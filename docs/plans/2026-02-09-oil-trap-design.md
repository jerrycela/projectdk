# 油漬陷阱設計文件

## 概述

完全取代現有的爆破陷阱（blast_trap），改為油漬陷阱（oil_trap）。油漬陷阱是控制型地板陷阱，踩踏觸發後產生限時油漬區域，大幅緩速敵人並附加油污狀態。火法師攻擊油污敵人可引爆，造成高額傷害並對附近敵人施加燒傷 DOT。

## 設計目標

- 與水電觸電反應做出明確區隔：觸電重控制（麻痺+大範圍連鎖），油燃重傷害（高額 DOT+引爆）
- 鼓勵火英雄+油漬陷阱的策略搭配
- 進化態提供九宮格大範圍油沼，成為強力 combo 節點

## 一、油漬陷阱基礎機制

### 屬性定義

| 屬性 | 值 | 說明 |
|------|-----|------|
| id | oil_trap | — |
| name | 油漬陷阱 | — |
| cost | 50 | 控制型，比原爆破(60)略低 |
| damage | 0 | 本身不造成傷害 |
| slowAmount | 0.4 | 減速 60%，比冰凍印記(0.8)強很多 |
| cooldown | 4000ms | 油漬消失後才開始冷卻 |
| type | floor | 地板陷阱 |
| element | none | 陷阱本身非火屬性 |
| oilDuration | 2000ms | 油漬區域持續 2 秒 |
| oilRadius | 1 格 | 僅陷阱所在格 |

### 觸發流程

1. 敵人踩到油漬陷阱 → 觸發油漬噴灑
2. 產生一個持續 2 秒的油漬區域（陷阱所在的 1 格）
3. 區域內所有敵人持續被附加 `oiled` 狀態 + 大幅緩速
4. 在油漬區域內 `oiled` 持續時間會不斷刷新
5. 2 秒後油漬消失 → 進入 4 秒冷卻 → 重新裝填

### `oiled` 新狀態

| 屬性 | 值 |
|------|-----|
| duration | 3000ms（離開油漬後仍維持） |
| slowAmount | 0.4（-60%） |
| color | #5a4020（深褐色） |
| particleColor | #3a2810（暗褐色） |

## 二、火焰引爆反應（油燃反應）

### 新元素反應：fire + oiled → oil_ignite

| 項目 | 油燃引爆 | 對比觸電反應 |
|------|---------|------------|
| 引爆傷害 | 50（一次性） | 無一次性傷害 |
| 連鎖範圍 | 1 格 (16px) | 基礎 1 格 |
| 燒傷 DOT | 20/500ms | 12/500ms |
| 燒傷持續 | 3000ms | 2000ms |
| 燒傷總傷 | ~120 | ~48 |
| 控制效果 | 無 | 麻痺 |
| 連鎖條件 | 無條件波及範圍內所有敵人 | 需目標有 wet |

### 觸發流程

1. 火法師火球命中帶有 `oiled` 的敵人
2. `applyElement(enemy, 'fire')` 偵測到 `oiled` 狀態
3. 消耗 `oiled`，觸發 `oil_ignite` 反應
4. 被引爆的敵人：受到 50 點一次性傷害
5. 1 格範圍內所有其他敵人（無論有無油污）：附加 `oil_burn` 狀態
6. 範圍內有油污的敵人：額外消耗油污 + 50 點引爆傷害
7. 螢幕震動 +「油燃引爆！」反應文字 + 火焰爆發特效

### `oil_burn` 新狀態

| 屬性 | 值 |
|------|-----|
| duration | 3000ms |
| dot | 20 |
| dotInterval | 500ms |
| color | #ff5500（橘紅色） |
| particleColor | #ffaa22（亮橘色） |

- 不可與 `oiled` 共存（火燒掉了油）

## 三、進化態 — 油焰陷阱

### 屬性對比

