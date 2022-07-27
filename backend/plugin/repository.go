package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	semver "github.com/Masterminds/semver/v3"
	dl "github.com/hashicorp/go-getter"
	"github.com/kataras/golog"
)

func (m *PluginManager) List() ([]Manifest, error) {
	availManifests, err := m.dlIndex()

	if err != nil {
		return availManifests, err
	}

	updatedList := []Manifest{}

	for i := range availManifests {
		manifest := availManifests[i]
		manifest.Status = PLUGIN_NOT_INSTALLED

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

		updatedList = append(updatedList, manifest)
	}

	return updatedList, nil
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
		c.Stop()
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

	resp, err := http.Get(m.Registry)
	if err != nil {
		return list, err
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)

	err = json.Unmarshal(body, &list)
	if err != nil {
		return list, err
	}

	return list, nil
}
