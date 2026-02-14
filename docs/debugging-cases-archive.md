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

---

### 典型案例 3：API 名稱錯誤導致全面渲染失敗（2026-02-11）

#### 問題描述

用戶報告進入遊戲後，**所有陷阱/圖標按鈕完全是黑色**，無法點擊選擇。連關卡編輯器的圖標也變黑了。

#### 初步除錯嘗試（失敗）

1. ❌ 懷疑是 Critical issues 修復造成的副作用
2. ❌ 檢查語法（`node -c`）- 全部通過
3. ❌ 懷疑瀏覽器快取 - Hard Refresh 無效

#### 根本原因

**CRIT-002: `DK.FONTS.normal` 未定義**

```javascript
// main.js:357, 401 呼叫了不存在的方法
ctx.font = DK.FONTS.normal(14);  // ❌ TypeError!

// 實際 DK.FONTS 定義（config.js）
DK.FONTS = {
  title(size) { ... },
  body(size) { ... },    // ✅ 正確的方法
  bold(size) { ... },
  heavy(size) { ... },
  pixel(size) { ... }
  // ❌ 沒有 normal() 方法！
}
```

**連鎖效應**：
1. `DK.UI.render(ctx)` 呼叫 `renderWavePreview(ctx)`
2. `renderWavePreview` 內部呼叫 `renderCurrentWaveCard`（main.js:357）
3. 執行 `DK.FONTS.normal(14)` → **TypeError: DK.FONTS.normal is not a function**
4. TypeError 中斷 canvas 上下文的正常狀態
5. 後續所有按鈕/圖標渲染失敗 → **全面黑屏**

**同時發現 CRIT-001**：`DK.ENEMIES` 未定義（應該是 `DK.ENEMY_TYPES`）

#### 為什麼 QA 沒發現？

1. **瀏覽器快取問題**
   - QA agents 可能使用舊版本程式碼
   - 或測試環境沒有 Hard Refresh

2. **錯誤發生在特定時機**
   - TypeError 發生在 `renderWavePreview` 內部
   - 只有在特定遊戲狀態下才會觸發

3. **語法檢查無法捕獲執行期錯誤**
   - `node -c` 只檢查語法，不檢查 API 是否存在
   - `DK.FONTS.normal` 語法正確，但執行時不存在

4. **無視覺回歸測試**
   - 自動化測試無法捕獲「按鈕變黑」這種視覺錯誤

---

### 關鍵教訓：從錯誤中學習

> **核心信念**：錯誤不可恥，重點是不要犯同樣的錯

#### 教訓 1：語法檢查 ≠ API 存在性檢查

**問題**：
```javascript
// ✅ 語法正確（node -c 通過）
ctx.font = DK.FONTS.normal(14);

// ❌ 執行期錯誤（normal 不存在）
TypeError: DK.FONTS.normal is not a function
```

**解決方案**：**啟動時 API 驗證**

```javascript
// 在遊戲初始化時驗證所有必要 API
function validateAPIs() {
  const requiredAPIs = [
    { path: 'DK.FONTS.title', type: 'function' },
    { path: 'DK.FONTS.body', type: 'function' },
    { path: 'DK.FONTS.bold', type: 'function' },
    { path: 'DK.ENEMY_TYPES', type: 'object' },
    { path: 'DK.TRAP_TYPES', type: 'object' },
    { path: 'DK.Map.init', type: 'function' },
  ];

  const errors = [];
  for (const api of requiredAPIs) {
    const value = eval(api.path);  // 或使用更安全的方式
    if (typeof value !== api.type) {
      errors.push(`API 不存在或類型錯誤: ${api.path} (期望 ${api.type})`);
    }
  }

  if (errors.length > 0) {
    console.error('❌ API 驗證失敗：');
    errors.forEach(err => console.error('  -', err));
    throw new Error('遊戲無法啟動：API 驗證失敗');
  }

  console.log('✅ API 驗證通過');
}

// 在 main.js 開頭呼叫
window.addEventListener('DOMContentLoaded', () => {
  validateAPIs();  // 先驗證 API
  initGame();      // 再初始化遊戲
});
```

**替代方案**：使用 JSDoc + TypeScript

```javascript
/**
 * @typedef {object} DK_FONTS
 * @property {function(number): string} title
 * @property {function(number): string} body
 * @property {function(number): string} bold
 */

// TypeScript 會在編譯時捕獲 .normal() 不存在的錯誤
```

---

#### 教訓 2：QA 測試必須清除快取

**問題**：QA agents 可能在舊版本程式碼上運行測試

**解決方案**：

