package routers

import "github.com/gin-gonic/gin"

type Router interface {
	Register(group gin.IRouter)
}

func RegisterRouters(group gin.IRouter, routers ...Router) {
	for _, r := range routers {
		r.Register(group)
	}
}
