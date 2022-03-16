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

		for {
			select {
			case tx, ok := <-txCh:
				if !ok {
					return
				}
				fmt.Printf("%+v\n", tx)
			case err, ok := <-errCh:
				if !ok {
					return
				}

				PushToClients("job-progress", map[string]string{
					"_id":      jobID.Hex(),
					"label":    src.Label(),
					"progress": "100",
				})

				applog.Send(applog.Error, err.Error(), src.Label())
				return
			}
		}
	}(src, srcCon)
}

func ListSources() []SourceInfo {
	return AvailSources
}