| 屬性 | 基礎 | 進化後 |
|------|------|--------|
| id | oil_trap | inferno_oil_trap |
| name | 油漬陷阱 | 油焰陷阱 |
| 進化費用 | — | 80 |
| 需求 | — | 火英雄光環 |
| 油漬範圍 | 1 格 | 九宮格 (3x3) |
| 油漬持續 | 2000ms | 5000ms |
| 緩速 | 0.4 (-60%) | 0.25 (-75%) |
| 引爆傷害 | 50 | 70 (+40%) |
| 燒傷 DOT | 20/500ms | 28/500ms (+40%) |
| 連鎖範圍 | 1 格 | 1.5 格 (+50%) |
| 眩暈 | 無 | 1000ms |

### 進化態額外效果

- 引爆時對波及範圍內敵人施加 1 秒眩暈（paralyzed）
- 油漬區域視覺升級：深紅色油灘 + 微弱火焰紋路
- 引爆特效升級：更大的火焰爆發 + 衝擊波環

### AURA_PAIRS 配對

```javascript
fire: 'oil_trap'  // 原本是 fire: 'blast_trap'
```

## 四、修改檔案清單

| 檔案 | 改動項目 |
|------|---------|
| config.js | 移除 BLAST_TRAP → 新增 OIL_TRAP；移除 seismic_blast_trap → 新增 inferno_oil_trap；AURA_PAIRS fire → oil_trap；新增油漬色板常數 |
| traps.js | 移除 blast_trap 觸發邏輯 → 新增 oil_trap 觸發（產生油漬區域）；新增油漬區域管理（activeOilZones）；每幀更新區域計時+範圍內敵人上油；移除 applyBlastAoE |
| elements.js | 新增 oiled / oil_burn 狀態定義；新增 oil_ignite 反應（fire + oiled）；新增 triggerReaction 油燃引爆邏輯；移除 blaze_ignition 反應 |
| main.js | 移除 blast_trap 渲染 → 新增 oil_trap 外觀；移除 renderExplosion / renderBlazeExplosion → 新增 oil_splat / oil_zone / oil_ignite_burst 特效；新增 oiled / oil_burn 狀態粒子渲染 |
| enemies.js | 無大改，oiled 緩速走既有 slowFactor 機制 |
| heroes.js | 無改動，火法師 applyElement 自動觸發新反應 |
| game.js | 新增每幀油漬區域更新（或整合進 traps.update） |

## 五、特效設計

| 特效 | 視覺描述 |
|------|---------|
| oil_splat | 觸發瞬間：深褐色油滴從中心向外濺射，4-6 個油滴粒子 |
| oil_zone | 持續區域：地面深褐色半透明油灘，微弱光澤反射，邊緣不規則；進化態帶深紅紋路 |
| oiled 狀態 | 敵人身上：3-4 個深褐色油滴粒子向下滴落 |
| oil_ignite_burst | 引爆瞬間：橘紅色火焰從敵人位置爆發，白色閃光核心，向外擴散的火環 |
| oil_burn 狀態 | 燒傷中：橘紅+黃色火焰粒子猛烈向上飄動，比普通灼印更大更亮 |
| 反應文字 | 「油燃引爆！」橘紅色 #ff5500 |

## 六、完全移除清單

- config.js: BLAST_TRAP 定義、seismic_blast_trap 進化、TRAP_BLAST_* 色板常數
- traps.js: blast_trap 觸發邏輯、applyBlastAoE 函式
- main.js: blast_trap 渲染、renderExplosion、renderBlazeExplosion
- elements.js: blaze_ignition 反應及 triggerReaction 對應分支

## 七、反應系統對比總結

| 維度 | 水電觸電 | 火油引爆 |
|------|---------|---------|
| 觸發 | electric + wet | fire + oiled |
| 一次性傷害 | 0 | 50 (進化 70) |
| DOT | 12/500ms × 2s = ~48 | 20/500ms × 3s = ~120 |
| 控制 | 麻痺 2 秒 | 無 (進化態 1 秒眩暈) |
| 連鎖條件 | 需目標有 wet | 無條件波及 |
| 連鎖範圍 | 1 格 (進化 +2 格) | 1 格 (進化 1.5 格) |
| 設計定位 | 控制型 | 傷害型 |

---

*Created: 2026-02-09*
