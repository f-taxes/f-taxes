package backend

import (
	"embed"
	"net/http"

	"github.com/f-taxes/f-taxes/backend/applog"
	"github.com/f-taxes/f-taxes/backend/global"
	"github.com/f-taxes/f-taxes/backend/plugin"
	"github.com/f-taxes/f-taxes/backend/settings"
	"github.com/f-taxes/f-taxes/backend/sources"
	"github.com/f-taxes/f-taxes/backend/transactions"
	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/view"
	"github.com/knadh/koanf"
)

func Start(cfg *koanf.Koanf, webAssets embed.FS) {
	app := iris.New()
	app.Use(iris.Compression)
	app.SetRoutesNoLog(true)

	global.ConnectDB(cfg)

	registerFrontend(app, cfg, webAssets)

	applog.Setup()
	applog.RegisterRoutes(app)
	settings.RegisterRoutes(app)
	plugin.RegisterRoutes(app, cfg)
	sources.RegisterRoutes(app)
	transactions.RegisterRoutes(app)

	global.SetupWebsocketServer(app)

	config := iris.WithConfiguration(iris.Configuration{
		EnableOptimizations: true,
		Charset:             "UTF-8",
	})

	if err := app.Listen(cfg.MustString("addr"), config); err != nil {
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
