package ftx

import (
	. "github.com/f-taxes/f-taxes/backend/global"
)

type FtxSource struct {
	id      string
	label   string
	srcType SourceType
}

func NewFtxSource() *FtxSource {
	return &FtxSource{
		id:      "ftx",
		label:   "FTX",
		srcType: EXCHANGE,
	}
}

func (s *FtxSource) ID() string {
	return s.id
}

func (s *FtxSource) Label() string {
	return s.label
}

func (s *FtxSource) Type() SourceType {
	return s.srcType
}
