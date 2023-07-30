package core

type Room struct {
	players []Player
}

func NewRoomManager() *RoomManager {
	return &RoomManager{}
}

type RoomManager struct {
	idleRooms    []*Room // 空闲房间
	playingRooms []*Room // 正在游玩房间
}

// MatchRoom 匹配房间
func (rm *RoomManager) MatchRoom(player Player) *Room {
	// 如果没有空闲房间则创建一个新房间
	if len(rm.idleRooms) == 0 {
		newRoom := &Room{players: []Player{player}}
		rm.idleRooms = append(rm.idleRooms, newRoom)
		return newRoom
	}

	// 如果有空闲房间则加入一个空闲房间
	room := rm.idleRooms[0]
	room.players = append(room.players, player)
	rm.idleRooms = rm.idleRooms[1:]
	rm.playingRooms = append(rm.playingRooms, room)
	return room
}
