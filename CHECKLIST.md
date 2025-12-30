# Pub/Sub 功能實現檢查清單

## ✅ 完成的修改

### 核心功能
- [x] `pkg/natsclient/client.go` - 添加 Publish, Subscribe, Unsubscribe, Drain 方法
- [x] `pkg/store/store.go` - Template 結構添加 Mode 字段
- [x] `pkg/store/store.go` - 更新模板解析和格式化支持 Mode
- [x] `pkg/service/request_service.go` - RequestPayload 添加 Mode 字段
- [x] `pkg/service/request_service.go` - SendRequest 支持 pubsub 模式
- [x] `pkg/service/subscribe_service.go` - 新增完整的訂閱服務（新文件）

### 應用層集成
- [x] `app.go` - 添加 SubscribeService 到 App 結構
- [x] `app.go` - 新增 5 個 RPC 方法（Subscribe, Unsubscribe, etc.）
- [x] `main.go` - 初始化 SubscribeService
- [x] `main.go` - 傳遞 subService 到 App 和 Router
- [x] `server.go` - 添加 subService 參數到 SetupRouter
- [x] `server.go` - 新增 5 個 HTTP API 端點

### 文檔和測試
- [x] `README_PUBSUB.md` - 完整的功能說明文檔
- [x] `IMPLEMENTATION_SUMMARY.md` - 實現細節總結
- [x] `test_pubsub.sh` - Bash 測試腳本
- [x] `example_pubsub.py` - Python 示例代碼
- [x] `templates/example_request.nm` - Request 模式範例
- [x] `templates/example_pubsub.nm` - Pub/Sub 模式範例

## ✅ 編譯驗證
- [x] Server 模式編譯成功
- [x] 無語法錯誤
- [x] 無導入錯誤

## 🔑 關鍵特性

### 向後兼容
- ✅ 未指定 Mode 時默認為 "request"
- ✅ 原有 Request/Reply 功能不受影響
- ✅ 現有模板文件不需要修改即可工作

### Pub/Sub 功能
- ✅ Publish - 發布消息（不等待回覆）
- ✅ Subscribe - 訂閱主題（持續監聽）
- ✅ Unsubscribe - 取消訂閱
- ✅ GetMessages - 獲取接收的消息
- ✅ ClearMessages - 清空消息歷史
- ✅ GetActiveSubscriptions - 列出活躍訂閱

### 技術實現
- ✅ 線程安全（sync.RWMutex）
- ✅ 消息緩衝（channel 容量 100）
- ✅ 獨立連接管理（每個訂閱一個連接）
- ✅ 消息帶時間戳
- ✅ 支持變量模板

## 📝 API 端點

### 新增 HTTP 端點
1. `POST /api/subscribe` - 開始訂閱
2. `POST /api/unsubscribe` - 停止訂閱
3. `GET /api/subscriptions` - 列出訂閱
4. `GET /api/subscriptions/:subject/messages` - 獲取消息
5. `DELETE /api/subscriptions/:subject/messages` - 清空消息

### 新增 RPC 方法（Wails）
1. `Subscribe(payload)`
2. `Unsubscribe(subject)`
3. `GetSubscriptionMessages(subject)`
4. `GetActiveSubscriptions()`
5. `ClearSubscriptionMessages(subject)`

### 修改的端點
- `POST /api/send` - 現在支持 mode 參數（request/pubsub）

## 🧪 測試方式

### 前提條件
```bash
# 需要 NATS server 運行在 localhost:4222
nats-server
```

### 方式 1: Bash 腳本
```bash
./test_pubsub.sh
```

### 方式 2: Python 腳本
```bash
python3 example_pubsub.py
```

### 方式 3: 手動 curl
```bash
# 訂閱
curl -X POST http://localhost:8080/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"subject": "test"}'

# 發布
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -d '{"mode": "pubsub", "subject": "test", "body": "{\"msg\":\"hi\"}"}'

# 獲取消息
curl http://localhost:8080/api/subscriptions/test/messages

# 取消訂閱
curl -X POST http://localhost:8080/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"subject": "test"}'
```

## 📂 文件清單

### 修改的文件（7 個）
1. `pkg/natsclient/client.go` - 添加 Pub/Sub 方法
2. `pkg/store/store.go` - 支持 Mode 字段
3. `pkg/service/request_service.go` - 支持 pubsub 模式
4. `app.go` - 集成 SubscribeService
5. `main.go` - 初始化服務
6. `server.go` - 新增 API 端點

### 新增的文件（6 個）
1. `pkg/service/subscribe_service.go` - 訂閱服務實現
2. `README_PUBSUB.md` - 功能文檔
3. `IMPLEMENTATION_SUMMARY.md` - 實現總結
4. `test_pubsub.sh` - 測試腳本
5. `example_pubsub.py` - Python 示例
6. `templates/example_pubsub.nm` - 模板範例

## ⚠️ 注意事項

1. **內存限制**: 每個訂閱最多緩衝 100 條消息
2. **連接管理**: 每個訂閱使用獨立的 NATS 連接
3. **消息持久化**: 消息只存在內存中，重啟後丟失
4. **NATS 依賴**: 需要 NATS server 運行才能測試
5. **向後兼容**: 默認 mode 是 "request"

## 🎉 完成狀態

- ✅ 核心功能實現完成
- ✅ API 端點實現完成
- ✅ RPC 方法實現完成
- ✅ 編譯成功
- ✅ 文檔完成
- ✅ 測試腳本完成
- ✅ 範例模板完成

**所有功能已實現並可以使用！**
