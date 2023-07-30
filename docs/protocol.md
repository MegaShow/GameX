# 协议

此文档定义了 GameX 服务端和客户端交互的通信协议和游戏逻辑交互协议。

## 通信协议

在游戏匹配和局内逻辑，GameX 使用 WebSocket 实现服务端和客户端的双向数据传输。除此，类似公告等非局内逻辑使用 HTTP 进行单向数据传输。

- WebSocket 的请求链接为 `wss://api.icytown.com/game/<game_name>`
- HTTP 的请求链接为 `https://api.icytown.com/game/<req_uri>`

传输数据暂不考虑宽带占用问题，数据均使用 JSON 格式。

## 游戏协议

### 数据结构

游戏逻辑协议具有统一的数据结构。

```go
type Message struct {
	Type  string `json:"type,omitempty"`  // 类型
	Code  int32  `json:"code,omitempty"`  // 状态码
	Token string `json:"token,omitempty"` // 令牌
}
```

### 鉴权

暂不支持鉴权。

### 匹配对局

```json
// Request
{
    "type": "match_room"
}

// Response
{
    "type": "match_room",
    "code": 0
}
```

