package config

import (
	"github.com/kataras/golog"
	"github.com/knadh/koanf"
	"github.com/knadh/koanf/parsers/json"
	"github.com/knadh/koanf/providers/confmap"
	"github.com/knadh/koanf/providers/file"
)

func LoadAppConfig(path string) *koanf.Koanf {
	k := koanf.New(".")

	k.Load(confmap.Provider(map[string]interface{}{
		"database.server": "localhost",
		"database.port":   "27017",
		"database.name":   "f-taxes",
		"log.path":        "./logs/app_%Y_%m_%d__%H_%M.log",
		"log.write":       false,
	}, "."), nil)

	f := file.Provider(path)

	if err := k.Load(f, json.Parser()); err != nil {
		golog.Fatalf("Error loading config: %v", err)
	}

	return k
}
