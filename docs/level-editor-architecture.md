# ProjectDK 關卡編輯器 - 整體架構設計

## 一、架構概覽

### 1.1 設計理念

- **獨立頁面設計**：編輯器使用獨立的 HTML 頁面（`editor.html`），與遊戲本體分離
- **共用核心模組**：複用遊戲的渲染引擎（`pixelart.js`, `map.js`）與配置（`config.js`）
- **實時預覽**：所見即所得的編輯體驗，即時渲染地圖變更
- **模組化設計**：編輯器功能拆分為獨立模組，職責明確

### 1.2 技術選型

| 項目 | 選擇 | 理由 |
|------|------|------|
| **頁面架構** | 獨立 HTML | 避免污染遊戲主頁面，方便測試與維護 |
| **UI 框架** | Pure Vanilla JS | 保持與主遊戲技術棧一致，無額外依賴 |
| **渲染引擎** | 複用 DK.PixelArt | 確保編輯器與遊戲視覺完全一致 |
| **資料格式** | JSON | 與現有 `DK.LEVELS` 格式相容 |
| **儲存方式** | localStorage + JSON 匯出 | 本地快速儲存 + 可分享的檔案格式 |

### 1.3 與現有遊戲狀態機的整合

遊戲原有狀態機：`'start' → 'planning' → 'breach' → 'invasion'`

編輯器整合方式：

```
┌─────────────────────────────────────────────────────────┐
│              整合後的全域狀態架構                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐            ┌──────────────┐          │
│  │   遊戲模式   │            │  編輯器模式  │          │
│  │  (index.html)│            │ (editor.html)│          │
│  └──────┬───────┘            └──────┬───────┘          │
│         │                           │                  │
│         │ DK.Game.state             │ DK.Editor.state  │
│         ▼                           ▼                  │
│  ┌─────────────────┐         ┌─────────────────┐      │
│  │ 'start'         │         │ 'EDIT_MODE'     │      │
│  │ 'planning'      │◄────────┤   ├─ TILES      │      │
│  │ 'breach'        │ 測試模式 │   ├─ PORTALS    │      │
│  │ 'invasion'      │ 共用引擎 │   └─ WAVES      │      │
│  └─────────────────┘         │                 │      │
│         │                    │ 'TEST_MODE'     │      │
│         │                    │  (呼叫 DK.Game) │      │
│         └────────────────────┴─────────────────┘      │
│                    共用模組:                           │
│        DK.Map, DK.PixelArt, DK.Config, DK.Enemies    │
└─────────────────────────────────────────────────────────┘
```

**關鍵設計決策**：

1. **獨立頁面，共用引擎**：
   - `index.html` 只執行遊戲邏輯（`DK.Game.state`）
   - `editor.html` 只執行編輯器邏輯（`DK.Editor.state`）
   - 兩者不同時運作，避免狀態污染

2. **測試模式的整合**：
   - 編輯器的 `TEST_MODE` 內部呼叫 `DK.Game.init()`
   - 暫時「借用」遊戲引擎執行測試
   - 退出時清理遊戲狀態，恢復編輯器狀態

3. **共用模組的唯讀原則**：
   - 編輯器讀取 `DK.CONFIG`, `DK.COLORS` 但不修改
   - 編輯器調用 `DK.PixelArt.drawXXX()` 進行渲染
   - 編輯器使用 `DK.Map.computeDistanceField()` 驗證路徑

---

## 二、模組結構與職責

### 2.1 檔案結構

```
projectdk/
├── editor.html                 # 編輯器獨立頁面
├── js/
│   ├── editor/
│   │   ├── editor-main.js      # 編輯器主控制器
│   │   ├── editor-tools.js     # 畫筆工具系統
│   │   ├── editor-portal.js    # 傳送門編輯器
│   │   ├── editor-wave.js      # 波次配置編輯器
│   │   ├── editor-ui.js        # 編輯器 UI 渲染
│   │   └── editor-storage.js   # 儲存與匯出功能
│   ├── config.js               # [共用] 遊戲配置
│   ├── pixelart.js             # [共用] 像素渲染引擎
│   ├── map.js                  # [共用] 地圖系統
│   └── levels.js               # [共用] 關卡定義
└── css/
    └── editor.css              # 編輯器專用樣式
```

### 2.2 模組職責劃分

#### **editor-main.js** - 主控制器
- 初始化編輯器環境（Canvas、UI、工具）
- 管理編輯器狀態（編輯模式、選中工具、當前關卡）
- 協調各子模組（tools、portal、wave、ui、storage）
- 處理鍵盤快捷鍵（Ctrl+S 儲存、Ctrl+Z 復原等）

