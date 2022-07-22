package plugin

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	dl "github.com/hashicorp/go-getter"
)

func (m *PluginManager) List() ([]Manifest, error) {
	return m.dlIndex()
}

func (m *PluginManager) Install(id string) error {
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
	os.MkdirAll(pluginPath, 755)

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

	err = dl.Get(pluginPath, dlUrl)

	if err != nil {
		return err
	}

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
