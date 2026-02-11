# ProjectDK - Claude 協作指引

## 語言與態度

- **一律使用繁體中文對答**
- **一切誠實以告**：不迴避問題、不美化現狀、不隱瞞風險，如實告知優缺點與不確定性

## 迭代開發流程

本專案採用「1+9 迭代模式」：

1. **第 1 次迭代**：完整實作任務，產出可運行的成果
2. **第 2～10 次迭代**：每次從頭到尾重新檢視整份程式碼與任務成果，提出：
   - 具體的改善建議
   - 發現的問題或潛在風險
   - 新的洞察與優化方向
   - 每次迭代都應該基於前一次的修改重新審視全局

**重點**：第 2 次開始不是修修補補，而是每次都完整重新審視，確保不會只看到局部而忽略整體。

## Agent Teams 協作流程（標準模式）

當用戶要求「啟動 agent teams」時，**必須嚴格遵循以下標準流程**：

### 步驟 1：創建 Team 結構

```javascript
TeamCreate({
  team_name: "具體任務名稱-team",  // 例如: level-editor-design
  description: "清楚描述團隊目標與職責範圍",
  agent_type: "architect"  // Team lead 的角色類型
})
```

### 步驟 2：創建任務列表

使用 `TaskCreate` 為所有需要完成的子任務建立清單：

```javascript
// 範例：為設計任務創建清單
TaskCreate({ subject: "設計整體架構", description: "...", activeForm: "設計架構中" })
TaskCreate({ subject: "設計 UI/UX", description: "...", activeForm: "設計 UI 中" })
// ... 更多任務
TaskCreate({ subject: "進行 10 次迭代優化", description: "...", activeForm: "迭代優化中" })
```

### 步驟 3：啟動 Team Lead（**必須使用 Opus 4.6**）

```javascript
Task({
  subagent_type: "Plan",  // 或其他適合的 agent 類型
  team_name: "具體任務名稱-team",  // 與步驟 1 的 team_name 一致
  name: "team-lead",
  model: "opus",  // ⚠️ 關鍵：必須明確指定 opus (Opus 4.6)
  description: "Team lead 規劃與協調",
  prompt: `你是 XXX team 的 team lead，使用 Opus 4.6 模型。

## 你的職責

1. 查看任務列表（使用 TaskList）
2. 為每個設計/實作任務分派 teammates（使用 Task tool 指定 team_name）
3. Teammates 可使用 Sonnet 或 Haiku 模型（根據任務複雜度選擇）
4. 收集並整合 teammates 的成果
5. 進行多輪迭代優化（通常 10 次）
6. 產出最終文件至 docs/ 目錄

## 專案背景
[補充專案相關背景資訊]

現在開始你的工作！`
})
```

### 模型配置規則

| 角色 | 模型 | 使用時機 |
|------|------|----------|
| **Team Lead** | **Opus 4.6** | **永遠使用**（規劃、協調、迭代優化） |
| Teammate | Haiku 4.5 | 簡單、重複性任務（快速、低成本） |
| Teammate | Sonnet 4.5 | 中等複雜度任務（平衡效能與成本） |
| Teammate | Opus 4.6 | 高度複雜任務（需要深度推理） |

### 工作流程圖

```
主 Claude
  ↓ 創建 Team（TeamCreate）
  ↓ 創建任務列表（TaskCreate × N）
  ↓ 啟動 Team Lead（Task tool + model: opus）

Team Lead (Opus 4.6)
  ↓ 查看任務（TaskList）
  ↓ 分派 Teammates（Task tool + team_name）
  ↓ 協調與整合成果
  ↓ 進行 10 次迭代優化
  ↓ 產出最終文件（Write to docs/）
  ↓ 向主 Claude 報告（SendMessage）

主 Claude
  ↓ 接收成果報告
  ↓ 根據設計文件進行實作（或交由用戶決定）
```

### 迭代優化標準

Team lead 必須進行至少 10 次完整迭代：
- **Iteration 1-5**：專注特定維度（架構、UX、數據、整合、擴展性）
- **Iteration 6-10**：全局深度檢視與細節優化
- 每次從頭到尾重新審視，確保一致性與完整性

