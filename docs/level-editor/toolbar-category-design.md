# 關卡編輯器：工具欄分類系統設計

**設計師**: UI/UX 設計師 (toolbar-designer)
**日期**: 2026-02-10
**版本**: 1.0
**狀態**: ✅ 已完成

---

## 一、設計目標

將 18 種地磚重新組織為分類工具欄，改善關卡編輯器的可用性與效率：

### 核心問題
- **當前問題**：18 種地磚全部平鋪在單一面板中，查找效率低
- **目標用戶**：遊戲關卡設計師、玩家自製地圖
- **使用場景**：快速建構迷宮、房間、陷阱、裝飾

### 設計原則
1. **符合心智模型**：分類邏輯符合關卡設計流程（先地形→再設施→最後裝飾）
2. **視覺直觀**：使用真實地磚預覽 + 圖標 + 名稱
3. **快速存取**：快捷鍵綁定 + 可折疊面板
4. **彈性擴充**：未來新增地磚時易於維護

---

## 二、分類結構

### 2.1 六大分類

```
🟫 基礎地形 (Terrain)         - 5 種
🏠 房間設施 (Rooms)           - 2 種
🚪 傳送路徑 (Portals)         - 3 種
⚡ 陷阱系統 (Traps)           - 2 種
✨ 裝飾物件 (Decorations)     - 5 種
🌊 特殊地形 (Special Terrain) - 3 種
```

### 2.2 詳細分類表

| 分類 | Tile ID | 名稱 | 快捷鍵 | 說明 |
|------|---------|------|--------|------|
| **🟫 基礎地形** | | | | 地圖骨架 |
| | `W` | 牆壁 | `1` | 主要牆體，不可通行 |
| | `.` | 地板 | `2` | 可行走路徑 |
| | `O` | 外圍 | `3` | 地圖邊界，絕對不可通行 |
| | `B` | 路障 | `4` | 可破壞牆壁（100HP，最多5個） |
| | `A` | 深淵 | `5` | 敵人掉落秒殺，推力陷阱配合 |
| **🏠 房間設施** | | | | 功能建築 |
| | `H` | 地心 | `Q` | Dungeon Heart（核心，100HP） |
| | `E` | 傳送門 | `W` | 敵人入口/出口（傳送對） |
| **🚪 傳送路徑** | | | | 特殊門戶 |
| | `E` | 傳送門 | `W` | 已在房間設施（重複分類） |
| | `D` | 門 | `E` | 可開關門扇 |
| | `B` | 路障 | `4` | 已在基礎地形（重複分類） |
| **⚡ 陷阱系統** | | | | 戰鬥機制 |
| | `(陷阱放置)` | 電擊板 | - | 遊戲中放置，非地磚 |
| | `(陷阱放置)` | 推力陷阱 | - | 遊戲中放置，非地磚 |
| **✨ 裝飾物件** | | | | 氛圍營造 |
| | `T` | 火把 | `R` | 牆壁照明 |
| | `C` | 寶箱 | `F` | 獎勵裝飾 |
| | `L` | 石柱 | `V` | 建築柱體 |
| | `S` | 骸骨 | `C` | 恐怖氛圍 |
| | `U` | 符文 | `X` | 魔法裝飾 |
| | `F` | 火盆 | `G` | 大型火光 |
| | `X` | 水晶 | `Z` | 能量裝飾 |
| **🌊 特殊地形** | | | | 元素互動 |
| | `P` | 水潭 | `T` | 水元素區域 |
| | `G` | 草叢 | `Y` | 可燃地形 |
| | `A` | 深淵 | `5` | 已在基礎地形（重複分類） |

**說明**：
- `E`, `B`, `A` 在兩個分類中重複出現（符合不同使用情境）
- 陷阱系統在遊戲中透過金幣購買放置，非地磚編輯

---

## 三、資料結構設計

### 3.1 TOOL_CATEGORIES 物件

