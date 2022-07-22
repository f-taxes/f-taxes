package transactions

import (
	"context"
	"math"

	. "github.com/f-taxes/f-taxes/backend/global"
	"go.mongodb.org/mongo-driver/bson"
)

const COL_TRANSACTION = "transactions"

type PaginationResult struct {
	Items         []Transaction `json:"items"`
	TotalCount    int64         `json:"totalCount"`
	FilteredCount int64         `json:"filteredCount"`
	Page          int64         `json:"page"`
	Limit         int64         `json:"limit"`
	TotalPages    int64         `json:"totalPages"`
}

type Query struct {
	Page              int64      `json:"page" bson:"page"`
	Limit             int64      `json:"limit" bson:"limit"`
	Sort              string     `json:"sort" bson:"sort"`
	Filter            [][]Filter `json:"filter"`
	ConstructedFilter bson.M     `json:"constructedFilter"`
}

func Paginate(q Query) (PaginationResult, error) {
	out := PaginationResult{
		Items: []Transaction{},
	}

	col := DBConn.Collection(COL_TRANSACTION)
	count, err := col.Find(context.Background(), q.ConstructedFilter).Count()

	if err != nil {
		return out, err
	}

	out.FilteredCount = count
	out.TotalCount = count
	out.Page = q.Page
	out.Limit = q.Limit
	out.TotalPages = int64(math.Ceil(float64(count) / float64(q.Limit)))

	err = col.Find(context.Background(), q.ConstructedFilter).Sort(q.Sort).Skip((q.Page - 1) * q.Limit).Limit(q.Limit).All(&out.Items)
	return out, err
}
