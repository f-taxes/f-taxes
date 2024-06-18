package plugin

import (
	"context"
	"time"

	"github.com/f-taxes/f-taxes/proto"
	"github.com/kataras/golog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/backoff"
	"google.golang.org/grpc/credentials/insecure"
)

type CtlClient struct {
	name       string
	conStr     string
	Connection *grpc.ClientConn
	GrpcClient proto.PluginCtlClient
}

func NewCtlClient(name, conStr string) *CtlClient {
	return &CtlClient{
		name:   name,
		conStr: conStr,
	}
}

// Tries to connect to a plugin. Will sleep for 10s if it fails to connect and then try again to keep CPU usage in check.
func (c *CtlClient) Connect() error {
	for {
		ctx, _ := context.WithTimeout(context.Background(), time.Second*3)
		con, err := grpc.DialContext(ctx, c.conStr, grpc.WithTransportCredentials(insecure.NewCredentials()), grpc.WithConnectParams(grpc.ConnectParams{
			MinConnectTimeout: time.Second * 3,
			Backoff:           backoff.Config{MaxDelay: time.Second * 5},
		}), grpc.WithBlock())

		if err != nil {
			golog.Errorf("%s: Failed to establish grpc connections: %v", c.name, err)
			time.Sleep(time.Second * 10)
			continue
		}

		go func() {
			state := con.GetState()
			for {
				golog.Infof("%s: Connection state is %s", c.name, state.String())
				con.WaitForStateChange(context.Background(), state)
				state = con.GetState()
			}
		}()

		c.Connection = con
		c.GrpcClient = proto.NewPluginCtlClient(con)

		return nil
	}
}
