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

type TransferAction int

const (
	DEPOSIT    = TransferAction(0)
	WITHDRAWAL = TransferAction(1)
)

// Describes a single transfer were some asset was send from one to another wallet/account.
// Fields ending with "C" are values converted to the selected costbases currency.
type Transfer struct {
	ID          primitive.ObjectID `json:"_id" bson:"_id"`
	TxID        string             `json:"txId" bson:"txId"`
	Ts          time.Time          `json:"ts" bson:"ts"`
	Account     string             `json:"account" bson:"account"`
	Source      string             `json:"source" bson:"source"`
	Destination string             `json:"destination" bson:"destination"`
	Comment     string             `json:"comment" bson:"comment"`

	Asset         Currency        `json:"asset" bson:"asset"`
	AssetDecimals int32           `json:"assetDecimals" bson:"assetDecimals"`
	Amount        decimal.Decimal `json:"amount" bson:"amount"`
	Action        TransferAction  `json:"action" bson:"action"`

	Fee            decimal.Decimal `json:"fee" bson:"fee"`
	FeeDecimals    int32           `json:"feeDecimals" bson:"feeDecimals"`
	FeeC           decimal.Decimal `json:"feeC" bson:"feeC"`
	FeeConvertedBy string          `json:"feeConvertedBy"`
	FeeCurrency    Currency        `json:"feeCurrency" bson:"feeCurrency"`
	FeePriceC      decimal.Decimal `json:"feePriceC" bson:"feePriceC"` // Price of the fee converted. Lets say the fee is quoted in SOL. FeePriceC would be the price of SOL at the time of transfer.

	Plugin        string    `json:"plugin" bson:"plugin"`
	PluginVersion string    `json:"pluginVersion" bson:"pluginVersion"`
	Created       time.Time `json:"created" bson:"created"`
	Updated       time.Time `json:"updated" bson:"updated"`
}

func (t Transfer) GetTs() time.Time {
	return t.Ts
}

func (t *Transfer) Store() error {
	col := DBConn.Collection(COL_TRANSFERS)

	if t.TxID != "" {
		count, _ := col.Find(context.Background(), bson.M{"txId": t.TxID}).Count()
		if count > 0 {
			return nil
		}
	}

	_, err := col.InsertOne(context.Background(), t)
	return err
}

func (t Transfer) MarshalBSON() ([]byte, error) {
	data, err := bson.Marshal(transferDoc{
		ID:          t.ID,
		TxID:        t.TxID,
		Ts:          t.Ts,
		Account:     t.Account,
		Source:      t.Source,
		Destination: t.Destination,
		Comment:     t.Comment,

		Asset:         t.Asset,
		AssetDecimals: t.AssetDecimals,
		Amount:        DecimalToMongoDecimal(t.Amount),
		Action:        t.Action,

		Fee:         DecimalToMongoDecimal(t.Fee),
		FeeDecimals: t.FeeDecimals,
		FeePriceC:   DecimalToMongoDecimal(t.FeePriceC),
		FeeCurrency: t.FeeCurrency,
		FeeC:        DecimalToMongoDecimal(t.FeeC),

		Plugin:        t.Plugin,
		PluginVersion: t.PluginVersion,
		Created:       t.Created,
		Updated:       t.Updated,
	})

	if err != nil {
		golog.Errorf("Failed to marshal transfer document: %v", err)
	}

	return data, err
}

func (t *Transfer) UnmarshalBSON(b []byte) error {
	d := transferDoc{}
	err := bson.Unmarshal(b, &d)

	if err != nil {
		golog.Errorf("Failed to unmarshal transfer document: %v", err)
		return err
	}

	t.ID = d.ID
	t.TxID = d.TxID
	t.Ts = d.Ts
	t.Account = d.Account
	t.Source = d.Source
	t.Destination = d.Destination
	t.Comment = d.Comment

	t.Asset = d.Asset
	t.AssetDecimals = d.AssetDecimals
	t.Amount = decimal.RequireFromString(d.Amount.String())
	t.Action = d.Action

	t.Fee = decimal.RequireFromString(d.Fee.String())
	t.FeeDecimals = d.FeeDecimals
	t.FeePriceC = decimal.RequireFromString(d.FeePriceC.String())
	t.FeeCurrency = d.FeeCurrency
	t.FeeC = decimal.RequireFromString(d.FeeC.String())
	t.FeeConvertedBy = d.FeeConvertedBy

	t.Plugin = d.Plugin
	t.PluginVersion = d.PluginVersion
	t.Created = d.Created
	return nil
}

