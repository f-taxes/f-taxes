package plugin

import "time"

type PluginStatus int

const (
	PLUGIN_INSTALLED = iota
	PLUGIN_NOT_INSTALLED
	PLUGIN_UPDATE_AVAIL
)

type Author struct {
	Name   string   `json:"name"`
	Social []Social `json:"social"`
}

type Social struct {
	Type string `json:"type"`
	Url  string `json:"url"`
}

type DlInfo struct {
	Windows string `json:"windows"`
	Linux   string `json:"linux"`
	Darwin  string `json:"darwin"`
}

type Web struct {
	Address    string `json:"address"` // Address that the plugin's web server is listening on."
	ConfigPage string `json:"configPage,omitempty"`
	ReportPage string `json:"reportPage,omitempty"`
}

type Ctl struct {
	Address string `json:"address"` // Address for the web server to listen on.
}

type Manifest struct {
	ID            string       `json:"id"`            // Unique ID of the plugin.
	Type          string       `json:"type"`          // Type of the plugin. Currently only "source" is supported.
	Label         string       `json:"label"`         // Name of the plugin as presented in the apps UI.
	Author        Author       `json:"author"`        // Author of the plugin. Can include a social media link as well. See Author struct.
	Version       string       `json:"version"`       // Version of the plugin.
	Icon          string       `json:"icon"`          // Icon to show in the plugin section and else where if needed.
	Bin           string       `json:"bin"`           // Name of the binary that f-taxes should start (must be the same for each operating system. The file extension should be omitted here. F-Taxes will add ".exe" on windows automatically).
	NoSpawn       bool         `json:"noSpawn"`       // If true, F-Taxes won't try to spawn the plugin. Useful to run a plugin manually for development.
	Repository    string       `json:"repository"`    // Url of the repository with the plugin's source code.
	Download      DlInfo       `json:"download"`      // List of download urls. Should supply one for each operating system if possible.
	Web           Web          `json:"web"`           // If set F-Taxes will allow the plugin to display a web ui.
	Ctl           Ctl          `json:"ctl"`           // Settings for the plugin's grpc server that allows for control via F-Taxes.
	Status        PluginStatus `json:"status"`        // Status of the plugin. Possible states are "installed", "not installed" and "update available".
	LastHeartbeat time.Time    `json:"lastHeartbeat"` // Last time a heartbeat was received from the plugin.
}
