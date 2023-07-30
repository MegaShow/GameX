package main

import (
	"flag"
	"fmt"
	"os"
)

const (
	author  = "MegaShow"
	version = "0.1.0-alpha"
)

var (
	configFilename string
)

func getConfigFilename() string {
	return configFilename
}

// 解析运行参数
func parseFlag() {
	var showHelp, showVersion bool
	flag.BoolVar(&showHelp, "h", false, "help of GameX")
	flag.BoolVar(&showVersion, "v", false, "version of GameX")
	flag.StringVar(&configFilename, "c", "", "configuration filename")
	flag.Parse()

	if showHelp {
		printUsage()
		os.Exit(0)
	} else if showVersion {
		printVersion()
		os.Exit(0)
	}
}

func printUsage() {
	printVersion()
	fmt.Fprintf(flag.CommandLine.Output(), "Usage: gamex [-hv] [-c filename]\n\nOptions:\n")
	flag.PrintDefaults()
}

func printVersion() {
	fmt.Fprintf(flag.CommandLine.Output(), "Version: GameX %s, powered by %s\n", version, author)
}
