# Findings & Decisions — 關卡編輯器實作

## 設計文件分析（2026-02-10）

### 文件來源
- **檔案**: `docs/level-editor-design-2026-02-10.md`
- **長度**: 1,376 行
- **版本**: v1.0（經過 10 次迭代優化）
- **設計團隊**: 7 位設計師 + team-lead（Opus 4.6）

### 核心架構

#### 1. 獨立頁面設計
- **編輯器**: `editor.html`（獨立頁面）
- **遊戲測試**: `index.html?mode=test`（URL 參數）
- **優勢**: 避免污染遊戲本體，清晰分離關注點

#### 2. 6 個模組系統
```
js/editor/
├── editor-main.js      # 主控制器
├── editor-tools.js     # 地圖編輯工具
├── editor-portal.js    # 傳送門編輯器
├── editor-wave.js      # 波次配置 UI
├── editor-ui.js        # UI 渲染
└── editor-storage.js   # 存儲系統
```

#### 3. 雙層 Canvas 架構
- **地圖層**: 低解析度（320x180）像素渲染
- **UI 層**: 高解析度（960x540）文字與網格
- **優勢**: 高效能 + 像素完美

### 資料結構規範

#### Level 格式
```javascript
{
  id: 1,
  name: '破牆試煉',
  layout: [...],  // 20x13 地圖陣列
  portals: [
    {
      id: 'north_gate',
      col: 8,
      row: 1,
      type: 'entrance',
      waves: [...]
    }
  ],
  startingGold: 1000,
  dungeonHeartHP: 100,
  metadata: {...}
}
```

#### localStorage 命名規範
| Key | 說明 |
|-----|------|
| `dk_editor_draft_current` | 當前編輯草稿 |
| `dk_editor_drafts_list` | 草稿列表 |
| `dk_test_level` | 測試關卡 |
| `dk_test_results` | 測試結果歷史 |
| `dk_editor_config` | 編輯器設定 |

### 地磚類型（10 種）

| 字元 | 名稱 | 顏色 | 說明 |
|------|------|------|------|
| `W` | 牆壁 | #2d2d44 | 不可通行 |
| `.` | 地板 | #5e5648 | 可通行 |
| `O` | 外圍 | #050508 | 地圖邊界 |
| `H` | 地心 | #ff4444 | 玩家基地 |
| `E` | 傳送門 | #44aa44 | 敵人生成點 |
| `P` | 水潭 | #2a4a7a | 可通行，減速 |
| `A` | 深淵 | #050508 | 不可通行 |
| `G` | 草叢 | #2a5a2a | 可通行，隱藏 |
| `R` | 軌道 | #7a7a8e | 可通行，加速 |
| `B` | 路障 | #5a5a6e | 已棄用 |

---

## Codebase 整合點

### 需要修改的現有檔案

| 檔案 | 修改內容 | 影響範圍 | 向下相容 |
|------|---------|---------|---------|
| `js/map.js` | 新增 portals 支援 | 中等 | ✅ 支援舊格式 |
| `js/game.js` | 修改 startWave() 支援多傳送門 | 中等 | ✅ 支援舊格式 |
| `js/main.js` | 新增 URL 參數檢查 `?mode=test` | 低 | ✅ 新增程式碼 |
| `js/LevelManager.js` | init() 測試模式判斷 | 低 | ✅ 新增分支 |
| `js/ui.js` | renderStartScreen() 測試標題 | 低 | ✅ 新增分支 |

### 向下相容策略

```javascript
// 支援新舊兩種格式
if (level.portals && level.portals.length > 0) {
  // 使用新的 portals 系統
  initPortals(level.portals);
} else if (level.breachHoles) {
  // 自動轉換為 portals（向下相容）
  level.portals = convertBreachHolesToPortals(level.breachHoles);
  initPortals(level.portals);
}
```

---

## 技術挑戰與解決方案

### 1. Flood Fill 效能
**挑戰**: 大面積填充可能卡頓
**解決方案**:
- 限制填充範圍（最多 500 格）
- 使用 BFS 演算法
- 顯示進度提示

### 2. Undo/Redo 記憶體管理
**挑戰**: 歷史記錄可能占用大量記憶體
**解決方案**:
- 使用差分快照（只記錄變更部分）
- 限制堆疊大小（最多 50 個狀態）
- 提供「清除歷史」功能

### 3. 路徑驗證
**挑戰**: 驗證傳送門到地心的可達性
**解決方案**:
- 使用現有的 `DK.Map.computeDistanceField()`
- 臨時修改 layout 以計算可達性
- BFS 演算法檢查距離場

### 4. Canvas 效能
**挑戰**: 高頻率的重繪可能影響效能
**解決方案**:
- throttle mousemove（16ms = 60fps）
- debounce 即時驗證（300ms）
- 雙層 Canvas 架構（地圖 + UI 分離）

---

## 設計優勢

### ✅ 模組化清晰
6 個獨立模組職責明確，易於維護和擴展

### ✅ 資料驅動
JSON 格式統一，方便匯出/匯入/分享關卡

### ✅ 向下相容
支援舊的 breachHoles 格式，平滑過渡

### ✅ 可擴展性
- 預留外掛系統 (`DK.EditorPlugins`)
- 鉤子函式 (`DK.Editor.Hooks`)
- 支援自訂地圖尺寸

### ✅ UX 流程完善
編輯 → 配置 → 測試流程順暢，所見即所得

### ✅ 安全性考量
- XSS 防護：清理 HTML 標籤
- JSON 注入防護：禁止危險欄位
- 容量管理：使用 `navigator.storage.estimate()`

