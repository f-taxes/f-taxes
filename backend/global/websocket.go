package global

import (
	"encoding/json"
	"log"

	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/websocket"
	"github.com/kataras/neffos"
)

// values should match with the client sides as well.
const enableJWT = false
const namespace = "default"

var websocketServer *neffos.Server

type msgWrap struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

func SetupWebsocketServer(app *iris.Application) {
	websocketServer = websocket.New(
		websocket.DefaultGorillaUpgrader,
		serverEvents)

	websocketServer.SyncBroadcaster = true

	idGen := func(ctx iris.Context) string {
		if username := ctx.GetHeader("X-Username"); username != "" {
			return username
		}

		return websocket.DefaultIDGenerator(ctx)
	}

	app.Get("/echo", websocket.Handler(websocketServer, idGen))

	app.Head("/echo", func(ctx iris.Context) {
		ctx.JSON(Resp{
			Result: true,
		})
	})
}

// if namespace is empty then simply websocket.Events{...} can be used instead.
var serverEvents = websocket.Namespaces{
	namespace: websocket.Events{
		websocket.OnNamespaceConnected: func(nsConn *websocket.NSConn, msg websocket.Message) error {
			// with `websocket.GetContext` you can retrieve the Iris' `Context`.
			ctx := websocket.GetContext(nsConn.Conn)

			log.Printf("[%s] connected to namespace [%s] with IP [%s]",
				nsConn, msg.Namespace,
				ctx.RemoteAddr())
			return nil
		},
		websocket.OnNamespaceDisconnect: func(nsConn *websocket.NSConn, msg websocket.Message) error {
			log.Printf("[%s] disconnected from namespace [%s]", nsConn, msg.Namespace)
			return nil
		},
		"ping": func(nsConn *websocket.NSConn, msg websocket.Message) error {
			nsConn.Emit("pong", []byte(""))
			return nil
		},
	},
}

func PushToClients(channel string, data interface{}) {
	msg := msgWrap{
		Event: channel,
		Data:  data,
	}

	jData, err := json.Marshal(msg)
	if err != nil {
		golog.Fatal(err)
	}

	websocketServer.Broadcast(nil, neffos.Message{
		Namespace: "default",
		Event:     "msg",
		Body:      jData,
	})
}
