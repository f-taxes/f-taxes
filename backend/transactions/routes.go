package transactions

import (
	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
)

type Query struct {
	Page  int64  `json:"page"`
	Limit int64  `json:"limit"`
	Sort  string `json:"sort"`
}

func RegisterRoutes(app *iris.Application) {
	app.Post("/transactions/page", func(ctx iris.Context) {
		reqData := Query{}

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
