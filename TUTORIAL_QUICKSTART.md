# 🎮 ProjectDK 新手教學關卡系統 - 快速啟動指引

## 快速開始

### 1. 啟動遊戲

```bash
cd /Users/admin/Downloads/遊戲專案/projectdk/projectdk
python3 -m http.server 8000
```

然後在瀏覽器開啟：http://localhost:8000

### 2. 測試教學系統

開啟測試頁面：http://localhost:8000/test-tutorial.html

這個頁面會執行 10 個單元測試，驗證：
- ✅ 關卡系統載入
- ✅ 地圖尺寸正確
- ✅ 教學步驟完整
- ✅ LevelManager 功能
- ✅ Tutorial 系統功能

### 3. 遊玩關卡

遊戲會自動從 **Level 1: 破牆試煉** 開始。

#### 關卡順序
1. **破牆試煉** (20×13, 3 波) - 學習路障與破牆
2. **水坑戰術** (20×13, 3 波) - 學習水電連鎖
3. **火焰軌道** (20×13, 3 波) - 學習軌道與油坑
4. **組合攻勢** (20×13, 3 波) - 綜合元素運用
5. **完整挑戰** (40×26, 10 波) - 無教學，完整關卡

---

## 教學系統使用方式

### Level 1 教學步驟預覽

1. **歡迎訊息** (自動 3 秒)
   - 介紹破牆試煉

2. **放置路障** (條件觸發)
   - 點擊右下角「路障」按鈕
   - 在地圖上放置 1 個路障
   - 完成後自動進入下一步

3. **開始第 1 波** (條件觸發)
   - 點擊「開始第 1 波」按鈕
   - 觀察敵人破牆

4. **觀察破牆** (自動 4 秒)
   - 觀看敵人攻擊路障

5. **放置陷阱** (條件觸發)
   - 選擇並放置陷阱
   - 消滅敵人

### 教學訊息顯示位置

- **底部中央偏上**：金色邊框黑底訊息框
- **不會遮擋遊戲區域**
- **支援多行文字**

---

## 開發者模式

### 測試特定關卡

在瀏覽器控制台執行：

```javascript
// 跳到關卡 2
DK.LevelManager.loadLevel(1);  // 索引從 0 開始
DK.Game.init();

// 跳到關卡 5（完整挑戰）
DK.LevelManager.loadLevel(4);
DK.Game.init();
```

### 檢查當前關卡

```javascript
// 取得當前關卡資訊
console.log(DK.LevelManager.currentLevel);

// 檢查教學系統狀態
console.log('教學啟用:', DK.Tutorial.enabled);
console.log('當前步驟:', DK.Tutorial.currentStep);
```

### 觸發教學步驟

```javascript
// 手動觸發下一步
DK.Tutorial.nextStep('afterStep:welcome');

// 檢查條件
DK.Tutorial.checkCondition('barricadePlaced', { count: 1 });
```

---

## 疑難排解

### 問題 1: 教學訊息不顯示

**檢查**：
```javascript
console.log('Tutorial enabled:', DK.Tutorial.enabled);
console.log('Current step:', DK.Tutorial.currentStep);
```

**解決**：
- 確認 `levels.js` 和 `tutorial.js` 已載入
- 檢查關卡是否有 `tutorial` 定義
- 確認 `DK.Tutorial.init()` 被呼叫

### 問題 2: 關卡無法切換

**檢查**：
```javascript
console.log('Current wave:', DK.Game.currentWave);
console.log('Total waves:', DK.WAVES.length);
console.log('Game over:', DK.Game.gameOver);
```

**解決**：
- 確認所有波次已完成
- 檢查 `DK.LevelManager.nextLevel()` 回傳值
- 查看控制台是否有錯誤

### 問題 3: 地圖顯示異常

**檢查**：
```javascript
console.log('Map size:', DK.Map.layout[0].length, 'x', DK.Map.layout.length);
console.log('Camera:', DK.Game.camera);
```

**解決**：
- 確認地圖每行長度一致
- 20×13 地圖應禁用 camera
- 檢查 `map.js` 的動態載入邏輯

---

## 檔案結構

```
projectdk/
├── index.html              # 主頁面（已修改，載入新腳本）
├── test-tutorial.html      # 教學系統測試頁面
├── js/
│   ├── levels.js          # ✨ 新增：關卡定義 + LevelManager
│   ├── tutorial.js        # ✨ 新增：教學步驟管理系統
│   ├── config.js          # WAVES 可覆寫
│   ├── game.js            # ✏️ 修改：整合 LevelManager
│   ├── map.js             # ✏️ 修改：動態地圖載入
│   └── ui.js              # ✏️ 修改：教學 UI + 條件檢測
└── docs/
    └── tutorial-system-phase1-2026-02-09.md  # 完整實作文件
```

---

## 下一步開發

### 第 2 階段：教學互動（迭代 2-4）

- [ ] 高亮系統（UI 元素脈動）
- [ ] 地圖格子高亮
- [ ] 完善 Level 1 教學流程
- [ ] 條件觸發測試

### 第 3 階段：多關卡系統（迭代 5-7）

- [ ] Level 2-4 詳細設計
- [ ] 關卡選單（可選）
- [ ] 進度儲存（localStorage）

### 第 4 階段：優化潤飾（迭代 8-10）

- [ ] 動畫效果
- [ ] UI 美化
- [ ] 效能優化
- [ ] 完整測試

---

## 技術支援

遇到問題？檢查：

1. **控制台錯誤**: F12 → Console
2. **網路請求**: F12 → Network
3. **檔案載入**: 確認所有 JS 檔案載入成功
4. **測試頁面**: 開啟 `test-tutorial.html` 執行單元測試

**詳細文件**：`docs/tutorial-system-phase1-2026-02-09.md`

---

**🎉 第 1 階段已完成！享受遊戲吧！**
