#!/bin/bash

# NATS Manager Pub/Sub Quick Start Guide
# 快速開始指南

echo "========================================="
echo "   NATS Manager Pub/Sub 快速開始"
echo "========================================="
echo ""

# Check if NATS server is running
echo "檢查 NATS 服務器..."
if command -v nats-server &> /dev/null; then
    echo "✅ NATS server 已安裝"
else
    echo "⚠️  NATS server 未安裝"
    echo "   請訪問: https://docs.nats.io/running-a-nats-service/introduction/installation"
fi
echo ""

# Check if natsman-server exists
if [ -f "./natsman-server" ]; then
    echo "✅ natsman-server 已編譯"
else
    echo "📦 正在編譯 natsman-server..."
    go build -tags server -o natsman-server
    if [ $? -eq 0 ]; then
        echo "✅ 編譯成功"
    else
        echo "❌ 編譯失敗"
        exit 1
    fi
fi
echo ""

echo "========================================="
echo "   使用說明"
echo "========================================="
echo ""
echo "1. 啟動 NATS 服務器:"
echo "   $ nats-server"
echo ""
echo "2. 啟動 NATS Manager:"
echo "   $ ./natsman-server"
echo ""
echo "3. 打開瀏覽器:"
echo "   http://localhost:8080"
echo ""
echo "========================================="
echo "   功能說明"
echo "========================================="
echo ""
echo "📝 Request/Reply 模式:"
echo "   1. 選擇 Mode: Request/Reply"
echo "   2. 輸入 Subject 和 Payload"
echo "   3. 點擊 'Send Request'"
echo "   4. 查看響應結果"
echo ""
echo "📤 Publish 模式:"
echo "   1. 選擇 Mode: Publish"
echo "   2. 輸入 Subject 和 Payload"
echo "   3. 點擊 'Publish'"
echo "   4. 消息已發布（不等待回覆）"
echo ""
echo "📥 Subscribe（訂閱）:"
echo "   1. 點擊側邊欄 '🌐 Subscriptions' 按鈕"
echo "   2. 查看活躍訂閱列表"
echo "   3. 點擊訂閱查看實時消息"
echo "   4. 使用工具按鈕管理訂閱"
echo ""
echo "========================================="
echo "   測試腳本"
echo "========================================="
echo ""
echo "運行自動化測試:"
echo "   $ ./test_pubsub.sh"
echo ""
echo "運行 Python 示例:"
echo "   $ python3 example_pubsub.py"
echo ""
echo "========================================="
echo "   文檔"
echo "========================================="
echo ""
echo "📖 UI 使用指南: UI_PUBSUB_GUIDE.md"
echo "📖 API 文檔: README_PUBSUB.md"
echo "📖 實現細節: IMPLEMENTATION_SUMMARY.md"
echo "📖 完整總結: FINAL_SUMMARY.md"
echo ""
echo "========================================="
echo "   現在開始使用吧！"
echo "========================================="
