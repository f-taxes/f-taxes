package applog

import (
	"context"
	"fmt"
	"strings"
	"time"

	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/kataras/golog"
	"github.com/qiniu/qmgo/options"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ApplogLevel string

var inCh = make(chan applogMsg, 10000)

const (
	Info    ApplogLevel = "Info"
	Error   ApplogLevel = "Error"
	Warning ApplogLevel = "Warning"
)

type applogMsg struct {
	Data  interface{} `json:"data"`
	Ts    time.Time   `json:"ts"`
	Level ApplogLevel `json:"level"`
	Tags  []string    `json:"tags"`
}

func (a applogMsg) StringSlice() []string {
	return []string{
		a.Ts.String(),
		string(a.Level),
		strings.Join(a.Tags, ","),
		fmt.Sprintf("%v", a.Data),
	}
}

func Setup() {
	col := DBConn.Collection(APPLOG_COL)
	col.CreateIndexes(context.Background(), []options.IndexModel{
		{Key: []string{"tags"}, Background: true},
	})

	go func() {
		ticker := time.NewTicker(time.Hour)
		for range ticker.C {
			golog.Info("Purging old applog entries")
			col := DBConn.Collection(APPLOG_COL)
			col.RemoveAll(context.Background(), bson.M{"ts": bson.M{"$lt": primitive.NewDateTimeFromTime(time.Now().UTC().Add(-12 * time.Hour))}})
		}
	}()

	go func() {
		for msg := range inCh {
			PushToClients("applog", msg)
			Write(msg)
		}
	}()
}

func Send(level ApplogLevel, data interface{}, tags ...string) {
	msg := applogMsg{
		Data:  data,
		Level: level,
		Tags:  tags,
		Ts:    time.Now().UTC(),
	}

	inCh <- msg
}
