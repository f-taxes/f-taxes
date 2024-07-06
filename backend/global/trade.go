package global

import (
	"context"
	"time"

	"github.com/f-taxes/f-taxes/proto"
	"github.com/kataras/golog"
	"github.com/shopspring/decimal"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Currency string

type TradeAction int
type OrderType int
type AssetType int

const (
	NONE = TradeAction(-1)
	BUY  = TradeAction(0)
	SELL = TradeAction(1)
)

const (
	TAKER = OrderType(0)
	MAKER = OrderType(1)
)

type Props struct {
	IsMarginTrade bool `json:"isMarginTrade" bson:"isMarginTrade"`
	IsDerivative  bool `json:"isDerivative" bson:"isDerivative"`
	IsPhysical    bool `json:"isPhysical" bson:"isPhysical"`
}

type Cost struct {
	Name        string          `json:"name" bson:"name"`
	Currency    string          `json:"currency" bson:"currency"`
	Amount      decimal.Decimal `json:"amount" bson:"amount"`
	AmountC     decimal.Decimal `json:"amountC" bson:"amountC"`
	Price       decimal.Decimal `json:"price" bson:"price"`
	PriceC      decimal.Decimal `json:"priceC" bson:"priceC"`
	Decimals    int32           `json:"decimals" bson:"decimals"`
	ConvertedBy string          `json:"convertedBy" bson:"convertedBy"`
}

// Describes a single trade were some asset was either bought or sold
// Fields ending with "C" are values converted to the selected costbases currency.
type Trade struct {
	ID                    primitive.ObjectID `json:"_id" bson:"_id"`
	TxID                  string             `json:"txId" bson:"txId"`
	Ts                    time.Time          `json:"ts" bson:"ts"`
	Account               string             `json:"account" bson:"account"`
	Comment               string             `json:"comment" bson:"comment"`
	Ticker                string             `json:"ticker" bson:"ticker"`
	Quote                 Currency           `json:"quote" bson:"quote"`
	Asset                 Currency           `json:"asset" bson:"asset"`
	Price                 decimal.Decimal    `json:"price" bson:"price"`
	PriceC                decimal.Decimal    `json:"priceC" bson:"priceC"`
	PriceConvertedBy      string             `json:"priceConvertedBy" bson:"priceConvertedBy"`
	QuotePriceC           decimal.Decimal    `json:"quotePriceC" bson:"quotePriceC"`
	QuotePriceConvertedBy string             `json:"quotePriceConvertedBy" bson:"quotePriceConvertedBy"`
	Amount                decimal.Decimal    `json:"amount" bson:"amount"`
	Value                 decimal.Decimal    `json:"value" bson:"value"`
	ValueC                decimal.Decimal    `json:"valueC" bson:"valueC"`
	Action                TradeAction        `json:"action" bson:"action"`
	OrderType             OrderType          `json:"orderType" bson:"orderType"`
	OrderID               string             `json:"orderId" bson:"orderId"`
	Fee                   Cost               `json:"fee" bson:"fee"`
	QuoteFee              Cost               `json:"quoteFee" bson:"quoteFee"`
	AssetDecimals         int32              `json:"assetDecimals" bson:"assetDecimals"`
	QuoteDecimals         int32              `json:"quoteDecimals" bson:"quoteDecimals"`
	FeeDecimals           int32              `json:"feeDecimals" bson:"feeDecimals"`
	QuoteFeeDecimals      int32              `json:"quoteFeeDecimals" bson:"quoteFeeDecimals"`
	Props                 Props              `json:"props" bson:"props"`
	Plugin                string             `json:"plugin" bson:"plugin"`
	PluginVersion         string             `json:"pluginVersion" bson:"pluginVersion"`
	Created               time.Time          `json:"created" bson:"created"`
	Updated               time.Time          `json:"updated" bson:"updated"`
}

func (t Trade) GetTs() time.Time {
	return t.Ts
}

func (t Trade) MarshalBSON() ([]byte, error) {
	data, err := bson.Marshal(tradeDoc{
		ID:                    t.ID,
		TxID:                  t.TxID,
		Ts:                    t.Ts,
		Account:               t.Account,
		Comment:               t.Comment,
		Ticker:                t.Ticker,
		Quote:                 t.Quote,
		Asset:                 t.Asset,
		Price:                 DecimalToMongoDecimal(t.Price),
		PriceC:                DecimalToMongoDecimal(t.PriceC),
		PriceConvertedBy:      t.PriceConvertedBy,
		QuotePriceC:           DecimalToMongoDecimal(t.QuotePriceC),
		QuotePriceConvertedBy: t.QuotePriceConvertedBy,
		Amount:                DecimalToMongoDecimal(t.Amount),
		Value:                 DecimalToMongoDecimal(t.Value),
		ValueC:                DecimalToMongoDecimal(t.ValueC),
		Action:                t.Action,
		OrderType:             t.OrderType,
		OrderID:               t.OrderID,
		Fee: CostDoc{
			Name:        t.Fee.Name,
			Currency:    t.Fee.Currency,
			Amount:      DecimalToMongoDecimal(t.Fee.Amount),
			AmountC:     DecimalToMongoDecimal(t.Fee.AmountC),
			Price:       DecimalToMongoDecimal(t.Fee.Price),
			PriceC:      DecimalToMongoDecimal(t.Fee.PriceC),
			Decimals:    t.Fee.Decimals,
			ConvertedBy: t.Fee.ConvertedBy,
		},
		QuoteFee: CostDoc{
			Name:        t.QuoteFee.Name,
			Currency:    t.QuoteFee.Currency,
			Amount:      DecimalToMongoDecimal(t.QuoteFee.Amount),
			AmountC:     DecimalToMongoDecimal(t.QuoteFee.AmountC),
			Price:       DecimalToMongoDecimal(t.QuoteFee.Price),
			PriceC:      DecimalToMongoDecimal(t.QuoteFee.PriceC),
			Decimals:    t.QuoteFee.Decimals,
			ConvertedBy: t.QuoteFee.ConvertedBy,
		},
		AssetDecimals: t.AssetDecimals,
		QuoteDecimals: t.QuoteDecimals,
		Props:         t.Props,
		Plugin:        t.Plugin,
		PluginVersion: t.PluginVersion,
		Created:       t.Created,
		Updated:       t.Updated,
	})

	if err != nil {
		golog.Errorf("Failed to marshal trade document: %v", err)
	}

	return data, err
}

func (t *Trade) UnmarshalBSON(b []byte) error {
	d := tradeDoc{}
	err := bson.Unmarshal(b, &d)

	if err != nil {
		golog.Errorf("Failed to unmarshal trade document: %v", err)
		return err
	}

	t.ID = d.ID
	t.TxID = d.TxID
	t.Ts = d.Ts
	t.Account = d.Account
	t.Comment = d.Comment

	t.Ticker = d.Ticker
	t.Quote = d.Quote
	t.Asset = d.Asset

	t.Price = decimal.RequireFromString(d.Price.String())
	t.PriceC = decimal.RequireFromString(d.PriceC.String())
	t.PriceConvertedBy = d.PriceConvertedBy
	t.QuotePriceC = decimal.RequireFromString(d.QuotePriceC.String())
	t.QuotePriceConvertedBy = d.QuotePriceConvertedBy
	t.Amount = decimal.RequireFromString(d.Amount.String())
	t.Value = decimal.RequireFromString(d.Value.String())
	t.ValueC = decimal.RequireFromString(d.ValueC.String())
	t.Action = d.Action
	t.OrderType = d.OrderType
	t.OrderID = d.OrderID

	t.Fee = Cost{
		Name:        d.Fee.Name,
		Currency:    d.Fee.Currency,
		Amount:      decimal.RequireFromString(d.Fee.Amount.String()),
		AmountC:     decimal.RequireFromString(d.Fee.AmountC.String()),
		Price:       decimal.RequireFromString(d.Fee.Price.String()),
		PriceC:      decimal.RequireFromString(d.Fee.PriceC.String()),
		Decimals:    d.Fee.Decimals,
		ConvertedBy: d.Fee.ConvertedBy,
	}

	t.QuoteFee = Cost{
		Name:        d.QuoteFee.Name,
		Currency:    d.QuoteFee.Currency,
		Amount:      decimal.RequireFromString(d.QuoteFee.Amount.String()),
		AmountC:     decimal.RequireFromString(d.QuoteFee.AmountC.String()),
		Price:       decimal.RequireFromString(d.QuoteFee.Price.String()),
		PriceC:      decimal.RequireFromString(d.QuoteFee.PriceC.String()),
		Decimals:    d.QuoteFee.Decimals,
		ConvertedBy: d.QuoteFee.ConvertedBy,
	}

	t.AssetDecimals = d.AssetDecimals
	t.QuoteDecimals = d.QuoteDecimals
	t.Props = d.Props
	t.Plugin = d.Plugin
	t.PluginVersion = d.PluginVersion
	t.Created = d.Created
	return nil
}

type CostDoc struct {
	Name        string               `json:"name" bson:"name"`
	Currency    string               `json:"currency" bson:"currency"`
	Amount      primitive.Decimal128 `json:"amount" bson:"amount"`
	AmountC     primitive.Decimal128 `json:"amountC" bson:"amountC"`
	Price       primitive.Decimal128 `json:"price" bson:"price"`
	PriceC      primitive.Decimal128 `json:"priceC" bson:"priceC"`
	Decimals    int32                `json:"decimals" bson:"decimals"`
	ConvertedBy string               `json:"convertedBy" bson:"convertedBy"`
}

// Intermediary type used to (un-)marshal trades for mongodb.
type tradeDoc struct {
	ID                    primitive.ObjectID   `bson:"_id"`
	TxID                  string               `json:"txId" bson:"txId"`
	Ts                    time.Time            `json:"ts" bson:"ts"`
	Account               string               `json:"account" bson:"account"`
	Comment               string               `json:"comment" bson:"comment"`
	Ticker                string               `json:"ticker" bson:"ticker"`
	Quote                 Currency             `json:"quote" bson:"quote"`
	Asset                 Currency             `json:"asset" bson:"asset"`
	Price                 primitive.Decimal128 `json:"price" bson:"price"`
	PriceC                primitive.Decimal128 `json:"priceC" bson:"priceC"`
	PriceConvertedBy      string               `json:"priceConvertedBy"`
	QuotePriceC           primitive.Decimal128 `json:"quotePriceC" bson:"quotePriceC"`
	QuotePriceConvertedBy string               `json:"quotePriceConvertedBy" bson:"quotePriceConvertedBy"`
	Amount                primitive.Decimal128 `json:"amount" bson:"amount"`
	Value                 primitive.Decimal128 `json:"value" bson:"value"`
	ValueC                primitive.Decimal128 `json:"valueC" bson:"valueC"`
	Action                TradeAction          `json:"action" bson:"action"`
	OrderType             OrderType            `json:"orderType" bson:"orderType"`
	OrderID               string               `json:"orderId" bson:"orderId"`
	Fee                   CostDoc              `json:"fee" bson:"fee"`
	QuoteFee              CostDoc              `json:"quoteFee" bson:"quoteFee"`
	AssetDecimals         int32                `json:"assetDecimals" bson:"assetDecimals"`
	QuoteDecimals         int32                `json:"quoteDecimals" bson:"quoteDecimals"`
	Props                 Props                `json:"props" bson:"props"`
	Plugin                string               `json:"plugin" bson:"plugin"`
	PluginVersion         string               `json:"pluginVersion" bson:"pluginVersion"`
	Created               time.Time            `json:"created" bson:"created"`
	Updated               time.Time            `json:"updated" bson:"updated"`
}

func (t *Trade) Store() error {
	col := DBConn.Collection(COL_TRADES)

	if t.TxID != "" {
		count, _ := col.Find(context.Background(), bson.M{"txId": t.TxID}).Count()
		if count > 0 {
			return nil
		}
	}

	_, err := col.InsertOne(context.Background(), t)
	return err
}

func DecimalToMongoDecimal(v decimal.Decimal) primitive.Decimal128 {
	val, _ := primitive.ParseDecimal128(v.String())
	return val
}

func ProtoTradeToTrade(t *proto.Trade) Trade {
	if t.Fee == nil {
		t.Fee = &proto.Cost{}
	}

	if t.QuoteFee == nil {
		t.QuoteFee = &proto.Cost{}
	}

	return Trade{
		ID:                    primitive.NewObjectID(),
		TxID:                  t.TxID,
		Ts:                    t.Ts.AsTime(),
		Account:               t.Account,
		Comment:               t.Comment,
		Ticker:                t.Ticker,
		Quote:                 Currency(t.Quote),
		Asset:                 Currency(t.Asset),
		Price:                 StrToDecimal(t.Price),
		PriceC:                StrToDecimal(t.PriceC, decimal.Zero),
		PriceConvertedBy:      t.PriceConvertedBy,
		QuotePriceC:           StrToDecimal(t.QuotePriceC, decimal.Zero),
		QuotePriceConvertedBy: t.QuotePriceConvertedBy,
		Amount:                StrToDecimal(t.Amount),
		Action:                TradeAction(t.Action),
		Value:                 StrToDecimal(t.Value),
		ValueC:                StrToDecimal(t.ValueC, decimal.Zero),
		OrderType:             OrderType(t.OrderType),
		OrderID:               t.OrderID,
		Fee: Cost{
			Name:        t.Fee.Name,
			Currency:    t.Fee.Currency,
			Amount:      StrToDecimal(t.Fee.Amount),
			AmountC:     StrToDecimal(t.Fee.AmountC),
			Price:       StrToDecimal(t.Fee.Price),
			PriceC:      StrToDecimal(t.Fee.PriceC),
			Decimals:    t.Fee.Decimals,
			ConvertedBy: t.Fee.ConvertedBy,
		},
		QuoteFee: Cost{
			Name:        t.QuoteFee.Name,
			Currency:    t.QuoteFee.Currency,
			Amount:      StrToDecimal(t.QuoteFee.Amount),
			AmountC:     StrToDecimal(t.QuoteFee.AmountC),
			Price:       StrToDecimal(t.QuoteFee.Price),
			PriceC:      StrToDecimal(t.QuoteFee.PriceC),
			Decimals:    t.QuoteFee.Decimals,
			ConvertedBy: t.QuoteFee.ConvertedBy,
		},
		AssetDecimals: t.AssetDecimals,
		QuoteDecimals: t.QuoteDecimals,
		Props: Props{
			IsMarginTrade: t.Props.IsMarginTrade,
			IsDerivative:  t.Props.IsDerivative,
			IsPhysical:    t.Props.IsPhysical,
		},
		Plugin:        t.Plugin,
		PluginVersion: t.PluginVersion,
		Created:       t.Created.AsTime(),
		Updated:       t.Updated.AsTime(),
	}
}

func TradeToProtoTrade(t Trade) *proto.Trade {
	return &proto.Trade{
		TxID:                  t.TxID,
		Ts:                    timestamppb.New(t.Ts),
		Account:               t.Account,
		Comment:               t.Comment,
		Ticker:                t.Ticker,
		Quote:                 string(t.Quote),
		QuoteDecimals:         t.QuoteDecimals,
		Asset:                 string(t.Asset),
		AssetDecimals:         t.AssetDecimals,
		Price:                 t.Price.String(),
		PriceC:                t.PriceC.String(),
		PriceConvertedBy:      t.PriceConvertedBy,
		QuotePriceC:           t.QuotePriceC.String(),
		QuotePriceConvertedBy: t.QuotePriceConvertedBy,
		Amount:                t.Amount.String(),
		Action:                proto.TxAction(t.Action),
		Value:                 t.Value.String(),
		ValueC:                t.ValueC.String(),
		OrderType:             proto.OrderType(t.OrderType),
		OrderID:               t.OrderID,
		Fee: &proto.Cost{
			Name:        t.Fee.Name,
			Currency:    t.Fee.Currency,
			Amount:      t.Fee.Amount.String(),
			AmountC:     t.Fee.AmountC.String(),
			Price:       t.Fee.Price.String(),
			PriceC:      t.Fee.PriceC.String(),
			Decimals:    t.Fee.Decimals,
			ConvertedBy: t.Fee.ConvertedBy,
		},
		QuoteFee: &proto.Cost{
			Name:        t.QuoteFee.Name,
			Currency:    t.QuoteFee.Currency,
			Amount:      t.QuoteFee.Amount.String(),
			AmountC:     t.QuoteFee.AmountC.String(),
			Price:       t.QuoteFee.Price.String(),
			PriceC:      t.QuoteFee.PriceC.String(),
			Decimals:    t.QuoteFee.Decimals,
			ConvertedBy: t.QuoteFee.ConvertedBy,
		},
		Props: &proto.Props{
			IsMarginTrade: t.Props.IsMarginTrade,
			IsDerivative:  t.Props.IsDerivative,
			IsPhysical:    t.Props.IsPhysical,
		},
		Plugin:        t.Plugin,
		PluginVersion: t.PluginVersion,
		Created:       timestamppb.New(t.Created),
		Updated:       timestamppb.New(t.Updated),
	}
}
