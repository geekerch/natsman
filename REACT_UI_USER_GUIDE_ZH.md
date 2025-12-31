# React UI 使用指南

## 專案概述

NatsMan 是一個類似 Postman 的 NATS 管理工具，使用 React + TypeScript + shadcn/ui 重新設計實現。

## 快速開始

### 開發環境

```bash
cd frontend
npm install
npm run dev
```

### 構建生產版本

```bash
cd frontend
npm run build
```

### 啟動應用

```bash
# Desktop 模式 (Wails)
./natsman

# Server 模式 (Web)
./natsman-server
```

## 功能說明

### 1. Settings（設定）

**用途**：管理 NATS 連線配置

**功能**：
- 創建、編輯、刪除 NATS 連線 Profile
- 設定 URL、Credentials、TLS 選項
- 測試連線狀態

**使用流程**：
1. 點擊左側選單「Settings」
2. 點擊「Create Profile」建立新的連線配置
3. 填寫 Profile 名稱、NATS URL、Credentials 路徑
4. 儲存後在右上角下拉選單選擇 Profile
5. 點擊「Connect」連線到 NATS 伺服器

### 2. Requests（請求）

**用途**：發送 NATS 請求並接收回應

**功能**：
- 管理請求模板（支援資料夾層級結構）
- 配置 Subject、Payload、Headers
- 變數替換功能（`{{變數名}}`）
- 可調整大小的 Request/Reply 分割視圖
- 垂直/水平佈局切換

**使用流程**：
1. 在左側邊欄點擊「New Template」或「New Folder」
2. 編輯 Template 名稱、Subject、Payload
3. 在 Payload 中使用 `{{variable}}` 語法插入變數
4. 點擊「Send」發送請求
5. 在 Reply 分頁查看回應

**快捷鍵**：
- `Ctrl+Enter`：發送請求
- `Ctrl+S`：儲存模板

### 3. Variables（變數）

**用途**：管理全域和模板變數

**功能分類**：

#### Template Variables（模板變數）
- 自動從模板中提取 `{{var}}` 語法
- 支援靜態值和動態 JavaScript 表達式
- 即時預覽變數值

#### Global Variables（全域變數）
- 支援多環境配置（dev、staging、production）
- 可在所有模板中共用
- 支援環境切換

#### 變數類型
- **Static（靜態）**：固定值
- **Dynamic（動態）**：JavaScript 表達式
- **Built-in（內建）**：系統函數

#### 內建函數
```javascript
{{timestamp()}}      // Unix 時間戳（秒）
{{timestampMs()}}    // Unix 時間戳（毫秒）
{{uuid()}}           // UUID v4
{{now()}}            // ISO 8601 時間字串
{{randomInt(0,100)}} // 隨機整數
```

**使用流程**：
1. 點擊「Variables」頁面
2. 選擇 Template Variables 或 Global Variables
3. 點擊「Add Variable」新增變數
4. 選擇變數類型（Static/Dynamic）
5. 對於 Dynamic 類型，可使用「Snippet」快速插入常用函數
6. 點擊「Test」測試動態變數的執行結果

### 4. Subscriptions（訂閱）

**用途**：訂閱 NATS Subject 並接收訊息

**功能**：
- 訂閱多個 Subject
- 即時顯示收到的訊息
- 訊息歷史記錄
- 清除訊息

**使用流程**：
1. 點擊「Subscriptions」頁面
2. 點擊「Add Subscription」
3. 輸入要訂閱的 Subject（支援萬用字元 `*` 和 `>`）
4. 點擊「Subscribe」
5. 當有訊息發佈到該 Subject 時，會即時顯示在右側

### 5. JetStream

**用途**：管理 JetStream Streams 和 Consumers

**功能**：

#### Stream 管理
- 創建、刪除 Stream
- 配置 Subjects、Storage Type、Replicas
- 查看 Stream 資訊
- 瀏覽 Stream 訊息（分頁支援）

#### Consumer 管理
- 創建、刪除 Consumer
- 配置 Deliver Policy、Ack Policy

#### 訊息瀏覽
- 分頁導航（Previous/Next）
- 跳轉到指定頁碼
- 手動刷新
- 查看訊息詳情（Sequence、Subject、Time、Payload）

**使用流程**：

**建立 Stream**：
1. 點擊「JetStream」頁面
2. 點擊「Create Stream」
3. 填寫 Stream 名稱、Subjects、Storage Type
4. 點擊「Create」

**查看訊息**：
1. 在左側選擇一個 Stream
2. 點擊「View Messages」
3. 使用分頁控制瀏覽訊息
4. 點擊訊息查看詳細內容

