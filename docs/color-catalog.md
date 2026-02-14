# DK.COLORS 顏色目錄

快速查詢所有顏色常數的索引表。

**最後更新**：2026-02-11

---

## 使用方式

```javascript
const C = DK.COLORS;

// 方式 1：直接引用
PA.rect(ctx, x, y, w, h, C.decorations.torch.flameCore);

// 方式 2：解構賦值
const { torch } = C.decorations;
PA.pixel(ctx, x, y, torch.wood);
```

---

## 1. environment（環境色彩）

### 1.1 wall（牆壁）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `darkest` | #12101e | 最深紫藍 |
| `dark` | #1a1828 | 深紫藍 |
| `darkMid` | #242236 | 中深 |
| `darkShade` | #2a2840 | 深色調 |
| `midDark` | #2d2d44 | 中深灰 |
| `mid` | #35354e | 中等灰 |
| `midNeutral` | #3a3a54 | 中性灰 |
| `midLight` | #3e3e5a | 中淺 |
| `lightMid` | #484660 | 淺中 |
| `light` | #525266 | 淺灰 |
| `lightBright` | #565470 | 明亮淺灰 |
| `highlight` | #5e5e7a | 高光 |
| `highlightStrong` | #686884 | 強高光 |
| `brightest` | #72728e | 最亮 |
| `edge` | #7c7c98 | 邊緣 |
| `mortar` | #140e24 | 灰泥 |
| `moss` | #2a4a2a | 苔蘚 |
| `warm` | #3a3248 | 暖色調 |
| `crack` | #0e0c1a | 裂紋 |

### 1.2 floor（地板）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `darkest` | #3a3228 | 最深褐 |
| `dark` | #4a4236 | 深褐 |
| `darkMid` | #524a3e | 中深褐 |
| `midDark` | #5a5246 | 中深 |
| `mid` | #5e5648 | 中等 |
| `midNeutral` | #665e50 | 中性 |
| `midLight` | #6e6658 | 中淺 |
| `lightMid` | #72695a | 淺中 |
| `light` | #7a7162 | 淺褐 |
| `lightBright` | #82796a | 明亮淺褐 |
| `highlight` | #8a8172 | 高光 |
| `brightest` | #92897a | 最亮 |
| `crack` | #3a3428 | 裂紋 |
| `dust` | #72695a | 灰塵 |

### 1.3 abyss（深淵）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `void` | #000000 | 虛空 |
| `darkest` | #030305 | 最深 |
| `dark` | #050508 | 深黑 |
| `midDark` | #08080e | 中深 |
| `mid` | #0e0e18 | 中等 |
| `crack` | #0a0a14 | 裂紋 |
| `edgeDark` | #12121e | 邊緣深 |
| `edge` | #1a1a2a | 邊緣 |
| `rock` | #2a2838 | 岩石 |

### 1.4 pool（水池）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `darkest` | #0a1a3a | 最深藍 |
| `dark` | #1a2a4a | 深藍 |
| `midDark` | #2a3a5a | 中深藍 |
| `mid` | #2a4a7a | 中等藍 |
| `light` | #3a6aaa | 淺藍 |
| `highlight` | #5a8acc | 高光藍 |
| `ripple` | #6aaaee | 漣漪 |

### 1.5 grass（草地）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `darkest` | #0a2a0a | 最深綠 |
| `dark` | #1a3a1a | 深綠 |
| `midDark` | #254a25 | 中深綠 |
| `mid` | #2a5a2a | 中等綠 |
| `midLight` | #356a35 | 中淺綠 |
| `light` | #3a7a3a | 淺綠 |
| `highlight` | #4a9a4a | 高光綠 |
| `burningDark` | #aa3311 | 燃燒深紅 |
| `burning` | #cc5522 | 燃燒紅 |
| `burningLight` | #ee7744 | 燃燒亮紅 |
| `scorchedDark` | #1a1410 | 焦黑深 |
| `scorched` | #2a2420 | 焦黑 |
| `scorchedLight` | #3a3430 | 焦黑淺 |

