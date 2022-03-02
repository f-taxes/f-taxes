package global

import (
	"context"
	"fmt"

	"github.com/kataras/golog"
	"github.com/knadh/koanf"
	"github.com/qiniu/qmgo"
)

var DBConn *qmgo.Database

func ConnectDB(cfg *koanf.Koanf) {
	ctx := context.Background()
	conUri := fmt.Sprintf("mongodb://%s:%s", cfg.MustString("database.server"), cfg.MustString("database.port"))
	golog.Debugf("Trying to connect to database server at %s", conUri)
	client, err := qmgo.NewClient(ctx, &qmgo.Config{Uri: conUri})

	if err != nil {
		golog.Fatal(err)
	}

	DBConn = client.Database(cfg.MustString("database.name"))
	golog.Debug("Database connection established")
}
