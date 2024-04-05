#!/bin/bash
git clone https://github.com/bufbuild/protovalidate protovalidate
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
protoc --proto_path=protovalidate/proto/protovalidate --proto_path=. --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative f-taxes.proto
cp *.go ../../csv_import/proto/
cp *.go ../../german_tax_report/proto/
cp *.go ../../kraken_import/proto/
cp *.go ../../kraken_conversion/proto/
cp *.go ../../binance_conversion/proto/
cp *.go ../../german_conversion/proto/