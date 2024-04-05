package trades

import (
	"context"
	"fmt"
	"math"

	"github.com/f-taxes/f-taxes/backend/applog"
	g "github.com/f-taxes/f-taxes/backend/global"
	"github.com/f-taxes/f-taxes/proto"
)

type PaginationResult struct {
	Items         []g.Trade `json:"items"`
	TotalCount    int64     `json:"totalCount"`
	FilteredCount int64     `json:"filteredCount"`
	Page          int64     `json:"page"`
	Limit         int64     `json:"limit"`
	TotalPages    int64     `json:"totalPages"`
}

func Paginate(q g.Query) (PaginationResult, error) {
	out := PaginationResult{
		Items: []g.Trade{},
	}

	col := g.DBConn.Collection(g.COL_TRADES)
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

func StoreProtoTrade(trade *proto.Trade) {
	t := g.ProtoTradeToTrade(trade)
	err := t.Store()

	if err != nil {
		applog.Send(applog.Error, fmt.Sprintf("Failed to store trade in database: %v", err))
	}
}
