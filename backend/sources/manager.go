package sources

import (
	"context"
	"fmt"
	"time"

	"github.com/f-taxes/f-taxes/backend/applog"
	"github.com/f-taxes/f-taxes/backend/ftx"
	. "github.com/f-taxes/f-taxes/backend/global"
	jobmanager "github.com/f-taxes/f-taxes/backend/jobManager"
	"github.com/kataras/golog"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// func RegisterSource(srcReq ReqAddSource) error {
// 	var newSrc SourceConnection

// 	switch srcReq.Source {
// 	case "ftx":
// 		newSrc = ftx.NewFtxSource()
// 	default:
// 		return fmt.Errorf("source %s is unknown to the source manager", srcReq.Source)
// 	}

// 	sources = append(sources, newSrc)
// 	return nil
// }

// func UniqueSourceId(src Source) bool {
// 	for _, s := range sources {
// 		if s.ID() == src.ID() {
// 			return false
// 		}
// 	}

// 	return true
// }

// Any jobs to be processed by sources are in this queue and can be canceled.
var jobs = jobmanager.New()

func GetSource(srcID primitive.ObjectID) (Source, SourceConnection, error) {
	srcCon, err := OneById(srcID)

	if err != nil {
		return nil, SourceConnection{}, err
	}

	var src Source
	switch srcCon.SourceID {
	case "ftx":
		src = ftx.NewFtxSource(&srcCon)
	default:
		return nil, SourceConnection{}, fmt.Errorf("source %s is not supported", srcCon.ID)
	}

	return src, srcCon, nil
}

func FetchAllFromSource(srcID primitive.ObjectID) {
	src, srcCon, err := GetSource(srcID)

	if err != nil {
		golog.Errorf("Failed to setup source to fetch from: %v", err)
		return
	}

	go func(src Source, srcCon SourceConnection) {
		jobID := primitive.NewObjectID()
		ctx, cancelFn := context.WithCancel(context.Background())
		jobs.Add(jobID, cancelFn)

		txCh, errCh := src.FetchTransactions(ctx, srcCon.LastFetched.Add(-6*time.Hour))
		newTxCount := 0

		col := DBConn.Collection("ftx")

	loop:
		for {
			select {
			case tx, ok := <-txCh:
				if !ok {
					break loop
				}

				count, err := col.Find(context.Background(), bson.M{"txId": tx.TxID}).Count()

				if err != nil {
					golog.Errorf("Failed to check for record: %v", err)
					return
				}

				if count == 0 {
					newTxCount++
					col.InsertOne(context.Background(), Transaction{
						ID:       primitive.NewObjectID(),
						TxID:     tx.TxID,
						SourceID: srcCon.ID,
						Cost:     tx.Price,
						Amount:   tx.Amount,
						Fee:      tx.Fee,
						Ticker:   tx.Ticker,
						Ts:       tx.Ts,
						Side:     tx.Side,
						Quote:    tx.Quote,
						Base:     tx.Base,
					}.ToDoc())
				}
			case err, ok := <-errCh:
				if !ok {
					break loop
				}

				PushToClients("job-progress", map[string]string{
					"_id":      jobID.Hex(),
					"label":    src.Label(),
					"progress": "100",
				})

				applog.Send(applog.Error, err.Error(), src.Label())
			}
		}

		applog.Send(applog.Info, fmt.Sprintf("Downloaded %d new transactions", newTxCount), src.Label())
	}(src, srcCon)
}

func ListSources() []SourceInfo {
	return AvailSources
}
