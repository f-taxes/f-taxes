package plugin

import (
	"encoding/json"
	"fmt"
	"sync"

	natsserver "github.com/f-taxes/f-taxes/backend/natsServer"
	"github.com/kataras/golog"
	"github.com/nats-io/nats.go"
	// dl "github.com/hashicorp/go-getter"
)

func NatsResp(result bool, data any) []byte {
	bytes, _ := json.Marshal(struct {
		Result bool `json:"result"`
		Data   any  `json:"data"`
	}{
		Result: result,
		Data:   data,
	})

	return bytes
}

// Listens on the nats message server for plugins trying to register themselves.
// Is also used to send messages to plugins and receive responses.
type PluginManager struct {
	sync.Mutex
	Registry   string
	Manifests  []*Manifest
	PluginPath string
}

func (m *PluginManager) Start() {
	golog.Info("Starting plugin manager")
	_, err := natsserver.NatsClient.Subscribe("register", func(msg *nats.Msg) {
		plugins := Manifest{}
		err := json.Unmarshal(msg.Data, &plugins)

		if err != nil {
			golog.Errorf("Failed to unmarshal plugin registration: %v", err)
			return
		}

		fmt.Printf("%+v\n", plugins)
		msg.Respond(NatsResp(true, nil))
	})

	if err != nil {
		golog.Fatalf("Failed to setup nats subscriptions: %v")
	}
}