---

## 2. ui（使用者介面）

### 2.1 background（背景）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `main` | #12101e | 主背景 |
| `panel` | #1e1a2e | 面板背景 |

### 2.2 border（邊框）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `normal` | #4a3e6e | 普通邊框 |
| `light` | #6a5e8e | 淺色邊框 |

### 2.3 text（文字）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `primary` | #e8e0d0 | 主要文字 |
| `secondary` | #8a8070 | 次要文字 |

### 2.4 status（狀態）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `gold` | #ffd700 | 金幣 |
| `hp` | #ff4444 | 生命值 |
| `hpBg` | #441111 | 生命值背景 |
| `wave` | #44aaff | 波次 |
| `selected` | #ffaa44 | 選中 |

---

## 3. elements（元素）

### 3.1 trap（陷阱基礎）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `metal` | #7888a0 | 金屬 |
| `metalLight` | #98a8c0 | 金屬亮 |
| `metalDark` | #586878 | 金屬暗 |

### 3.2 electric（電擊）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `main` | #ffdd44 | 主色 |
| `light` | #ffff88 | 亮色 |
| `dark` | #aa8800 | 暗色 |
| `plate` | #4a4a5a | 電擊板 |

### 3.3 push（推力）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `housing` | #5a5060 | 外殼 |
| `piston` | #8a8090 | 活塞 |
| `charge` | #ff6622 | 蓄力 |
| `glow` | #ffaa44 | 光暈 |

### 3.4 oil（油漬）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `body` | #3a3020 | 主體 |
| `puddle` | #2a2010 | 油池 |
| `sheen` | #5a5030 | 光澤 |
| `dark` | #1a1808 | 暗部 |

### 3.5 wind（風壓）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `housing` | #2a3448 | 外殼 |
| `fan` | #88aacc | 風扇 |
| `glow` | #aaddff | 光暈 |

### 3.6 barricade（路障）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `stone` | #5a5a6e | 石頭 |
| `stoneDark` | #2a2a3a | 石頭暗 |
| `stoneLight` | #7a7a8e | 石頭亮 |
| `mortar` | #3a3a4a | 灰泥 |
| `crack` | #1a1a2a | 裂紋 |

---

## 4. characters（角色）

### 4.1 hero（英雄）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `skin` | #f0dcc8 | 皮膚 |
| `selected` | #44ff44 | 選中 |
| `hair.dark` | #aa8844 | 金髮暗 |
| `hair.mid` | #ddaa55 | 金髮中 |
| `hair.light` | #ffcc77 | 金髮亮 |
| `crown.gold` | #ffcc00 | 皇冠金 |
| `crown.gem` | #cc0000 | 皇冠寶石 |

### 4.2 enemy（敵人）

參見 config.js 的 `characters.enemy.*` 定義。

---

## 5. effects（特效）

### 5.1 element（元素屬性）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `water` | #4488ff | 水 |
| `waterLight` | #66aaff | 水亮 |
| `fire` | #ff6622 | 火 |
| `fireLight` | #ffaa44 | 火亮 |
| `electric` | #ffdd44 | 電 |
| `electricLight` | #ffff88 | 電亮 |
| `reaction` | #ffffff | 反應 |

### 5.2 text（文字特效）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `damage` | #ff4444 | 傷害 |
| `gold` | #ffd700 | 金幣 |
| `heal` | #44ff44 | 治療 |

---

## 6. system（系統）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `error` | #ff4444 | 錯誤 |
| `warning` | #ffaa44 | 警告 |
| `success` | #44ff44 | 成功 |
| `info` | #44aaff | 資訊 |

---

## 7. detail（細節裝飾）

### 7.1 pool（水池細節）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `pebble` | #1a2838 | 卵石 |
| `pebbleMid` | #1a3040 | 卵石中 |
| `pebbleDark` | #142030 | 卵石暗 |

