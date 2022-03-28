package settings

import (
	"context"

	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/f-taxes/f-taxes/backend/transactions"
	"github.com/kataras/golog"
	"github.com/qiniu/qmgo"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const COL_SETTINGS = "settings"

type Column struct {
	Name     string `json:"name" bson:"name"`
	Width    string `json:"width" bson:"width"`
	Required bool   `json:"required" bson:"required"`
	Visible  bool   `json:"visible" bson:"visible"`
	Label    string `json:"label" bson:"label"`
}

type TransactionSettings struct {
	Pagination transactions.Query `json:"pagination" bson:"pagination"`
	Columns    []Column           `json:"columns" bson:"columns"`
}

type UserSettings struct {
	ID             primitive.ObjectID  `bson:"_id" json:"-"`
	DateTimeFormat string              `bson:"dateTimeFormat" json:"dateTimeFormat"`
	Transactions   TransactionSettings `bson:"transactions" json:"transactions"`
}

func ensureDefaultSettings() {
	s, err := Get()

	if err != nil {
		golog.Errorf("Failed to get settings document from database: %v", err)
		return
	}

	if s.DateTimeFormat == "" {
		s.DateTimeFormat = "Pp"
	}

	if s.Transactions.Pagination.Page == 0 {
		s.Transactions.Pagination = transactions.Query{
			Page:  1,
			Limit: 2000,
			Sort:  "-ts",
		}
	}

	if len(s.Transactions.Columns) == 0 {
		s.Transactions.Columns = []Column{
			{Name: "srcName", Label: "Source", Visible: true, Width: "203px"},
			{Name: "base", Label: "Base", Visible: true, Width: "100px"},
			{Name: "amount", Label: "Amount", Visible: true, Width: "100px"},
			{Name: "cost", Label: "Cost", Visible: true, Width: "100px"},
			{Name: "costC", Label: "Cost C", Visible: true, Width: "100px"},
			{Name: "fee", Label: "Fee", Visible: true, Width: "163px"},
			{Name: "feeC", Label: "Fee C", Visible: true, Width: "100px"},
			{Name: "quote", Label: "Quote", Visible: true, Width: "100px"},
			{Name: "side", Label: "Side", Visible: true, Width: "97px"},
			{Name: "srcCon", Label: "Account", Visible: true, Width: "203px"},
			{Name: "ticker", Label: "Ticker", Visible: true, Width: "117px"},
			{Name: "ts", Label: "Date", Visible: true, Required: true, Width: "223px"},
			{Name: "txId", Label: "Tx-ID", Visible: true, Width: "100px"},
		}
	}

	err = Save(s)

	if err != nil {
		golog.Errorf("Failed to save default settings document from database: %v", err)
		return
	}
}

// We only use one document in the collection to store settings.
func Get() (UserSettings, error) {
	s := UserSettings{
		ID: primitive.NewObjectID(),
	}

	col := DBConn.Collection(COL_SETTINGS)
	err := col.Find(context.Background(), bson.M{}).One(&s)

	if qmgo.IsErrNoDocuments(err) {
		return s, nil
	}

	return s, err
}

// This code ensures we only store one document with settings.
func Save(updatedSettings UserSettings) error {
	s, err := Get()

	if err != nil {
		return err
	}

	updatedSettings.ID = s.ID

	col := DBConn.Collection(COL_SETTINGS)
	_, err = col.UpsertId(context.Background(), s.ID, updatedSettings)
	return err
}