#### **editor-tools.js** - 畫筆工具系統
- 提供地磚畫筆（牆壁 W、地板 .、深淵 A、水潭 P、草叢 G 等）
- 實作填充工具（Flood Fill）
- 矩形繪製工具
- 橡皮擦工具
- 滑鼠拖曳繪製邏輯

#### **editor-portal.js** - 傳送門編輯器
- 新增/刪除傳送門（取代破牆 B 機制）
- 設定傳送門座標（col, row）
- 預覽敵人出生路徑
- 驗證傳送門到地心的路徑可達性

#### **editor-wave.js** - 波次配置編輯器
- 編輯波次列表（新增/刪除/調整順序）
- 配置每波敵人類型與數量
- 預覽波次難度曲線
- 驗證波次合理性（總數、難度漸增等）

#### **editor-ui.js** - UI 渲染系統
- 渲染工具列（畫筆選擇、傳送門按鈕、波次按鈕）
- 渲染地圖座標網格（輔助定位）
- 渲染右側屬性面板（關卡名稱、描述、起始金幣、地心 HP）
- 渲染狀態提示（儲存成功、錯誤訊息等）

#### **editor-storage.js** - 儲存與匯出
- 儲存到 localStorage（自動儲存 + 手動儲存）
- 匯出為 JSON 檔案（可下載）
- 匯入 JSON 檔案（載入現有關卡）
- 複製到剪貼簿（快速分享）

---

## 三、狀態機架構設計

### 3.1 編輯器狀態機

編輯器採用**雙層狀態機**架構：
1. **頂層狀態**：編輯模式 vs 測試模式
2. **次層狀態**：編輯模式內的子狀態（地磚編輯、傳送門編輯、波次編輯）

