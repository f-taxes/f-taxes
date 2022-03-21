package ftx

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/beefsack/go-rate"
	. "github.com/f-taxes/f-taxes/backend/global"
	"github.com/grishinsana/goftx"
	"github.com/grishinsana/goftx/models"
	"github.com/kataras/golog"
)

// Calls the FTX api to fetch transaction and other data.
// Implements the Source interface.
type FtxSource struct {
	id      string
	label   string
	srcType SourceType
	client  *goftx.Client
	limiter *rate.RateLimiter
}

func NewFtxSource(srcCon *SourceConnection) *FtxSource {
	limiter := rate.New(30, time.Second)
	client := goftx.New(goftx.WithAuth(srcCon.ApiKey, srcCon.ApiSecret), goftx.WithSubaccount(srcCon.Subaccount))

	return &FtxSource{
		id:      "ftx",
		label:   fmt.Sprintf("FTX: %s", srcCon.Label),
		srcType: EXCHANGE,
		client:  client,
		limiter: limiter,
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

func (s *FtxSource) FetchTransactions(ctx context.Context, since time.Time) (<-chan SrcTx, <-chan error) {
	outCh := make(chan SrcTx)
	errCh := make(chan error)

	go func(since time.Time) {
		if since.Year() == 0 {
			since = time.Now().UTC().Add(-25 * 356 * 20 * time.Hour)
		}

		start := int(since.Unix())
		end := int(time.Now().Unix())

		defer func() {
			close(outCh)
			close(errCh)
		}()

		for {
			select {
			case <-ctx.Done():
				return
			default:
				s.limiter.Wait()
				golog.Infof("FTX: Fetch fills from %s to %s", time.Unix(int64(start), 0), time.Unix(int64(end), 0))
				fills, err := s.client.Fills.Fills(&models.FillsParams{
					StartTime: &start,
					EndTime:   &end,
				})

				if err != nil {
					errCh <- err
					return
				}

				if len(fills) == 0 {
					return
				}

				end = int(fills[len(fills)-1].Time.Time.Unix())

				for i := range fills {
					f := fills[i]

					if strings.HasSuffix(f.Future, "-PERP") {
						f.QuoteCurrency = "USD"
						f.BaseCurrency = strings.Split(f.Market, "-")[0]
					}

					outCh <- SrcTx{
						TxID:   fmt.Sprintf("%d", f.ID),
						Ts:     f.Time.Time,
						Ticker: f.Market,
						Price:  f.Price,
						Amount: f.Size,
						Quote:  Currency(f.QuoteCurrency),
						Base:   Currency(f.BaseCurrency),
						Side:   Side(f.Side),
						Fee:    f.Fee,
					}
				}
			}
		}
	}(since)

	return outCh, errCh
}