**建立 Consumer**：
1. 切換到「Consumers」標籤
2. 選擇一個 Stream
3. 點擊「Create Consumer」
4. 填寫 Consumer 配置
5. 點擊「Create」

### 6. KV Store（鍵值存儲）

**用途**：管理 NATS KV Buckets 和 Key-Value 對

**功能**：
- 創建、刪除 Bucket
- Put/Get/Delete Key-Value
- 查看 Key 的修訂歷史
- 配置 Bucket 的歷史記錄數量

**使用流程**：

**建立 Bucket**：
1. 點擊「KV Store」頁面
2. 點擊「Create」建立 Bucket
3. 填寫 Bucket 名稱和最大歷史記錄數
4. 點擊「Create」

**存取 Key-Value**：
1. 在左上方選擇一個 Bucket
2. 點擊「Put」新增 Key
3. 填寫 Key 名稱和 Value
4. 點擊「Put」儲存
5. 在左側 Keys 列表點擊 Key 查看內容

**查看歷史**：
- 右側顯示 Revision、Operation、Created 時間
- Value 顯示在下方

## UI 特色

### 統一的二級側邊欄
- 所有列表頁面使用一致的可收合側邊欄
- 點擊箭頭圖示收合/展開
- 狀態會自動保存到 localStorage

### 可調整大小的分割視圖
- Request/Reply 支援垂直和水平佈局
- 拖曳中間分隔線調整比例
- 佈局選擇會自動保存

### 連線狀態指示
- 右上角顯示目前連線狀態
- 未連線：灰色圓點
- 已連線：綠色圓點
- 顯示當前使用的 Profile 名稱

### 響應式設計
- 固定的卡片位置（不會因內容變化而跳動）
- 內容區域內部滾動
- 適應不同螢幕尺寸

## 常見問題

### Q: 如何切換 NATS 連線？
A: 在右上角的 Profile 下拉選單選擇不同的 Profile，然後點擊 Disconnect 再 Connect。

### Q: 變數替換不生效？
A: 確認變數名稱正確，並且在 Variables 頁面已設定該變數。動態變數可使用 Test 功能測試。

### Q: JetStream 訊息太多，如何快速找到特定訊息？
A: 使用「Go to Page」功能輸入頁碼直接跳轉，或使用 Previous/Next 導航。

### Q: 如何清空 Subscription 的訊息歷史？
A: 點擊「Clear Messages」按鈕清空當前顯示的所有訊息。

### Q: 全域變數和模板變數有什麼區別？
A: 
- **模板變數**：僅在特定模板中使用，從模板內容自動提取
- **全域變數**：可在所有模板中共用，支援多環境配置

### Q: Desktop 模式和 Web 模式有什麼區別？
A: 
- **Desktop 模式**：使用 Wails 框架，直接呼叫 Go 函數，無網路開銷
- **Web 模式**：使用 HTTP Server，透過 REST API 通訊

## 開發指南

### 技術棧
- React 18
- TypeScript
- Vite
- shadcn/ui (Radix UI + Tailwind CSS)
- React Router v7
- Lucide React

### 專案結構
```
frontend/src/
├── components/     # UI 元件
│   ├── ui/        # shadcn/ui 元件
│   └── ...        # 自訂元件
├── pages/         # 頁面元件
├── services/      # API 服務層
└── types/         # TypeScript 型別定義
```

### 新增頁面
1. 在 `pages/` 建立新的 `.tsx` 檔案
2. 在 `App.tsx` 加入路由配置
3. 在 `MainLayout.tsx` 加入導航項目

### 新增 API
1. 在 `types/index.ts` 定義型別
2. 在 `services/api.ts` 實作 API 方法
3. 同時處理 Desktop 和 Web 模式

## 貢獻指南

1. Fork 專案
2. 創建功能分支：`git checkout -b feature/new-feature`
3. 提交變更：`git commit -m "feat: add new feature"`
4. 推送分支：`git push origin feature/new-feature`
5. 發起 Pull Request

### Commit 訊息格式
```
<type>(<scope>): <subject>

<body>
```

**Type**:
- `feat`: 新功能
- `fix`: 修復 Bug
- `docs`: 文件變更
- `style`: 程式碼格式
- `refactor`: 重構
- `test`: 測試
- `chore`: 建置工具或輔助工具

## 授權

MIT License

---

**專案**: NatsMan
**分支**: refactor/react-ui
**文件版本**: 1.0
**更新日期**: 2025-12-31