```
┌─────────────────────────────────────────────────────────┐
│                   編輯器狀態機                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────┐         進入測試        ┌──────────┐│
│   │             │─────────────────────────▶│          ││
│   │ EDIT_MODE   │                          │TEST_MODE ││
│   │  (編輯)     │◀─────────────────────────│ (測試)   ││
│   │             │         退出測試          │          ││
│   └──────┬──────┘                          └──────────┘│
│          │                                              │
│          │ 次層狀態機                                    │
│   ┌──────▼──────────────────────────────┐              │
│   │  EDIT_MODE 子狀態:                  │              │
│   │  ┌─────────┐  ┌─────────┐  ┌──────┐│              │
│   │  │ TILES   │  │ PORTALS │  │WAVES ││              │
│   │  │地磚編輯 │  │傳送門   │  │波次  ││              │
│   │  └────┬────┘  └────┬────┘  └───┬──┘│              │
│   │       └───────────┬┴───────────┘   │              │
│   │                   ↕                 │              │
│   │            [Tab 鍵切換]             │              │
│   └─────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 3.2 狀態定義與轉換

```javascript
DK.Editor = {
  // === 頂層狀態 ===
  state: 'EDIT_MODE',  // 'EDIT_MODE' | 'TEST_MODE'

  // === EDIT_MODE 子狀態 ===
  editSubState: 'TILES',  // 'TILES' | 'PORTALS' | 'WAVES'

  // 狀態轉換表
  transitions: {
    // 進入測試模式
    enterTestMode() {
      if (this.state !== 'EDIT_MODE') return false;

      // 驗證關卡資料完整性
      if (!this.validateLevel()) {
        this.showError('關卡資料不完整，無法測試');
        return false;
      }

      // 儲存編輯狀態
      this.saveSnapshot();

      // 切換狀態
      this.state = 'TEST_MODE';

      // 初始化遊戲環境
      DK.Game.init();
      DK.Game.loadCustomLevel(this.currentLevel);

      return true;
    },

    // 退出測試模式
    exitTestMode() {
      if (this.state !== 'TEST_MODE') return false;

      // 清理遊戲狀態
      DK.Game.cleanup();

      // 切換回編輯模式
      this.state = 'EDIT_MODE';

      // 恢復編輯環境
      this.restoreSnapshot();
      this.render();

      return true;
    },

    // 切換編輯子狀態
    switchEditSubState(newState) {
      if (this.state !== 'EDIT_MODE') return false;
      if (!['TILES', 'PORTALS', 'WAVES'].includes(newState)) return false;

      // 儲存當前工具選擇
      this.saveToolState();

      // 切換狀態
      this.editSubState = newState;

      // 更新 UI
      this.updateToolbar();

      return true;
    },
  },
};
```

### 3.3 模式切換機制

#### **EDIT_MODE → TEST_MODE**（進入測試）

```javascript
// 觸發方式：點擊「測試關卡」按鈕或按下 Ctrl+T
function onTestLevel() {
  // 1. 驗證關卡資料
  const validation = DK.Editor.validateLevel();
  if (!validation.valid) {
    DK.EditorUI.showValidationErrors(validation.errors);
    return;
  }

  // 2. 儲存編輯器狀態快照（用於退出時恢復）
  DK.Editor.editorSnapshot = {
    camera: { ...DK.Editor.camera },
    selectedTool: DK.Editor.selectedTool,
    editSubState: DK.Editor.editSubState,
  };

  // 3. 切換到測試模式
  DK.Editor.state = 'TEST_MODE';

  // 4. 隱藏編輯器 UI，顯示遊戲 UI
  DK.EditorUI.hide();
  DK.UI.show();

  // 5. 載入關卡到遊戲引擎
  DK.Game.init();
  DK.Game.loadCustomLevel(DK.Editor.currentLevel);
  DK.Game.startGame();

  // 6. 顯示測試模式提示
  DK.UI.showMessage('測試模式：按 ESC 退出');
}
```

#### **TEST_MODE → EDIT_MODE**（退出測試）

```javascript
// 觸發方式：按下 ESC 鍵或點擊「退出測試」按鈕
function onExitTest() {
  // 1. 暫停遊戲
  DK.Game.pause();

  // 2. 清理遊戲狀態（移除敵人、陷阱等動態物件）
  DK.Enemies.cleanup();
  DK.Traps.cleanup();
  DK.Heroes.cleanup();

  // 3. 切換回編輯模式
  DK.Editor.state = 'EDIT_MODE';

  // 4. 恢復編輯器狀態
  DK.Editor.camera = DK.Editor.editorSnapshot.camera;
  DK.Editor.selectedTool = DK.Editor.editorSnapshot.selectedTool;
  DK.Editor.editSubState = DK.Editor.editorSnapshot.editSubState;

  // 5. 顯示編輯器 UI，隱藏遊戲 UI
  DK.EditorUI.show();
  DK.UI.hide();

  // 6. 重新渲染編輯器畫面
  DK.Editor.render();
}
```

#### **編輯子狀態切換**（TILES ↔ PORTALS ↔ WAVES）

```javascript
// 觸發方式：點擊工具列分頁按鈕或按下 Tab 鍵
function switchEditSubState(newState) {
  // 1. 清除當前選擇
  DK.Editor.clearSelection();

  // 2. 儲存當前工具狀態
  DK.Editor.toolStateCache[DK.Editor.editSubState] = {
    selectedTool: DK.Editor.selectedTool,
    scrollY: DK.EditorUI.toolbarScrollY,
  };

  // 3. 切換子狀態
  DK.Editor.editSubState = newState;

  // 4. 恢復新狀態的工具選擇
  const cached = DK.Editor.toolStateCache[newState];
  if (cached) {
    DK.Editor.selectedTool = cached.selectedTool;
    DK.EditorUI.toolbarScrollY = cached.scrollY;
  } else {
    // 預設工具
    const defaults = {
      TILES: 'W',      // 預設選擇牆壁畫筆
      PORTALS: 'ADD',  // 預設選擇新增傳送門
      WAVES: null,     // 無預設
    };
    DK.Editor.selectedTool = defaults[newState];
  }

  // 5. 更新工具列 UI
  DK.EditorUI.renderToolbar();

  // 6. 更新畫面輔助線/預覽
  DK.Editor.render();
}
```

---

## 四、資料流設計

### 4.1 資料模型

```javascript
// 編輯器內部狀態
DK.Editor = {
  // === 狀態機 ===
  state: 'EDIT_MODE',         // 'EDIT_MODE' | 'TEST_MODE'
  editSubState: 'TILES',      // 'TILES' | 'PORTALS' | 'WAVES'

  // === 關卡資料 ===
  currentLevel: {
    id: 1,
    name: '破牆試煉',
    description: '學習破除路障與埋設障礙物的基礎技能',
    layout: [
      'OOOOOOOOOOOOOOOOOOOO',
      'OWWWWWWWBBWWWWWWWWWO',
      // ... 13 行 × 20 列（或 26 行 × 40 列）
    ],
    portals: [
      { col: 8, row: 2, id: 'portal-1' },
      { col: 11, row: 2, id: 'portal-2' }
    ],
    waves: [
      { enemies: [{ type: 'GOBLIN', count: 3 }] },
      { enemies: [{ type: 'GOBLIN', count: 5 }] },
    ],
    startingGold: 1000,
    dungeonHeartHP: 50,
  },

  // === 編輯器工具狀態 ===
  selectedTool: 'W',          // 當前選中的地磚類型或工具
  isDragging: false,          // 滑鼠拖曳狀態
  camera: { x: 0, y: 0 },     // 編輯器相機位置

  // === 復原/重做系統 ===
  undoStack: [],              // 復原堆疊
  redoStack: [],              // 重做堆疊

  // === 狀態管理 ===
  dirty: false,               // 是否有未儲存的變更
  editorSnapshot: null,       // 測試模式前的編輯器狀態快照
  toolStateCache: {},         // 各子狀態的工具選擇快取
};
```

### 4.2 編輯資料 → 測試執行 資料流

```
編輯模式 (EDIT_MODE)                    測試模式 (TEST_MODE)
─────────────────────                  ─────────────────────