1. **測試前強制清除快取**
```javascript
// 方案 1：URL 版本號
<script src="js/main.js?v=20260211_2210"></script>
<script src="js/config.js?v=20260211_2210"></script>

// 方案 2：自動版本號（build 時生成）
<script src="js/main.js?v=${BUILD_TIMESTAMP}"></script>
```

2. **測試腳本自動 Hard Refresh**
```bash
# 測試前清除快取
open "http://localhost:8000/index.html?nocache=$(date +%s)"
```

3. **測試環境禁用快取**
```javascript
// 在測試模式下禁用快取
if (window.location.hostname === 'localhost') {
  document.querySelectorAll('script').forEach(script => {
    const src = script.src;
    if (src && !src.includes('?')) {
      script.src = src + '?t=' + Date.now();
    }
  });
}
```

---

#### 教訓 3：執行期錯誤需要 Runtime 驗證

**語法檢查無法捕獲的錯誤**：
- ✅ 缺少分號、括號不匹配
- ❌ API 不存在（`DK.FONTS.normal`）
- ❌ 屬性名稱錯誤（`DK.ENEMIES` vs `DK.ENEMY_TYPES`）
- ❌ 參數類型錯誤（物件 vs 字串）

**解決方案：建立執行期檢查腳本**

```javascript
// validate-runtime.js
const RUNTIME_CHECKS = [
  {
    name: 'FONTS API',
    checks: [
      () => typeof DK.FONTS.title === 'function',
      () => typeof DK.FONTS.body === 'function',
      () => typeof DK.FONTS.bold === 'function',
    ]
  },
  {
    name: 'ENEMY_TYPES',
    checks: [
      () => DK.ENEMY_TYPES !== undefined,
      () => Object.keys(DK.ENEMY_TYPES).length > 0,
    ]
  },
  {
    name: 'TRAP_TYPES',
    checks: [
      () => DK.TRAP_TYPES !== undefined,
      () => Object.keys(DK.TRAP_TYPES).length > 0,
    ]
  }
];

function runRuntimeChecks() {
  let passed = 0;
  let failed = 0;

  for (const group of RUNTIME_CHECKS) {
    for (const check of group.checks) {
      if (check()) {
        passed++;
      } else {
        failed++;
        console.error(`❌ ${group.name} 檢查失敗`);
      }
    }
  }

  console.log(`✅ 通過: ${passed}, ❌ 失敗: ${failed}`);
  return failed === 0;
}
```

---

#### 教訓 4：視覺回歸測試的必要性

**問題**：自動化測試無法捕獲「按鈕變黑」這種視覺錯誤

**解決方案：使用 Playwright 視覺回歸測試**

```javascript
// tests/visual-regression.spec.js
import { test, expect } from '@playwright/test';

test('陷阱按鈕正常顯示', async ({ page }) => {
  await page.goto('http://localhost:8000/index.html');

  // 等待遊戲初始化
  await page.waitForTimeout(1000);

  // 截圖比對
  await expect(page).toHaveScreenshot('trap-buttons.png', {
    maxDiffPixels: 100  // 允許 100 像素差異
  });
});

test('編輯器圖標正常顯示', async ({ page }) => {
  await page.goto('http://localhost:8000/editor.html');
  await page.waitForTimeout(1000);

  await expect(page).toHaveScreenshot('editor-icons.png', {
    maxDiffPixels: 100
  });
});
```

**執行測試**：
```bash
# 首次執行：建立基準截圖
npx playwright test --update-snapshots

# 後續執行：比對截圖
npx playwright test
```

---

#### 教訓 5：API 命名一致性

**問題**：相似但不一致的命名容易混淆
- `DK.ENEMIES` vs `DK.ENEMY_TYPES`
- `DK.FONTS.normal` vs `DK.FONTS.body`

**解決方案：統一命名規範**

1. **複數形式表示集合**
```javascript
DK.ENEMY_TYPES = { ... }    // ✅ 正確
DK.TRAP_TYPES = { ... }     // ✅ 正確
DK.ENEMIES = { ... }        // ❌ 避免（容易與 ENEMY_TYPES 混淆）
```

2. **方法命名一致**
```javascript
// ✅ 統一使用 size 描述符
DK.FONTS = {
  title(size) { ... },     // 大標題
  body(size) { ... },      // 正文（不要用 normal）
  bold(size) { ... },      // 粗體
  heavy(size) { ... },     // 超粗
}
```

3. **避免語義重疊**
```javascript
// ❌ 不好：normal 和 body 語義重疊
DK.FONTS.normal(14)
DK.FONTS.body(14)

// ✅ 好：明確的語義區分
DK.FONTS.heading(14)   // 標題
DK.FONTS.body(14)      // 正文
DK.FONTS.caption(14)   // 說明文字
```

