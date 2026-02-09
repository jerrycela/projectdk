# Task Plan: 有機環境設計 — 裝飾物系統

## Goal
為 40×26 地圖建立 3 層裝飾物系統，讓環境有聚落感和戰略引導。先實作水牢區作為試點。

## Design Doc
docs/plans/2026-02-09-organic-environment-design.md

## Current Phase
Phase 1: 裝飾物渲染系統 + 水牢區試點

## Phases

### Phase 1: 裝飾物渲染系統 + 水牢區試點
- [x] pixelart.js: 新增 drawDecoration() 函式，8 種裝飾物 × 2 變體 = 16 種
- [x] map.js: 新增 decorations 陣列，水牢區 37 個裝飾物
- [x] main.js: 新增 renderDecorations() 函式，分層渲染（Layer 1-2, Layer 3）
- [ ] 測試：瀏覽器中查看水牢區效果
- **Status:** complete (待測試)

### Phase 2: 擴展到其他區域（待定）
- [ ] 熔岩祭壇環境配置
- [ ] 西側入口走廊環境配置
- [ ] 東側入口走廊環境配置
- [ ] 荒草庭院環境配置
- [ ] 地心聖域環境配置
- **Status:** pending

## 修改檔案清單
| 檔案 | 改動 | 說明 |
|------|------|------|
| pixelart.js | 新增 | drawDecoration() + 8-10 種裝飾物繪製 |
| map.js | 新增 | decorations 陣列 + 水牢區配置 |
| main.js | 新增 | renderDecorations() 函式 |

## 水牢區裝飾物清單（試點）
**位置：** row 7-9, col 4-11

### Layer 1: 地板裝飾
- crack_small × 8-10 個
- moss × 6-8 個
- water_puddle × 4-6 個
- bloodstain × 3-5 個

### Layer 2: 小型物件
- rock_medium × 8-10 個（水池邊）
- bone_pile × 2-3 個

### Layer 3: 牆壁裝飾
- wall_moss × 5-7 個
- chain × 3-4 個

**總計約 40-50 個裝飾物**

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|

---
*Updated: 2026-02-09*