┌─────────────────┐                    ┌─────────────────┐
│ 使用者編輯關卡  │                    │ 載入關卡資料    │
│ (修改 layout,   │                    │ → DK.Game       │
│  portals, waves)│                    │                 │
└────────┬────────┘                    └────────▲────────┘
         │                                      │
         ▼                                      │
┌─────────────────┐                             │
│ DK.Editor       │    [測試關卡按鈕]            │
│ .currentLevel   │──────────────────────────────┤
│ (即時同步)      │    Ctrl+T                   │
└────────┬────────┘                             │
         │                              ┌───────┴────────┐
         │ 自動儲存                      │ 1. 驗證資料    │
         ▼                              │ 2. 序列化      │
┌─────────────────┐                     │ 3. 傳遞給遊戲  │
│ localStorage    │                     └───────┬────────┘
│ (自動備份)      │                             │
└─────────────────┘                             ▼
                                       ┌─────────────────┐
                                       │ DK.Game.init()  │
                                       │ - 清空舊狀態    │
                                       │ - 載入新關卡    │
                                       └────────┬────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │ DK.Map.layout   │
                                       │ DK.Enemies.init │
                                       │ DK.Traps.init   │
                                       └────────┬────────┘
                                                │
         [ESC 退出測試]                          ▼
         ◄────────────────────────────┌─────────────────┐
                                      │ 開始遊戲        │
         恢復編輯狀態                  │ (即時測試)      │
         - 清理遊戲物件                └─────────────────┘
         - 恢復編輯器 UI
```

### 4.3 資料流向圖（模組層級）

```
┌───────────────────────────────────────────────────────────┐
│                    使用者操作層                            │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │畫筆  │  │傳送門│  │波次  │  │儲存  │  │匯出  │       │
│  └───┬──┘  └───┬──┘  └───┬──┘  └───┬──┘  └───┬──┘       │
└──────┼─────────┼─────────┼─────────┼─────────┼───────────┘
       │         │         │         │         │
       ▼         ▼         ▼         │         │
┌──────────────────────────────────┐ │         │
│      editor-main.js              │ │         │
│   (主控制器協調各模組)            │ │         │
│                                  │ │         │
│  ┌────────────┐  ┌────────────┐ │ │         │
│  │ tools.js   │  │ portal.js  │ │ │         │
│  │ 地磚編輯   │  │ 傳送門編輯 │ │ │         │
│  └─────┬──────┘  └─────┬──────┘ │ │         │
│        │                │        │ │         │
│        └────────┬───────┘        │ │         │
│                 ▼                │ │         │
│      ┌───────────────────┐      │ │         │
│      │ currentLevel      │      │ │         │
│      │ (編輯中的關卡)    │◄─────┼─┤         │
│      └───────┬───────────┘      │ │         │
└──────────────┼──────────────────┘ │         │
               │                    │         │
               ▼                    ▼         ▼
        ┌─────────────┐      ┌────────────────────┐
        │  map.js     │      │  storage.js        │
        │  (渲染引擎) │      │  (localStorage +   │
        │  pixelart.js│      │   JSON 匯出)       │
        └─────────────┘      └────────────────────┘
               │                    │
               ▼                    ▼
        ┌─────────────┐      ┌────────────────────┐
        │  Canvas     │      │  本地儲存 / 檔案   │
        │  即時預覽   │      │  系統               │
        └─────────────┘      └────────────────────┘
