package applog

import (
	"context"

	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"go.mongodb.org/mongo-driver/bson"
)

const APPLOG_COL = "applog"

func Write(msg applogMsg) {
	col := DBConn.Collection(APPLOG_COL)
	_, err := col.InsertOne(context.Background(), msg)

	if err != nil {
		golog.Errorf("Failed to store applog msg: %v", err)
	}
}

func List() ([]applogMsg, error) {
	list := []applogMsg{}
	col := DBConn.Collection(APPLOG_COL)
	err := col.Find(context.Background(), bson.M{}).Sort("-ts").All(&list)

	if err != nil {
		return list, err
	}

	return list, nil
}

func Purge() error {
	col := DBConn.Collection(APPLOG_COL)
	_, err := col.RemoveAll(context.Background(), bson.M{})
	return err
}
