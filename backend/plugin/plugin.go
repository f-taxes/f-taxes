package plugin

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
	Type       string `json:"type"`
	ID         string `json:"id"`
	Label      string `json:"label"`
	Author     Author `json:"author"`
	Version    string `json:"version"`
	Icon       string `json:"icon"`
	Repository string `json:"repository"`
	Download   DlInfo `json:"download"`
}
