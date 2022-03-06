package global

type Resp struct {
	Result bool        `json:"result"`
	Data   interface{} `json:"data"`
}
