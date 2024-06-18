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

type TradeProps struct {
	IsMarginTrade bool `json:"isMarginTrade" bson:"isMarginTrade"`
	IsDerivative  bool `json:"isDerivative" bson:"isDerivative"`
	IsPhysical    bool `json:"isPhysical" bson:"isPhysical"`
}

// Describes a single trade were some asset was either bought or sold
// Fields ending with "C" are values converted to the selected costbases currency.
type Trade struct {
	ID      primitive.ObjectID `json:"_id" bson:"_id"`
	TxID    string             `json:"txId" bson:"txId"`
	Ts      time.Time          `json:"ts" bson:"ts"`
	Account string             `json:"account" bson:"account"`
	Comment string             `json:"comment" bson:"comment"`

	Ticker string   `json:"ticker" bson:"ticker"`
	Quote  Currency `json:"quote" bson:"quote"`
	Asset  Currency `json:"asset" bson:"asset"`

	Price                 decimal.Decimal `json:"price" bson:"price"`
	PriceC                decimal.Decimal `json:"priceC" bson:"priceC"`
	PriceConvertedBy      string          `json:"priceConvertedBy" bson:"priceConvertedBy"`
	QuotePriceC           decimal.Decimal `json:"quotePriceC" bson:"quotePriceC"`
	QuotePriceConvertedBy string          `json:"quotePriceConvertedBy" bson:"quotePriceConvertedBy"`
	Amount                decimal.Decimal `json:"amount" bson:"amount"`
	Value                 decimal.Decimal `json:"value" bson:"value"`
	ValueC                decimal.Decimal `json:"valueC" bson:"valueC"`
	Action                TradeAction     `json:"action" bson:"action"`
	OrderType             OrderType       `json:"orderType" bson:"orderType"`
	OrderID               string          `json:"orderId" bson:"orderId"`

	Fee            decimal.Decimal `json:"fee" bson:"fee"`
	FeeCurrency    Currency        `json:"feeCurrency" bson:"feeCurrency"`
	FeePriceC      decimal.Decimal `json:"feePriceC" bson:"feePriceC"` // Price of the fee converted. Lets say the fee is quoted in SOL. FeePriceC would be the price of SOL at the time of trade.
	FeeC           decimal.Decimal `json:"feeC" bson:"feeC"`
	FeeConvertedBy string          `json:"feeConvertedBy" bson:"feeConvertedBy"`

	QuoteFee            decimal.Decimal `json:"quoteFee" bson:"quoteFee"`
	QuoteFeePriceC      decimal.Decimal `json:"quoteFeePriceC" bson:"quoteFeePriceC"`
	QuoteFeeCurrency    Currency        `json:"quoteFeeCurrency" bson:"quoteFeeCurrency"`
	QuoteFeeC           decimal.Decimal `json:"quoteFeeC" bson:"quoteFeeC"`
	QuoteFeeConvertedBy string          `json:"quoteFeeConvertedBy" bson:"quoteFeeConvertedBy"`

	AssetDecimals    int32 `json:"assetDecimals" bson:"assetDecimals"`
	QuoteDecimals    int32 `json:"quoteDecimals" bson:"quoteDecimals"`
	FeeDecimals      int32 `json:"feeDecimals" bson:"feeDecimals"`
	QuoteFeeDecimals int32 `json:"quoteFeeDecimals" bson:"quoteFeeDecimals"`

	Props TradeProps `json:"props" bson:"props"`

	Plugin        string    `json:"plugin" bson:"plugin"`
	PluginVersion string    `json:"pluginVersion" bson:"pluginVersion"`
	Created       time.Time `json:"created" bson:"created"`
	Updated       time.Time `json:"updated" bson:"updated"`
}

func (t Trade) GetTs() time.Time {
	return t.Ts
}

