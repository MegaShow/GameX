package api

import (
	"context"
	"sync"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

var pool = sync.Pool{
	New: func() interface{} {
		return &RequestContext{
			ctx:    nil,
			logger: nil,
		}
	},
}

type RequestContext struct {
	ctx    *gin.Context
	logger *zap.Logger
}

func NewRequestContext(c *gin.Context, handlerName string) *RequestContext {
	// 从gin.Context中获取需要的数据
	logger, ok := c.Value(keyLogger).(*zap.Logger)
	if !ok || logger == nil {
		logger = zap.L()
	}
	logger = logger.With(zap.String(keyHandler, handlerName))

	// 更新gin.Context
	c.Set(keyHandler, handlerName)
	c.Set(keyLogger, logger)

	// 构建RequestContext
	r := pool.Get().(*RequestContext)
	r.ctx = c
	r.logger = logger

	return r
}

func RecycleRequestContext(r *RequestContext) {
	r.ctx = nil
	r.logger = nil
	pool.Put(r)
}

func (r *RequestContext) Copy() *RequestContext {
	obj := pool.Get().(*RequestContext)
	obj.ctx = r.ctx.Copy()
	obj.logger = r.logger
	return obj
}

func (r *RequestContext) Ctx() context.Context {
	return r.ctx
}

func (r *RequestContext) Logger() *zap.Logger {
	return r.logger
}
