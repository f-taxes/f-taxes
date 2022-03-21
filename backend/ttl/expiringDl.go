package ttl

import (
	"os"
	"sync"
	"time"
)

type ttlDownload struct {
	Name string
	Path string
	TTL  time.Time
}

var ttlLock sync.Mutex
var aliveDownloads = map[string]ttlDownload{}

func init() {
	go func() {
		ticker := time.NewTicker(time.Minute)

		for range ticker.C {
			go func() {
				ttlLock.Lock()
				defer ttlLock.Unlock()
				now := time.Now().UTC()

				for n, dl := range aliveDownloads {
					if now.After(dl.TTL) {
						os.Remove(dl.Path)
						delete(aliveDownloads, n)
					}
				}
			}()
		}
	}()
}

func AddExpiringDownload(name, path string, ttl time.Duration) {
	ttlLock.Lock()
	defer ttlLock.Unlock()
	aliveDownloads[name] = ttlDownload{
		Name: name,
		Path: path,
		TTL:  time.Now().UTC().Add(ttl),
	}
}

func GetExpiringDownload(name string) (string, bool) {
	ttlLock.Lock()
	defer ttlLock.Unlock()
	if ttlDl, ok := aliveDownloads[name]; ok && time.Now().UTC().Before(ttlDl.TTL) {
		return ttlDl.Path, true
	}
	return "", false
}
