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
	"github.com/kataras/golog"
)

type SpawnedPlugin struct {
	Cmd       *cmd.Cmd
	CtlClient *CtlClient
	Manifest  Manifest
}

// Listens on the nats message server for plugins trying to register themselves.
// Is also used to send messages to plugins and receive responses.
type PluginManager struct {
	sync.Mutex
	Registry       string
	RegistryFile   string // Used to available load plugins from a local file instead of downloading it from the registry. Useful for development.
	PluginPath     string
	GrpcAddress    string
	SpawnedPlugins map[string]*SpawnedPlugin
}

func (m *PluginManager) Start() {
	golog.Info("Starting plugin manager")

	m.SpawnPlugins()
}

func (m *PluginManager) SpawnPlugins() {
	all := m.listLocalManifests()
	for i := range all {
		manifest := all[i]
		m.spawn(manifest)
	}
}

func (m *PluginManager) ConnectBackToPlugin(pluginId string) {
	if manifest, ok := m.findLocalManifestById(pluginId); ok {
		if manifest.Ctl.Address != "" && pluginId == manifest.ID && m.SpawnedPlugins[manifest.ID] != nil {
			m.Lock()
			if m.SpawnedPlugins[manifest.ID].CtlClient == nil {
				m.SpawnedPlugins[manifest.ID].CtlClient = NewCtlClient(manifest.ID, manifest.Ctl.Address)
				go m.SpawnedPlugins[manifest.ID].CtlClient.Connect()
			}
			m.Unlock()
		}
	}
}

func (m *PluginManager) spawn(manifest Manifest) {
	if manifest.Ctl.Address != "" {
		pluginInstance := SpawnedPlugin{
			Manifest: manifest,
		}

		// if manifest.Ctl.Address != "" {
		// 	pluginInstance.CtlClient = NewCtlClient(manifest.ID, manifest.Ctl.Address)
		// 	go pluginInstance.CtlClient.Connect()
		// }

		m.Lock()
		m.SpawnedPlugins[manifest.ID] = &pluginInstance
		m.Unlock()
	}

	if manifest.NoSpawn {
		golog.Warnf("Won't start plugin %s. NoSpawn flag set.", manifest.ID)
		return
	}

	golog.Infof("Starting plugin %s", manifest.ID)
	cmdOptions := cmd.Options{
		Streaming: true,
		Buffered:  false,
	}
	pluginCmd := cmd.NewCmdOptions(cmdOptions, fmt.Sprintf(".%s%s", string(os.PathSeparator), manifest.Bin), "-grpc-addr", m.GrpcAddress)
	pluginCmd.Dir = filepath.Join(m.PluginPath, manifest.ID)

	pluginInstance := SpawnedPlugin{
		Cmd:      pluginCmd,
		Manifest: manifest,
	}

	if manifest.Ctl.Address != "" {
		pluginInstance.CtlClient = NewCtlClient(manifest.ID, manifest.Ctl.Address)
	}

	m.Lock()
	m.SpawnedPlugins[manifest.ID] = &pluginInstance
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

		golog.Warnf("Plugin %s (%s) has exited", manifest.Label, manifest.Version)
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
