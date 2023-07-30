package core

const (
	MessageTypeAuth       = "auth"        // 鉴权
	MessageTypeCreateRoom = "create_room" // 创建对局
	MessageTypeJoinRoom   = "join_room"   // 加入对局
	MessageTypeMatchRoom  = "match_room"  // 匹配对局
	MessageTypeSync       = "sync"        // 同步游戏数据
	MessageTypeGameStart  = "game_start"  // 游戏开始, 仅服务端下发
	MessageTypeGameEnd    = "game_end"    // 游戏结束, 仅服务端下发

	CodeSuccess  = 0
	CodeNoAuth   = 1
	CodeAuthFail = 2
)

type Message struct {
	Type  string `json:"type,omitempty"`  // 类型
	Code  int32  `json:"code,omitempty"`  // 状态码
	Token string `json:"token,omitempty"` // 令牌
}