---

## Codebase 探索結果（2026-02-10）

### ✅ 已確認 - 現有 Codebase

#### 1. **config.js** - 配置完整
- ✅ `DK.COLORS` - 完整定義（UI 顏色、地磚顏色、英雄顏色等）
- ✅ `DK.FONTS` - 定義在 ui.js（bold, body, pixel, title, heavy）
- ✅ 地磚類型 - 10 種（W, ., O, H, B, A, P, G, R, E）
- ✅ 視口配置 - GRID_COLS: 20, GRID_ROWS: 13, SCALE: 3

#### 2. **PixelArt.js** - 渲染引擎完整
- ✅ 雙層 Canvas 架構（離屏 320x208 + 顯示 960x720）
- ✅ 基本繪製 API（pixel, rect, circle, line）
- ✅ drawSprite() - 從模式陣列繪製精靈
- ✅ drawDecoration() - 8 種裝飾物（各 2 變體）
- ✅ 顏色工具（lighten, darken, mix, seededRandom）

#### 3. **map.js** - 地圖系統
- ✅ `computeDistanceField()` - 可直接使用（BFS 演算法）
- ✅ breachHoles 系統（破牆記錄）
- ❌ portals 系統 - **需新增**
- ✅ 地磚查詢 API（getTile, isWall, isPath 等）
- ✅ 路徑驗證 API（getNextStep, recomputeFields）

#### 4. **game.js** - 波次系統
- ✅ startWave() - 當前使用 breachHoles 輪轉生成
- ❌ 多傳送門支援 - **需修改**
- ✅ 波次資料結構簡潔（{type, count}）
- ✅ 敵人生成間隔配置（ENEMY_SPAWN_INTERVAL: 500ms）

#### 5. **LevelManager.js & main.js** - 關卡載入
- ✅ loadLevel(index) - 可直接使用
- ✅ 覆寫機制（waves, startingGold, dungeonHeartHP）
- ❌ URL 參數解析 - **需新增**
- ❌ localStorage 測試關卡載入 - **需新增**

---

## 整合修改清單

### 需要新增的功能

| 優先級 | 功能 | 檔案 | 說明 |
|--------|------|------|------|
| **P0** | portals 資料結構 | map.js | 新增 `portals: [{id, col, row, paired}]` |
| **P0** | Portal 查詢 API | map.js | getPortalAt(), getPortalPair() |
| **P0** | URL 參數解析 | index.html | `?mode=test&level=N` |
| **P0** | 測試模式初始化 | game.js | init() 中檢查 window.DK_TEST_MODE |
| **P1** | startWave() 多傳送門 | game.js | 向下相容的多傳送門分配 |
| **P1** | Portal 渲染 | map.js | drawPortalTile() 函式 |

### 技術細節確認

- ✅ **localStorage 配額**：使用 `navigator.storage.estimate()` 檢查
- ✅ **Safari 相容性**：需要測試 localStorage 限制（5-10MB）
- ✅ **Canvas 尺寸**：固定 960x720（不需響應式）
- ⚠️ **觸控裝置**：編輯器建議 PC 優先，後續可加入觸控支援

---

## 實作建議

### Phase 1: 核心編輯功能
**可以直接開始**，所有依賴都已就緒：
- 使用 `DK.PixelArt` API 繪製 Canvas
- 使用 `DK.COLORS` 調色盤
- 使用 `DK.FONTS` 字型系統
- 雙層 Canvas 架構與遊戲一致

### Phase 2: 傳送門與波次
**需要先修改 map.js**：
1. 新增 portals 陣列
2. 新增查詢 API
3. 整合路徑驗證

### Phase 3: 測試流程
**需要修改 3 個檔案**：
1. index.html - URL 參數解析
2. game.js - 測試模式初始化
3. ui.js - 測試標題顯示（可選）

---

**最後更新**: 2026-02-10 13:15
**探索狀態**: ✅ 完成
**可以開始實作**: ✅ 是

---

## 10 次迭代優化成果摘要

### Iteration 1-5: 基礎一致性
1. ✅ 統一座標命名（`{col, row}`）
2. ✅ 統一地磚標記（'E' = 傳送門）
3. ✅ 統一 localStorage key 格式
4. ✅ 統一檔案結構（`js/editor/`）
5. ✅ 統一命名空間（`DK.Editor.*`）

### Iteration 6-10: 進階優化
6. ✅ UX 細節（快捷鍵、拖曳、預覽）
7. ✅ 效能優化（Flood Fill、虛擬滾動）
8. ✅ 安全性（深度驗證、配額管理）
9. ✅ 文件完整性（API 文件、測試清單）
10. ✅ 最終整合（P0/P1 功能清單）

---

## 決策記錄

| 日期 | 決策 | 理由 |
|------|------|------|
| 2026-02-10 | 使用 'E' 作為傳送門標記 | 與設計文件一致，避免與舊的 'T' 衝突 |
| 2026-02-10 | 使用底線分隔 localStorage key | 統一命名規範 `dk_editor_*` |
| 2026-02-10 | 獨立頁面設計（editor.html） | 避免污染遊戲本體，清晰分離 |
| 2026-02-10 | 雙層 Canvas 架構 | 高效能 + 像素完美 |
| 2026-02-10 | 6 個獨立模組 | 職責明確，易於維護 |

---

**最後更新**: 2026-02-10 12:39
**設計文件**: docs/level-editor-design-2026-02-10.md