```javascript
/**
 * 關卡編輯器 - 工具欄分類定義
 * 對應檔案: js/editor/editor-ui.js
 */
DK.TOOL_CATEGORIES = {
  terrain: {
    id: 'terrain',
    name: '🟫 基礎地形',
    icon: '🟫',
    description: '地圖骨架：牆壁、地板、外圍',
    collapsed: false, // 預設展開（最常用）
    tiles: [
      { id: 'W', name: '牆壁', key: '1', color: '#2d2d44' },
      { id: '.', name: '地板', key: '2', color: '#5e5648' },
      { id: 'O', name: '外圍', key: '3', color: '#050508' },
      { id: 'B', name: '路障', key: '4', color: '#5a5a6e' },
      { id: 'A', name: '深淵', key: '5', color: '#050508' }
    ]
  },

  rooms: {
    id: 'rooms',
    name: '🏠 房間設施',
    icon: '🏠',
    description: '功能建築：地心、傳送門',
    collapsed: false, // 預設展開（核心機制）
    tiles: [
      { id: 'H', name: '地心', key: 'Q', color: '#ff4444' },
      { id: 'E', name: '傳送門', key: 'W', color: '#44aa44' }
    ]
  },

  portals: {
    id: 'portals',
    name: '🚪 傳送路徑',
    icon: '🚪',
    description: '門戶系統：傳送門、門、路障',
    collapsed: true, // 預設折疊（次要）
    tiles: [
      { id: 'E', name: '傳送門', key: 'W', color: '#44aa44' },
      { id: 'D', name: '門', key: 'E', color: '#6a5040' },
      { id: 'B', name: '路障', key: '4', color: '#5a5a6e' }
    ]
  },

  traps: {
    id: 'traps',
    name: '⚡ 陷阱系統',
    icon: '⚡',
    description: '戰鬥機制（遊戲中放置）',
    collapsed: true, // 預設折疊（非地磚）
    tiles: [
      // 空白（陷阱在遊戲中放置）
      // 顯示提示訊息：「陷阱在遊戲中使用金幣購買放置」
    ]
  },

  decorations: {
    id: 'decorations',
    name: '✨ 裝飾物件',
    icon: '✨',
    description: '氛圍營造：火把、寶箱、骸骨等',
    collapsed: true, // 預設折疊（最後調整）
    tiles: [
      { id: 'T', name: '火把', key: 'R', color: '#ff8800' },
      { id: 'C', name: '寶箱', key: 'F', color: '#ffd700' },
      { id: 'L', name: '石柱', key: 'V', color: '#7a7a8e' },
      { id: 'S', name: '骸骨', key: 'C', color: '#d0c8b0' },
      { id: 'U', name: '符文', key: 'X', color: '#44aaff' },
      { id: 'F', name: '火盆', key: 'G', color: '#ff9922' },
      { id: 'X', name: '水晶', key: 'Z', color: '#aa44ff' }
    ]
  },

  special: {
    id: 'special',
    name: '🌊 特殊地形',
    icon: '🌊',
    description: '元素互動：水潭、草叢',
    collapsed: true, // 預設折疊（特殊場景）
    tiles: [
      { id: 'P', name: '水潭', key: 'T', color: '#2a4a7a' },
      { id: 'G', name: '草叢', key: 'Y', color: '#2a5a2a' },
      { id: 'A', name: '深淵', key: '5', color: '#050508' }
    ]
  }
};
```

### 3.2 快捷鍵設計邏輯

**左手操作區（QWER / ASDF / ZXCV）**：
- **Q**: 地心 (Heart) - 最重要，左上角
- **W**: 傳送門 (Way/Warp) - 核心機制
- **E**: 門 (Entry)
- **R**: 火把 (toRch)
- **T**: 水潭 (waTer)
- **Y**: 草叢 (grassY)
- **F**: 寶箱 (treasureFund)
- **G**: 火盆 (firepGrate)
- **C**: 骸骨 (boneCarcass)
- **V**: 石柱 (pillarVertical)
- **X**: 符文 (runeX)
- **Z**: 水晶 (crystalZ)

**數字鍵（1-5）**：
- **1-5**: 基礎地形（牆/地/外/障/淵）- 最常用

