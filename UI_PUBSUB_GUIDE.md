# NATS Manager UI - Pub/Sub 功能指南

## 新增功能概覽

### 1. 模式選擇器（Mode Selector）
在請求面板頂部新增了模式選擇下拉菜單，可以切換：
- **Request/Reply** - 傳統的請求-回覆模式
- **Publish** - 發布消息模式（不等待回覆）

### 2. 訂閱管理面板（Subscriptions Panel）
側邊欄新增了 "Subscriptions" 按鈕，點擊後可以：
- 查看所有活躍的訂閱
- 實時查看接收到的消息
- 取消訂閱
- 清空消息歷史
- 自動刷新消息（每 2 秒）

## 功能詳解

### 使用 Request/Reply 模式

1. 選擇模式為 "Request/Reply"
2. 輸入 Subject（例如：`user.get`）
3. 輸入 Payload
4. 點擊 "Send Request"
5. 查看響應結果

### 使用 Publish 模式

1. 選擇模式為 "Publish"
2. 輸入 Subject（例如：`events.user.created`）
3. 輸入 Payload（消息內容）
4. 點擊 "Publish"
5. 消息將被發布，不等待回覆

### 訂閱消息

#### 方法 1: 直接從模板訂閱
1. 打開一個模板
2. 確保 Mode 是 "Publish"（或任何你想監聽的 subject）
3. 輸入要監聽的 Subject
4. 點擊側邊欄的 "Subscriptions" 按鈕
5. 在訂閱管理面板中，創建新訂閱

#### 方法 2: 從訂閱管理面板訂閱
1. 點擊側邊欄的 "Subscriptions" 按鈕
2. 訂閱管理面板會顯示所有活躍訂閱
3. 要添加新訂閱，請從模板中選擇一個 subject 並使用 Subscribe 功能

### 管理訂閱

在訂閱管理面板中：

**左側面板 - 訂閱列表**
- 顯示所有活躍的訂閱
- 點擊訂閱查看其消息
- 點擊 ❌ 按鈕取消訂閱

**右側面板 - 消息列表**
- 實時顯示選中訂閱接收到的消息
- 每條消息顯示：
  - 序號
  - 接收時間
  - Subject
  - 消息內容
- 自動滾動到最新消息

**工具按鈕**
- 🔄 刷新 - 手動刷新消息列表
- 🗑️ 清空 - 清空當前訂閱的所有消息

## UI 元素說明

### Mode Select（模式選擇）
```
位置: Request 標籤頁頂部
選項:
  - Request/Reply: 發送請求並等待回覆
  - Publish: 發布消息不等待回覆
```

### Subscriptions Button（訂閱按鈕）
```
位置: 側邊欄底部（Globals 按鈕上方）
圖標: 連接節點圖標
功能: 打開訂閱管理面板
```

### Subscriptions Modal（訂閱管理面板）
```
佈局: 左右分欄
左側: 訂閱列表（300px）
右側: 消息顯示區域
高度: 500px
```

## 工作流程示例

### 示例 1: 監聽用戶事件

1. **創建訂閱監聽器**
   - 打開 Subscriptions 面板
   - 或使用測試腳本：`./test_pubsub.sh`

2. **發布事件**
   - 創建新模板，設置：
     - Mode: Publish
     - Subject: `events.user.created`
     - Payload: `{"userId": "123", "username": "alice"}`
   - 點擊 "Publish"

3. **查看消息**
   - 在 Subscriptions 面板中選擇 `events.user.created`
   - 實時查看接收到的消息

### 示例 2: 測試微服務通信

1. **準備訂閱**
   - 訂閱 `service.response.*`

2. **發送請求**
   - Mode: Request/Reply
   - Subject: `service.request.data`
   - 發送請求

3. **同時監控**
   - Request/Reply 模式會顯示直接響應
   - Subscriptions 可以監控任何廣播消息

## 模板格式

模板文件現在支持 `mode` 字段：

```
Mode: request
Subject: user.get.{{.userId}}
---
{
  "userId": "{{.userId}}"
}
```

或

```
Mode: pubsub
Subject: events.{{.eventType}}
---
{
  "event": "{{.eventType}}",
  "timestamp": "{{.timestamp}}"
}
```

## 鍵盤快捷鍵

- `Esc` - 關閉當前打開的 Modal
- 在訂閱面板中，消息會自動滾動到底部

## API 調用流程

### Subscribe（訂閱）
```
POST /api/subscribe
{
  "subject": "events.test",
  "config": {
    "url": "nats://localhost:4222"
  }
}
```

### Publish（發布）
```
POST /api/send
{
  "mode": "pubsub",
  "subject": "events.test",
  "body": "{\"message\": \"hello\"}",
  "variables": {}
}
```

### Get Messages（獲取消息）
```
GET /api/subscriptions/events.test/messages
```

### Unsubscribe（取消訂閱）
```
POST /api/unsubscribe
{
  "subject": "events.test"
}
```

## 注意事項

1. **消息緩衝**: 每個訂閱最多緩衝 100 條消息
2. **自動刷新**: 訂閱面板打開時，每 2 秒自動刷新一次消息
3. **連接管理**: 每個訂閱使用獨立的 NATS 連接
4. **消息持久化**: 消息僅存儲在內存中，刷新頁面或重啟服務器後會丟失
5. **模板保存**: 模板的 mode 字段會被保存，下次打開時自動恢復

## 故障排除

### 訂閱不顯示消息
- 確認 NATS 服務器正在運行
- 檢查 Subject 是否正確
- 確認有其他客戶端在發布消息
- 點擊刷新按鈕手動刷新

### 發布失敗
- 檢查 NATS 連接設置
- 確認 Subject 格式正確
- 查看瀏覽器控制台錯誤信息

### UI 響應慢
- 清空舊消息（使用清空按鈕）
- 減少活躍訂閱數量
- 關閉訂閱面板停止自動刷新

## 最佳實踐

1. **命名規範**: 使用清晰的 Subject 命名，例如：
   - `events.{domain}.{action}` - 事件
   - `service.{name}.{operation}` - 服務調用

2. **訂閱管理**: 不使用的訂閱及時取消，避免資源浪費

3. **消息清理**: 定期清空消息歷史，保持性能

4. **模板組織**: 將 Request 和 Publish 模板分開管理

## 相關文件

- `README_PUBSUB.md` - API 和後端功能說明
- `IMPLEMENTATION_SUMMARY.md` - 技術實現細節
- `test_pubsub.sh` - 命令行測試腳本
- `example_pubsub.py` - Python 示例代碼