### 7.2 floor（地板細節）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `weatherSpot` | #2a5a2a | 風化點 |
| `weatherDark` | #1e3a1e | 風化暗 |
| `weatherShadow` | #1a3a1a | 風化陰影 |
| `mossSpot` | #2a4a2a | 苔蘚斑 |
| `highlight` | #9a9080 | 高光 |
| `highlightMid` | #8a8070 | 高光中 |
| `highlightDark` | #7a7060 | 高光暗 |

### 7.3 rail（鐵道）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `base` | #2a2a1a | 基底 |
| `wood` | #aa8844 | 木材 |
| `woodLight` | #ccaa55 | 木材亮 |
| `metal` | #777766 | 金屬 |
| `metalDark` | #666655 | 金屬暗 |
| `gravel` | #1a1a14 | 碎石 |
| `gravelLight` | #1a1810 | 碎石亮 |
| `dust` | #3a3630 | 灰塵 |

---

## 8. decorations（裝飾物）

### 8.1 torch（火把）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `wood` | #4a3020 | 木柱 |
| `woodLight` | #5a4030 | 木柱亮 |
| `flameCore` | #ffcc44 | 火焰核心 |
| `flameHot` | #ffaa00 | 高溫區 |
| `flameBright` | #ff8800 | 明亮區 |
| `flameMid` | #ff9922 | 中溫區 |
| `flameGlow` | #ff6622 | 光暈 |
| `flameDark` | #ff4400 | 暗火焰 |

### 8.2 chest（寶箱）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `wood` | #4a3020 | 木材 |
| `woodMid` | #5a4030 | 木材中 |
| `woodLight` | #6a5040 | 木材亮 |
| `woodHighlight` | #7a6050 | 木材高光 |
| `gold` | #ffd700 | 金幣 |
| `goldMid` | #ffaa00 | 金幣中 |
| `goldGlow` | #ffee88 | 金幣光暈 |
| `goldLight` | #ffdd77 | 金幣亮 |

### 8.3 statue（雕像）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `base` | #5a5a6e | 基座 |
| `mid` | #6a6a7e | 中部 |
| `top` | #7a7a8e | 頂部 |
| `topLight` | #8a8a9e | 頂部亮 |
| `bottom` | #4a4a5e | 底部 |
| `highlight` | #9a9aae | 高光 |
| `shadow` | #3a3a4e | 陰影 |
| `crack` | #3a3a4e | 裂紋 |
| `floor` | #5e5648 | 地板色 |

### 8.4 skull（骷髏）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `bone` | #d0c8b0 | 骨頭 |
| `boneLight` | #e0d8c0 | 骨頭亮 |
| `boneDark` | #c0b8a0 | 骨頭暗 |
| `eye` | #1a1a1a | 眼窩 |
| `eyeMid` | #2a2a2a | 眼窩中 |

### 8.5 potion（藥水瓶）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `blue` | #44aaff | 藍色藥水 |
| `blueLight` | #66ccff | 藍色亮 |
| `blueBright` | #88eeff | 藍色明亮 |
| `blueDark` | #2288cc | 藍色暗 |
| `orange` | #ff8800 | 橙色藥水 |
| `orangeHot` | #ffaa00 | 橙色熱 |
| `orangeBright` | #ffcc44 | 橙色亮 |
| `orangeMid` | #ff9922 | 橙色中 |
| `orangeGlow` | #ffbb33 | 橙色光暈 |
| `purple` | #aa44ff | 紫色藥水 |
| `purpleLight` | #cc66ff | 紫色亮 |
| `purpleBright` | #8833cc | 紫色明亮 |
| `purpleMid` | #cc88ff | 紫色中 |
| `purpleGlow` | #ee99ff | 紫色光暈 |
| `purpleHot` | #ffaaff | 紫色熱 |
| `purpleDark` | #bb66ee | 紫色暗 |

