package main

import (
	"embed"
	"os"
	"path/filepath"
	"time"

	"github.com/f-taxes/f-taxes/backend"
	"github.com/f-taxes/f-taxes/backend/config"
	"github.com/f-taxes/f-taxes/backend/gapi"
	"github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	rotatelogs "github.com/lestrrat-go/file-rotatelogs"
)

//go:embed frontend-dist/*
var WebAssets embed.FS

func main() {
	cfg := config.LoadAppConfig("config.json")

	if cfg.Bool("debug") {
		global.SetGoLogDebugFormat()
		golog.SetLevel("debug")
		golog.Info("Debug logging is enabled!")
	}

	if cfg.Bool("log.write") {
		golog.Infof("Writing log messages to file %s", cfg.String("log.file"))
		pathToAccessLog := cfg.String("log.path")
		os.MkdirAll(filepath.Dir(pathToAccessLog), 0755)

		w, err := rotatelogs.New(pathToAccessLog, rotatelogs.WithMaxAge(24*time.Hour), rotatelogs.WithRotationTime(time.Hour))

		if err != nil {
			golog.Fatal(err)
		}

		defer w.Close()
		golog.SetOutput(w)
	}

	go gapi.Start(cfg)
	backend.Start(cfg, WebAssets)
}
