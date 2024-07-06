package snapshot

import (
	"fmt"
	"time"

	"github.com/f-taxes/f-taxes/backend/applog"
	g "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/iris/v12"
	"github.com/knadh/koanf"
)

func RegisterRoutes(app iris.Party, cfg *koanf.Koanf) {
	app.Post("/snapshots/create", func(ctx iris.Context) {
		err := Create(cfg)

		if err != nil {
			applog.Send(applog.Error, fmt.Sprintf("Failed to create snapshot: %v.", err.Error()))

			ctx.JSON(g.Resp{
				Result: false,
			})
			return
		}

		list, _ := ListSnapshots(cfg)

		ctx.JSON(g.Resp{
			Result: true,
			Data:   list,
		})
	})

	app.Get("/snapshots/list", func(ctx iris.Context) {
		snapshots, err := ListSnapshots(cfg)

		if err != nil {
			ctx.JSON(g.Resp{
				Result: false,
				Data:   err.Error(),
			})
			return
		}

		ctx.JSON(g.Resp{
			Result: true,
			Data:   snapshots,
		})
	})

	app.Post("/snapshots/restore", func(ctx iris.Context) {
		reqData := struct {
			Ts time.Time `json:"ts"`
		}{}

		if !g.ReadJSON(ctx, &reqData) {
			return
		}

		err := RestoreFromSnapshot(cfg, reqData.Ts)

		if err != nil {
			applog.Send(applog.Error, fmt.Sprintf("Failed to restore snapshot %s: %v.", reqData.Ts.Format("2006-01-02T15_04_05"), err.Error()))

			ctx.JSON(g.Resp{
				Result: false,
			})
			return
		}

		ctx.JSON(g.Resp{
			Result: true,
		})
	})

	app.Post("/snapshots/remove", func(ctx iris.Context) {
		reqData := struct {
			Ts time.Time `json:"ts"`
		}{}

		if !g.ReadJSON(ctx, &reqData) {
			return
		}

		err := RemoveSnapshot(cfg, reqData.Ts)

		if err != nil {
			applog.Send(applog.Error, fmt.Sprintf("Failed to remove snapshot %s: %v.", reqData.Ts.Format("2006-01-02T15_04_05"), err.Error()))

			ctx.JSON(g.Resp{
				Result: false,
			})
			return
		}

		applog.Send(applog.Info, fmt.Sprintf("Removed snapshot %s.", reqData.Ts.Format("2006-01-02T15_04_05")))
		list, _ := ListSnapshots(cfg)

		ctx.JSON(g.Resp{
			Result: true,
			Data:   list,
		})
	})
}
