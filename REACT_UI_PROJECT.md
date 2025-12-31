# React UI Refactoring Project

## 概述
從 `refactor/ddd-architecture` 分支 fork 出新分支 `refactor/react-ui`，使用 React + TypeScript + shadcn/ui 重新設計和實現 UI。

## 已完成

### ✅ 初始化設置 (2025-12-31)

#### 技術棧
- **React 18** - 現代化 UI 框架
- **TypeScript 5** - 完整的類型安全
- **Vite 7** - 快速的構建工具
- **Tailwind CSS v4** - 最新版本的實用優先 CSS 框架
- **React Router** - 客戶端路由（已安裝，待配置）
- **Lucide React** - 現代化圖標庫
- **shadcn/ui 依賴** - 準備添加 UI 組件

#### 項目結構
```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui 組件（待添加）
│   │   └── layout/      # 佈局組件（待創建）
│   ├── pages/           # 頁面組件（待創建）
│   ├── services/        # API 服務層（待實現）
│   ├── hooks/           # 自定義 Hooks（待添加）
│   ├── lib/             # 工具函數
│   │   └── utils.ts     # ✅ className 合併工具
│   └── types/           # TypeScript 類型定義（待添加）
├── dist/                # 構建輸出
└── README.md            # 項目文檔
```

#### 配置文件
- ✅ `tailwind.config.js` - Tailwind CSS v4 配置
- ✅ `postcss.config.js` - PostCSS 配置
- ✅ `tsconfig.json` - TypeScript 配置
- ✅ `vite.config.ts` - Vite 構建配置

#### 編譯驗證
```bash
✓ npm install - 成功安裝所有依賴
✓ npm run build - 成功編譯
  - dist/index.html (0.46 kB)
  - dist/assets/index-*.css (6.88 kB)
  - dist/assets/index-*.js (193.49 kB)
```

## 開發計劃

### Phase 1: 基礎架構 (Week 1)
- [ ] 安裝並配置 React Router
- [ ] 創建基本路由結構
  - `/` - 首頁/請求面板
  - `/pubsub` - Pub/Sub 管理
  - `/jetstream` - JetStream 管理
  - `/kv` - KV Store 管理
  - `/settings` - 設置
- [ ] 實現主佈局組件
  - Sidebar 導航
  - Header 頭部
  - Main content 區域
- [ ] 添加 shadcn/ui 核心組件
  - Button
  - Input
  - Card
  - Dialog
  - Dropdown Menu
  - Tabs

### Phase 2: API 服務層 (Week 1)
- [ ] 創建 API 服務基礎架構
  - 檢測 Desktop (Wails) vs Server 模式
  - 統一的 API 調用接口
- [ ] 實現 TypeScript 類型定義
  - Template
  - RequestPayload
  - StreamInfo
  - KVEntry
  - etc.
- [ ] 實現核心 API 服務
  - 模板管理 API
  - 請求發送 API
  - 訂閱管理 API
  - JetStream API
  - KV Store API
  - 配置管理 API

### Phase 3: 核心功能 (Week 2)
- [ ] **Requests 頁面**
  - 模板樹狀視圖
  - 創建/刪除模板和文件夾
  - 請求編輯器
  - 響應查看器
  - 變數管理

- [ ] **Pub/Sub 頁面**
  - 訂閱管理
  - 消息列表
  - 實時消息更新（輪詢）
  - 發布消息功能

- [ ] **JetStream 頁面**
  - Stream 列表
  - 創建/刪除 Stream
  - Stream 詳情
  - 消息查看

- [ ] **KV Store 頁面**
  - Bucket 列表
  - 創建/刪除 Bucket
  - Key 管理
  - Value 查看/編輯

### Phase 4: 高級功能 (Week 2-3)
- [ ] **全局變數管理**
  - Globals 面板
  - 變數編輯
  - Profile 管理

- [ ] **JS Extensions**
  - 擴展列表
  - 啟用/禁用擴展
  - 擴展管理