### 8.6 brazier（火盆）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `base` | #3a3a3a | 基座 |
| `baseDark` | #2a2a2a | 基座暗 |

### 8.7 crystal（水晶台）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `base` | #5a5a6e | 基座 |
| `frame` | #4a4a5e | 框架 |
| `wood` | #6a5040 | 木材 |
| `shadow` | #3a3a4e | 陰影 |
| `gold` | #ffd700 | 金色 |
| `goldMid` | #ffaa00 | 金色中 |

---

## 9. portals（傳送門）

### 9.1 green（綠色傳送門）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `dark` | #226622 | 深綠 |
| `darkMid` | #22662a | 深綠中 |
| `mid` | #338833 | 中綠 |
| `bright` | #44aa44 | 亮綠 |
| `brightMid` | #66cc66 | 亮綠中 |
| `light` | #88ee88 | 淺綠 |
| `glow` | #66ff66 | 光暈 |
| `glowBright` | #88ff88 | 光暈亮 |
| `glowLight` | #aaffaa | 光暈淺 |
| `core` | #0a1a0a | 核心暗 |
| `rim1` | #1a3820 | 邊緣1 |
| `rim2` | #2a5a30 | 邊緣2 |
| `rim3` | #44aa44 | 邊緣3 |
| `center` | #66ff66 | 中心 |
| `centerGlow` | #aaffaa | 中心光暈 |
| `particle` | #88ff88 | 粒子 |
| `edge` | #0a0a0a | 邊緣 |

### 9.2 red（紅色傳送門）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `dark` | #662222 | 深紅 |
| `darkMid` | #662222 | 深紅中 |
| `mid` | #883333 | 中紅 |
| `bright` | #aa4444 | 亮紅 |
| `brightMid` | #cc4444 | 亮紅中 |
| `light` | #ff6666 | 淺紅 |
| `glow` | #ff8888 | 光暈 |
| `glowBright` | #ffaaaa | 光暈亮 |
| `core` | #1a0a0a | 核心暗 |
| `rim1` | #3a1820 | 邊緣1 |
| `rim2` | #5a2a30 | 邊緣2 |
| `rim3` | #aa4444 | 邊緣3 |
| `center` | #ff6666 | 中心 |
| `centerGlow` | #ffaaaa | 中心光暈 |
| `particle` | #ff8888 | 粒子 |
| `bridge` | #ff4444 | 傳送橋 |
| `edge` | #0a0a0a | 邊緣 |

### 9.3 common（傳送門通用）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `edgeColor` | #4a4236 | 地板邊緣色 |

---

## 10. heart（地心系統）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `background` | #1a0a2a | 背景 |
| `crystal` | #aa44ff | 水晶 |
| `crystalGlow` | #ffffff | 水晶光暈 |
| `crystalBright` | #cc88ff | 水晶亮 |
| `crystalMid` | #aa66dd | 水晶中 |
| `stoneBase` | #3a2a4a | 石台 |
| `edge` | #0a0a0a | 邊緣 |

---

## 11. doors（門系統）

### 11.1 wood（木門）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `base` | #2a2218 | 基底 |
| `shadeLight` | #342a1e | 陰影淺 |
| `shadeMid` | #2e2618 | 陰影中 |
| `shadeDark` | #1e1a12 | 陰影暗 |
| `moss` | #1a3018 | 苔蘚 |
| `mossLight` | #243820 | 苔蘚淺 |
| `weatherLight` | #3a3428 | 風化淺 |
| `weatherDark` | #2a2620 | 風化暗 |
| `scratch` | #3a3020 | 刮痕 |

### 11.2 stone（石門）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `base` | #3a3850 | 基底 |
| `mortar` | #282638 | 灰泥 |
| `brick` | #4a4868 | 磚塊 |
| `brickMid` | #3e3c58 | 磚塊中 |
| `brickDark` | #343248 | 磚塊暗 |
| `highlight` | #5a5878 | 高光 |
| `highlightStrong` | #4e4c68 | 強高光 |
| `shadow` | #2a2840 | 陰影 |
| `crack` | #1a1828 | 裂紋 |
| `glowDot` | #5a5878 | 光點 |
| `moss` | #1e3a1e | 苔蘚 |

