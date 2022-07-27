package global

import (
	"os"
	"path/filepath"

	"github.com/kataras/golog"
)

func FindFileByName(name, searchRoot string) (paths []string) {
	err := filepath.Walk(searchRoot, func(path string, info os.FileInfo, err error) error {
		if err == nil && info.Name() == name {
			if !info.IsDir() {
				paths = append(paths, path)
			}
		}
		return nil
	})

	if err != nil {
		golog.Error(err)
	}

	return paths
}
