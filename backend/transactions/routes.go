package transactions

import (
	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
)

type Query struct {
	Page  int64  `json:"page" bson:"page"`
	Limit int64  `json:"limit" bson:"limit"`
	Sort  string `json:"sort" bson:"sort"`
}

func RegisterRoutes(app *iris.Application) {
	app.Post("/transactions/page", func(ctx iris.Context) {
		reqData := Query{
			Page:  1,
			Sort:  "ts",
			Limit: 2000,
		}

		if !ReadJSON(ctx, &reqData) {
			return
		}

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
