package gapi

import (
	"context"
	"fmt"
	"net"

	"github.com/bufbuild/protovalidate-go"
	"github.com/f-taxes/f-taxes/backend/applog"
	"github.com/f-taxes/f-taxes/backend/global"
	g "github.com/f-taxes/f-taxes/backend/global"
	"github.com/f-taxes/f-taxes/backend/settings"
	"github.com/f-taxes/f-taxes/backend/trades"
	"github.com/f-taxes/f-taxes/backend/transfers"
	pb "github.com/f-taxes/f-taxes/proto"
	"github.com/kataras/golog"
	"github.com/knadh/koanf"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/types/known/emptypb"
)

var validator *protovalidate.Validator

type GapiServer struct {
	pb.UnimplementedFTaxesServer
}

func init() {
	v, err := protovalidate.New()
	if err != nil {
		golog.Fatalf("Failed to initialize protobuf message validator: %v", err)
	}

	validator = v
}

func (s *GapiServer) StreamRecords(job *pb.StreamRecordsJob, stream pb.FTaxes_StreamRecordsServer) error {
	colTrades := g.DBConn.Collection(g.COL_TRADES)
	colTransfers := g.DBConn.Collection(g.COL_TRANSFERS)
	golog.Infof("Plugin %s (v%s) requested a stream of records from %s to %s", job.Plugin, job.PluginVersion, job.From.AsTime(), job.To.AsTime())

	cursorTrades := colTrades.Find(context.Background(), bson.M{"ts": bson.M{"$gte": primitive.NewDateTimeFromTime(job.From.AsTime()), "$lte": primitive.NewDateTimeFromTime(job.To.AsTime())}}).Sort("ts").Cursor()
	cursorTransfers := colTransfers.Find(context.Background(), bson.M{"ts": bson.M{"$gte": primitive.NewDateTimeFromTime(job.From.AsTime()), "$lte": primitive.NewDateTimeFromTime(job.To.AsTime())}}).Sort("ts").Cursor()

	var hasTrade bool
	var hasTransfer bool
	trade := g.Trade{}
	transfer := g.Transfer{}
	tradeCount := 0
	transferCount := 0

	for {
		if trade.Ts.IsZero() {
			hasTrade = cursorTrades.Next(&trade)
		}

		if transfer.Ts.IsZero() {
			hasTransfer = cursorTransfers.Next(&transfer)
		}

		if allFalse(hasTrade, hasTransfer) {
			break
		}

		var err error
		e := getEarliest(&trade, &transfer)

		switch e := e.(type) {
		case *g.Trade:
			tradeCount++

			err = stream.Send(&pb.Record{
				Trade: g.TradeToProtoTrade(*e),
			})
			trade = g.Trade{}
		case *g.Transfer:
			transferCount++

			err = stream.Send(&pb.Record{
				Transfer: g.TransferToProtoTransfer(*e),
			})
			transfer = g.Transfer{}
		}

		if err != nil {
			return err
		}
	}

	golog.Infof("Sent %d trades and %d transfers to plugin %s (v%s).", tradeCount, transferCount, job.Plugin, job.PluginVersion)
	return nil
}

func getEarliest(records ...g.Record) g.Record {
	var match g.Record

	for i := range records {
		if records[i].GetTs().IsZero() {
			continue
		}

		if match == nil || records[i].GetTs().Before(match.GetTs()) {
			match = records[i]
		}
	}

	return match
}

func allFalse(states ...bool) bool {
	for i := range states {
		if states[i] {
			return false
		}
	}

	return true
}

func (s *GapiServer) SubmitTrade(ctx context.Context, t *pb.Trade) (*emptypb.Empty, error) {
	err := validator.Validate(t)
	if err != nil {
		return &emptypb.Empty{}, err
	}

	trades.StoreProtoTrade(t)
	return &emptypb.Empty{}, nil
}

func (s *GapiServer) SubmitTransfer(ctx context.Context, transfer *pb.Transfer) (*emptypb.Empty, error) {
	err := validator.Validate(transfer)
	if err != nil {
		return &emptypb.Empty{}, err
	}

	transfers.StoreProtoTransfer(transfer)
	return &emptypb.Empty{}, nil
}

func (s *GapiServer) SubmitGenericFee(ctx context.Context, gf *pb.SrcGenericFee) (*emptypb.Empty, error) {
	fmt.Printf("%+v\n", gf.TxID)
	return &emptypb.Empty{}, nil
}

func (s *GapiServer) ShowJobProgress(ctx context.Context, job *pb.JobProgress) (*emptypb.Empty, error) {
	err := validator.Validate(job)
	if err != nil {
		return &emptypb.Empty{}, err
	}

	global.PushToClients("job-progress", map[string]string{
		"_id":      job.ID,
		"label":    fmt.Sprintf("[%s] %s", job.Plugin, job.Label),
		"progress": job.Progress,
	})
	return &emptypb.Empty{}, nil
}

func (s *GapiServer) GetSettings(ctx context.Context, _ *emptypb.Empty) (*pb.Settings, error) {
	userSettings, err := settings.Get()
	if err != nil {
		return nil, err
	}

	return &pb.Settings{
		DateTimeFormat: userSettings.DateTimeFormat,
		TimeZone:       userSettings.TimeZone,
	}, nil
}

func (s *GapiServer) AppLog(ctx context.Context, msg *pb.AppLogMsg) (*emptypb.Empty, error) {
	level := applog.Info

	switch msg.Level {
	case pb.LogLevel_ERR:
		level = applog.Error
	case pb.LogLevel_WARN:
		level = applog.Warning
	}

	applog.Send(level, msg.Message, msg.Tags...)
	return &emptypb.Empty{}, nil
}

func Start(cfg *koanf.Koanf) {
	srv := &GapiServer{}
	lis, err := net.Listen("tcp", cfg.MustString("grpc.address"))
	if err != nil {
		golog.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterFTaxesServer(s, srv)
	golog.Infof("GRPC server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		golog.Fatalf("Failed to start GRPC server: %v", err)
	}
}
