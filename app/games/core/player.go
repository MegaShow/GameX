package core

import "github.com/gorilla/websocket"

type Player struct {
	UserId uint64          // 用户id
	Conn   *websocket.Conn // 长连接
}
