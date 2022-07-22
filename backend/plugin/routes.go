package plugin

import (
	"fmt"

	"github.com/f-taxes/f-taxes/backend/applog"
	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/iris/v12"
	"github.com/knadh/koanf"
)

var Manager *PluginManager

func RegisterRoutes(app *iris.Application, cfg *koanf.Koanf) {
	Manager = &PluginManager{
		Manifests:  []*Manifest{},
		Registry:   cfg.MustString("plugins.registry"),
		PluginPath: cfg.MustString("plugins.path"),
	}

	Manager.Start()

	app.Get("/plugins/list", func(ctx iris.Context) {
		availPlugins, err := Manager.List()

		if err != nil {
			applog.Send(applog.Error, fmt.Sprintf("Failed to load plugin list from online registry. Please try again later: %v", err.Error()), "Internal Error")
			ctx.JSON(Resp{
				Result: false,
				Data:   availPlugins,
			})
			return
		}

		ctx.JSON(Resp{
			Result: true,
			Data:   availPlugins,
		})
	})

	app.Post("/plugins/install", func(ctx iris.Context) {
		reqData := struct {
			ID string `json:"id"`
		}{}

		if !ReadJSON(ctx, &reqData) {
			return
		}

		err := Manager.Install(reqData.ID)

		if err != nil {
			applog.Send(applog.Error, fmt.Sprintf("Failed to install plugin: %v", err.Error()))
			ctx.JSON(Resp{
				Result: false,
			})
			return
		}

		ctx.JSON(Resp{
			Result: true,
		})
	})
}