---

## 四、UI 設計規格

### 4.1 分類面板結構

```html
<!-- 分類工具欄（替換原 tilePalette） -->
<div id="categoryToolbar">
  <!-- 分類標籤頁（可選：Tab 或 Accordion） -->
  <div class="category-section" data-category="terrain">
    <div class="category-header">
      <span class="category-icon">🟫</span>
      <span class="category-name">基礎地形</span>
      <button class="collapse-btn" aria-label="折疊/展開">▼</button>
    </div>
    <div class="category-tiles">
      <!-- 地磚按鈕（與原 tile-btn 樣式一致） -->
      <button class="tile-btn" data-tile="W" title="牆壁 (快捷鍵: 1)">
        <canvas class="tile-preview" width="32" height="32"></canvas>
        <div class="tile-label">
          <strong>W</strong><br>
          <small>牆壁</small>
        </div>
        <kbd class="tile-hotkey">1</kbd>
      </button>
      <!-- ... 其他地磚 ... -->
    </div>
  </div>

  <!-- ... 其他分類 ... -->
</div>
```

### 4.2 CSS 樣式規格

```css
/* 分類區塊 */
.category-section {
  margin-bottom: 8px;
  background: var(--ui-panel);
  border: 1px solid var(--ui-border);
  border-radius: 4px;
}

/* 分類標題（可點擊折疊） */
.category-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  background: var(--ui-border);
  transition: background 0.2s;
}

.category-header:hover {
  background: var(--ui-border-light);
}

.category-icon {
  font-size: 16px;
  margin-right: 8px;
}

.category-name {
  flex: 1;
  font-weight: bold;
  color: var(--ui-text);
}

.collapse-btn {
  background: none;
  border: none;
  color: var(--ui-text-dim);
  cursor: pointer;
  transition: transform 0.2s;
}

.category-section.collapsed .collapse-btn {
  transform: rotate(-90deg); /* ▼ → ▶ */
}

/* 地磚網格 */
.category-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
  transition: max-height 0.3s, opacity 0.3s;
}

.category-section.collapsed .category-tiles {
  max-height: 0;
  opacity: 0;
  padding: 0;
  overflow: hidden;
}

/* 快捷鍵提示（新增） */
.tile-hotkey {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #ffd700;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 2px;
  font-family: monospace;
}

/* 地磚按鈕（沿用原樣式） */
.tile-btn {
  position: relative; /* 為 hotkey 定位 */
  /* ... 原樣式 ... */
}
```

### 4.3 互動行為

| 動作 | 行為 |
|------|------|
| **點擊分類標題** | 折疊/展開該分類 |
| **點擊地磚按鈕** | 選中地磚，切換為畫筆工具 |
| **按下快捷鍵** | 直接選中對應地磚 + 畫筆工具 |
| **Hover 地磚** | 顯示完整名稱 + 快捷鍵提示 |
| **右鍵地磚** | 快速切換為橡皮擦（可選） |

---

## 五、實作細節

### 5.1 初始化流程

