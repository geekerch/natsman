# 錯誤修復說明

## 問題描述
在點擊 "Send Request" 時出現錯誤：
```
TypeError: Cannot read properties of undefined (reading 'length')
```

## 原因分析
1. Backend API 返回的 `result.reply` 可能是 `undefined`
2. 當 NATS 服務器未運行或連接失敗時，響應可能不完整
3. JavaScript 嘗試訪問 `undefined.length` 導致錯誤

## 修復內容

### 1. 改進 `sendRequest` 函數
```javascript
// 之前的代碼（有問題）
let responseText = result.reply;

// 修復後的代碼
let responseText = result.reply || '';
if (responseText && typeof responseText === 'string') {
    try {
        const obj = JSON.parse(responseText);
        responseText = JSON.stringify(obj, null, 2);
    } catch { }
}
```

### 2. 改進 Backend.sendRequest 錯誤處理
```javascript
// 添加了錯誤狀態檢查
if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
}
```

## 測試步驟

### 1. 確認 NATS 服務器運行
```bash
# 檢查 NATS 服務器是否運行
ps aux | grep nats-server

# 如果沒有運行，啟動它
nats-server
```

### 2. 重新啟動 natsman-server
```bash
# 停止當前運行的服務器（如果有）
pkill natsman-server

# 重新編譯（已完成）
go build -tags server -o natsman-server

# 啟動服務器
./natsman-server
```

### 3. 測試 Request/Reply

#### 方式 1: 使用 Debug 頁面
1. 打開瀏覽器訪問：http://localhost:8080/debug.html
2. 在 "Test Request/Reply" 部分輸入：
   - Subject: `test.echo`
   - Body: `{"message": "hello"}`
3. 點擊 "Send Request"
4. 查看結果

#### 方式 2: 使用主界面
1. 打開瀏覽器訪問：http://localhost:8080
2. 確保 Mode 選擇為 "Request/Reply"
3. 輸入 Subject 和 Payload
4. 點擊 "Send Request"

#### 方式 3: 使用 curl 測試
```bash
# 測試 Request/Reply（需要有對應的 responder）
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "request",
    "subject": "test.echo",
    "body": "{\"message\": \"hello\"}",
    "variables": {},
    "config": {}
  }'

# 測試 Publish
curl -X POST http://localhost:8080/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "pubsub",
    "subject": "events.test",
    "body": "{\"event\": \"test\"}",
    "variables": {},
    "config": {}
  }'
```

## 常見問題和解決方案

### 問題 1: NATS 服務器未運行
**症狀**: 錯誤信息包含 "connection refused" 或 "failed to connect"
**解決方案**:
```bash
# 安裝 NATS server (如果未安裝)
# macOS:
brew install nats-server

# Linux:
wget https://github.com/nats-io/nats-server/releases/download/v2.10.7/nats-server-v2.10.7-linux-amd64.tar.gz
tar xzf nats-server-v2.10.7-linux-amd64.tar.gz
sudo mv nats-server-v2.10.7-linux-amd64/nats-server /usr/local/bin/

# 啟動 NATS server
nats-server
```

### 問題 2: Request/Reply 沒有 Responder
**症狀**: 錯誤信息 "no responders available" 或超時
**解決方案**: 
這是正常的！Request/Reply 模式需要有服務監聽該 Subject。

選項 A: 使用 Publish 模式（不需要 responder）
1. 選擇 Mode: Publish
2. 發送消息

選項 B: 創建一個測試 Responder
```bash
# 使用 nats CLI 創建 responder
nats reply test.echo "Hello from responder"
```

### 問題 3: 瀏覽器緩存問題
**症狀**: 修復後仍然出現錯誤
**解決方案**:
1. 按 Ctrl+Shift+R (或 Cmd+Shift+R) 強制刷新頁面
2. 或清除瀏覽器緩存
3. 或使用無痕模式打開

### 問題 4: CORS 錯誤
**症狀**: 瀏覽器控制台顯示 CORS 相關錯誤
**解決方案**: 
服務器已經配置了 CORS，如果仍有問題：
1. 確認從正確的地址訪問（http://localhost:8080）
2. 不要使用 file:// 協議打開 HTML 文件

## 調試技巧

### 1. 使用瀏覽器開發者工具
```
按 F12 打開開發者工具
切換到 Console 標籤查看錯誤
切換到 Network 標籤查看 API 請求/響應
```

### 2. 查看詳細錯誤信息
在主界面的 Response 面板中會顯示詳細錯誤信息

### 3. 查看服務器日誌
```bash
# natsman-server 的輸出會顯示所有請求
# 查看是否有錯誤信息
```

## 修復驗證

修復後應該看到以下改進：
- ✅ 即使沒有 responder，也不會出現 JavaScript 錯誤
- ✅ 錯誤信息會正確顯示在 Response 面板
- ✅ Publish 模式正常工作
- ✅ Subscribe 功能正常工作

## 需要更多幫助？

如果問題仍然存在，請提供以下信息：
1. 瀏覽器控制台的完整錯誤信息
2. Network 標籤中的 API 響應內容
3. natsman-server 的日誌輸出
4. NATS server 是否正在運行

## 相關文件
- `web/app.js` - 前端邏輯（已修復）
- `web/debug.html` - 調試頁面
- `server.go` - 後端 API
- `pkg/service/request_service.go` - 請求處理邏輯
