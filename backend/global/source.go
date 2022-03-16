package global

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SourceType string

const (
	EXCHANGE = SourceType("exchange")
	WALLET   = SourceType("wallet")
)

type Source interface {
	Label() string
	Type() SourceType
	ID() string
	FetchTransactions(context.Context, time.Time) (<-chan SrcTx, <-chan error)
}

type SourceInfo struct {
	Label string     `json:"label"`
	Type  SourceType `json:"type"`
	ID    string     `json:"id"`
}

type SourceConnection struct {
	ID         primitive.ObjectID `bson:"_id" json:"_id"`
	Label      string             `bson:"label" json:"label"`
	Note       string             `bson:"note" json:"note"`
	SourceID   string             `bson:"sourceId" json:"source"`
	ApiKey     string             `bson:"apiKey" json:"key"`
	ApiSecret  string             `bson:"apiSecret" json:"secret"`
	Subaccount string             `bson:"subaccount" json:"subaccount"`

	// Timestamp of the last time the app fetched transactions from the source.
	LastFetched time.Time `bson:"lastFetched" json:"lastFetched"`
}
