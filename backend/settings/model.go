package settings

import (
	"context"

	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"github.com/qiniu/qmgo"
	"github.com/thlib/go-timezone-local/tzlocal"
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

type TableSettings struct {
	Pagination Query    `json:"pagination" bson:"pagination"`
	Columns    []Column `json:"columns" bson:"columns"`
}

type UserSettings struct {
	ID             primitive.ObjectID `bson:"_id" json:"-"`
	DateTimeFormat string             `bson:"dateTimeFormat" json:"dateTimeFormat"`
	Trades         TableSettings      `bson:"trades" json:"trades"`
	Transfers      TableSettings      `bson:"transfers" json:"transfers"`
	TimeZone       string             `bson:"timeZone" json:"timeZone"`
}

func ensureDefaultSettings() {
	s, err := Get()

	if err != nil {
		golog.Errorf("Failed to get settings document from database: %v", err)
		return
	}

	if s.TimeZone == "" {
		tz, err := tzlocal.RuntimeTZ()
		if err != nil {
			golog.Errorf("Failed to get system timezone to set default setting: %v", err)
			return
		}

		s.TimeZone = tz
	}

	if s.DateTimeFormat == "" {
		s.DateTimeFormat = "Pp"
	}

	if s.Trades.Pagination.Page == 0 {
		s.Trades.Pagination = Query{
			Page:  1,
			Limit: 2000,
			Sort:  "-ts",
		}
	}

	if s.Transfers.Pagination.Page == 0 {
		s.Transfers.Pagination = Query{
			Page:  1,
			Limit: 2000,
			Sort:  "-ts",
		}
	}

	if len(s.Trades.Columns) == 0 {
		s.Trades.Columns = []Column{
			{Name: "account", Label: "Account", Visible: true, Width: "200px"},
			{Name: "ticker", Label: "Ticker", Visible: true, Width: "120px"},
			{Name: "amount", Label: "Amount", Visible: true, Width: "100px"},
			{Name: "asset", Label: "Asset", Visible: true, Width: "100px"},
			{Name: "price", Label: "Price", Visible: true, Width: "100px"},
			{Name: "quote", Label: "Quote", Visible: true, Width: "100px"},
			{Name: "priceC", Label: "Price C", Visible: true, Width: "100px"},
			{Name: "value", Label: "Value", Visible: true, Width: "100px"},
			{Name: "valueC", Label: "Value C", Visible: true, Width: "100px"},
			{Name: "quotePriceC", Label: "Quote Price C", Visible: true, Width: "100px"},
			{Name: "fee", Label: "Fee", Visible: true, Width: "160px"},
			{Name: "feePriceC", Label: "Fee Price C", Visible: true, Width: "100px"},
			{Name: "feeC", Label: "Fee C", Visible: true, Width: "100px"},
			{Name: "feeCurrency", Label: "Fee Currency", Visible: true, Width: "100px"},
			{Name: "action", Label: "Action", Visible: true, Width: "100px"},
			{Name: "orderType", Label: "Order Type", Visible: true, Width: "100px"},
			{Name: "orderId", Label: "Order ID", Visible: true, Width: "100px"},
			{Name: "assetType", Label: "Asset Type", Visible: true, Width: "100px"},
			{Name: "ts", Label: "Date", Visible: true, Required: true, Width: "220px"},
			{Name: "txId", Label: "Tx-ID", Visible: true, Width: "100px"},
			{Name: "comment", Label: "Comment", Visible: true, Width: "100px"},
			{Name: "plugin", Label: "Plugin", Visible: true, Width: "100px"},
			{Name: "pluginVersion", Label: "Plugin Version", Visible: true, Width: "100px"},
			{Name: "priceConvertedBy", Label: "Price Converted By", Visible: true, Width: "100px"},
			{Name: "feeConvertedBy", Label: "Fee Converted By", Visible: true, Width: "100px"},
		}
	}

	if len(s.Transfers.Columns) == 0 {
		s.Transfers.Columns = []Column{
			{Name: "account", Label: "Account", Visible: true, Width: "200px"},
			{Name: "amount", Label: "Amount", Visible: true, Width: "100px"},
			{Name: "asset", Label: "Asset", Visible: true, Width: "100px"},
			{Name: "action", Label: "Action", Visible: true, Width: "100px"},
			{Name: "source", Label: "Source", Visible: true, Width: "200px"},
			{Name: "destination", Label: "Destination", Visible: true, Width: "200px"},
			{Name: "fee", Label: "Fee", Visible: true, Width: "160px"},
			{Name: "feePriceC", Label: "Fee Price C", Visible: true, Width: "100px"},
			{Name: "feeC", Label: "Fee C", Visible: true, Width: "100px"},
			{Name: "feeCurrency", Label: "Fee Currency", Visible: true, Width: "100px"},
			{Name: "ts", Label: "Date", Visible: true, Required: true, Width: "220px"},
			{Name: "txId", Label: "Tx-ID", Visible: true, Width: "100px"},
			{Name: "comment", Label: "Comment", Visible: true, Width: "100px"},
			{Name: "plugin", Label: "Plugin", Visible: true, Width: "100px"},
			{Name: "pluginVersion", Label: "Plugin Version", Visible: true, Width: "100px"},
			{Name: "priceConvertedBy", Label: "Price Converted By", Visible: true, Width: "100px"},
			{Name: "feeConvertedBy", Label: "Fee Converted By", Visible: true, Width: "100px"},
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
