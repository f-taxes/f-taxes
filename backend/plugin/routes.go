package plugin

import (
	"context"
	"fmt"

	"github.com/f-taxes/f-taxes/backend/applog"
	. "github.com/f-taxes/f-taxes/backend/global"
	jobmanager "github.com/f-taxes/f-taxes/backend/jobManager"
	"github.com/kataras/iris/v12"
	"github.com/knadh/koanf"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var jobs = jobmanager.New()
var Manager *PluginManager

func RegisterRoutes(app *iris.Application, cfg *koanf.Koanf) {
	Manager = &PluginManager{
		Registry:       cfg.String("plugins.registry"),
		RegistryFile:   cfg.String("plugins.registryFile"),
		PluginPath:     cfg.MustString("plugins.path"),
		GrpcAddress:    cfg.MustString("grpc.address"),
		SpawnedPlugins: map[string]*SpawnedPlugin{},
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
			ID      string `json:"id"`
			Label   string `json:"label"`
			Version string `json:"version"`
		}{}

		if !ReadJSON(ctx, &reqData) {
			return
		}

		jobID := primitive.NewObjectID()
		jobCtx, cancelFn := context.WithCancel(context.Background())
		jobs.Add(jobID, cancelFn)

		defer PushToClients("job-progress", map[string]string{
			"_id":      jobID.Hex(),
			"label":    fmt.Sprintf("Installing plugin %s (%s)", reqData.Label, reqData.Version),
			"progress": "100",
		})

		PushToClients("job-progress", map[string]string{
			"_id":      jobID.Hex(),
			"label":    fmt.Sprintf("Installing plugin %s (%s)", reqData.Label, reqData.Version),
			"progress": "-1",
		})

		err := Manager.Install(jobCtx, reqData.ID)

		if err != nil {
			applog.Send(applog.Error, fmt.Sprintf("Failed to install plugin '%s (%s)': %v", reqData.Label, reqData.Version, err.Error()))
			ctx.JSON(Resp{
				Result: false,
			})

			PushToClients("plugin-install-result", map[string]any{
				"id":     reqData.ID,
				"result": false,
			})
			return
		}

		applog.Send(applog.Info, fmt.Sprintf("Plugin '%s (%s)' was installed", reqData.Label, reqData.Version))

		PushToClients("plugin-install-result", map[string]any{
			"id":     reqData.ID,
			"result": true,
		})

		ctx.JSON(Resp{
			Result: true,
		})
	})

	app.Post("/plugin/uninstall", func(ctx iris.Context) {
		reqData := struct {
			ID      string `json:"id"`
			Label   string `json:"label"`
			Version string `json:"version"`
		}{}

		if !ReadJSON(ctx, &reqData) {
			return
		}

		err := Manager.Uninstall(reqData.ID)

		if err != nil {
			applog.Send(applog.Error, fmt.Sprintf("Failed to uninstall plugin '%s': %s", reqData.ID, err.Error()))
		}

		PushToClients("plugin-uninstalled", map[string]any{
			"id":     reqData.ID,
			"result": true,
		})

		ctx.JSON(Resp{
			Result: true,
		})
	})
}