### 成果交付檢查清單

Team lead 完成後必須：
- ✅ 設計文件已寫入 `docs/` 目錄
- ✅ 文件包含完整的架構、數據結構、流程說明
- ✅ 已進行至少 10 次迭代優化
- ✅ 向主 Claude 發送訊息報告（使用 SendMessage）

**⚠️ 關鍵提醒**：
1. Team lead **必須**明確指定 `model: "opus"`
2. 分派 teammates 時**必須**指定 `team_name` 參數
3. 所有 teammates 工作完成後，team lead 才能進行迭代優化

## 大量任務處理

處理大量或複雜任務時，**必須適時呼叫 subagent 並行處理**：

- 將可獨立執行的子任務拆分給不同 subagent
- 善用 `run_in_background` 處理耗時任務
- 透過 `TaskOutput` 追蹤進度
- 不要一個人硬撐,該分工就分工

## 完成通知

工作完成後，**必須同時推送到 Slack 和 Heptabase**：

### 1️⃣ Slack 通知（即時通知）

推送結果摘要到 **n8n-測試頻道**（ID: `C08D74G1ZG8`）：

- 使用 `mcp__claude_ai_Slack__slack_send_message` 工具
- 訊息格式包含：類型、摘要、修改範圍、注意事項
- 讓用戶在 Slack 即時收到進度通知

### 2️⃣ Heptabase 知識庫（長期保存）

將重要成果推送到 Heptabase 作為知識資產：

**觸發條件**：
- ✅ 重大功能完成（如：門系統、傳送門視覺重構）
- ✅ 重要技術發現（如：性能優化方案）
- ✅ 架構決策（如：數據結構設計）
- ✅ 問題解決方案（如：複雜 bug 修復）
- ✅ 學習筆記（如：最佳實踐總結）

**推送流程**：

1. **推送到 Heptabase**：使用 `mcp__claude_ai_Heptabase__save_to_note_card`
   ```javascript
   mcp__claude_ai_Heptabase__save_to_note_card({
     content: "完整的技術文檔內容...",
     tags: ["ProjectDK", "門系統", "Phase3", "2026-02"]
   })
   ```

2. **本地備份**：同時保存到 `docs/` 目錄
   ```javascript
   Write({
     file_path: "/projectdk/docs/door-system-implementation.md",
     content: "與 Heptabase 相同的內容..."
   })
   ```

**Tag 命名規則**：

| Tag 類型 | 格式 | 範例 |
|---------|------|------|
| 專案名稱 | `ProjectDK` | `ProjectDK` |
| 功能模組 | `模組名稱` | `門系統`, `傳送門`, `小地圖` |
| 階段標記 | `Phase{數字}` | `Phase1`, `Phase2`, `Phase3` |
| 時間標記 | `YYYY-MM` | `2026-02`, `2026-03` |
| 類型標記 | `類型` | `設計`, `實作`, `優化`, `bug修復` |

**內容格式**：

```markdown
# [標題]

## 概述
[簡短描述 2-3 句話]

## 詳細內容
[完整的技術細節或結論]

## 相關資訊
- 日期：YYYY-MM-DD
- 專案：ProjectDK
- Git Commit：[commit hash]
- 修改檔案：[檔案列表]
```

**⚠️ 重要**：
- 推送到 Heptabase 後**必須**同時保存本地備份
- Tag 必須包含至少 3 個：專案名稱 + 功能模組 + 時間標記
- 本地備份檔名格式：`<主題>-<日期>.md`

---

## 除錯方法論與經驗教訓

### 典型案例：遊戲 UI 無法顯示（2026-02-11）

#### 問題描述

重構傳送門系統後，遊戲畫面正常顯示，但**下方 UI 按鈕區域完全空白**。

#### 錯誤的除錯方向（避免）

❌ **直接懷疑重構程式碼有問題**
- 立即 `git stash` 回滾所有變更
- 問題依然存在 → 證明不是重構造成的

