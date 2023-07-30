package core

import (
	"fmt"
	"sync"

	"github.com/gorilla/websocket"
	"icytown.com/game/x/configs"
)

type GameServer struct {
	conf configs.GameConfig

	mu            sync.RWMutex
	playerUidMap  map[uint64]Player          // 玩家uid键值对
	playerConnMap map[*websocket.Conn]Player // 玩家连接键值对

	roomManager *RoomManager
}

func NewGameServer(conf configs.GameConfig) *GameServer {
	return &GameServer{
		conf:          conf,
		playerUidMap:  make(map[uint64]Player),
		playerConnMap: make(map[*websocket.Conn]Player),
		roomManager:   NewRoomManager(),
	}
}

func (s *GameServer) PlayerJoin(player Player) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.playerUidMap[player.UserId] = player
	s.playerConnMap[player.Conn] = player
}

func (gm *GameServer) PlayerLeave(player Player) {
	gm.mu.Lock()
	defer gm.mu.Unlock()
	delete(gm.playerUidMap, player.UserId)
	delete(gm.playerConnMap, player.Conn)
}

// ProcessMsg 处理消息
func (gm *GameServer) ProcessMsg(player Player, msg Message) {
	switch msg.Type {
	case MessageTypeMatchRoom:
		room := gm.roomManager.MatchRoom(player)
		fmt.Println(room)
	}
}
