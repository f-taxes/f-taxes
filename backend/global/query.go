package global

import "go.mongodb.org/mongo-driver/bson"

type Query struct {
	Page              int64      `json:"page" bson:"page"`
	Limit             int64      `json:"limit" bson:"limit"`
	Sort              string     `json:"sort" bson:"sort"`
	Filter            [][]Filter `json:"filter"`
	ConstructedFilter bson.M     `json:"constructedFilter"`
}