```

### 3.3 關鍵資料流程

#### 畫筆繪製流程
1. 使用者點擊工具列選擇地磚類型（如 `W` 牆壁）
2. `editor-ui.js` 更新選中狀態 → `editor-main.js` 設定 `selectedTool = 'W'`
3. 使用者在 Canvas 上拖曳滑鼠
4. `editor-tools.js` 偵測滑鼠事件 → 計算 tile 座標 → 修改 `currentLevel.layout[row][col]`
5. `editor-main.js` 推送變更到 `undoStack` → 設定 `dirty = true`
6. 即時呼叫 `map.js` 重新渲染 Canvas

#### 傳送門編輯流程
1. 使用者點擊「傳送門模式」按鈕
2. `editor-main.js` 切換 `mode = 'portals'`
3. 使用者點擊地圖位置
4. `editor-portal.js` 驗證該位置是否為可破壞牆（B）或外圍（O）
5. 若合法，新增 `{ col, row, id }` 到 `currentLevel.portals`
6. 呼叫 `map.js` 計算路徑可達性 → 渲染預覽路徑

#### 儲存流程
1. 使用者按下 Ctrl+S 或點擊「儲存」按鈕
2. `editor-storage.js` 序列化 `currentLevel` 為 JSON
3. 儲存到 `localStorage` key: `dk-editor-level-{id}`
4. 設定 `dirty = false` → UI 顯示「儲存成功」提示

---

## 五、編輯器與遊戲的整合點

### 5.1 共用模組

| 模組 | 編輯器使用方式 | 遊戲使用方式 |
|------|--------------|-------------|
| `config.js` | 讀取地磚尺寸、顏色常數 | 讀取遊戲規則參數 |
| `pixelart.js` | 渲染地圖預覽 | 渲染遊戲畫面 |
| `map.js` | 驗證地圖合法性、計算路徑 | 敵人尋路、地圖渲染 |

### 5.2 資料格式相容性

編輯器產出的 JSON 格式與遊戲的 `DK.LEVELS` 陣列完全相容：

```javascript
// 編輯器匯出格式
{
  "id": 1,
  "name": "破牆試煉",
  "description": "...",
  "layout": [...],
  "portals": [...],
  "waves": [...],
  "startingGold": 1000,
  "dungeonHeartHP": 50
}

// 遊戲讀取方式（手動複製到 levels.js）
DK.LEVELS.push({
  id: 1,
  name: '破牆試煉',
  // ... 貼上匯出的內容
});
```

**未來優化**：考慮實作「動態載入關卡」功能，讓遊戲可直接從 `localStorage` 或 URL 參數讀取自訂關卡。

### 5.3 整合測試流程

1. 在編輯器設計關卡
2. 點擊「測試關卡」按鈕
3. 開啟新分頁載入 `test-level.html`
4. URL 參數傳遞關卡 ID：`test-level.html?level=custom-1`
5. 測試頁面從 `localStorage` 讀取關卡資料
6. 使用遊戲引擎執行測試
7. 測試完成後回到編輯器繼續調整

---

## 六、UI/UX 設計

### 6.1 編輯器佈局

```
┌─────────────────────────────────────────────────────────────┐
│  關卡編輯器 - 破牆試煉             [儲存] [匯出] [測試關卡] │
├───────────┬─────────────────────────────────────────┬───────┤
│           │                                         │       │
│  工具列   │           Canvas 地圖編輯區             │ 屬性  │
│           │           (20×13 或 40×26)              │ 面板  │
│  ┌─────┐  │                                         │       │
│  │ W   │  │     [實時預覽地圖渲染]                  │ 關卡  │
│  │ .   │  │                                         │ 名稱  │
│  │ O   │  │     [座標網格輔助線]                    │ ───   │
│  │ A   │  │                                         │ 起始  │
│  │ P   │  │     [傳送門標記 + 路徑預覽]             │ 金幣  │
│  │ G   │  │                                         │ ───   │
│  │ H   │  │                                         │ 地心  │
│  │ ... │  │                                         │ HP    │
│  └─────┘  │                                         │       │
│           │                                         │       │
│  ┌─────┐  │                                         │ [波次]│
│  │傳送門│  │                                         │ [配置]│
│  └─────┘  │                                         │       │
│           │                                         │       │
│  ┌─────┐  │                                         │       │
│  │波次  │  │                                         │       │
│  └─────┘  │                                         │       │
│           │                                         │       │
└───────────┴─────────────────────────────────────────┴───────┘
│ 狀態列：當前工具: 牆壁(W) | 座標: (12, 5) | 未儲存變更    │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 互動設計

