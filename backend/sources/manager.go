package sources

import (
	"context"
	"fmt"
	"time"

	"github.com/f-taxes/f-taxes/backend/applog"
	"github.com/f-taxes/f-taxes/backend/ftx"
	. "github.com/f-taxes/f-taxes/backend/global"
	jobmanager "github.com/f-taxes/f-taxes/backend/jobManager"
	"github.com/f-taxes/f-taxes/backend/transactions"
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

func GetSource(srcConId primitive.ObjectID) (Source, SourceConnection, error) {
	srcCon, err := OneById(srcConId)

	if err != nil {
		return nil, SourceConnection{}, err
	}

	var src Source
	switch srcCon.SrcName {
	case "ftx":
		src = ftx.NewFtxSource(&srcCon)
	default:
		return nil, SourceConnection{}, fmt.Errorf("source %s is not supported", srcCon.ID)
	}

	return src, srcCon, nil
}

func RemoveSource(srcConId primitive.ObjectID) error {
	col := DBConn.Collection(transactions.COL_TRANSACTION)
	_, err := col.RemoveAll(context.Background(), bson.M{"srcConId": srcConId})

	if err != nil {
		golog.Errorf("Failed to remove transactions associated with source connection \"%s\"", srcConId.Hex())
		return err
	}

	err = RemoveById(srcConId)

	if err != nil {
		golog.Errorf("Failed to remove source connection \"%s\"", srcConId.Hex())
		return err
	}

	PushToClients("update-src-connections", nil)
	return nil
}

func FetchAllFromSource(srcConId primitive.ObjectID) {
	src, srcCon, err := GetSource(srcConId)

	if err != nil {
		golog.Errorf("Failed to setup source to fetch from: %v", err)
		return
	}

	go func(src Source, srcCon SourceConnection) {
		jobID := primitive.NewObjectID()
		ctx, cancelFn := context.WithCancel(context.Background())
		jobs.Add(jobID, cancelFn)

		txCh, errCh := src.FetchTransactions(ctx, srcCon.LastFetched.Add(-5*time.Minute))
		newTxCount := 0

		col := DBConn.Collection(transactions.COL_TRANSACTION)

		defer PushToClients("job-progress", map[string]string{
			"_id":      jobID.Hex(),
			"label":    fmt.Sprintf("Download transactions for %s", src.Label()),
			"srcConId": srcCon.ID.Hex(),
			"progress": "100",
		})

		PushToClients("job-progress", map[string]string{
			"_id":      jobID.Hex(),
			"label":    fmt.Sprintf("Download transactions for %s", src.Label()),
			"srcConId": srcCon.ID.Hex(),
			"progress": "-1",
		})

	loop:
		for {
			select {
			case tx, ok := <-txCh:
				if !ok {
					break loop
				}

				// Make sure we don't store any duplicates by checking for the source id and the txid specific to the records as assigned by the exchange/blockchain.
				count, err := col.Find(context.Background(), bson.M{"srcName": srcCon.SrcName, "txId": tx.TxID}).Count()

				if err != nil {
					golog.Errorf("Failed to check for record: %v", err)
					return
				}

				if count == 0 {
					newTxCount++
					col.InsertOne(context.Background(), Transaction{
						ID:       primitive.NewObjectID(),
						TxID:     tx.TxID,
						SrcName:  srcCon.SrcName,
						SrcConID: srcCon.ID,
						Cost:     tx.Price,
						Amount:   tx.Amount,
						Fee:      tx.Fee,
						Ticker:   tx.Ticker,
						Ts:       tx.Ts,
						Side:     tx.Side,
						Quote:    tx.Quote,
						Base:     tx.Base,
					})
				}
			case err, ok := <-errCh:
				if !ok {
					break loop
				}

				applog.Send(applog.Error, err.Error(), src.Label())
			}
		}

		applog.Send(applog.Info, fmt.Sprintf("Downloaded %d new transactions", newTxCount), src.Label())
	}(src, srcCon)
}

func ListSources() []SourceInfo {
	return AvailSources
}
