# NATS Pub/Sub 功能實現總結

## 概述
在原有的 Request/Reply 功能基礎上，成功添加了 Pub/Sub 模式支持，使 natsman 成為一個更完整的 NATS 客戶端工具。

## 主要改動

### 1. 核心層 (`pkg/natsclient/client.go`)
新增方法：
- `Publish(subject, data)` - 發布消息
- `Subscribe(subject, handler)` - 訂閱主題
- `Subscription.Unsubscribe()` - 取消訂閱
- `Drain()` - 優雅關閉連接

### 2. 數據模型 (`pkg/store/store.go`)
- `Template` 結構體新增 `Mode` 字段，支持 "request" 或 "pubsub" 模式
- 模板文件格式更新，支持 `Mode:` 標頭
- 向後兼容：未指定 Mode 時默認為 "request"

### 3. 服務層

#### `pkg/service/request_service.go`
- `RequestPayload` 新增 `Mode` 字段
- `SendRequest()` 方法根據 Mode 執行不同邏輯：
  - `request`: 發送請求並等待回覆（原有功能）
  - `pubsub`: 發布消息不等待回覆（新功能）

#### `pkg/service/subscribe_service.go` (新文件)
完整的訂閱管理服務：
- `Subscribe()` - 啟動訂閱
- `Unsubscribe()` - 停止訂閱
- `GetMessages()` - 獲取接收到的消息
- `GetActiveSubscriptions()` - 列出活躍訂閱
- `ClearMessages()` - 清空消息歷史

數據結構：
- `ActiveSubscription` - 訂閱狀態管理
- `SubscriptionMessage` - 消息記錄（包含主題、數據、時間戳）
- `SubscribePayload` - 訂閱請求參數

### 4. 應用層 (`app.go`)
新增 RPC 方法（用於 Wails 桌面應用）：
- `Subscribe(payload)`
- `Unsubscribe(subject)`
- `GetSubscriptionMessages(subject)`
- `GetActiveSubscriptions()`
- `ClearSubscriptionMessages(subject)`

### 5. HTTP API (`server.go`)
新增端點：
- `POST /api/subscribe` - 開始訂閱
- `POST /api/unsubscribe` - 停止訂閱
- `GET /api/subscriptions` - 列出活躍訂閱
- `GET /api/subscriptions/:subject/messages` - 獲取消息
- `DELETE /api/subscriptions/:subject/messages` - 清空消息

### 6. 主程序 (`main.go`)
- 初始化 `SubscribeService` 實例
- 將服務傳遞給 App 和 Router

## 模板文件格式

### Request/Reply 模式
```
Mode: request
Subject: user.get.{{.userId}}
---
{
  "userId": "{{.userId}}"
}
```

### Pub/Sub 模式
```
Mode: pubsub
Subject: events.{{.eventType}}
---
{
  "event": "{{.eventType}}",
  "data": {{.payload}},
  "timestamp": "{{.timestamp}}"
}
```

## 特性

### ✅ 已實現
1. **發布消息** - 不等待回覆的單向通信
2. **訂閱管理** - 持續監聽指定主題
3. **消息收集** - 自動收集接收到的消息（緩衝最多 100 條）
4. **多訂閱** - 同時訂閱多個主題
5. **消息歷史** - 查看接收到的所有消息
6. **清空功能** - 清空特定訂閱的消息記錄
7. **變量支持** - Pub/Sub 模式也支持模板變量
8. **Profile 支持** - 使用相同的 NATS Profile 配置
9. **HTTP & RPC** - 同時支持 Web API 和桌面應用
10. **向後兼容** - 不影響原有的 Request/Reply 功能

### 🔧 技術細節
- 每個訂閱維護獨立的 NATS 連接
- 線程安全的消息存儲（使用 sync.RWMutex）
- 非阻塞的消息接收（使用 channel）
- 優雅的訂閱生命週期管理

## 測試文件

### 1. `test_pubsub.sh`
Bash 腳本，演示完整的 Pub/Sub 流程：
- 啟動訂閱
- 發布多條消息
- 獲取消息
- 清空消息
- 取消訂閱

### 2. `example_pubsub.py`
Python 示例，提供友好的 API 封裝：
```python
subscribe("test.events")
publish("test.events", {"event": "user.created"})
messages = get_messages("test.events")
unsubscribe("test.events")
```

### 3. `templates/example_*.nm`
- `example_request.nm` - Request/Reply 範例
- `example_pubsub.nm` - Pub/Sub 範例

## 使用場景

### Pub/Sub 適用場景
- ✅ 事件廣播（多個訂閱者）
- ✅ 日誌收集
- ✅ 異步通知
- ✅ 消息隊列
- ✅ 實時監控

### Request/Reply 適用場景
- ✅ RPC 調用
- ✅ 需要回覆的請求
- ✅ 同步操作
- ✅ 點對點通信

## API 使用示例

### 發布消息
```bash
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "pubsub",
    "subject": "events.user.created",
    "body": "{\"userId\": \"123\", \"username\": \"alice\"}",
    "variables": {}
  }'
```

### 訂閱主題
```bash
curl -X POST http://localhost:8080/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "events.user.created"
  }'
```

### 獲取消息
```bash
curl http://localhost:8080/api/subscriptions/events.user.created/messages
```

## 注意事項

1. **內存管理**：每個訂閱最多緩衝 100 條消息（channel 容量限制）
2. **連接管理**：每個訂閱使用獨立的 NATS 連接
3. **持久化**：消息僅存儲在內存中，重啟後會丟失
4. **並發安全**：所有操作都是線程安全的
5. **默認模式**：未指定 Mode 時默認為 "request" 以保持向後兼容

## 後續可能的增強

- [ ] WebSocket 支持實時推送消息到前端
- [ ] 消息持久化選項
- [ ] 訂閱過濾器
- [ ] 消息統計和分析
- [ ] 支持 JetStream
- [ ] 通配符訂閱（已支持，但需要測試）

## 編譯和運行

```bash
# 編譯 server 模式
go build -o natsman-server -tags server

# 運行
./natsman-server

# 運行測試
./test_pubsub.sh
# 或
python3 example_pubsub.py
```

## 總結

此次更新成功為 natsman 添加了完整的 Pub/Sub 支持，使其成為一個功能更全面的 NATS 客戶端工具。實現方式遵循了原有的架構設計，保持了代碼的一致性和可維護性，同時完全向後兼容現有功能。