#### 畫筆工具
- **左鍵拖曳**：連續繪製地磚
- **右鍵點擊**：擷取該位置的地磚類型（吸管工具）
- **Shift + 拖曳**：繪製直線
- **Ctrl + 點擊**：填充（Flood Fill）

#### 傳送門工具
- **左鍵點擊**：新增傳送門
- **右鍵點擊傳送門**：刪除傳送門
- **滑鼠懸停**：顯示從該傳送門到地心的路徑預覽

#### 快捷鍵
- `Ctrl + S`：儲存關卡
- `Ctrl + Z`：復原
- `Ctrl + Y`：重做
- `Ctrl + E`：匯出 JSON
- `Ctrl + T`：測試關卡（開啟新分頁）
- `1-9`：快速切換畫筆類型

---

## 七、技術實作要點

### 7.1 Canvas 座標轉換

編輯器需實作滑鼠座標 → tile 座標的轉換：

```javascript
// editor-tools.js
function screenToTile(screenX, screenY) {
  const rect = canvas.getBoundingClientRect();
  const canvasX = screenX - rect.left;
  const canvasY = screenY - rect.top;

  // 考慮 SCALE 因子（3x 放大）
  const tileX = Math.floor(canvasX / DK.CONFIG.DISPLAY_TILE);
  const tileY = Math.floor(canvasY / DK.CONFIG.DISPLAY_TILE);

  return { col: tileX, row: tileY };
}
```

### 7.2 復原/重做機制

使用不可變資料結構（immutable）管理歷史記錄：

```javascript
// 每次編輯前快照
function pushUndo() {
  DK.Editor.undoStack.push(JSON.stringify(DK.Editor.currentLevel));
  DK.Editor.redoStack = []; // 清空重做堆疊
}

// 復原
function undo() {
  if (DK.Editor.undoStack.length === 0) return;
  const current = JSON.stringify(DK.Editor.currentLevel);
  DK.Editor.redoStack.push(current);
  const prev = DK.Editor.undoStack.pop();
  DK.Editor.currentLevel = JSON.parse(prev);
}
```

### 7.3 路徑驗證

複用 `map.js` 的 `computeDistanceField()` 函式驗證傳送門到地心的可達性：

```javascript
// editor-portal.js
function validatePortal(col, row) {
  // 臨時修改 layout 將傳送門位置設為路徑
  const tempLayout = cloneLayout(DK.Editor.currentLevel.layout);
  tempLayout[row] = replaceChar(tempLayout[row], col, '.');

  // 計算距離場
  DK.Map.layout = tempLayout;
  DK.Map.computeDistanceField();

  // 檢查該位置是否可達地心
  const dist = DK.Map.distanceField[row][col];
  return dist !== -1; // -1 表示不可達
}
```

### 7.4 自動儲存

防止使用者誤關分頁導致資料遺失：

```javascript
// editor-storage.js
let autoSaveTimer = null;

function markDirty() {
  DK.Editor.dirty = true;

  // 3 秒後自動儲存
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    saveToLocalStorage();
  }, 3000);
}

// 離開前警告
window.addEventListener('beforeunload', (e) => {
  if (DK.Editor.dirty) {
    e.preventDefault();
    e.returnValue = '有未儲存的變更，確定要離開嗎？';
  }
});
```

---

## 九、與現有 Codebase 的整合方式

### 9.1 最小侵入性原則

- **不修改現有遊戲檔案**：編輯器完全獨立，不影響 `index.html` 與遊戲 JS
- **只讀共用模組**：編輯器只讀取 `config.js`、`pixelart.js`、`map.js`，不寫入
- **資料格式相容**：匯出的 JSON 可直接手動複製到 `levels.js`

### 9.2 新增檔案列表

```
editor.html                    # 新增
css/editor.css                 # 新增
js/editor/editor-main.js       # 新增
js/editor/editor-tools.js      # 新增
js/editor/editor-portal.js     # 新增
js/editor/editor-wave.js       # 新增
js/editor/editor-ui.js         # 新增
js/editor/editor-storage.js    # 新增
test-level.html                # 新增（測試關卡專用頁面）
```

### 9.3 未來擴展性

- **外掛系統**：預留 `DK.EditorPlugins` 接口，允許第三方工具（如地形生成器）
- **雲端儲存**：未來可整合 Firebase/Supabase 實現多人協作編輯
- **版本控制**：記錄關卡修改歷史，支援回溯特定版本

---

## 八、狀態轉換完整圖（含邊界條件）

### 8.1 EDIT_MODE 內部狀態轉換

