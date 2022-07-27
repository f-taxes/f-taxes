package plugin

type PluginStatus int

const (
	PLUGIN_INSTALLED = iota
	PLUGIN_NOT_INSTALLED
	PLUGIN_UPDATE_AVAIL
)

type Author struct {
	Name    string `json:"name"`
	Twitter string `json:"twitter"`
}

type DlInfo struct {
	Windows string `json:"windows"`
	Linux   string `json:"linux"`
	Darwin  string `json:"darwin"`
}

type Manifest struct {
	Type       string       `json:"type"`       // Type of the plugin. Currently only "source" is supported.
	ID         string       `json:"id"`         // Unique ID of the plugin.
	Label      string       `json:"label"`      // Name of the plugin as presented in the apps UI.
	Author     Author       `json:"author"`     // Author of the plugin. Can include a social media link as well. See Author struct.
	Version    string       `json:"version"`    // Version of the plugin.
	Icon       string       `json:"icon"`       // Icon to show in the plugin section and in the transaction table.
	Bin        string       `json:"bin"`        // Name of the binary that f-taxes should start (must be the same for each operating system. The file extension should be omitted here. F-Taxes will add ".exe" on windows automatically).
	Repository string       `json:"repository"` // Url of the repository with the plugin's source code.
	Download   DlInfo       `json:"download"`   // List of download urls. Should supply one for each operating system if possible.
	Status     PluginStatus `json:"status"`     // Status of the plugin. Possible states are "installed", "not installed" and "update available".
}
