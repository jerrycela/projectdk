# Task Plan: 關卡編輯器實作

## Goal
根據 `docs/level-editor-design-2026-02-10.md` 設計文件（經過 10 次迭代優化），實作完整的關卡編輯器系統。

## 設計文件來源
- **檔案**: `docs/level-editor-design-2026-02-10.md`（1,376 行）
- **版本**: v1.0（最終版）
- **日期**: 2026-02-10
- **設計團隊**: 7 位設計師 + team-lead（Opus 4.6）

## Phases

### Phase 1: 核心編輯功能 ⏱️ pending
**預估時間**: 2-3 天

**新增檔案**:
- [ ] `editor.html` - 編輯器主頁面
- [ ] `js/editor/editor-main.js` - 主控制器
- [ ] `js/editor/editor-tools.js` - 地圖編輯工具
- [ ] `js/editor/editor-ui.js` - UI 渲染
- [ ] `js/editor/editor-storage.js` - 存儲系統
- [ ] `css/editor.css` - 編輯器樣式

**功能清單**:
- [ ] Canvas 初始化（雙層架構）
- [ ] Tile Palette 渲染（10 種地磚）
- [ ] 基礎畫筆繪製（W, ., E, H）
- [ ] 拖曳繪製
- [ ] 網格線渲染
- [ ] Hover 高亮
- [ ] localStorage 儲存/載入
- [ ] JSON 匯出

**驗收標準**:
- 能夠繪製 20x13 地圖
- 能夠儲存到 localStorage
- 能夠匯出 JSON 檔案

---

### Phase 2: 傳送門與波次配置 ⏱️ pending
**預估時間**: 3-4 天

**新增檔案**:
- [ ] `js/editor/editor-portal.js` - 傳送門編輯器
- [ ] `js/editor/editor-wave.js` - 波次配置 UI

**功能清單**:
- [ ] 傳送門放置（'E' 地磚）
- [ ] Side Panel 傳送門列表
- [ ] 波次編輯 Modal
- [ ] 波次配置儲存
- [ ] 全局參數設定（startingGold, dungeonHeartHP）
- [ ] 路徑驗證（BFS）
- [ ] 傳送門複製/刪除
- [ ] Undo/Redo

**驗收標準**:
- 能夠新增/刪除傳送門
- 能夠配置每個傳送門的波次
- 路徑驗證正確顯示警告
- Undo/Redo 正常運作

---

### Phase 3: 測試流程與整合 ⏱️ pending
**預估時間**: 2-3 天

**新增檔案**:
- [ ] `js/test/test-toolbar.js` - 測試工具列
- [ ] `js/test/test-validator.js` - 關卡驗證器
- [ ] `css/test-toolbar.css` - 測試工具列樣式

**修改現有檔案**:
- [ ] `js/main.js` - 新增 URL 參數檢查 `?mode=test`
- [ ] `js/LevelManager.js` - init() 測試模式判斷
- [ ] `js/ui.js` - renderStartScreen() 測試標題
- [ ] `js/game.js` - 測試結果儲存

**功能清單**:
- [ ] 測試按鈕 UI
- [ ] 關卡驗證（必要欄位、路徑可達性）
- [ ] localStorage 存儲測試關卡
- [ ] 新分頁開啟（window.open）
- [ ] 測試工具列（暫停、速度、跳波、無敵）
- [ ] 測試結果儲存
- [ ] 快捷鍵（空白、R、N、G、Esc）

**驗收標準**:
- 測試關卡能正確載入
- 測試工具列所有功能正常
- 測試結果正確儲存

---

### Phase 4: 打磨與優化 ⏱️ pending
**預估時間**: 1-2 天

**功能清單**:
- [ ] UI/UX 打磨
- [ ] 效能優化（Flood Fill、Canvas、Side Panel）
- [ ] 錯誤處理完善
- [ ] 文件補充
- [ ] 完整測試

**驗收標準**:
- 所有測試用例通過
- 效能達標（60fps）
- 錯誤提示友善

---

## 技術要點

### 架構原則
- **命名空間隔離**: `DK.Editor.*`, `DK.TestMode.*`
- **雙層 Canvas**: 地圖層（低解析度）+ UI 層（高解析度）
- **模組化**: 6 個獨立模組（main/tools/portal/wave/ui/storage）
- **向下相容**: 支援舊的 breachHoles 格式

### 資料結構
```javascript
portals: [{
  id: 'portal-1',
  col: 8,
  row: 1,
  type: 'entrance',
  waves: [...]
}]
```

### localStorage Keys
- `dk_editor_draft_current` - 當前編輯草稿
- `dk_editor_drafts_list` - 草稿列表
- `dk_test_level` - 測試關卡
- `dk_editor_config` - 編輯器設定

---

## 整合點（需修改現有檔案）

| 檔案 | 修改內容 | 影響範圍 |
|------|---------|---------|
| `js/map.js` | 新增 portals 支援 | 中等（向下相容） |
| `js/game.js` | 修改 startWave() 支援多傳送門 | 中等（向下相容） |
| `js/main.js` | 新增 URL 參數檢查 | 低（新增程式碼） |
| `js/LevelManager.js` | 測試模式判斷 | 低（新增分支） |
| `js/ui.js` | 測試標題 | 低（新增分支） |

---

## 錯誤記錄

| 錯誤 | 嘗試 | 解決方案 |
|------|------|---------|
| (待記錄) | | |

---

## 決策記錄

| 日期 | 決策 | 理由 |
|------|------|------|
| 2026-02-10 | 使用 'E' 作為傳送門標記 | 與設計文件一致 |
| 2026-02-10 | 使用底線分隔 localStorage key | 統一命名規範 |
| 2026-02-10 | 獨立頁面設計（editor.html） | 避免污染遊戲本體 |

---

**最後更新**: 2026-02-10 12:39
**當前階段**: 準備開始 Phase 1
**設計文件**: docs/level-editor-design-2026-02-10.md
