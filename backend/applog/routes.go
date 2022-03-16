package applog

import (
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
	"time"

	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/f-taxes/f-taxes/backend/ttl"
	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
)

func RegisterRoutes(app *iris.Application) {
	(*app).Get("/applog/list", func(ctx iris.Context) {
		records, err := List()

		if err != nil {
			golog.Errorf("Failed to fetch applog records: %v", err)
			ctx.StatusCode(iris.StatusInternalServerError)
			return
		}

		ctx.JSON(Resp{
			Result: true,
			Data:   records,
		})
	})

	(*app).Post("/applog/clear", func(ctx iris.Context) {
		err := Purge()

		if err != nil {
			golog.Errorf("Failed to purge applog records: %v", err)
			ctx.StatusCode(iris.StatusInternalServerError)
			return
		}

		ctx.JSON(Resp{
			Result: true,
		})
	})

	(*app).Post("/applog/export", func(ctx iris.Context) {
		records, err := List()

		if err != nil {
			golog.Errorf("Failed to fetch applog records: %v", err)
			ctx.StatusCode(iris.StatusInternalServerError)
			return
		}

		fPath := fmt.Sprintf("./app_log_%s.csv", time.Now().UTC().Format("01_02_06__03_04_05PM"))
		f, err := os.Create(fPath)

		if err != nil {
			golog.Errorf("Failed to open file", err)
			ctx.StatusCode(iris.StatusInternalServerError)
			return
		}

		defer f.Close()

		w := csv.NewWriter(f)
		defer w.Flush()

		for _, record := range records {
			if err := w.Write(record.StringSlice()); err != nil {
				golog.Errorf("Error writing record to file", err)
				ctx.StatusCode(iris.StatusInternalServerError)
				return
			}
		}

		ttl.AddExpiringDownload(filepath.Base(fPath), fPath, time.Minute*30)

		ctx.JSON(Resp{
			Result: true,
			Data:   filepath.Base(fPath),
		})
	})

	(*app).Get("/applog/download/{p:string}", func(ctx iris.Context) {
		name := ctx.Params().GetString("p")

		if fPath, ok := ttl.GetExpiringDownload(name); ok {
			ctx.SendFile(fPath, name)
		} else {
			golog.Errorf("File %s is not a valid download target", name)
			ctx.StatusCode(iris.StatusInternalServerError)
		}
	})
}