❌ **懷疑瀏覽器快取**
- 硬重新載入（Cmd+Shift+R）
- 更換 port（8000 → 8001）
- 無痕模式測試
- 問題依然存在 → 證明不是快取問題

#### 正確的除錯流程（推薦）

✅ **階段 1：語法檢查**
```bash
# 檢查所有 JS 檔案語法
for file in js/*.js; do
  node -c "$file" || echo "❌ 語法錯誤: $file"
done
```

**結論**：所有檔案語法正確 → 問題不在語法層面

---

✅ **階段 2：建立除錯測試頁面**

建立 `test-debug.html`，測試模組載入和邏輯：

```html
<script src="js/config.js"></script>
<script src="js/ui.js"></script>
<script>
  console.log('DK.TRAP_TYPES:', Object.keys(DK.TRAP_TYPES));
  console.log('DK.HERO_TYPES:', Object.keys(DK.HERO_TYPES));
  DK.UI.buildButtons();
  console.log('Buttons:', DK.UI.buttons.length);
</script>
```

**結論**：
- ✅ 所有模組正確載入
- ✅ `buildButtons()` 成功執行
- ✅ 按鈕陣列建立正確（8 個按鈕）

→ 問題不在 UI 邏輯，而在**遊戲初始化流程**

---

✅ **階段 3：捕獲 Runtime 錯誤**

建立 `test-game.html`，捕獲所有 JavaScript 錯誤：

```javascript
window.addEventListener('error', (e) => {
  console.error('❌ ERROR:', e.message, '@', e.filename + ':' + e.lineno);
});
```

**結論**：發現關鍵錯誤訊息
```
❌ ERROR: Cannot read properties of undefined (reading 'layout')
@ js/doors.js:16
```

---

✅ **階段 4：追蹤錯誤根源**

**錯誤位置**：`js/doors.js:16`
```javascript
init(levelData) {
  if (!levelData.layout) return;  // ← levelData 是 undefined
  // ...
}
```

**呼叫位置**：`js/game.js:64`
```javascript
if (DK.Doors) DK.Doors.init(DK.Map.currentLevel);  // ← 問題在這裡
```

**根本原因**：屬性名稱錯誤
- ❌ `DK.Map.currentLevel`（不存在）
- ✅ `DK.LevelManager.currentLevel`（正確）

**修復**：
```javascript
// 修改前
if (DK.Doors) DK.Doors.init(DK.Map.currentLevel);

// 修改後
if (DK.Doors) DK.Doors.init(DK.LevelManager.currentLevel);
```

---

### 關鍵教訓總結

#### 1. 語法正確 ≠ 邏輯正確

✅ **語法檢查（node -c）只能發現**：
- 缺少分號、括號不匹配
- 關鍵字拼寫錯誤
- 基本語法錯誤

❌ **無法發現**：
- 屬性名稱錯誤（`DK.Map.currentLevel` vs `DK.LevelManager.currentLevel`）
- 函式呼叫參數為 `undefined`
- 邏輯錯誤

#### 2. 瀏覽器快取的真實影響範圍

瀏覽器快取**只會影響**：
- 舊的 JS/CSS 檔案內容被快取
- 修改後的程式碼沒有載入

瀏覽器快取**不會導致**：
- Runtime 錯誤（如 `undefined.layout`）
- 邏輯錯誤
- 模組載入失敗

**最佳實踐**：
- 硬重新載入後問題依然存在 → **不是快取問題**
- 立即進行 Runtime 錯誤檢查

#### 3. 除錯頁面的威力

**建立專門的除錯頁面**可以：

✅ **隔離問題範圍**
- `test-debug.html`：只測試邏輯，不渲染遊戲
- `test-game.html`：完整遊戲 + 錯誤捕獲

✅ **快速定位錯誤**
- 捕獲所有 Runtime 錯誤
- 顯示詳細的錯誤堆疊
- 避免被遊戲邏輯干擾

✅ **驗證修復效果**
- 修改後立即測試
- 確認錯誤訊息消失

#### 4. 函式呼叫前必須驗證參數