---

### 改進措施（立即執行）

#### 1. 加入啟動時 API 驗證

**位置**：`js/main.js` 開頭

```javascript
// 在遊戲初始化前驗證所有必要 API
function validateCriticalAPIs() {
  const apis = [
    'DK.FONTS.title', 'DK.FONTS.body', 'DK.FONTS.bold',
    'DK.ENEMY_TYPES', 'DK.TRAP_TYPES', 'DK.Map.init'
  ];

  for (const api of apis) {
    const parts = api.split('.');
    let obj = window;
    for (const part of parts) {
      obj = obj[part];
      if (!obj) {
        throw new Error(`❌ Critical API 不存在: ${api}`);
      }
    }
  }

  if (DK.DEBUG_MODE) console.log('✅ API 驗證通過');
}

// DOMContentLoaded 時先驗證
window.addEventListener('DOMContentLoaded', () => {
  validateCriticalAPIs();  // 先驗證
  init();                  // 再初始化
});
```

#### 2. 加入版本號強制清除快取

**位置**：`index.html`, `editor.html`

```html
<!-- 在所有 script 標籤加入版本號 -->
<script src="js/config.js?v=20260211"></script>
<script src="js/main.js?v=20260211"></script>
<!-- ... -->
```

#### 3. 建立視覺回歸測試

**位置**：`tests/visual-regression.spec.js`

```bash
# 安裝 Playwright
npm install -D @playwright/test

# 建立測試
npx playwright test --update-snapshots
```

#### 4. QA 檢查清單更新

在 QA 測試前**必須**執行：
- [ ] Hard Refresh 瀏覽器（Cmd+Shift+R）
- [ ] 開啟 Chrome DevTools Console
- [ ] 確認沒有 JavaScript 錯誤
- [ ] 執行視覺檢查（所有按鈕/圖標正常顯示）
- [ ] 執行功能檢查（可以點擊和互動）

---

### 最終啟示：錯誤是學習的機會

這次經驗證明：

1. **錯誤不可恥** - 每個人都會犯錯，重要的是如何回應
2. **不要重蹈覆轍** - 把教訓寫進 CLAUDE.md
3. **建立預防機制** - 啟動時 API 驗證、視覺回歸測試
4. **提升除錯效率** - 系統化除錯流程 > 盲目猜測
5. **誠實面對問題** - 坦承錯誤，快速修復

**時間對比**：
- ❌ 猜測 + 回滾：浪費 30 分鐘
- ✅ 全面測試 + 系統化修復：15 分鐘定位 + 5 分鐘修復 = **20 分鐘解決**

**ROI**：
- 投資：建立 API 驗證 + 視覺測試（1 小時）
- 回報：避免未來所有類似錯誤（節省數小時）

---

### 典型案例 4：Canvas 狀態污染導致按鈕渲染失敗（2026-02-11）

#### 問題描述

用戶報告：test-02-planning.png 截圖中，陷阱按鈕沒有圖示顯示（黑色/空白）

#### 根本原因

**Canvas 狀態污染** - Wave Preview 渲染函式修改了 Canvas 狀態但沒有恢復，導致下一幀按鈕渲染使用錯誤的狀態。

#### 渲染順序與問題機制

```
幀 N：
  1. DK.UI.render(uiCtx) - 渲染按鈕
  2. renderWavePreview(uiCtx) - 設定 textAlign = 'left'
  3. ❌ 沒有 ctx.restore() - 狀態未恢復

幀 N+1：
  1. uiCtx.clearRect() - 清空 Canvas
  2. DK.UI.render(uiCtx) - 渲染按鈕
  3. renderButton() 假設 textAlign = 'center'
  4. ❌ 但實際是 'left'（從上一幀繼承）
  5. 文字繪製在按鈕右側外面 → 按鈕內部空白
```

#### 具體污染點

**main.js** 中的 4 個函式：

1. `renderCurrentWaveCard()` - Line 350 設定 `textAlign = 'left'`
2. `renderNextWaveCard()` - Line 398 設定 `textAlign = 'left'`
3. `renderDifficultyIndicator()` - 修改 `fillStyle`
4. `renderWaveProgress()` - Line 488 設定 `textAlign = 'center'`

**所有函式都沒有使用 `ctx.save()` / `ctx.restore()` 保護狀態。**

#### 為什麼像素分析顯示透明？

不是真正的「黑屏」或「透明」，而是：
- 文字 `textAlign = 'left'` + `x = btn.x + btn.width / 2`
- 文字被繪製在按鈕右側**外面**
- 按鈕內部沒有內容 → 看起來是黑色/透明

#### 為什麼最小測試成功？