### 11.3 crystal（水晶門）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `background` | #2a1a3a | 背景 |
| `innerShade1` | #3a2a4e | 內陰影1 |
| `innerShade2` | #342448 | 內陰影2 |
| `layer1` | #4a2a5e | 層級1 |
| `layer2` | #5a3a6e | 層級2 |
| `layer3` | #6a4a80 | 層級3 |
| `layer4` | #8a6aa0 | 層級4 |
| `layer5` | #aa8ac0 | 層級5 |
| `coreHot` | #ddbbff | 核心熱 |
| `coreMid` | #ccaaee | 核心中 |
| `rimBright` | #5a4a6e | 邊緣亮 |
| `cornerDark` | #1a0e28 | 角落暗 |
| `glow` | #aa8ac0 | 光暈 |
| `glowMid` | #9a7ab0 | 光暈中 |

---

## 12. lighting（高光與陰影）

### 12.1 highlight（高光）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `waterGlow` | rgba(255,255,255,0.1) | 水面反光 |
| `metalGlow` | rgba(255,255,255,0.2) | 金屬反光 |
| `white` | #ffffff | 純白 |
| `warm` | #ffffaa | 暖白 |
| `hot` | #ffcc44 | 熱光 |
| `fire` | #ffaa22 | 火光 |
| `fireDark` | #ff8844 | 火光暗 |
| `fireGlow` | #ff6622 | 火光暈 |
| `fireHot` | #ff4400 | 火熱光 |

### 12.2 shadow（陰影）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `soft` | rgba(0,0,0,0.2) | 柔和陰影 |
| `medium` | rgba(0,0,0,0.4) | 中等陰影 |
| `hard` | rgba(0,0,0,0.6) | 硬陰影 |

---

## 13. tooltips（提示框）

### 13.1 trap（陷阱提示）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `border` | #6a5a8a | 邊框 |
| `evolved` | #ffcc44 | 進化標記 |
| `evolvedMid` | #ffd966 | 進化標記中 |
| `type` | #c0b090 | 類型文字 |
| `damage` | #ff8866 | 傷害文字 |
| `push` | #ffaa66 | 推力文字 |
| `range` | #88ccff | 範圍文字 |
| `upgrade` | #88ff88 | 升級文字 |
| `cost` | #ffcc44 | 成本文字 |
| `requirement` | #ff8866 | 需求文字 |
| `description` | #a0a090 | 描述文字 |

### 13.2 hero（英雄提示）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `border` | #4488ff | 邊框 |
| `name` | #4488ff | 名稱 |
| `hpGood` | #88ff88 | 生命值良好 |
| `hpMid` | #ffcc44 | 生命值中等 |
| `hpLow` | #ff6666 | 生命值低 |
| `damage` | #ff8866 | 傷害 |
| `range` | #88ccff | 範圍 |
| `statusNeutral` | #aaa090 | 狀態中性 |
| `statusPatrol` | #88aaff | 狀態巡邏 |
| `statusAttack` | #ff8866 | 狀態攻擊 |
| `element` | #aa88ff | 元素 |
| `aura` | #8888cc | 光環 |

### 13.3 enemy（敵人提示）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `border` | #ff6666 | 邊框 |
| `name` | #ff6666 | 名稱 |
| `hpGood` | #ff8866 | 生命值良好 |
| `hpMid` | #ffaa44 | 生命值中等 |
| `hpLow` | #ffcc88 | 生命值低 |
| `speed` | #88aaff | 速度 |
| `gold` | #ffcc44 | 金幣 |

