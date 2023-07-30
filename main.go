package main

import (
	"icytown.com/game/x/app"
	"icytown.com/game/x/configs"
)

func main() {
	parseFlag()
	conf, err := configs.ReadConfig(getConfigFilename())
	if err != nil {
		panic(err)
	}

	engine := app.NewEngine(conf)
	if err = engine.Run(); err != nil {
		panic(err)
	}
}