```
┌─────────────────────────────────────────────────────────┐
│                EDIT_MODE 狀態轉換圖                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│      ┌───────────────────────────────────┐             │
│      │         TILES (地磚編輯)          │             │
│      │  - 畫筆繪製 (W, ., O, A, P, G, H) │             │
│      │  - 填充工具 (Ctrl+Click)          │             │
│      │  - 矩形繪製 (Shift+Drag)          │             │
│      └────┬────────────▲──────────────────┘             │
│           │            │                                │
│    Tab/1  │            │  Tab/3                         │
│           │            │                                │
│           ▼            │                                │
│      ┌────────────────┴──────────────────┐             │
│      │      PORTALS (傳送門編輯)        │             │
│      │  - 新增傳送門 (左鍵點擊)         │             │
│      │  - 刪除傳送門 (右鍵點擊)         │             │
│      │  - 路徑預覽 (滑鼠懸停)           │             │
│      │  - 驗證可達性                    │             │
│      └────┬─────────────────────▲────────┘             │
│           │                     │                      │
│    Tab/2  │                     │  Tab/1               │
│           │                     │                      │
│           ▼                     │                      │
│      ┌─────────────────────────┴────────┐             │
│      │       WAVES (波次編輯)           │             │
│      │  - 新增/刪除波次                 │             │
│      │  - 配置敵人類型與數量            │             │
│      │  - 調整波次順序                  │             │
│      │  - 難度曲線預覽                  │             │
│      └──────────────────────────────────┘             │
│                                                         │
│  共用操作（所有子狀態都支援）：                          │
│  - Ctrl+S: 儲存關卡                                     │
│  - Ctrl+Z: 復原                                         │
│  - Ctrl+Y: 重做                                         │
│  - Ctrl+T: 進入測試模式                                 │
│  - Ctrl+E: 匯出 JSON                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 8.2 EDIT_MODE ↔ TEST_MODE 轉換邊界條件

```javascript
// 進入測試模式的前置條件檢查
function canEnterTestMode() {
  const errors = [];

  // 1. 檢查是否有地心 (H)
  const hasHeart = DK.Editor.currentLevel.layout.some(row =>
    row.includes('H')
  );
  if (!hasHeart) {
    errors.push('關卡缺少地心 (H)');
  }

  // 2. 檢查是否有傳送門
  if (!DK.Editor.currentLevel.portals ||
      DK.Editor.currentLevel.portals.length === 0) {
    errors.push('關卡缺少傳送門（敵人無法進入）');
  }

  // 3. 檢查傳送門到地心的路徑可達性
  for (const portal of DK.Editor.currentLevel.portals) {
    if (!DK.Editor.validatePortalPath(portal)) {
      errors.push(`傳送門 ${portal.id} 到地心的路徑不可達`);
    }
  }

  // 4. 檢查是否至少有一波敵人
  if (!DK.Editor.currentLevel.waves ||
      DK.Editor.currentLevel.waves.length === 0) {
    errors.push('關卡缺少波次配置');
  }

  // 5. 檢查地圖尺寸是否合法
  const rows = DK.Editor.currentLevel.layout.length;
  const cols = DK.Editor.currentLevel.layout[0]?.length || 0;
  if (rows !== 13 && rows !== 26) {
    errors.push(`地圖高度 ${rows} 不合法（應為 13 或 26）`);
  }
  if (cols !== 20 && cols !== 40) {
    errors.push(`地圖寬度 ${cols} 不合法（應為 20 或 40）`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// 退出測試模式的清理流程
function exitTestMode() {
  // 1. 暫停遊戲循環
  cancelAnimationFrame(DK.Game.animationFrameId);

  // 2. 清理動態物件
  DK.Enemies.active = [];
  DK.Traps.placed = [];
  DK.Heroes.deployed = [];
  DK.Elements.pools = [];
  DK.Game.effects = [];
  DK.Game.particles = [];

  // 3. 重置遊戲狀態
  DK.Game.state = 'start';
  DK.Game.waveActive = false;
  DK.Game.gameOver = false;

  // 4. 恢復編輯器狀態
  DK.Editor.state = 'EDIT_MODE';
  DK.Editor.camera = DK.Editor.editorSnapshot.camera;

  // 5. 重新載入關卡資料到編輯器
  DK.Map.layout = DK.Editor.currentLevel.layout;
  DK.Map.init();

  // 6. 重新渲染編輯器畫面
  DK.Editor.render();
}
```

### 8.3 未儲存變更保護機制

```javascript
// 離開編輯器前警告
window.addEventListener('beforeunload', (e) => {
  if (DK.Editor.dirty && DK.Editor.state === 'EDIT_MODE') {
    e.preventDefault();
    e.returnValue = '有未儲存的變更，確定要離開嗎？';
    return e.returnValue;
  }
});

// 切換子狀態前自動儲存
function switchEditSubState(newState) {
  if (DK.Editor.dirty) {
    // 自動儲存到 localStorage（不彈出提示）
    DK.EditorStorage.autoSave();
  }

  // ... 切換邏輯
}

// 進入測試模式前自動儲存
function enterTestMode() {
  if (DK.Editor.dirty) {
    DK.EditorStorage.autoSave();
  }

  // ... 測試邏輯
}
```

---

## 十、開發優先級建議

### Phase 1：核心編輯功能（1-2 天）
- [ ] `editor-main.js`：Canvas 初始化、事件監聽
- [ ] `editor-tools.js`：基礎畫筆繪製（W, ., O, A, P, G, H）
- [ ] `editor-ui.js`：工具列渲染
- [ ] `editor-storage.js`：localStorage 儲存/載入

### Phase 2：進階功能（1-2 天）
- [ ] `editor-portal.js`：傳送門新增/刪除、路徑預覽
- [ ] `editor-wave.js`：波次配置 UI
- [ ] 復原/重做功能
- [ ] JSON 匯出/匯入

### Phase 3：測試與優化（1 天）
- [ ] `test-level.html`：測試關卡頁面
- [ ] 快捷鍵系統
- [ ] 自動儲存
- [ ] UI/UX 打磨

---


---

## 十一、風險評估與應對

| 風險 | 影響 | 應對措施 |
|------|------|---------|
| **Canvas 渲染效能**（大地圖卡頓） | 中 | 使用 offscreen canvas 快取、限制最大地圖尺寸 |
| **復原堆疊記憶體溢位** | 低 | 限制 undoStack 最大長度（50 次） |
| **JSON 序列化失敗** | 低 | try-catch 包裹所有 JSON 操作，顯示錯誤提示 |
| **瀏覽器相容性** | 低 | 使用標準 Web API，避免實驗性功能 |
| **資料遺失** | 高 | 自動儲存 + beforeunload 警告 + localStorage 備份 |
| **測試模式狀態污染** | 中 | 嚴格的 cleanup 流程 + 狀態快照機制 |
| **狀態機死鎖** | 低 | 所有轉換都有前置條件檢查 + 錯誤恢復邏輯 |

---

## 十二、總結

### 核心設計理念

本架構設計遵循以下原則：

1. **雙層狀態機架構**：
   - 頂層：EDIT_MODE ↔ TEST_MODE（編輯 vs 測試）
   - 次層：TILES → PORTALS → WAVES（編輯子模式）

2. **模組化與單一職責**：
   - 6 個獨立模組，職責明確
   - 主控制器協調，子模組專注功能

3. **最大化複用遊戲引擎**：
   - 共用 `DK.PixelArt`, `DK.Map`, `DK.Config`
   - 測試模式「借用」`DK.Game` 引擎
   - 確保編輯器與遊戲視覺一致

4. **最小侵入性**：
   - 新增 8 個檔案，不修改現有遊戲檔案
   - 獨立頁面 `editor.html`，避免狀態污染

5. **資料安全與容錯**：
   - 自動儲存（3 秒防抖）
   - beforeunload 警告
   - localStorage 多重備份
   - 狀態快照與清理機制

6. **可擴展性**：
   - 預留 `DK.EditorPlugins` 接口
   - 支援未來雲端儲存整合
   - 版本控制系統預留空間

### 關鍵技術亮點

- **座標轉換系統**：處理滑鼠 → tile 的 SCALE=3 轉換
- **路徑驗證引擎**：複用 `computeDistanceField()` 驗證傳送門可達性
- **復原/重做機制**：immutable snapshot stack（限制 50 層）
- **狀態機邊界檢查**：所有轉換都有完整的前置條件驗證

### 預期效益

透過這套架構，可實現：

- ✅ **開發效率提升 10 倍**：視覺化編輯取代手動編寫字串陣列
- ✅ **設計迭代加速**：即時測試 + 快速調整 + 無需重啟遊戲
- ✅ **降低錯誤率**：路徑驗證 + 資料格式檢查 + 自動儲存
- ✅ **易於維護**：模組化設計 + 清晰的職責劃分
- ✅ **可擴展架構**：支援外掛、雲端儲存等未來功能

這是一個功能完整、架構清晰、易於維護的專業級關卡編輯器設計。