### 13.4 button（按鈕提示）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `border` | #6a5a8a | 邊框 |
| `description` | #e8e0d0 | 描述 |
| `hotkey` | #88aaff | 快捷鍵 |
| `cost` | #ffcc44 | 成本 |

---

## 14. notifications（通知系統）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `error.bg` | #6e3e3e | 錯誤背景 |
| `error.border` | #ff4444 | 錯誤邊框 |
| `warning.bg` | #6e5e3e | 警告背景 |
| `warning.border` | #ffaa44 | 警告邊框 |
| `info.bg` | #3e4e6e | 資訊背景 |
| `info.border` | #4488ff | 資訊邊框 |
| `text` | #f0e8d8 | 文字 |
| `highlight` | #ffcc88 | 高亮 |

---

## 15. uiCore（UI 核心擴充）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `panel` | #1a1630 | 面板 |
| `goldText` | #ffdd44 | 金幣文字 |
| `whiteText` | #ffffff | 白色文字 |
| `resourceDark` | #5a5060 | 資源暗 |
| `resourceMid` | #8a8090 | 資源中 |
| `resourceLight` | #aaa0b0 | 資源亮 |
| `resourceBright` | #bbb0c0 | 資源明亮 |
| `costOrange` | #ff6622 | 成本橙 |
| `costOrangeBright` | #ff8844 | 成本橙亮 |
| `oilBody` | #3a3020 | 油漬主體 |
| `oilDark` | #2a2010 | 油漬暗 |
| `oilSheen` | #5a5030 | 油漬光澤 |
| `oilShadow` | #3a2810 | 油漬陰影 |
| `oilDetail` | #4a3828 | 油漬細節 |
| `windHousing` | #2a3448 | 風壓外殼 |
| `windFan` | #88aacc | 風壓風扇 |
| `windGlow` | #aaddff | 風壓光暈 |

---

## 16. flames（火焰效果）

### 16.1 torch（火把火焰）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `wood` | #6b5010 | 木材 |
| `helmet` | #586878 | 頭盔（？） |
| `coreWhite` | #ffffff | 核心白 |
| `coreYellow` | #ffffaa | 核心黃 |
| `coreOrange` | #ffcc44 | 核心橙 |
| `coreFire` | #ffaa22 | 核心火 |
| `flameBright` | #ff8844 | 火焰亮 |
| `flameOrange` | #ffaa44 | 火焰橙 |
| `flameDark` | #ff6622 | 火焰暗 |
| `flameDeep` | #ff4400 | 火焰深 |

### 16.2 particle（粒子火焰）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `orange` | #ff8844 | 橙色粒子 |
| `orangeBright` | #ffaa44 | 橙色粒子亮 |

---

## 17. water（水花效果）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `splash` | #8accff | 水花 |

---

## 18. burning（油漬燃燒）

| 名稱 | 色值 | 用途 |
|------|------|------|
| `flameDark` | #ee6633 | 火焰暗 |
| `flame` | #ffaa22 | 火焰 |
| `flameBright` | #ffcc44 | 火焰亮 |

---

## 快速搜尋

### 按顏色值搜尋

使用 `Cmd+F` 或 `Ctrl+F` 搜尋色值（如 `#ffcc44`），快速找到對應的命名常數。

### 按用途搜尋

| 用途 | 搜尋關鍵字 | 命名空間 |
|------|-----------|---------|
| 火焰 | flame, torch | decorations.torch, flames |
| 水面 | water, pool, splash | environment.pool, water |
| 傳送門 | portal, green, red | portals |
| 寶箱 | chest, gold | decorations.chest |
| 門 | door, wood, stone, crystal | doors |
| 陰影 | shadow, dark | lighting.shadow |
| 高光 | highlight, glow | lighting.highlight |

---

**維護規則**：

1. 新增顏色時必須更新本目錄
2. 顏色名稱必須語義化（描述用途而非外觀）
3. 相關顏色組織在同一命名空間
4. 漸層顏色使用一致的後綴（darkest, dark, mid, light, brightest）