`test-minimal-button-render.html` 中：
- 只渲染按鈕，沒有 Wave Preview
- Canvas 狀態是乾淨的
- 沒有其他函式污染 textAlign

#### 解決方案

在所有修改 Canvas 狀態的函式中加入 `ctx.save()` / `ctx.restore()`：

```javascript
function renderCurrentWaveCard(ctx, waveData, x, y) {
  ctx.save();  // ✅ 保存狀態

  // ... 所有渲染邏輯 ...
  ctx.textAlign = 'left';  // 可以自由修改
  // ...

  ctx.restore();  // ✅ 恢復狀態
}
```

**修復的 4 個函式**：
1. ✅ `renderCurrentWaveCard()`
2. ✅ `renderNextWaveCard()`
3. ✅ `renderDifficultyIndicator()`
4. ✅ `renderWaveProgress()`

#### 關鍵教訓

**1. Canvas 狀態是全域的，會跨幀繼承**

```javascript
// ❌ 錯誤：修改狀態後不恢復
function render1(ctx) {
  ctx.textAlign = 'left';
  ctx.fillText('text', 100, 100);
  // 沒有恢復 → 影響下一幀
}

// ✅ 正確：使用 save/restore 保護
function render2(ctx) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.fillText('text', 100, 100);
  ctx.restore();  // 狀態恢復
}
```

**2. 所有修改 Canvas 狀態的函式都必須保護**

需要保護的狀態：
- `ctx.fillStyle`
- `ctx.strokeStyle`
- `ctx.font`
- `ctx.textAlign`
- `ctx.textBaseline`
- `ctx.globalAlpha`
- `ctx.globalCompositeOperation`
- `ctx.lineWidth`
- `ctx.lineCap`
- `ctx.lineJoin`

**3. 使用 Agent Teams 加速除錯**

本次除錯使用 Agent Teams 並行分析：
- Team Lead (Opus 4.6) 協調 4 個 teammates
- 並行檢查：渲染流程、Canvas 狀態、執行追蹤、差異對比
- **15 分鐘定位根本原因**（單人可能需要 1-2 小時）

**4. 視覺問題不一定是視覺邏輯錯誤**

表面現象：按鈕黑屏/透明
實際原因：文字繪製在錯誤位置（Canvas 狀態污染）

**不要只看表象，要追蹤根本原因。**

#### 除錯流程檢討

**✅ 正確的步驟**：
1. 確認問題（像素分析 → 發現透明）
2. 排除原因（語法、按鈕物件、基礎渲染）
3. 建立最小測試（發現基礎渲染正常）
4. 啟動 Agent Teams 並行分析
5. 定位根本原因（Canvas 狀態污染）
6. 實作修復（加入 save/restore）

**⚠️  錯誤的嘗試**（已避免）：
- ❌ 直接猜測是瀏覽器快取
- ❌ 直接修改按鈕渲染邏輯
- ❌ 盲目調整顏色/字型

#### 預防措施

**1. 建立 Canvas 狀態保護規範**

```javascript
// 專案規範：所有渲染函式都必須使用 save/restore
function renderAnyComponent(ctx, data) {
  ctx.save();  // 必須有

  // 渲染邏輯

  ctx.restore();  // 必須有
}
```

**2. ESLint 規則（未來）**

建立自訂 ESLint 規則，檢查：
- `ctx.textAlign =` 必須在 `ctx.save()` 之後
- 函式結尾必須有對應的 `ctx.restore()`

**3. 視覺回歸測試**

```bash
# 每次修改後自動截圖對比
npm run test:visual
```

#### 時間統計

| 階段 | 時間 | 方法 |
|------|------|------|
| 問題確認 | 15 分鐘 | 截圖、像素分析 |
| 最小測試 | 10 分鐘 | 建立 test-minimal-button-render.html |
| Agent Teams 分析 | 15 分鐘 | 4 個 teammates 並行調查 |
| 修復實作 | 5 分鐘 | 加入 save/restore |
| 驗證測試 | 10 分鐘 | Chrome 驗證 |
| **總計** | **55 分鐘** | **系統化除錯** |

**對比**：如果盲目猜測修改，可能需要 2-3 小時。

---

**日期**：2026-02-11
**教訓來源**：Canvas 狀態污染 - 陷阱按鈕黑屏
**根本原因**：Wave Preview 函式沒有使用 save/restore 保護 Canvas 狀態
**修復時間**：55 分鐘（15 分鐘定位 + 5 分鐘修復 + 10 分鐘驗證）
**影響範圍**：main.js 4 個函式
**關鍵發現**：Canvas 狀態會跨幀繼承，必須使用 save/restore 保護
**預防成本**：建立 Canvas 狀態保護規範（立即執行）

---

