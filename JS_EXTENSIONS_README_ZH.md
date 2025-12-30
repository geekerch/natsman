# JS Extensions - Quick Start (快速開始)

## 功能說明

這個功能讓你可以自行開發 JavaScript 擴充檔案，來擴展 template 變數的功能。

## 使用步驟

### 1. 建立擴充檔案

在 `extensions/` 目錄下建立 `.js` 檔案：

```javascript
// extensions/myhelpers.js

function randomEmail() {
    const domains = ['example.com', 'test.com', 'demo.com'];
    const user = Math.random().toString(36).substring(2, 8);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${user}@${domain}`;
}

function randomPhone() {
    const area = Math.floor(Math.random() * 900) + 100;
    const pre = Math.floor(Math.random() * 900) + 100;
    const line = Math.floor(Math.random() * 9000) + 1000;
    return `+1-${area}-${pre}-${line}`;
}
```

### 2. 啟用擴充

1. 點擊側邊欄的 **Extensions** 按鈕
2. 勾選要啟用的 JS 檔案
3. 點擊 **Save**

### 3. 使用擴充函數

在動態變數中使用你定義的函數：

**全域變數設定 (Global Variables):**
- 變數名稱: `userEmail`
- 類型: `dynamic`
- 值: `randomEmail()`

**在 Template 中使用:**
```json
{
  "email": "{{.userEmail}}",
  "phone": "{{.userPhone}}"
}
```

## 內建函數

系統已提供以下內建函數（不需擴充）：

- `timestamp()` - Unix 時間戳（秒）
- `timestampMs()` - Unix 時間戳（毫秒）
- `uuid()` - 產生 UUID
- `randomInt(min, max)` - 隨機整數
- `now()` - ISO 8601 時間格式
- `dateFormat(layout)` - 自訂時間格式

## 範例擴充

專案已包含 `extensions/example.js` 範例檔案，提供以下函數：

- `randomEmail()` - 隨機 email
- `randomPhone()` - 隨機電話
- `formatCurrency(amount, currency)` - 貨幣格式化
- `randomFloat(min, max, decimals)` - 隨機浮點數
- `timestamp(format)` - 自訂格式時間戳
- `lorem(words)` - Lorem Ipsum 文字

## 技術細節

- **JavaScript 版本**: ECMAScript 5.1
- **執行環境**: 沙盒環境（goja VM）
- **執行超時**: 1 秒
- **限制**: 無法存取檔案系統、網路、Node.js 模組

## 完整文件

詳細說明請參閱 `JS_EXTENSIONS_GUIDE.md`

## 範例：完整流程

### 1. 建立擴充檔案
```bash
# extensions/testing.js
function randomId() {
    return 'TEST-' + Math.floor(Math.random() * 100000);
}
```

### 2. 在 UI 中啟用
1. 點擊 Extensions 按鈕
2. 勾選 `testing.js`
3. 點擊 Save

### 3. 設定全域變數
- 名稱: `testId`
- 類型: `dynamic`
- 值: `randomId()`

### 4. 在 Template 使用
```
Mode: pubsub
Subject: test.message
---
{
  "id": "{{.testId}}",
  "timestamp": "{{.timestamp}}"
}
```

### 5. 發送測試
點擊 Send，訊息會包含隨機產生的測試 ID！

## 疑難排解

**Q: 擴充沒有載入？**
- 確認檔案副檔名是 `.js`
- 檢查檔案在 `extensions/` 目錄下
- 確認在 Extensions modal 中有勾選並儲存

**Q: 函數找不到？**
- 檢查函數名稱大小寫
- 確認擴充已啟用
- 查看 console 是否有錯誤訊息

**Q: 執行超時？**
- 簡化計算邏輯
- 避免無窮迴圈
- 使用更有效率的演算法

## 分支資訊

此功能在 `feature/js-extensions` 分支開發完成。

要使用此功能：
```bash
git checkout feature/js-extensions
go build
./natsman
```
