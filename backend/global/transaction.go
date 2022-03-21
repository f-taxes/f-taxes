package global

import (
	"time"

	"github.com/shopspring/decimal"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Currency string

type Side string

const (
	Buy  = Side("buy")
	Sell = Side("sell")
)

// Describes a single transaction were some asset was either bought or sold
// Fields ending with "C" are values converted to the selected costbases currency.
type Transaction struct {
	ID       primitive.ObjectID `bson:"_id"`
	TxID     string             `json:"txId" bson:"txId"`
	SourceID primitive.ObjectID `json:"source" bson:"source"`
	Cost     decimal.Decimal    `json:"cost" bson:"cost"`
	CostC    decimal.Decimal    `json:"costC" bson:"costC"`
	Amount   decimal.Decimal    `json:"amount" bson:"amount"`
	Ticker   string             `json:"ticker" bson:"ticker"`
	Quote    Currency           `json:"quote" bson:"quote"`
	Base     Currency           `json:"base" bson:"base"`
	Ts       time.Time          `json:"ts" bson:"ts"`
	Side     Side               `json:"side" bson:"side"`
	Fee      decimal.Decimal    `json:"fee" bson:"fee"`
	FeeC     decimal.Decimal    `json:"feeC" bson:"feeC"`
}

func (t Transaction) ToDoc() TransactionDoc {
	return TransactionDoc{
		ID:       t.ID,
		TxID:     t.TxID,
		SourceID: t.SourceID,
		Cost:     DecimalToMongoDecimal(t.Cost),
		CostC:    DecimalToMongoDecimal(t.CostC),
		Amount:   DecimalToMongoDecimal(t.Amount),
		Ticker:   t.Ticker,
		Quote:    t.Quote,
		Base:     t.Base,
		Ts:       t.Ts,
		Side:     t.Side,
		Fee:      DecimalToMongoDecimal(t.Fee),
		FeeC:     DecimalToMongoDecimal(t.FeeC),
	}
}

// Used to store Transactions with Decimal128 in Mongodb.
// Hacky, need a better way to get rid of this intermediate type.
type TransactionDoc struct {
	ID       primitive.ObjectID   `bson:"_id"`
	TxID     string               `json:"txId" bson:"txId"`
	SourceID primitive.ObjectID   `json:"source" bson:"source"`
	Cost     primitive.Decimal128 `json:"cost" bson:"cost"`
	CostC    primitive.Decimal128 `json:"costC" bson:"costC"`
	Amount   primitive.Decimal128 `json:"amount" bson:"amount"`
	Ticker   string               `json:"ticker" bson:"ticker"`
	Quote    Currency             `json:"quote" bson:"quote"`
	Base     Currency             `json:"base" bson:"base"`
	Ts       time.Time            `json:"ts" bson:"ts"`
	Side     Side                 `json:"side" bson:"side"`
	Fee      primitive.Decimal128 `json:"fee" bson:"fee"`
	FeeC     primitive.Decimal128 `json:"feeC" bson:"feeC"`
}

func (d TransactionDoc) ToTransaction() Transaction {
	return Transaction{
		ID:       d.ID,
		TxID:     d.TxID,
		SourceID: d.SourceID,
		Cost:     decimal.RequireFromString(d.Cost.String()),
		CostC:    decimal.RequireFromString(d.CostC.String()),
		Amount:   decimal.RequireFromString(d.Amount.String()),
		Ticker:   d.Ticker,
		Quote:    d.Quote,
		Base:     d.Base,
		Ts:       d.Ts,
		Side:     d.Side,
		Fee:      decimal.RequireFromString(d.Fee.String()),
		FeeC:     decimal.RequireFromString(d.FeeC.String()),
	}
}

func DecimalToMongoDecimal(v decimal.Decimal) primitive.Decimal128 {
	val, _ := primitive.ParseDecimal128(v.String())
	return val
}
