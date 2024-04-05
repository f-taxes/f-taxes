package trades

import (
	"context"
	"fmt"
	"time"

	"github.com/f-taxes/f-taxes/backend/applog"
	g "github.com/f-taxes/f-taxes/backend/global"
	"github.com/f-taxes/f-taxes/backend/plugin"
	"github.com/f-taxes/f-taxes/proto"
	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
	"github.com/qiniu/qmgo"
	"github.com/shopspring/decimal"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func RegisterRoutes(app *iris.Application) {
	app.Post("/trades/page", func(ctx iris.Context) {
		reqData := g.Query{
			Page:   1,
			Sort:   "ts",
			Limit:  2000,
			Filter: [][]g.Filter{},
		}

		if !g.ReadJSON(ctx, &reqData) {
			return
		}

		f, err := g.BuildFilter(reqData.Filter)
		if err != nil {
			applog.Send(applog.Error, fmt.Sprintf("Failed to construct filter: %s. Please report this bug to the developers.", err.Error()), "Internal Error")
			golog.Errorf("Failed to construct filter: %v", err)
			ctx.JSON(g.Resp{
				Result: false,
				Data:   PaginationResult{},
			})
			return
		}

		reqData.ConstructedFilter = f
		result, err := Paginate(reqData)

		if err != nil {
			golog.Errorf("Failed to fetch page of trades: %v", err)
			ctx.StatusCode(iris.StatusInternalServerError)
			return
		}

		ctx.JSON(g.Resp{
			Result: true,
			Data:   result,
		})
	})

	app.Get("/trades/clear", func(ctx iris.Context) {
		err := g.DBConn.Collection(g.COL_TRADES).DropCollection(context.Background())

		if err != nil {
			golog.Errorf("Failed to drop collection for trades: %v", err)
			ctx.StatusCode(iris.StatusInternalServerError)
			return
		}

		ctx.JSON(g.Resp{
			Result: true,
		})
	})

	app.Post("/trades/manually/save", func(ctx iris.Context) {
		tx := g.Trade{}

		if !g.ReadJSON(ctx, &tx) {
			return
		}

		if tx.ID.IsZero() {
			tx.ID = primitive.NewObjectID()
			tx.Created = time.Now().UTC()
		} else {
			tx.Updated = time.Now().UTC()
		}

		tx.Value = tx.Amount.Mul(tx.Price)
		tx.ValueC = tx.Amount.Mul(tx.PriceC)
		tx.FeeC = tx.Fee.Mul(tx.FeePriceC)

		_, err := g.DBConn.Collection(g.COL_TRADES).UpsertId(context.Background(), tx.ID, tx)
		if err != nil {
			golog.Errorf("Failed to save trade: %v", err)

			applog.Send(applog.Error, fmt.Sprintf("Failed to save trade: %s", err.Error()))

			ctx.JSON(g.Resp{
				Result: false,
			})
			return
		}

		g.PushToClients("record-edited", tx)

		ctx.JSON(g.Resp{
			Result: true,
		})
	})

	app.Post("/trades/conversion/start", func(ctx iris.Context) {
		reqData := struct {
			Plugin      string       `json:"plugin"`
			ApplyFilter bool         `json:"applyFilter"`
			Currency    string       `json:"currency"`
			Filter      [][]g.Filter `json:"filter"`
		}{}

		if !g.ReadJSON(ctx, &reqData) {
			return
		}

		p := plugin.Manager.GetSpawnedPluginById(reqData.Plugin)
		if p == nil {
			applog.Send(applog.Error, fmt.Sprintf("Plugin %s isn't available.", reqData.Plugin))

			ctx.JSON(g.Resp{
				Result: false,
			})
			return
		}

		filter := bson.M{}

		if reqData.ApplyFilter {
			f, err := g.BuildFilter(reqData.Filter)

			if err != nil {
				applog.Send(applog.Error, fmt.Sprintf("Failed to construct filter: %s. Please report this bug to the developers.", err.Error()), "Internal Error")
				golog.Errorf("Failed to construct filter: %v", err)

				ctx.JSON(g.Resp{
					Result: false,
				})
				return
			}

			filter = f
		}

		go func(plugin *plugin.SpawnedPlugin, currency string, applyFilter bool, filter bson.M) {
			col := g.DBConn.Collection(g.COL_TRADES)
			var cursor qmgo.CursorI
			var count int64

			if applyFilter {
				count, _ = col.Find(context.Background(), filter).Count()
				cursor = col.Find(context.Background(), filter).Cursor()
			} else {
				count, _ = col.Find(context.Background(), bson.M{"$or": bson.A{bson.M{"priceC": 0}, bson.M{"quotePriceC": 0}, bson.M{"feeC": 0}, bson.M{"feePriceC": 0}}}).Count()
				cursor = col.Find(context.Background(), bson.M{"$or": bson.A{bson.M{"priceC": 0}, bson.M{"quotePriceC": 0}, bson.M{"feeC": 0}, bson.M{"feePriceC": 0}}}).Cursor()
			}

			jobID := primitive.NewObjectID().Hex()

			defer g.PushToClients("job-progress", map[string]string{
				"_id":      jobID,
				"progress": "100",
			})

			c := 0

			for {
				t := g.Trade{}
				if !cursor.Next(&t) {
					break
				}

				c++
				g.PushToClients("job-progress", map[string]string{
					"_id":      jobID,
					"label":    fmt.Sprintf("[%s] Converting prices in %d trades to %s (%d / %d)", plugin.Manifest.Label, count, currency, c, count),
					"progress": fmt.Sprintf("%2.f", (float64(c)/float64(count))*100),
				})

				updatedTrade, err := plugin.CtlClient.GrpcClient.ConvertPricesInTrade(context.Background(), &proto.TradeConversionJob{
					Trade:          g.TradeToProtoTrade(t),
					TargetCurrency: currency,
				})

				if err != nil {
					continue
				}

				priceC := g.StrToDecimal(updatedTrade.PriceC, decimal.Zero)
				valueC := priceC.Mul(t.Amount)
				quotePriceC := g.StrToDecimal(updatedTrade.QuotePriceC, decimal.Zero)
				feeC := g.StrToDecimal(updatedTrade.FeeC, decimal.Zero)
				feePriceC := g.StrToDecimal(updatedTrade.FeePriceC, decimal.Zero)

				err = col.UpdateOne(context.Background(), bson.M{"_id": t.ID}, bson.M{
					"$set": bson.M{
						"priceC":           g.DecimalToMongoDecimal(priceC),
						"valueC":           g.DecimalToMongoDecimal(valueC),
						"quotePriceC":      g.DecimalToMongoDecimal(quotePriceC),
						"priceConvertedBy": updatedTrade.PriceConvertedBy,
						"feeC":             g.DecimalToMongoDecimal(feeC),
						"feePriceC":        g.DecimalToMongoDecimal(feePriceC),
						"feeConvertedBy":   updatedTrade.FeeConvertedBy,
					},
				})

				if err != nil {
					golog.Errorf("Failed to save trade after converting prices: %v", err)
				}
			}
		}(p, reqData.Currency, reqData.ApplyFilter, filter)

		ctx.JSON(g.Resp{
			Result: true,
		})
	})
}
