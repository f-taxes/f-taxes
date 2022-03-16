package global

import (
	"fmt"
	"runtime"
	"strings"

	"github.com/kataras/golog"
)

func SetGoLogDebugFormat() {
	golog.Handle(func(l *golog.Log) bool {
		file := "???"
		line := 0

		pc := make([]uintptr, 64)
		n := runtime.Callers(3, pc)
		if n != 0 {
			pc = pc[:n]
			frames := runtime.CallersFrames(pc)

			for {
				frame, more := frames.Next()
				if !strings.Contains(frame.File, "github.com/kataras/golog") {
					file = frame.File
					line = frame.Line
					break
				}
				if !more {
					break
				}
			}
		}

		slices := strings.Split(file, "/")
		file = slices[len(slices)-1]

		l.Message = fmt.Sprintf("[%s:%d] %s", file, line, l.Message)
		return false
	})
}
