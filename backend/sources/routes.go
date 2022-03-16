package sources

import (
	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func RegisterRoutes(app *iris.Application) {
	app.Get("/sources/list", func(ctx iris.Context) {
		ctx.JSON(Resp{
			Result: true,
			Data:   ListSources(),
		})
	})

	app.Post("/source/add", func(ctx iris.Context) {
		reqData := SourceConnection{}
		if !ReadJSON(ctx, &reqData) {
			return
		}

		err := Update(reqData)

		if err != nil {
			golog.Errorf("Failed to save new source connection: %v", err)

			ctx.JSON(Resp{
				Result: false,
				Data:   "Failed to save new source connection",
			})
			return
		}

		PushToClients("update-src-connections", nil)

		ctx.JSON(Resp{
			Result: true,
		})
	})

	app.Post("/source/fetch/all", func(ctx iris.Context) {
		reqData := struct {
			SrcID primitive.ObjectID `json:"srcId"`
		}{}

		if !ReadJSON(ctx, &reqData) {
			return
		}

		go FetchAllFromSource(reqData.SrcID)

		ctx.JSON(Resp{
			Result: true,
		})
	})

	app.Get("/sources/connections/list", func(ctx iris.Context) {
		list, err := List()

		if err != nil {
			golog.Errorf("Failed to fetch list of source connections: %v", err)
			ctx.JSON(Resp{
				Result: false,
				Data:   "Failed to fetch list of source connections",
			})
			return
		}

		ctx.JSON(Resp{
			Result: true,
			Data:   list,
		})
	})
}
