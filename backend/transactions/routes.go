package transactions

import (
	"fmt"

	"github.com/f-taxes/f-taxes/backend/applog"
	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
)

func RegisterRoutes(app *iris.Application) {
	app.Post("/transactions/page", func(ctx iris.Context) {
		reqData := Query{
			Page:   1,
			Sort:   "ts",
			Limit:  2000,
			Filter: [][]Filter{},
		}

		if !ReadJSON(ctx, &reqData) {
			return
		}

		f, err := BuildFilter(reqData.Filter)
		if err != nil {
			applog.Send(applog.Error, fmt.Sprintf("Failed to construct filter: %s. Please report this bug to the developers.", err.Error()), "Internal Error")
			golog.Errorf("Failed to construct filter: %v", err)
			ctx.JSON(Resp{
				Result: false,
				Data:   PaginationResult{},
			})
			return
		}

		reqData.ConstructedFilter = f
		result, err := Paginate(reqData)

		if err != nil {
			golog.Errorf("Failed to fetch page of transactions: %v", err)
			ctx.StatusCode(iris.StatusInternalServerError)
			return
		}

		ctx.JSON(Resp{
			Result: true,
			Data:   result,
		})
	})
}
