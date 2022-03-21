package transactions

import (
	"context"

	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
	"go.mongodb.org/mongo-driver/bson"
)

func RegisterRoutes(app *iris.Application) {
	app.Get("/transactions/all", func(ctx iris.Context) {
		col := DBConn.Collection("ftx")

		txList := []Transaction{}
		txDocs := []TransactionDoc{}
		err := col.Find(context.Background(), bson.M{}).All(&txDocs)

		if err != nil {
			golog.Errorf("Failed to fetch transactions from database: %v", err)
			ctx.StatusCode(iris.StatusInternalServerError)
			return
		}

		for i := range txDocs {
			txList = append(txList, txDocs[i].ToTransaction())
		}

		ctx.JSON(Resp{
			Result: true,
			Data:   txList,
		})
	})
}