// Intermediary type used to (un-)marshal transfers for mongodb.
type transferDoc struct {
	ID          primitive.ObjectID `bson:"_id"`
	TxID        string             `json:"txId" bson:"txId"`
	Ts          time.Time          `json:"ts" bson:"ts"`
	Account     string             `json:"account" bson:"account"`
	Source      string             `json:"source" bson:"source"`
	Destination string             `json:"destination" bson:"destination"`
	Comment     string             `json:"comment" bson:"comment"`

	Asset         Currency             `json:"asset" bson:"asset"`
	AssetDecimals int32                `json:"assetDecimals" bson:"assetDecimals"`
	Amount        primitive.Decimal128 `json:"amount" bson:"amount"`
	Action        TransferAction       `json:"action" bson:"action"`

	Fee            primitive.Decimal128 `json:"fee" bson:"fee"`
	FeeDecimals    int32                `json:"feeDecimals" bson:"feeDecimals"`
	FeePriceC      primitive.Decimal128 `json:"feePriceC" bson:"feePriceC"`
	FeeCurrency    Currency             `json:"feeCurrency" bson:"feeCurrency"`
	FeeC           primitive.Decimal128 `json:"feeC" bson:"feeC"`
	FeeConvertedBy string               `json:"feeConvertedBy"`

	Plugin        string    `json:"plugin" bson:"plugin"`
	PluginVersion string    `json:"pluginVersion" bson:"pluginVersion"`
	Created       time.Time `json:"created" bson:"created"`
	Updated       time.Time `json:"updated" bson:"updated"`
}

func ProtoTransferToTransfer(t *proto.Transfer) Transfer {
	return Transfer{
		ID:             primitive.NewObjectID(),
		TxID:           t.TxID,
		Ts:             t.Ts.AsTime(),
		Account:        t.Account,
		Source:         t.Source,
		Destination:    t.Destination,
		Comment:        t.Comment,
		Asset:          Currency(t.Asset),
		AssetDecimals:  t.AssetDecimals,
		Amount:         StrToDecimal(t.Amount),
		Action:         TransferAction(t.Action),
		Fee:            StrToDecimal(t.Fee),
		FeeDecimals:    t.FeeDecimals,
		FeePriceC:      StrToDecimal(t.FeePriceC),
		FeeCurrency:    Currency(t.FeeCurrency),
		FeeC:           StrToDecimal(t.FeeC),
		FeeConvertedBy: t.FeeConvertedBy,
		Plugin:         t.Plugin,
		PluginVersion:  t.PluginVersion,
		Created:        t.Created.AsTime(),
		Updated:        t.Updated.AsTime(),
	}
}

func TransferToProtoTransfer(t Transfer) *proto.Transfer {
	return &proto.Transfer{
		TxID:           t.TxID,
		Ts:             timestamppb.New(t.Ts),
		Account:        t.Account,
		Source:         t.Source,
		Destination:    t.Destination,
		Comment:        t.Comment,
		Asset:          string(t.Asset),
		AssetDecimals:  t.AssetDecimals,
		Amount:         t.Amount.String(),
		Action:         proto.TransferAction(t.Action),
		Fee:            t.Fee.String(),
		FeeDecimals:    t.FeeDecimals,
		FeePriceC:      t.FeePriceC.String(),
		FeeCurrency:    string(t.FeeCurrency),
		FeeC:           t.FeeC.String(),
		FeeConvertedBy: t.FeeConvertedBy,
		Plugin:         t.Plugin,
		PluginVersion:  t.PluginVersion,
		Created:        timestamppb.New(t.Created),
		Updated:        timestamppb.New(t.Updated),
	}
}