**壞習慣**：直接呼叫函式
```javascript
DK.Doors.init(DK.Map.currentLevel);  // 假設 currentLevel 存在
```

**好習慣**：驗證參數存在
```javascript
if (DK.Map.currentLevel) {
  DK.Doors.init(DK.Map.currentLevel);
} else {
  console.warn('currentLevel 不存在，無法初始化門系統');
}
```

或使用正確的屬性：
```javascript
const levelData = DK.LevelManager?.currentLevel;
if (levelData) {
  DK.Doors.init(levelData);
}
```

#### 5. 錯誤訊息是最好的線索

**錯誤訊息**：
```
Cannot read properties of undefined (reading 'layout')
@ js/doors.js:16
```

**解讀**：
1. `undefined.layout` → 某個物件是 `undefined`
2. `js/doors.js:16` → 錯誤發生在 `doors.js` 第 16 行
3. 往上追蹤呼叫棧 → 找到 `game.js:64`
4. 檢查傳入的參數 → `DK.Map.currentLevel` 不存在

**教訓**：永遠仔細閱讀錯誤訊息，不要憑直覺猜測。

---

### 除錯檢查清單（Debugging Checklist）

遇到 Runtime 錯誤時，按照以下順序檢查：

- [ ] **語法檢查**：`node -c js/*.js`
- [ ] **清除快取**：硬重新載入（Cmd+Shift+R）
- [ ] **建立除錯頁面**：捕獲所有錯誤訊息
- [ ] **檢查錯誤堆疊**：找出錯誤發生的確切位置
- [ ] **追蹤呼叫鏈**：找出誰呼叫了出錯的函式
- [ ] **驗證參數**：檢查傳入的參數是否存在
- [ ] **屬性名稱**：確認物件屬性名稱正確
- [ ] **模組載入順序**：確認相依模組已載入

---

### 除錯工具清單

#### 1. 語法檢查工具
```bash
# 檢查單個檔案
node -c js/game.js

# 檢查所有 JS 檔案
for file in js/*.js; do node -c "$file"; done
```

#### 2. 除錯測試頁面範本

**test-debug.html**（邏輯測試）：
```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <div id="output"></div>
  <script src="js/config.js"></script>
  <script src="js/ui.js"></script>
  <script>
    const output = document.getElementById('output');
    function log(msg) {
      output.innerHTML += msg + '<br>';
      console.log(msg);
    }

    log('模組載入: ' + (typeof DK !== 'undefined'));
    log('按鈕數量: ' + (DK.UI.buttons?.length || 0));
  </script>
</body>
</html>
```

**test-game.html**（完整遊戲 + 錯誤捕獲）：
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="css/style.css">
  <style>
    #debug-console {
      position: fixed; top: 10px; right: 10px;
      background: rgba(0,0,0,0.9); color: #0f0;
      padding: 10px; max-height: 300px; overflow-y: auto;
    }
  </style>
</head>
<body>
  <div id="debug-console"></div>
  <canvas id="game-canvas"></canvas>
  <canvas id="ui-canvas"></canvas>

  <script>
    const debugConsole = document.getElementById('debug-console');
    function debugLog(msg) {
      debugConsole.innerHTML += msg + '<br>';
      console.log(msg);
    }

    window.addEventListener('error', (e) => {
      debugLog('❌ ' + e.message + ' @ ' + e.filename + ':' + e.lineno);
    });
  </script>

  <!-- 載入所有遊戲模組 -->
  <script src="js/config.js"></script>
  <script>debugLog('✓ config.js');</script>
  <!-- ... 其他模組 -->
</body>
</html>
```

#### 3. Console 檢查指令

在瀏覽器 Console 執行：

```javascript
// 檢查模組載入
console.log('DK:', DK);
console.log('Modules:', Object.keys(DK));

// 檢查關鍵屬性
console.log('LevelManager.currentLevel:', DK.LevelManager?.currentLevel);
console.log('Map.currentLevel:', DK.Map?.currentLevel);

