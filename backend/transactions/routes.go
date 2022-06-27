package transactions

import (
	"fmt"

	"github.com/f-taxes/f-taxes/backend/applog"
	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
	"go.mongodb.org/mongo-driver/bson"
)

type Query struct {
	Page              int64      `json:"page" bson:"page"`
	Limit             int64      `json:"limit" bson:"limit"`
	Sort              string     `json:"sort" bson:"sort"`
	Filter            [][]Filter `json:"filter"`
	ConstructedFilter bson.M     `json:"constructedFilter"`
}

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