```javascript
/**
 * 初始化分類工具欄
 * 檔案: js/editor/editor-ui.js
 */
DK.EditorUI = {
  init() {
    this.renderCategoryToolbar(); // 替換 renderTilePalette
    this.setupCategoryEvents();
    this.setupHotkeys();
  },

  renderCategoryToolbar() {
    const container = document.getElementById('categoryToolbar');
    if (!container) return;

    container.innerHTML = '';

    // 遍歷所有分類
    Object.values(DK.TOOL_CATEGORIES).forEach(category => {
      const section = this.createCategorySection(category);
      container.appendChild(section);
    });

    // 預設展開基礎地形和房間設施
    this.expandCategory('terrain');
    this.expandCategory('rooms');
  },

  createCategorySection(category) {
    const section = document.createElement('div');
    section.className = 'category-section';
    section.dataset.category = category.id;
    if (category.collapsed) section.classList.add('collapsed');

    // 標題
    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
      <span class="category-icon">${category.icon}</span>
      <span class="category-name">${category.name}</span>
      <button class="collapse-btn" aria-label="折疊/展開">▼</button>
    `;
    header.addEventListener('click', () => this.toggleCategory(category.id));

    // 地磚網格
    const tilesGrid = document.createElement('div');
    tilesGrid.className = 'category-tiles';

    if (category.tiles.length === 0) {
      // 陷阱系統（空白提示）
      const hint = document.createElement('div');
      hint.className = 'category-hint';
      hint.textContent = '陷阱在遊戲中使用金幣購買放置';
      tilesGrid.appendChild(hint);
    } else {
      // 渲染地磚按鈕
      category.tiles.forEach(tile => {
        const btn = this.createTileButton(tile);
        tilesGrid.appendChild(btn);
      });
    }

    section.appendChild(header);
    section.appendChild(tilesGrid);
    return section;
  },

  createTileButton(tile) {
    const btn = document.createElement('button');
    btn.className = 'tile-btn';
    btn.dataset.tile = tile.id;
    btn.title = `${tile.name} (快捷鍵: ${tile.key})`;

    // Canvas 預覽（沿用原邏輯）
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    canvas.className = 'tile-preview';
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    if (DK.Editor && DK.Editor.renderTile) {
      ctx.save();
      ctx.scale(2, 2);
      DK.Editor.renderTile.call(DK.Editor, ctx, tile.id, 0, 0);
      ctx.restore();
    }

    btn.appendChild(canvas);

    // 名稱和符號
    const label = document.createElement('div');
    label.className = 'tile-label';
    label.innerHTML = `<strong>${tile.id}</strong><br><small>${tile.name}</small>`;
    btn.appendChild(label);

    // 快捷鍵提示
    if (tile.key) {
      const hotkey = document.createElement('kbd');
      hotkey.className = 'tile-hotkey';
      hotkey.textContent = tile.key;
      btn.appendChild(hotkey);
    }

    // 點擊事件
    btn.addEventListener('click', () => {
      DK.Editor.selectedTile = tile.id;
      DK.Editor.selectedTool = 'paint';
      this.updateTileSelection();
      if (DK.EditorTools) DK.EditorTools.updateToolButtons();
    });

    return btn;
  },

  toggleCategory(categoryId) {
    const section = document.querySelector(`.category-section[data-category="${categoryId}"]`);
    if (section) {
      section.classList.toggle('collapsed');
    }
  },

  expandCategory(categoryId) {
    const section = document.querySelector(`.category-section[data-category="${categoryId}"]`);
    if (section) {
      section.classList.remove('collapsed');
    }
  },

  updateTileSelection() {
    document.querySelectorAll('.tile-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tile === DK.Editor.selectedTile);
    });
  },

  setupHotkeys() {
    // 建立快捷鍵映射表
    const hotkeyMap = {};
    Object.values(DK.TOOL_CATEGORIES).forEach(category => {
      category.tiles.forEach(tile => {
        if (tile.key) {
          hotkeyMap[tile.key.toLowerCase()] = tile.id;
        }
      });
    });

    // 監聽鍵盤事件（只在編輯器模式下）
    document.addEventListener('keydown', (e) => {
      if (!DK.Editor || !DK.Editor.isActive) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (hotkeyMap[key]) {
        e.preventDefault();
        DK.Editor.selectedTile = hotkeyMap[key];
        DK.Editor.selectedTool = 'paint';
        this.updateTileSelection();
        if (DK.EditorTools) DK.EditorTools.updateToolButtons();
      }
    });
  }
};
```

### 5.2 後續優化建議

**階段 2（v1.1）**：
- **搜尋功能**：輸入框篩選地磚（模糊搜尋名稱/ID）
- **最近使用**：快速存取面板（最近 5 個地磚）
- **自訂分類**：允許用戶自訂快捷鍵和分類

**階段 3（v1.2）**：
- **預設套組**：「迷宮」「房間」「裝飾」快速套用
- **圖層系統**：地形層 / 物件層 / 裝飾層分離
- **批次操作**：多選地磚 → 隨機填充

---

## 六、測試檢查清單

### 6.1 功能測試

- [ ] 所有分類可正常折疊/展開
- [ ] 點擊地磚可正確選中
- [ ] 快捷鍵可正常觸發（1-5, Q-Z）
- [ ] 真實地磚預覽正確渲染
- [ ] 預設展開「基礎地形」和「房間設施」
- [ ] 陷阱系統顯示提示訊息

### 6.2 UI/UX 測試

- [ ] 分類圖標清晰易辨識
- [ ] Hover 提示顯示正確
- [ ] 快捷鍵標籤位置不遮擋預覽
- [ ] 滾動條在地磚過多時正常工作
- [ ] 折疊動畫流暢（300ms transition）

### 6.3 效能測試

- [ ] 渲染 18+ 地磚無明顯卡頓
- [ ] Canvas 預覽快取機制正常
- [ ] 快捷鍵響應延遲 < 50ms

### 6.4 相容性測試

- [ ] Chrome / Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] 觸控裝置（平板編輯器模式）

---

## 七、風格指南與注意事項

### 7.1 命名慣例

| 元素 | 命名格式 | 範例 |
|------|----------|------|
| 分類 ID | 小寫英文 | `terrain`, `rooms`, `decorations` |
| 地磚 ID | 單字元大寫 | `W`, `H`, `E` |
| CSS 類別 | kebab-case | `.category-section`, `.tile-btn` |
| 快捷鍵 | 單字元（大小寫不敏感） | `1`, `Q`, `w` |

### 7.2 可及性（Accessibility）

- **鍵盤導航**：Tab 鍵切換地磚，Enter 選中
- **ARIA 標籤**：`aria-label` 用於折疊按鈕
- **顏色對比**：快捷鍵標籤（金色 #ffd700）在深色背景上符合 WCAG AA

### 7.3 效能考量

- **Canvas 快取**：地磚預覽僅渲染一次，存入 `tileCache`
- **Lazy Rendering**：折疊的分類不渲染 Canvas（節省記憶體）
- **事件委派**：使用 `.category-toolbar` 統一監聽點擊事件

---

## 八、總結

### 8.1 核心改進

| 項目 | 改進前 | 改進後 |
|------|--------|--------|
| **地磚組織** | 18 種平鋪 | 6 大分類 |
| **查找效率** | 逐一掃描 | 分類 + 快捷鍵 |
| **螢幕空間** | 固定展開 | 可折疊面板 |
| **新手友善** | 無引導 | 圖標 + 描述 |

### 8.2 設計亮點

1. **符合工作流程**：基礎地形（最常用）→ 房間設施（核心）→ 裝飾物件（最後調整）
2. **快捷鍵記憶性**：左手操作區 + 字母助記（Q=Heart, W=Warp, T=waTer）
3. **未來擴充性**：新增地磚只需加入對應分類，無需改動架構

### 8.3 下一步行動

1. **實作程式碼**：整合至 `js/editor/editor-ui.js`
2. **樣式整合**：更新 `editor.html` 的 CSS
3. **使用者測試**：邀請 3-5 位用戶測試工作流程
4. **迭代優化**：收集反饋，實作 v1.1 搜尋功能

---

## 附錄 A：完整快捷鍵表

```
【數字鍵】基礎地形
1 - 牆壁 (W)
2 - 地板 (.)
3 - 外圍 (O)
4 - 路障 (B)
5 - 深淵 (A)

【字母鍵】功能/裝飾
Q - 地心 (H)
W - 傳送門 (E)
E - 門 (D)
R - 火把 (T)
T - 水潭 (P)
Y - 草叢 (G)
F - 寶箱 (C)
G - 火盆 (F)
C - 骸骨 (S)
V - 石柱 (L)
X - 符文 (U)
Z - 水晶 (X)
```

---

**設計完成日期**: 2026-02-10
**審核狀態**: ✅ 待 Team Lead 審核
**預估實作時間**: 4-6 小時（含測試）
