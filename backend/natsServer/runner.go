package natsserver

import (
	"io/ioutil"
	"os"
	"time"

	"github.com/kataras/golog"
	"github.com/nats-io/nats-server/v2/server"
	"github.com/nats-io/nats.go"
)

var NatsClient *nats.EncodedConn

func Start() {
	serverName := "F-TAXES-NATS"
	host := "127.0.0.1"
	port := 4222

	tdir, err := ioutil.TempDir(os.TempDir(), serverName)

	if err != nil {
		golog.Fatalf("Failed to create temp directory for nats server: %v", err)
	}

	o := server.Options{
		Host:       host,
		Port:       port,
		JetStream:  true,
		ServerName: serverName,
		StoreDir:   tdir,
	}

	srv, err := server.NewServer(&o)

	if err != nil {
		golog.Fatalf("Failed to instantiate nats server: %v", err)
	}

	go func() {
		golog.Infof("Nats server will be listening at %s:%d", host, port)
		srv.Start()
	}()

	golog.Info("Waiting for nats server to become ready")
	if !srv.ReadyForConnections(20 * time.Second) {
		golog.Fatal("Failed to start nats server")
	}

	nc, err := nats.Connect(srv.ClientURL())

	if err != nil {
		golog.Fatalf("Failed to connect to f-taxes nats server: %v", err)
	}

	ec, err := nats.NewEncodedConn(nc, nats.JSON_ENCODER)

	if err != nil {
		golog.Fatalf("Failed to establish encoded connection to f-taxes nats server: %v", err)
	}

	NatsClient = ec

	golog.Info("Connected to nats server")
}