func (t Trade) MarshalBSON() ([]byte, error) {
	data, err := bson.Marshal(tradeDoc{
		ID:      t.ID,
		TxID:    t.TxID,
		Ts:      t.Ts,
		Account: t.Account,
		Comment: t.Comment,

		Ticker: t.Ticker,
		Quote:  t.Quote,
		Asset:  t.Asset,

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

		Fee:            DecimalToMongoDecimal(t.Fee),
		FeePriceC:      DecimalToMongoDecimal(t.FeePriceC),
		FeeCurrency:    t.FeeCurrency,
		FeeC:           DecimalToMongoDecimal(t.FeeC),
		FeeConvertedBy: t.FeeConvertedBy,

		QuoteFee:            DecimalToMongoDecimal(t.QuoteFee),
		QuoteFeePriceC:      DecimalToMongoDecimal(t.QuoteFeePriceC),
		QuoteFeeCurrency:    t.QuoteFeeCurrency,
		QuoteFeeC:           DecimalToMongoDecimal(t.QuoteFeeC),
		QuoteFeeConvertedBy: t.QuoteFeeConvertedBy,

		AssetDecimals:    t.AssetDecimals,
		QuoteDecimals:    t.QuoteDecimals,
		FeeDecimals:      t.FeeDecimals,
		QuoteFeeDecimals: t.QuoteFeeDecimals,

		Props: t.Props,

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

	t.Fee = decimal.RequireFromString(d.Fee.String())
	t.FeePriceC = decimal.RequireFromString(d.FeePriceC.String())
	t.FeeCurrency = d.FeeCurrency
	t.FeeC = decimal.RequireFromString(d.FeeC.String())
	t.FeeConvertedBy = d.FeeConvertedBy

	t.QuoteFee = decimal.RequireFromString(d.QuoteFee.String())
	t.QuoteFeePriceC = decimal.RequireFromString(d.QuoteFeePriceC.String())
	t.QuoteFeeCurrency = d.QuoteFeeCurrency
	t.QuoteFeeC = decimal.RequireFromString(d.QuoteFeeC.String())
	t.QuoteFeeConvertedBy = d.QuoteFeeConvertedBy

	t.AssetDecimals = d.AssetDecimals
	t.QuoteDecimals = d.QuoteDecimals
	t.FeeDecimals = d.FeeDecimals
	t.QuoteFeeDecimals = d.QuoteFeeDecimals

	t.Props = d.Props

	t.Plugin = d.Plugin
	t.PluginVersion = d.PluginVersion
	t.Created = d.Created
	return nil
}

// Intermediary type used to (un-)marshal trades for mongodb.
type tradeDoc struct {
	ID      primitive.ObjectID `bson:"_id"`
	TxID    string             `json:"txId" bson:"txId"`
	Ts      time.Time          `json:"ts" bson:"ts"`
	Account string             `json:"account" bson:"account"`
	Comment string             `json:"comment" bson:"comment"`

	Ticker string   `json:"ticker" bson:"ticker"`
	Quote  Currency `json:"quote" bson:"quote"`
	Asset  Currency `json:"asset" bson:"asset"`

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

	Fee            primitive.Decimal128 `json:"fee" bson:"fee"`
	FeePriceC      primitive.Decimal128 `json:"feePriceC" bson:"feePriceC"`
	FeeCurrency    Currency             `json:"feeCurrency" bson:"feeCurrency"`
	FeeC           primitive.Decimal128 `json:"feeC" bson:"feeC"`
	FeeConvertedBy string               `json:"feeConvertedBy" bson:"feeConvertedBy"`

	QuoteFee            primitive.Decimal128 `json:"quoteFee" bson:"quoteFee"`
	QuoteFeePriceC      primitive.Decimal128 `json:"quoteFeePriceC" bson:"quoteFeePriceC"`
	QuoteFeeCurrency    Currency             `json:"quoteFeeCurrency" bson:"quoteFeeCurrency"`
	QuoteFeeC           primitive.Decimal128 `json:"quoteFeeC" bson:"quoteFeeC"`
	QuoteFeeConvertedBy string               `json:"quoteFeeConvertedBy" bson:"quoteFeeConvertedBy"`

	AssetDecimals    int32 `json:"assetDecimals" bson:"assetDecimals"`
	QuoteDecimals    int32 `json:"quoteDecimals" bson:"quoteDecimals"`
	FeeDecimals      int32 `json:"feeDecimals" bson:"feeDecimals"`
	QuoteFeeDecimals int32 `json:"quoteFeeDecimals" bson:"quoteFeeDecimals"`

	Props TradeProps `json:"props" bson:"props"`

	Plugin        string    `json:"plugin" bson:"plugin"`
	PluginVersion string    `json:"pluginVersion" bson:"pluginVersion"`
	Created       time.Time `json:"created" bson:"created"`
	Updated       time.Time `json:"updated" bson:"updated"`
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
		Fee:                   StrToDecimal(t.Fee),
		FeePriceC:             StrToDecimal(t.FeePriceC),
		FeeCurrency:           Currency(t.FeeCurrency),
		FeeC:                  StrToDecimal(t.FeeC),
		FeeConvertedBy:        t.FeeConvertedBy,
		QuoteFee:              StrToDecimal(t.QuoteFee),
		QuoteFeePriceC:        StrToDecimal(t.QuoteFeePriceC),
		QuoteFeeCurrency:      Currency(t.QuoteFeeCurrency),
		QuoteFeeC:             StrToDecimal(t.QuoteFeeC),
		QuoteFeeConvertedBy:   t.QuoteFeeConvertedBy,
		AssetDecimals:         t.AssetDecimals,
		QuoteDecimals:         t.QuoteDecimals,
		FeeDecimals:           t.FeeDecimals,
		QuoteFeeDecimals:      t.QuoteFeeDecimals,
		Props: TradeProps{
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
		Fee:                   t.Fee.String(),
		FeeDecimals:           t.FeeDecimals,
		FeePriceC:             t.FeePriceC.String(),
		FeeCurrency:           string(t.FeeCurrency),
		FeeC:                  t.FeeC.String(),
		FeeConvertedBy:        t.FeeConvertedBy,
		QuoteFee:              t.QuoteFee.String(),
		QuoteFeeDecimals:      t.QuoteFeeDecimals,
		QuoteFeePriceC:        t.QuoteFeePriceC.String(),
		QuoteFeeCurrency:      string(t.QuoteFeeCurrency),
		QuoteFeeC:             t.QuoteFeeC.String(),
		QuoteFeeConvertedBy:   t.QuoteFeeConvertedBy,
		Props: &proto.TradeProps{
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
