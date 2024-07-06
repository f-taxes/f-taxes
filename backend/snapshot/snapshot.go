package snapshot

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/f-taxes/f-taxes/backend/applog"
	g "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"github.com/knadh/koanf"
	"github.com/qiniu/qmgo"
	"go.mongodb.org/mongo-driver/bson"
)

func Create(cfg *koanf.Koanf) error {
	// Make sure the snapshots directory exists.
	err := os.MkdirAll(cfg.MustString("snapshots.path"), 0755)
	if err != nil {
		return err
	}

	// Create timestamped folder for the new snapshot.
	folderName := time.Now().UTC().Format("2006-01-02T15_04_05")
	snapshotPath := filepath.Join(cfg.MustString("snapshots.path"), folderName)
	err = os.MkdirAll(snapshotPath, 0755)
	if err != nil {
		return err
	}

	var tradeCount int64
	if tradeCount, err = exportCollection[g.Trade](g.DBConn.Collection(g.COL_TRADES), filepath.Join(snapshotPath, "trades.json")); err != nil {
		return err
	}

	var txCount int64
	if txCount, err = exportCollection[g.Transfer](g.DBConn.Collection(g.COL_TRANSFERS), filepath.Join(snapshotPath, "transfers.json")); err != nil {
		return err
	}

	applog.Send(applog.Info, fmt.Sprintf("Wrote %d trades and %d transfers to %s.", tradeCount, txCount, snapshotPath))

	return nil
}

func exportCollection[T any](col *qmgo.Collection, path string) (int64, error) {
	// Write all trades to a file.
	file, err := os.Create(path)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	cursor := col.Find(context.Background(), bson.M{}).Cursor()
	var count int64

	for {
		var doc T
		if !cursor.Next(&doc) {
			break
		}

		count++
		encoder.Encode(doc)
	}

	return count, nil
}

// Lists all available snapshots in the snapshots directory.
func ListSnapshots(cfg *koanf.Koanf) ([]time.Time, error) {
	files, err := os.ReadDir(cfg.MustString("snapshots.path"))

	if err != nil {
		return nil, err
	}

	var snapshots []time.Time

	for _, file := range files {
		if !file.IsDir() {
			continue
		}

		// Parse the timestamp from the folder name.
		ts, err := time.Parse("2006-01-02T15_04_05", file.Name())
		if err != nil {
			continue
		}
		snapshots = append(snapshots, ts)
	}

	return snapshots, nil
}

func RemoveSnapshot(cfg *koanf.Koanf, ts time.Time) error {
	err := os.RemoveAll(filepath.Join(cfg.MustString("snapshots.path"), ts.Format("2006-01-02T15_04_05")))
	return err
}

func RestoreFromSnapshot(cfg *koanf.Koanf, ts time.Time) error {
	basePath := filepath.Join(cfg.MustString("snapshots.path"), ts.Format("2006-01-02T15_04_05"))

	tradesCount, err := restoreCollection[g.Trade](g.DBConn.Collection(g.COL_TRADES), filepath.Join(basePath, "trades.json"))
	if err != nil {
		return err
	}

	transfersCount, err := restoreCollection[g.Transfer](g.DBConn.Collection(g.COL_TRANSFERS), filepath.Join(basePath, "transfers.json"))
	if err != nil {
		return err
	}

	golog.Infof("Restored %d trades and %d transfers from %s.", tradesCount, transfersCount, basePath)

	return nil
}

func restoreCollection[T any](col *qmgo.Collection, path string) (int64, error) {
	file, err := os.Open(path)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	// Dump all the trades from the database.
	_, err = col.RemoveAll(context.Background(), bson.M{})
	if err != nil {
		return 0, err
	}

	decoder := json.NewDecoder(file)
	var count int64

	for decoder.More() {
		var doc T
		err := decoder.Decode(&doc)
		if err != nil {
			return 0, err
		}

		_, err = col.InsertOne(context.Background(), doc)
		if err != nil {
			return 0, err
		}

		count++
	}

	return count, nil
}