// 檢查 UI 按鈕
console.log('UI.buttons:', DK.UI?.buttons?.length);
DK.UI?.buttons?.forEach((btn, i) => {
  console.log(`Button ${i}:`, btn.trap?.name || btn.hero?.name || btn.action);
});
```

---

### 預防措施

#### 1. 使用 TypeScript 或 JSDoc

**問題**：屬性名稱錯誤無法在編譯時發現

**解決方案**：使用 JSDoc 類型註解
```javascript
/**
 * @param {object} levelData - 關卡數據
 * @param {string[][]} levelData.layout - 地圖佈局
 */
init(levelData) {
  if (!levelData?.layout) return;
  // ...
}
```

或使用 TypeScript：
```typescript
interface LevelData {
  layout: string[][];
}

init(levelData: LevelData) {
  // TypeScript 會檢查屬性是否存在
}
```

#### 2. 防禦性編程

**問題**：假設物件屬性一定存在

**解決方案**：使用可選鏈（Optional Chaining）
```javascript
// 壞習慣
DK.Doors.init(DK.Map.currentLevel);

// 好習慣
const levelData = DK.LevelManager?.currentLevel;
if (levelData) {
  DK.Doors.init(levelData);
} else {
  console.warn('[Game] 無法取得關卡數據');
}
```

#### 3. 統一命名規範

**問題**：相似的屬性名稱容易混淆
- `DK.Map.currentLevel`
- `DK.LevelManager.currentLevel`

**解決方案**：建立清晰的命名規範
```javascript
// 統一使用 LevelManager 管理關卡
DK.LevelManager = {
  currentLevel: null,
  loadLevel(id) { /* ... */ }
};

// Map 只負責渲染
DK.Map = {
  init() {
    const level = DK.LevelManager.currentLevel; // 明確的依賴關係
    // ...
  }
};
```

---

### 總結

這次除錯經驗的核心啟示：

1. **不要假設問題來源** - 重構後出錯不一定是重構造成的
2. **使用工具而非直覺** - 除錯頁面比猜測更有效
3. **錯誤訊息是線索** - 仔細閱讀，不要忽略
4. **防禦性編程** - 驗證參數存在，使用可選鏈
5. **記錄經驗** - 寫進 CLAUDE.md，避免重蹈覆轍

**時間對比**：
- ❌ 猜測 + 回滾 + 快取清除：30 分鐘（無效）
- ✅ 建立除錯頁面 + 追蹤錯誤：5 分鐘（直接定位）

**投資報酬率**：建立除錯工具的時間 < 無目標猜測的時間

---

### 典型案例 2：傳送門系統整合錯誤（2026-02-11）

#### 問題描述

完成傳送門系統重構後，遊戲出現多個連鎖問題：
1. 傳送門不顯示
2. Console 錯誤：`Cannot read properties of undefined (reading 'layout')`
3. Console 錯誤：`Failed to execute 'addColorStop'... ('undefined83') could not be parsed as a color`
4. 敵人無法生成

#### 根本原因分析

**問題 1：Agent Teams 實作不完整**
- Team Lead 完成了重構計畫但**沒有完整實作 Phase 3**
- main.js 缺少傳送門渲染邏輯
- map.js 的 init() 沒有載入 portals

**教訓**：
✅ **必須驗證 Agent Teams 的交付成果**
- 不能只看報告，要檢查實際程式碼
- 對照計畫文件，逐項確認實作完成度
- 特別注意「關鍵路徑」功能（如渲染、初始化）

---

**問題 2：函式參數類型不匹配**

```javascript
// 錯誤呼叫
const colorScheme = portal.type || 'green';  // 字串
DK.Map.drawPortalFull(ctx, x, y, colorScheme, time);

// 函式期望
function drawPortalFull(ctx, x, y, colorScheme, time) {
  gradient.addColorStop(0, colorScheme.glow + ...);  // 期望物件！
  //                            ^^^^
}

// 結果：undefined.glow → 'undefined' + '83' = 'undefined83'
```

**教訓**：
✅ **呼叫函式前必須確認參數類型**

1. **檢查函式簽名**
```javascript
// 錯誤：憑直覺假設參數類型
drawPortalFull(ctx, x, y, 'green', time);

