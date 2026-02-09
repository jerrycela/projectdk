#!/bin/bash

# ProjectDK 教學系統驗證腳本
# 用途：快速驗證第 1 階段所有檔案和功能

echo "🎮 ProjectDK 教學系統驗證"
echo "=========================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 計數器
PASS=0
FAIL=0

# 測試函式
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2 (檔案不存在: $1)"
        ((FAIL++))
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $3"
        ((FAIL++))
    fi
}

# 1. 檢查新增檔案
echo "📁 檢查新增檔案..."
check_file "js/levels.js" "levels.js 存在"
check_file "js/tutorial.js" "tutorial.js 存在"
check_file "test-tutorial.html" "測試頁面存在"
check_file "docs/tutorial-system-phase1-2026-02-09.md" "實作文件存在"
check_file "TUTORIAL_QUICKSTART.md" "快速啟動指引存在"
echo ""

# 2. 檢查 index.html 修改
echo "🔧 檢查 index.html 整合..."
check_content "index.html" "levels.js" "levels.js 已加入 index.html"
check_content "index.html" "tutorial.js" "tutorial.js 已加入 index.html"
echo ""

# 3. 檢查 levels.js 內容
echo "📊 檢查 levels.js 內容..."
check_content "js/levels.js" "DK.LEVELS" "DK.LEVELS 陣列定義"
check_content "js/levels.js" "DK.LevelManager" "DK.LevelManager 物件定義"
check_content "js/levels.js" "破牆試煉" "Level 1 關卡名稱"
check_content "js/levels.js" "完整挑戰" "Level 5 關卡名稱"
echo ""

# 4. 檢查 tutorial.js 內容
echo "🎓 檢查 tutorial.js 內容..."
check_content "js/tutorial.js" "DK.Tutorial" "DK.Tutorial 物件定義"
check_content "js/tutorial.js" "init" "init 方法"
check_content "js/tutorial.js" "update" "update 方法"
check_content "js/tutorial.js" "render" "render 方法"
check_content "js/tutorial.js" "checkCondition" "checkCondition 方法"
echo ""

# 5. 檢查 game.js 整合
echo "🎮 檢查 game.js 整合..."
check_content "js/game.js" "DK.LevelManager" "LevelManager 整合"
check_content "js/game.js" "DK.Tutorial" "Tutorial 整合"
check_content "js/game.js" "nextLevel()" "nextLevel 呼叫"
echo ""

# 6. 檢查 map.js 整合
echo "🗺️  檢查 map.js 整合..."
check_content "js/map.js" "DK.LevelManager" "LevelManager 檢查"
check_content "js/map.js" "currentLevel" "currentLevel 讀取"
check_content "js/map.js" "camera" "camera 設定"
echo ""

# 7. 檢查 ui.js 整合
echo "🎨 檢查 ui.js 整合..."
check_content "js/ui.js" "DK.Tutorial" "Tutorial 渲染"
check_content "js/ui.js" "checkCondition" "條件檢測"
check_content "js/ui.js" "barricadePlaced" "路障條件"
check_content "js/ui.js" "waveStarted" "波次條件"
check_content "js/ui.js" "trapPlaced" "陷阱條件"
echo ""

# 8. JavaScript 語法檢查
echo "🔍 JavaScript 語法檢查..."
if command -v node &> /dev/null; then
    if node -c js/levels.js 2>/dev/null; then
        echo -e "${GREEN}✓${NC} levels.js 語法正確"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} levels.js 語法錯誤"
        ((FAIL++))
    fi

    if node -c js/tutorial.js 2>/dev/null; then
        echo -e "${GREEN}✓${NC} tutorial.js 語法正確"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} tutorial.js 語法錯誤"
        ((FAIL++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Node.js 未安裝，跳過語法檢查"
fi
echo ""

# 9. 檔案大小檢查
echo "📦 檢查檔案大小..."
LEVELS_SIZE=$(wc -c < js/levels.js 2>/dev/null || echo 0)
TUTORIAL_SIZE=$(wc -c < js/tutorial.js 2>/dev/null || echo 0)

if [ "$LEVELS_SIZE" -gt 8000 ]; then
    echo -e "${GREEN}✓${NC} levels.js 大小: $LEVELS_SIZE bytes (>8KB)"
    ((PASS++))
else
    echo -e "${RED}✗${NC} levels.js 大小異常: $LEVELS_SIZE bytes"
    ((FAIL++))
fi

if [ "$TUTORIAL_SIZE" -gt 3000 ]; then
    echo -e "${GREEN}✓${NC} tutorial.js 大小: $TUTORIAL_SIZE bytes (>3KB)"
    ((PASS++))
else
    echo -e "${RED}✗${NC} tutorial.js 大小異常: $TUTORIAL_SIZE bytes"
    ((FAIL++))
fi
echo ""

# 總結
echo "=========================="
echo "📊 驗證結果"
echo "=========================="
echo -e "通過: ${GREEN}$PASS${NC} 項"
echo -e "失敗: ${RED}$FAIL${NC} 項"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 所有檢查通過！第 1 階段實作完成${NC}"
    echo ""
    echo "下一步："
    echo "1. 啟動遊戲: python3 -m http.server 8000"
    echo "2. 開啟瀏覽器: http://localhost:8000"
    echo "3. 測試頁面: http://localhost:8000/test-tutorial.html"
    echo ""
    exit 0
else
    echo -e "${RED}❌ 發現 $FAIL 個問題，請檢查${NC}"
    exit 1
fi