- [ ] **連接管理**
  - NATS Profile 管理
  - 連接狀態指示
  - Profile 切換

- [ ] **設置頁面**
  - 連接設置
  - 主題設置
  - 編輯器偏好設置

### Phase 5: UI/UX 優化 (Week 3)
- [ ] 深色模式支持
- [ ] 搜索功能
- [ ] 鍵盤快捷鍵
- [ ] 面板大小調整
- [ ] 拖放支持
- [ ] 加載狀態和錯誤處理
- [ ] Toast 通知
- [ ] 響應式設計調整

### Phase 6: 測試與優化 (Week 4)
- [ ] 單元測試
- [ ] 集成測試
- [ ] E2E 測試
- [ ] 性能優化
- [ ] 代碼分割
- [ ] 構建優化
- [ ] 文檔完善

## 設計原則

### 1. 組件化
- 每個功能模塊都是獨立的組件
- 組件可重用和可測試
- 清晰的 props 接口

### 2. 類型安全
- 完整的 TypeScript 覆蓋
- 嚴格的類型檢查
- API 響應的類型定義

### 3. 性能優先
- 代碼分割和懶加載
- 虛擬滾動（大列表）
- 優化的重渲染
- 緩存策略

### 4. 用戶體驗
- 響應式設計
- 流暢的動畫
- 清晰的反饋
- 錯誤處理

### 5. 可維護性
- 清晰的代碼結構
- 一致的命名規範
- 詳細的註釋
- 完整的文檔

## 參考實現

### 舊 UI (web/ 目錄)
參考 `refactor/ddd-architecture` 分支下的 `/web` 目錄：
- `web/index.html` - 完整的 UI 結構
- `web/app.js` - 所有功能的實現
- `web/style.css` - 樣式設計

### 功能對照
| 功能 | 舊 UI | 新 UI | 狀態 |
|-----|------|------|-----|
| 模板樹 | ✅ | ⏳ | 待實現 |
| 請求編輯 | ✅ | ⏳ | 待實現 |
| Pub/Sub | ✅ | ⏳ | 待實現 |
| JetStream | ✅ | ⏳ | 待實現 |
| KV Store | ✅ | ⏳ | 待實現 |
| 全局變數 | ✅ | ⏳ | 待實現 |
| JS 擴展 | ✅ | ⏳ | 待實現 |
| 設置 | ✅ | ⏳ | 待實現 |

## Git 分支狀態

```
refactor/ddd-architecture  (基礎分支 - 有工作的 vanilla JS UI)
    ↓ fork
refactor/react-ui          (當前分支 - React 重寫)
    ↓
[2025-12-31] ✅ 初始化 React + TypeScript + Tailwind CSS v4
```

## 構建集成

前端將使用 Go 的 `go:embed` 指令嵌入到二進制文件中：
```go
//go:embed frontend/dist/*
var embeddedFS embed.FS
```

## 開發命令

```bash
# 開發模式
cd frontend && npm run dev

# 構建
cd frontend && npm run build

# 類型檢查
cd frontend && npm run type-check

# Lint
cd frontend && npm run lint
```

## 資源

- [React 文檔](https://react.dev/)
- [TypeScript 文檔](https://www.typescriptlang.org/)
- [Tailwind CSS v4 文檔](https://tailwindcss.com/docs)
- [shadcn/ui 文檔](https://ui.shadcn.com/)
- [React Router 文檔](https://reactrouter.com/)
- [Lucide Icons](https://lucide.dev/)

## 下一步

1. 實現 React Router 和路由結構
2. 添加 shadcn/ui Button 組件
3. 創建主佈局組件（Sidebar + Header + Content）
4. 實現 API 服務層
5. 開始實現 Requests 頁面

---

**分支**: `refactor/react-ui`  
**基於**: `refactor/ddd-architecture`  
**創建日期**: 2025-12-31  
**狀態**: 🚀 進行中
