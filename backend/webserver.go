package backend

import (
	"embed"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/f-taxes/f-taxes/backend/config"
	"github.com/f-taxes/f-taxes/backend/global"
	"github.com/f-taxes/f-taxes/backend/sources"
	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/view"
	"github.com/knadh/koanf"
	rotatelogs "github.com/lestrrat-go/file-rotatelogs"
)

func Start(webAssets embed.FS) {
	cfg := config.LoadAppConfig("config.json")
	app := iris.New()
	app.Use(iris.Compression)

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

	global.ConnectDB(cfg)

	registerFrontend(app, cfg, webAssets)
	sources.RegisterRoutes(app)

	global.SetupWebsocketServer(app)

	if err := app.Listen(cfg.MustString("addr")); err != nil {
		golog.Fatal(err)
	}
}

func registerFrontend(app *iris.Application, cfg *koanf.Koanf, webAssets embed.FS) {
	var frontendTpl *view.HTMLEngine
	useEmbedded := cfg.Bool("embedded")

	if useEmbedded {
		golog.Debug("Using embedded web sources")
		embeddedFs := iris.PrefixDir("frontend-dist", http.FS(webAssets))
		frontendTpl = iris.HTML(embeddedFs, ".html")
		app.HandleDir("/assets", embeddedFs)
	} else {
		golog.Debug("Using external web sources")
		frontendTpl = iris.HTML("./frontend-dist", ".html")
		app.HandleDir("/assets", "frontend-dist")
	}

	golog.Debug("Automatic reload of web sources is enabled")
	frontendTpl.Reload(cfg.Bool("debug"))
	app.RegisterView(frontendTpl)
	app.OnAnyErrorCode(index)

	app.Get("/", index)
	app.Get("/{p:path}", index)
}

func index(ctx iris.Context) {
	ctx.View("index.html")
}
