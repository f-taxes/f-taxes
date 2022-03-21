package global

import (
	"time"

	"github.com/shopspring/decimal"
)

// Holds a subset of the transaction struct and should be
// used by source implementations to feed data into f-tax.
// Main purpose of this is to make the implementation of
// new sources less confusion by providing a data template
// for transactions that is as slim as possible and without
// fields only needed for internal stuff.
type SrcTx struct {
	// ID of the transaction on the exchange/chain.
	TxID string `json:"txId" bson:"txId"`

	// Timestamp of the transaction. Make sure the time is UTC!
	Ts time.Time `json:"ts" bson:"ts"`

	// Price at which the base asset was bought.
	Price decimal.Decimal `json:"price" bson:"price"`

	// Amount of the transacted base assest.
	Amount decimal.Decimal `json:"amount" bson:"amount"`

	// Name of the market. Example: BTC/USD or BTC-PERP.
	// Only used for labeling in the frontend.
	Ticker string `json:"ticker" bson:"ticker"`

	// Quote currency of the transaction. On the BTC/USD market this would be USD.
	Quote Currency `json:"quote" bson:"quote"`

	// Base currency of the transaction. On the BTC/USD market this would be BTC.
	Base Currency `json:"base" bson:"base"`

	// Whether the base currency was bought or sold.
	Side Side `json:"side" bson:"side"`

	// Any fees that had to be paid in order to execute the transaction.
	Fee decimal.Decimal `json:"fee" bson:"fee"`
}
