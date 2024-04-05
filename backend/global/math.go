package global

import "github.com/shopspring/decimal"

func StrToDecimal(str string, defValue ...decimal.Decimal) decimal.Decimal {
	d, err := decimal.NewFromString(str)
	if err != nil {
		if len(defValue) > 0 {
			return defValue[0]
		}
		return decimal.Zero
	}

	return d
}
