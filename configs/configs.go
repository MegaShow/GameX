package configs

import (
	"os"

	"github.com/go-playground/validator/v10"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Env  string     `yaml:"env" validate:"oneof=dev prod test"`
	App  AppConfig  `yaml:"app"`
	Game GameConfig `yaml:"game"`
}

type AppConfig struct {
	Host     string `yaml:"host" validate:"omitempty,hostname_rfc1123"`
	Port     uint16 `yaml:"port" validate:"required"`
	BasePath string `yaml:"basePath" validate:"omitempty,uri"`
	LogPath  string `yaml:"logPath" validate:"required"`
}

type GameConfig struct {
	Enables map[string]bool `yaml:"enables"`
	Origins []string        `yaml:"origins"`
}

var defaultConfig = Config{
	Env: EnvDev,
	App: AppConfig{
		Port:     3000,
		BasePath: "/game",
		LogPath:  "./log",
	},
	Game: GameConfig{
		Enables: map[string]bool{
			"tic-tac-toe": true,
		},
		Origins: []string{
			"localhost",
			"game.icytown.com",
			"wstool.js.org",
		},
	},
}

func ReadConfig(filename string) (Config, error) {
	conf := defaultConfig
	if filename != "" {
		// 从配置文件中读取数据
		data, err := os.ReadFile(filename)
		if err != nil {
			return Config{}, err
		}

		// 解析配置文件
		if err = yaml.Unmarshal(data, &conf); err != nil {
			return Config{}, err
		}
	}

	// 校验配置
	validate := validator.New()
	if err := validate.Struct(conf); err != nil {
		return Config{}, err
	}

	return conf, nil
}
