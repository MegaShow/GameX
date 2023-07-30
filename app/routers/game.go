package routers

import (
	"net/http"
	"net/url"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
	"icytown.com/game/x/app/api"
	"icytown.com/game/x/app/games/core"
	"icytown.com/game/x/configs"
)

type gameRouter struct {
	wsUpgrader websocket.Upgrader
	conf       configs.Config
	gameServer *core.GameServer
}

func NewGameRouter(conf configs.Config, gameService *core.GameServer) Router {
	// WebSocket 协议升级处理器
	trustOrigins := make(map[string]bool, len(conf.Game.Origins))
	for _, origin := range conf.Game.Origins {
		trustOrigins[origin] = true
	}
	wsUpgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			originUrl, _ := url.Parse(r.Header.Get("Origin"))
			return trustOrigins[originUrl.Hostname()]
		},
	}

	return &gameRouter{
		wsUpgrader: wsUpgrader,
		conf:       conf,
		gameServer: gameService,
	}
}

func (router *gameRouter) Register(group gin.IRouter) {
	group.GET("/:game", router.webSocket)
}

func (router *gameRouter) webSocket(c *gin.Context) {
	// 获取游戏名称, 判断游戏是否存在, 不存在返回 404 错误
	gameName := c.Params.ByName("game")
	if !router.conf.Game.Enables[gameName] {
		c.String(http.StatusNotFound, http.StatusText(http.StatusNotFound))
		return
	}

	// 鉴权
	strUserId := c.Query("uid")
	userId, err := strconv.ParseUint(strUserId, 10, 64)
	if err != nil || userId == 0 {
		c.String(http.StatusForbidden, http.StatusText(http.StatusForbidden))
		return
	}

	// 升级成 WebSocket 请求
	conn, err := router.wsUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	defer conn.Close()

	// 处理玩家加入、退出逻辑
	r := api.NewRequestContext(c, gameName)
	defer api.RecycleRequestContext(r)
	player := core.Player{UserId: userId, Conn: conn}
	router.gameServer.PlayerJoin(player)
	r.Logger().Info("player join game server", zap.Uint64("userId", userId))
	conn.SetCloseHandler(func(code int, text string) error {
		router.gameServer.PlayerLeave(player)
		r.Logger().Info("player leave game server", zap.Uint64("userId", userId))
		return nil
	})

	// 处理消息
	var msg core.Message
	for {
		// 读取消息
		if err = conn.ReadJSON(&msg); err != nil {
			r.Logger().Error("ReadJSON", zap.Error(err))
			return
		}
		r.Logger().Info("ReadJSON", zap.Any("msg", msg))

		router.gameServer.ProcessMsg(player, msg)
	}
}
