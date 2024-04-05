package global

import "time"

type Record interface {
	GetTs() time.Time
}
