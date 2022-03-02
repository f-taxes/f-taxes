package main

import (
	"embed"

	"github.com/f-taxes/f-taxes/backend"
)

//go:embed frontend-dist/*
var WebAssets embed.FS

func main() {
	backend.Start(WebAssets)
}
