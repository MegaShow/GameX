package app

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"icytown.com/game/x/app/api"
	"icytown.com/game/x/app/games/core"
	"icytown.com/game/x/app/routers"
	"icytown.com/game/x/configs"
	"icytown.com/game/x/lib/logs"
)

type AppEngine struct {
	conf       configs.Config
	router     *gin.Engine
	gameServer *core.GameServer
}

// 运行服务实例
func (e *AppEngine) Run() error {
	addr := fmt.Sprintf("%s:%d", e.conf.App.Host, e.conf.App.Port)
	zap.L().Sugar().Infof("Prepare to run GameX app engine at %s", addr)
	return e.router.Run(addr)
}

// 创建服务实例
func NewEngine(conf configs.Config) *AppEngine {
	// 初始化组件
	logs.InitLogger(conf.App.LogPath, conf.Env == configs.EnvProduct)
	if conf.Env == configs.EnvProduct {
		gin.SetMode(gin.ReleaseMode)
	}

	// 构建游戏服务器
	gameServer := core.NewGameServer(conf.Game)

	// 构建 Router
	r := gin.New()
	r.Use(
		api.MWTraceID(), // TraceID中间件需要在最开头
		api.MWLogger(conf),
		api.MWRecovery(conf),
	)
	group := r.Group(conf.App.BasePath)
	routers.RegisterRouters(group,
		routers.NewGameRouter(conf, gameServer))

	zap.L().Info("New GameX app engine success")

	return &AppEngine{
		conf:   conf,
		router: r,
	}
}
