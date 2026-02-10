# ProjectDK Dungeon Heart 機制完成

## 概述

將 ProjectDK 從固定蛇形路徑塔防改為以 Dungeon Heart 為核心的開放式地城防守遊戲。實現三階段遊戲流程（規劃→破牆→入侵）和 BFS 距離場動態尋路系統。

## 技術細節

### 三階段遊戲流程
- **規劃期（Planning）**：放置陷阱、部署英雄，無時間限制
- **破牆期（Breach）**：點擊外牆 B 格打洞，即時顯示 BFS 路徑預覽
- **入侵期（Invasion）**：敵人從洞口湧入，自動波次間隔 3 秒

### 地圖結構（40×26）
- O：外圍（2 格寬），敵人巡邏區
- B：可破壞牆壁（玩家點擊打洞）
- H：地心（2×2，位於 col 17-18, row 12-13）
- 內部：開放式房間＋走廊，580 個可通行格

### BFS 距離場系統
- 從地心的 4 個格子做 BFS 外擴
- 每格記錄到地心的最短步數
- 敵人每幀走向數值更小的鄰格
- 破牆後自動重新計算距離場

### 敵人 heartDamage
| 類型 | 傷害 |
|------|------|
| 哥布林 | 10 |
| 骷髏 | 15 |
| 獸人 | 25 |
| 史萊姆 | 5 |

### 修改範圍（8 檔案，+944/-217 行）
- config.js：新常數（DUNGEON_HEART_HP、WAVE_AUTO_DELAY、heartDamage）
- map.js：新地圖佈局、BFS 距離場、破牆邏輯、新地磚繪製
- game.js：三階段 state machine、地心 HP、自動波次、多入口生成
- enemies.js：距離場移動、地心攻擊、spawnAt()
- ui.js：階段按鈕、破牆互動、地心 HP 條、階段提示
- main.js：地心渲染、破牆特效、路徑預覽、高亮
- heroes.js / traps.js：O/B/H 格限制

## 並行開發架構
使用 3 個 Agent 並行開發避免檔案衝突：
- Agent A：config.js + map.js（基礎層）
- Agent B：game.js + enemies.js（邏輯層）
- Agent C：ui.js + main.js + heroes.js + traps.js（UI/渲染層）

## 相關資訊
- 日期：2026-02-08
- 分支：feat/dungeon-heart-mechanic
- Commit：9d0ee02
- 專案：ProjectDK (Dungeon Keep)
- 標籤：遊戲開發, 塔防, BFS, 像素風
