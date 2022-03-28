package global

import (
	"time"

	"github.com/kataras/golog"
	"github.com/shopspring/decimal"
	"go.mongodb.org/mongo-driver/bson"
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
	SrcName  string             `json:"srcName" bson:"srcName"`
	SrcConID primitive.ObjectID `json:"srcConId" bson:"srcConId"`
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

func (t Transaction) MarshalBSON() ([]byte, error) {
	data, err := bson.Marshal(txDoc{
		ID:       t.ID,
		TxID:     t.TxID,
		SrcName:  t.SrcName,
		SrcConID: t.SrcConID,
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
	})

	if err != nil {
		golog.Errorf("Failed to marshal transaction document: %v", err)
	}

	return data, err
}

func (t *Transaction) UnmarshalBSON(b []byte) error {
	d := txDoc{}
	err := bson.Unmarshal(b, &d)

	if err != nil {
		golog.Errorf("Failed to unmarshal transaction document: %v", err)
		return err
	}

	t.ID = d.ID
	t.TxID = d.TxID
	t.SrcConID = d.SrcConID
	t.SrcName = d.SrcName
	t.Cost = decimal.RequireFromString(d.Cost.String())
	t.CostC = decimal.RequireFromString(d.CostC.String())
	t.Amount = decimal.RequireFromString(d.Amount.String())
	t.Ticker = d.Ticker
	t.Quote = d.Quote
	t.Base = d.Base
	t.Ts = d.Ts
	t.Side = d.Side
	t.Fee = decimal.RequireFromString(d.Fee.String())
	t.FeeC = decimal.RequireFromString(d.FeeC.String())

	return nil
}

// Intermediary type used to (un-)marshal transactions for mongodb.
type txDoc struct {
	ID       primitive.ObjectID   `bson:"_id"`
	TxID     string               `json:"txId" bson:"txId"`
	SrcName  string               `json:"srcName" bson:"srcName"`
	SrcConID primitive.ObjectID   `json:"srcConId" bson:"srcConId"`
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

func DecimalToMongoDecimal(v decimal.Decimal) primitive.Decimal128 {
	val, _ := primitive.ParseDecimal128(v.String())
	return val
}