// 正確：先讀取函式實作，確認參數結構
// 發現 colorScheme.glow → 需要物件
const colorScheme = {
  glow: '#44ff88',
  bright: '#88ffaa',
  dark: '#226644'
};
drawPortalFull(ctx, x, y, colorScheme, time);
```

2. **使用 JSDoc 類型註解**
```javascript
/**
 * @param {object} colorScheme - 顏色配置
 * @param {string} colorScheme.glow - 光暈顏色
 * @param {string} colorScheme.bright - 亮面顏色
 * @param {string} colorScheme.dark - 暗面顏色
 */
drawPortalFull(ctx, x, y, colorScheme, time) {
  // ...
}
```

3. **參數驗證**
```javascript
function drawPortalFull(ctx, x, y, colorScheme, time) {
  // 防禦性編程
  if (typeof colorScheme === 'string') {
    console.error('colorScheme 必須是物件，收到:', colorScheme);
    return;
  }
  if (!colorScheme.glow) {
    console.error('colorScheme 缺少 glow 屬性');
    return;
  }
  // ...
}
```

---

**問題 3：單位不匹配**

```javascript
// 錯誤
DK.Map.drawPortalFull(ctx, x, y, colorScheme, DK.Game.time);
// DK.Game.time 是毫秒（如 5000）

// 函式內部
ctx.rotate(time * Math.PI);  // 期望秒數（如 5.0）
// 結果：5000 * Math.PI = 15708 弧度 → 旋轉超級快，視覺錯誤
```

**教訓**：
✅ **明確單位並在函式命名/註解中標示**

1. **命名慣例**
```javascript
// 好習慣：參數名稱包含單位
function animate(timeSeconds) { ... }
function delay(durationMs) { ... }

// 或使用註解
/**
 * @param {number} time - 時間（秒）
 */
function drawPortalFull(ctx, x, y, colorScheme, time) { ... }
```

2. **單位轉換點明確化**
```javascript
// 清晰的轉換
const timeInSeconds = DK.Game.time / 1000;
DK.Map.drawPortalFull(ctx, x, y, colorScheme, timeInSeconds);

// 或在函式內部轉換
function drawPortalFull(ctx, x, y, colorScheme, timeMs) {
  const time = timeMs / 1000;  // 毫秒轉秒
  ctx.rotate(time * Math.PI);
}
```

3. **統一時間單位**
```javascript
// 專案級約定：所有動畫函式統一使用秒
const ANIMATION_TIME_UNIT = 'seconds';

// 或統一使用毫秒
const ANIMATION_TIME_UNIT = 'milliseconds';
```

---

**問題 4：關卡索引錯誤**

```javascript
// LevelManager 預設載入 Level 5
currentLevelIndex: 4,
this.loadLevel(4);

// 但 portals 配置只加在 Level 1
DK.LEVELS[0].portals = [...]  // Level 1
DK.LEVELS[4].portals = undefined  // Level 5 沒有！

