package settings

import (
	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
)

func RegisterRoutes(app *iris.Application) {
	ensureDefaultSettings()

	app.Get("/settings/get", func(ctx iris.Context) {
		s, err := Get()

		if err != nil {
			ctx.JSON(Resp{
				Result: false,
				Data:   err.Error(),
			})
			return
		}

		ctx.JSON(Resp{
			Result: true,
			Data:   s,
		})
	})

	app.Post("/settings/save", func(ctx iris.Context) {
		reqData := UserSettings{}
		if !ReadJSON(ctx, &reqData) {
			return
		}

		err := Save(reqData)

		if err != nil {
			golog.Errorf("Failed to save settings: %v", err)

			ctx.JSON(Resp{
				Result: false,
				Data:   "Failed to save settings",
			})
			return
		}

		PushToClients("app-settings-updated", nil)

		ctx.JSON(Resp{
			Result: true,
		})
	})
}
