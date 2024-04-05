package transfers

import (
	"context"
	"fmt"
	"math"

	"github.com/f-taxes/f-taxes/backend/applog"
	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/f-taxes/f-taxes/proto"
)

type PaginationResult struct {
	Items         []Transfer `json:"items"`
	TotalCount    int64      `json:"totalCount"`
	FilteredCount int64      `json:"filteredCount"`
	Page          int64      `json:"page"`
	Limit         int64      `json:"limit"`
	TotalPages    int64      `json:"totalPages"`
}

func Paginate(q Query) (PaginationResult, error) {
	out := PaginationResult{
		Items: []Transfer{},
	}

	col := DBConn.Collection(COL_TRANSFERS)
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

func StoreProtoTransfer(transfer *proto.Transfer) {
	t := ProtoTransferToTransfer(transfer)
	err := t.Store()

	if err != nil {
		applog.Send(applog.Error, fmt.Sprintf("Failed to store transfer in database: %v", err))
	}
}
