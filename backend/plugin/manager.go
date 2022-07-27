package plugin

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/go-cmd/cmd"

	"github.com/f-taxes/f-taxes/backend/applog"
	. "github.com/f-taxes/f-taxes/backend/global"
	natsserver "github.com/f-taxes/f-taxes/backend/natsServer"
	"github.com/kataras/golog"
	"github.com/nats-io/nats.go"
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
	Registry       string
	Manifests      []*Manifest
	PluginPath     string
	Host           string
	Port           int
	SpawnedPlugins map[string]*cmd.Cmd
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

	m.SpawnPlugins()
}

func (m *PluginManager) SpawnPlugins() {
	all := m.listLocalManifests()
	for i := range all {
		manifest := all[i]
		m.spawn(manifest)
	}
}

func (m *PluginManager) spawn(manifest Manifest) {
	golog.Infof("Starting plugin %s", manifest.ID)
	cmdOptions := cmd.Options{
		Streaming: true,
		Buffered:  false,
	}
	pluginCmd := cmd.NewCmdOptions(cmdOptions, fmt.Sprintf(".%s%s", string(os.PathSeparator), manifest.Bin), "-host", m.Host, "-port", fmt.Sprintf("%d", m.Port))
	pluginCmd.Dir = filepath.Join(m.PluginPath, manifest.ID)

	m.Lock()
	m.SpawnedPlugins[manifest.ID] = pluginCmd
	m.Unlock()

	doneChan := make(chan struct{})
	go func(id string) {
		defer close(doneChan)
		// Done when both channels have been closed
		// https://dave.cheney.net/2013/04/30/curious-channels
		for pluginCmd.Stdout != nil || pluginCmd.Stderr != nil {
			select {
			case line, open := <-pluginCmd.Stdout:
				if !open {
					pluginCmd.Stdout = nil
					continue
				}
				golog.Infof("Plugin [%s]: %s", id, line)
			case line, open := <-pluginCmd.Stderr:
				if !open {
					pluginCmd.Stderr = nil
					continue
				}
				golog.Infof("Plugin [%s]: %s", id, line)
			}
		}
	}(manifest.ID)

	go func(manifest Manifest) {
		// Run and wait for Cmd to return, discard Status
		<-pluginCmd.Start()

		// Wait for goroutine to print everything
		<-doneChan

		m.Lock()
		delete(m.SpawnedPlugins, manifest.ID)
		m.Unlock()

		applog.Send(applog.Warning, fmt.Sprintf("Plugin %s (%s) has exited", manifest.Label, manifest.Version), "Plugin")
	}(manifest)
}

func (m *PluginManager) listLocalManifests() []Manifest {
	out := []Manifest{}
	manifests := FindFileByName("manifest.json", m.PluginPath)

	for i := range manifests {
		p := manifests[i]
		content, err := os.ReadFile(p)

		if err != nil {
			continue
		}

		manifest := Manifest{}
		err = json.Unmarshal(content, &manifest)

		if err != nil {
			continue
		}

		out = append(out, manifest)
	}

	return out
}

func (m *PluginManager) getPluginPath(id string) (string, bool) {
	manifests := FindFileByName("manifest.json", m.PluginPath)

	for i := range manifests {
		p := manifests[i]
		content, err := os.ReadFile(p)

		if err != nil {
			continue
		}

		manifest := Manifest{}
		err = json.Unmarshal(content, &manifest)

		if err != nil {
			continue
		}

		if manifest.ID == id {
			return filepath.Dir(p), true
		}
	}

	return "", false
}

func (m *PluginManager) findLocalManifestById(id string) (Manifest, bool) {
	all := m.listLocalManifests()
	for i := range all {
		if all[i].ID == id {
			return all[i], true
		}
	}

	return Manifest{}, false
}
