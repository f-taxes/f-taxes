package sources

import (
	. "github.com/f-taxes/f-taxes/backend/global"
)

// func RegisterSource(srcReq ReqAddSource) error {
// 	var newSrc SourceConnection

// 	switch srcReq.Source {
// 	case "ftx":
// 		newSrc = ftx.NewFtxSource()
// 	default:
// 		return fmt.Errorf("source %s is unknown to the source manager", srcReq.Source)
// 	}

// 	sources = append(sources, newSrc)
// 	return nil
// }

// func UniqueSourceId(src Source) bool {
// 	for _, s := range sources {
// 		if s.ID() == src.ID() {
// 			return false
// 		}
// 	}

// 	return true
// }

func ListSources() []SourceInfo {
	return AvailSources
}
