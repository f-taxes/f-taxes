package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"time"

	semver "github.com/Masterminds/semver/v3"
	"github.com/f-taxes/f-taxes/backend/global"
	dl "github.com/hashicorp/go-getter"
	"github.com/kataras/golog"
)

func (m *PluginManager) UpdatePluginConnectionStatus(pluginId string) {
	m.Lock()
	defer m.Unlock()

	if spawnedPlugin := m.GetSpawnedPluginById(pluginId); spawnedPlugin != nil {
		spawnedPlugin.Manifest.LastHeartbeat = time.Now().UTC()
	}
}

func (m *PluginManager) List(onlyInstalled bool, typeFilter ...string) ([]Manifest, error) {
	availManifests, err := m.dlIndex()

	if err != nil {
		return availManifests, err
	}

	updatedList := []Manifest{}

	for i := range availManifests {
		manifest := availManifests[i]
		manifest.Status = PLUGIN_NOT_INSTALLED

		if len(typeFilter) > 0 && !global.ContainsAny(typeFilter, manifest.Type) {
			continue
		}

		if instManifest, ok := m.findLocalManifestById(manifest.ID); ok {
			instVer, err := semver.NewVersion(instManifest.Version)

			if err != nil {
				golog.Warnf("Unable to parse semver %s of installed plugin %s", instManifest.Version, instManifest.ID)
				continue
			}

			availVer, err := semver.NewVersion(manifest.Version)

			if err != nil {
				golog.Warnf("Unable to parse semver %s of available plugin %s", manifest.Version, manifest.ID)
				continue
			}

			if instVer.LessThan(availVer) {
				manifest.Status = PLUGIN_UPDATE_AVAIL
			} else {
				manifest.Status = PLUGIN_INSTALLED
			}
		}

		if !onlyInstalled || (onlyInstalled && manifest.Status == PLUGIN_INSTALLED) {
			if spawnedPlugin := m.GetSpawnedPluginById(manifest.ID); spawnedPlugin != nil {
				manifest.LastHeartbeat = spawnedPlugin.Manifest.LastHeartbeat
			}

			updatedList = append(updatedList, manifest)
		}
	}

	return updatedList, nil
}

func (m *PluginManager) ListInstalled() []Manifest {
	return m.listLocalManifests()
}

func (m *PluginManager) GetSpawnedPluginById(id string) *SpawnedPlugin {
	if p, ok := m.SpawnedPlugins[id]; ok {
		return p
	}

	return nil
}

func (m *PluginManager) Uninstall(id string) error {
	p, ok := m.getPluginPath(id)

	if !ok {
		return fmt.Errorf("plugin %s seems to not be installed", id)
	}

	m.Lock()
	c, ok := m.SpawnedPlugins[id]
	m.Unlock()

	if ok {
		c.Cmd.Stop()

		if c.CtlClient != nil {
			c.CtlClient.Connection.Close()
		}
	}
	return os.RemoveAll(p)
}

func (m *PluginManager) Install(ctx context.Context, id string) error {
	list, err := m.dlIndex()

	if err != nil {
		return err
	}

	idx := m.indexOfManifest(id, list)

	if idx == -1 {
		return fmt.Errorf("manifest not found")
	}

	manifest := list[idx]
	pluginPath := filepath.Join(m.PluginPath, manifest.ID)
	os.MkdirAll(pluginPath, 0755)

	dlUrl := manifest.Download.Windows

	if runtime.GOOS == "linux" {
		dlUrl = manifest.Download.Linux
	}

	if runtime.GOOS == "darwin" {
		dlUrl = manifest.Download.Darwin
	}

	if dlUrl == "" {
		return fmt.Errorf("No download for the %s OS provided by the plugin author", runtime.GOOS)
	}

	golog.Infof("Downloading plugin %s from url %s", manifest.ID, dlUrl)
	err = dl.Get(pluginPath, dlUrl, dl.WithContext(ctx))

	if err != nil {
		return err
	}

	golog.Infof("Download of plugin %s from url %s finished", manifest.ID, dlUrl)

	m.spawn(manifest)

	return nil
}

func (m *PluginManager) indexOfManifest(id string, manifests []Manifest) int {
	for i := range manifests {
		if manifests[i].ID == id {
			return i
		}
	}
	return -1
}

func (m *PluginManager) dlIndex() ([]Manifest, error) {
	list := []Manifest{}

	if m.RegistryFile == "" {
		resp, err := http.Get(m.Registry)
		if err != nil {
			return nil, err
		}

		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(body, &list)
		if err != nil {
			return nil, err
		}
	} else {
		contents, err := os.ReadFile(m.RegistryFile)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(contents, &list)
		if err != nil {
			return nil, err
		}
	}

	return list, nil
}