// 結果：DK.Map.portals = undefined
```

**教訓**：
✅ **新功能必須全面配置或明確標記測試關卡**

1. **測試專用關卡**
```javascript
// 方案 1：明確標記測試關卡
DK.LevelManager = {
  // 開發模式：載入 Portal 測試關卡
  currentLevelIndex: 0,  // Level 1 (Portal Test)

  init() {
    const isDevelopment = window.location.hostname === 'localhost';
    if (isDevelopment) {
      this.loadLevel(0);  // 測試關卡
    } else {
      this.loadLevel(4);  // 正式關卡
    }
  }
};
```

2. **向後相容處理**
```javascript
// 方案 2：所有關卡都支援 portals（向後相容）
if (!level.portals) {
  // 自動掃描 layout 生成 portals
  map.scanPortalsFromLayout();
}
```

3. **驗證配置**
```javascript
// 方案 3：啟動時驗證
init() {
  const level = DK.LEVELS[this.currentLevelIndex];
  if (!level.portals && !this.hasEMarkers(level.layout)) {
    console.warn(`關卡 ${this.currentLevelIndex} 缺少 portals 配置`);
  }
}
```

---

### Agent Teams 交付檢查清單

當 Agent Teams 完成任務後，**必須**執行以下檢查：

#### 1. 文件檢查
- [ ] 設計文件已寫入 `docs/` 目錄
- [ ] 文件包含所有 Phase 的詳細實作步驟
- [ ] 文件包含程式碼範例

#### 2. 實作檢查（**最關鍵**）
- [ ] 對照設計文件，逐個 Phase 檢查程式碼
- [ ] 使用 `git diff` 查看實際變更
- [ ] 確認**關鍵路徑功能**已實作：
  - [ ] 初始化邏輯（init、載入配置）
  - [ ] 渲染邏輯（draw、render）
  - [ ] 主邏輯流程（update、process）

#### 3. 函式呼叫檢查
- [ ] 新增的函式呼叫是否正確？
- [ ] 參數類型是否匹配？（物件 vs 字串）
- [ ] 參數單位是否匹配？（秒 vs 毫秒）
- [ ] 參數數量是否正確？

#### 4. 資料流檢查
- [ ] 資料是否正確載入？（檢查 init/load 邏輯）
- [ ] 資料格式是否一致？（新格式 vs 舊格式）
- [ ] 是否有向後相容處理？

#### 5. 測試驗證
- [ ] 建立除錯測試頁面
- [ ] 執行語法檢查（`node -c`）
- [ ] 實際執行並檢查 Console
- [ ] 視覺驗證（功能是否顯示）

---

### 函式整合檢查清單

整合新功能時（如傳送門渲染），**必須**檢查：

#### 1. 函式簽名確認
```bash
# 步驟 1：找到函式定義
grep -n "functionName.*function\|functionName.*{" js/*.js

# 步驟 2：閱讀函式參數
# 確認每個參數的類型和用途
```

#### 2. 參數類型驗證
```javascript
// 檢查：參數是物件還是基本類型？
if (param.property) {
  // 參數是物件
} else {
  // 參數是基本類型
}

// 呼叫前確認類型匹配
const param = typeof expectedParam === 'object'
  ? objectParam
  : convertToObject(stringParam);
```

#### 3. 單位確認
```javascript
// 檢查：函式內部如何使用參數
ctx.rotate(time * Math.PI);  // time 是秒
setTimeout(callback, delay);  // delay 是毫秒

// 呼叫前確認單位
const timeInSeconds = timeInMs / 1000;
functionName(timeInSeconds);
```

#### 4. 錯誤訊息解讀
```
'undefined83' → 字串拼接錯誤，某個變數是 undefined
Cannot read properties of undefined → 物件不存在
NaN → 數學運算錯誤，可能是單位問題
```

---

### 關鍵教訓總結

#### 1. 永遠驗證 Agent Teams 的實作完成度
❌ 只看報告，假設程式碼已完成
✅ 對照文件，逐項檢查程式碼變更

#### 2. 呼叫函式前必須確認參數類型
❌ 憑直覺假設參數類型
✅ 閱讀函式實作，確認參數結構

#### 3. 明確標示和驗證單位
❌ 假設參數單位
✅ 參數名稱包含單位或加上註解

#### 4. 新功能必須全面配置
❌ 只在一個關卡測試
✅ 所有關卡支援或明確標記測試關卡

#### 5. 使用除錯工具驗證整合
❌ 直接執行完整遊戲
✅ 建立專門的除錯測試頁面

---

### 預防措施升級版

#### 1. 函式參數防禦性檢查
```javascript
function drawPortalFull(ctx, x, y, colorScheme, time) {
  // 參數驗證
  if (typeof colorScheme === 'string') {
    throw new Error(`colorScheme 必須是物件，收到字串: ${colorScheme}`);
  }

  if (!colorScheme.glow || !colorScheme.bright || !colorScheme.dark) {
    throw new Error('colorScheme 缺少必要屬性（glow, bright, dark）');
  }

  if (time > 1000) {
    console.warn('time 參數可能是毫秒，期望秒數。收到:', time);
  }

  // 正常邏輯
  // ...
}
```

#### 2. TypeScript 或 JSDoc
```javascript
/**
 * 繪製傳送門漩渦動畫
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {number} x - X 座標（像素）
 * @param {number} y - Y 座標（像素）
 * @param {PortalColorScheme} colorScheme - 顏色配置物件
 * @param {string} colorScheme.glow - 光暈顏色（hex）
 * @param {string} colorScheme.bright - 亮面顏色（hex）
 * @param {string} colorScheme.dark - 暗面顏色（hex）
 * @param {number} time - 動畫時間（秒，浮點數）
 */
function drawPortalFull(ctx, x, y, colorScheme, time) {
  // ...
}
```

#### 3. 配置集中管理
```javascript
// config.js
DK.PORTAL_COLORS = {
  green: {
    glow: '#44ff88',
    bright: '#88ffaa',
    dark: '#226644'
  },
  red: {
    glow: '#ff4444',
    bright: '#ff8888',
    dark: '#662222'
  }
};

// main.js
const colorScheme = DK.PORTAL_COLORS[portal.type] || DK.PORTAL_COLORS.green;
```

#### 4. Agent Teams 完成度自動檢查
```bash
# 建立檢查腳本
#!/bin/bash
echo "檢查 Phase 3 完成度..."

# 檢查是否有傳送門渲染邏輯
if grep -q "drawPortalFull" js/main.js; then
  echo "✓ Phase 3.1: 傳送門渲染邏輯已實作"
else
  echo "✗ Phase 3.1: 缺少傳送門渲染邏輯"
fi

# 檢查是否有 portals 載入邏輯
if grep -q "portals.*=" js/map.js; then
  echo "✓ Phase 2.1: Portals 載入邏輯已實作"
else
  echo "✗ Phase 2.1: 缺少 portals 載入邏輯"
fi
```

---

### 錯誤模式識別

| 錯誤訊息模式 | 可能原因 | 檢查方向 |
|-------------|----------|----------|
| `'undefined' + 數字` | 變數未定義，字串拼接 | 檢查變數是否存在、類型是否正確 |
| `Cannot read properties of undefined` | 物件不存在 | 檢查物件是否正確載入、屬性名稱是否正確 |
| `NaN` in 計算結果 | 數學運算錯誤 | 檢查單位是否匹配、變數是否為數字 |
| 視覺效果異常快/慢 | 時間單位錯誤 | 檢查是秒還是毫秒 |
| 功能完全不顯示 | 渲染邏輯未實作 | 檢查是否有呼叫 draw/render 函式 |

---

### 本次除錯時間統計

| 階段 | 時間 | 方法 |
|------|------|------|
| 修復 UI 按鈕問題 | 30 分鐘 | 除錯測試頁面 + 錯誤追蹤 |
| 發現 Agent 實作不完整 | 10 分鐘 | git diff 檢查 |
| 修復傳送門渲染 | 15 分鐘 | 加入渲染邏輯 |
| 修復 portals 載入 | 10 分鐘 | map.js init() 邏輯 |
| 修復關卡索引 | 5 分鐘 | 修改 LevelManager |
| 修復顏色參數 | 15 分鐘 | 建立顏色映射 |
| 修復時間單位 | 5 分鐘 | 毫秒轉秒 |
| **總計** | **90 分鐘** | **系統化除錯** |

**對比**：如果沒有除錯方法論，可能需要 3-4 小時的盲目猜測。

---

### 最終啟示

這次經驗證明了：

1. **Agent Teams 不是萬能的** - 必須驗證實作完成度
2. **函式整合需要謹慎** - 參數類型和單位必須確認
3. **除錯工具是救星** - 測試頁面快速定位問題
4. **文件不能只寫不查** - 實作必須對照文件驗證
5. **防禦性編程很重要** - 參數驗證能提早發現錯誤

**核心原則**：信任，但要驗證（Trust, but verify）
