# 關卡編輯器存儲系統設計文檔

**版本：** 1.0.0
**日期：** 2026-02-10
**設計者：** backend-designer-1 (Claude Sonnet 4.5)
**專案：** ProjectDK - Dungeon Keep 地層塔防

---

## 目錄

1. [系統架構概覽](#1-系統架構概覽)
2. [數據結構定義](#2-數據結構定義)
3. [API 設計](#3-api-設計)
4. [數據驗證規則](#4-數據驗證規則)
5. [錯誤處理策略](#5-錯誤處理策略)
6. [與 DK.LEVELS 的相容性](#6-與-dklevels-的相容性)
7. [使用範例](#7-使用範例)
8. [localStorage 容量管理](#8-localstorage-容量管理)
9. [實作優先級](#9-實作優先級)
10. [安全性考量](#10-安全性考量)

---

## 1. 系統架構概覽

### 1.1 核心功能

```
┌─────────────────────────────────────────┐
│     關卡編輯器存儲系統 (LevelStorage)    │
├─────────────────────────────────────────┤
│ 1. 自動存儲 (localStorage)              │
│ 2. 手動存儲 (保存草稿)                   │
│ 3. JSON 匯出 (下載檔案)                  │
│ 4. JSON 匯入 (上傳檔案)                  │
│ 5. 數據驗證與錯誤處理                     │
│ 6. 與 DK.LEVELS 格式相容                 │
└─────────────────────────────────────────┘
```

### 1.2 localStorage Key 命名規範

```javascript
// 命名規範：dk_editor_<功能>_<描述>
const STORAGE_KEYS = {
  // 當前編輯中的關卡（自動存儲）
  CURRENT_DRAFT: 'dk_editor_draft_current',

  // 保存的草稿列表（多個草稿）
  DRAFTS_LIST: 'dk_editor_drafts_list',

  // 編輯器設定
  EDITOR_CONFIG: 'dk_editor_config',

  // 測試關卡（傳遞給遊戲）
  TEST_LEVEL: 'dk_test_level',

  // 最後修改時間戳
  LAST_MODIFIED: 'dk_editor_last_modified',
};
```

---

## 2. 數據結構定義

### 2.1 關卡數據格式（與 DK.LEVELS 相容）

```javascript
// 完整關卡數據結構
const LevelDataSchema = {
  // === 基本資訊 ===
  id: Number | null,                    // 關卡 ID（null 表示新建）
  name: String,                         // 關卡名稱
  description: String,                  // 關卡描述

  // === 地圖配置 ===
  layout: Array<String>,                // 20x13 字串陣列（每行 20 字元）
                                        // 'O'=出界, 'W'=牆壁, '.'=可挖掘地面
                                        // 'B'=路障, 'H'=地心, 'P'=水坑, 'G'=油坑

  // === 波次配置 ===
  waves: Array<{
    enemies: Array<{
      type: String,                     // 'GOBLIN', 'SKELETON', 'ORC', 'TROLL', 'DARK_KNIGHT'
      count: Number,                    // 敵人數量
    }>,
  }>,

  // === 遊戲配置 ===
  startingGold: Number,                 // 起始金幣
  dungeonHeartHP: Number,               // 地心血量

  // === 傳送門配置（選用） ===
  portals: Array<{
    x: Number,                          // 格子座標
    y: Number,
  }> | null,

  // === 教學配置（選用） ===
  tutorial: {
    steps: Array<{
      id: String,
      trigger: String,
      message: String,
      highlight: Object | null,
      nextTrigger: String,
      condition: Object | null,
      autoDelay: Number | null,
    }>,
  } | null,

  // === 元數據（編輯器專用） ===
  metadata: {
    version: String,                    // 編輯器版本（如 '1.0.0'）
    createdAt: Number,                  // Unix 時間戳
    modifiedAt: Number,                 // Unix 時間戳
    author: String | null,              // 作者名稱
    tags: Array<String>,                // 標籤（如 ['簡單', '水元素']）
  },
};
```

### 2.2 草稿列表數據結構

```javascript
// 多個草稿的元數據列表（存儲在 DRAFTS_LIST）
const DraftsListSchema = {
  drafts: Array<{
    id: String,                         // UUID
    name: String,                       // 草稿名稱
    thumbnail: String | null,           // base64 縮圖（選用）
    modifiedAt: Number,                 // 最後修改時間
    levelId: Number | null,             // 關卡 ID（null=新建）
  }>,
  maxDrafts: Number,                    // 最多保存草稿數（預設 10）
};
```

### 2.3 數據格式範例

```json
{
  "id": 1,
  "name": "水坑戰術",
  "description": "掌握水元素與電擊陷阱的協同作戰",
  "layout": [
    "OOOOOOOOOOOOOOOOOOOO",
    "OWWWWWWWBBWWWWWWWWWO",
    "OW........WW......WO",
    "OW........WW......WO",
    "OW........WW......WO",
    "OW........WW......WO",
    "OW........WW......WO",
    "OW..PP....WW......WO",
    "OW..PP............WO",
    "OW................WO",
    "OW..............HHWO",
    "OWWWWWWWWWWWWWWWWWWO",
    "OOOOOOOOOOOOOOOOOOOO"
  ],
  "waves": [
    {
      "enemies": [
        { "type": "GOBLIN", "count": 5 }
      ]
    },
    {
      "enemies": [
        { "type": "GOBLIN", "count": 6 },
        { "type": "SKELETON", "count": 2 }
      ]
    }
  ],
  "startingGold": 1200,
  "dungeonHeartHP": 60,
  "portals": [
    { "x": 8, "y": 1 },
    { "x": 9, "y": 1 }
  ],
  "tutorial": null,
  "metadata": {
    "version": "1.0.0",
    "createdAt": 1707552000000,
    "modifiedAt": 1707638400000,
    "author": "GameDesigner",
    "tags": ["簡單", "水元素", "教學關卡"]
  }
}
```

---

## 3. API 設計

### 3.1 核心 API

```javascript
window.DK = window.DK || {};

DK.LevelStorage = {
  // ===== 初始化 =====

  /**
   * 初始化存儲系統
   * @param {Object} options - 配置選項
   * @param {Number} options.autoSaveInterval - 自動存儲間隔（毫秒，預設 30000）
   * @param {Number} options.maxDrafts - 最多草稿數（預設 10）
   * @returns {Boolean} 是否成功初始化
   */
  init(options = {}) {
    this.autoSaveInterval = options.autoSaveInterval || 30000;
    this.maxDrafts = options.maxDrafts || 10;
    this.autoSaveTimer = null;

    // 檢查 localStorage 是否可用
    if (!this.isStorageAvailable()) {
      console.error('localStorage 不可用');
      return false;
    }

    console.log('LevelStorage 初始化成功');
    return true;
  },

  // ===== 自動存儲 =====

  /**
   * 開始自動存儲（每 30 秒存一次）
   */
  startAutoSave() {
    if (this.autoSaveTimer) {
      this.stopAutoSave();
    }

    this.autoSaveTimer = setInterval(() => {
      console.log('執行自動存儲...');
      // 由編輯器提供當前關卡數據
      if (window.DK.LevelEditor && typeof window.DK.LevelEditor.getCurrentLevelData === 'function') {
        const levelData = window.DK.LevelEditor.getCurrentLevelData();
        this.autoSave(levelData);
      }
    }, this.autoSaveInterval);

    console.log(`自動存儲已啟動（間隔 ${this.autoSaveInterval}ms）`);
  },

  /**
   * 停止自動存儲
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('自動存儲已停止');
    }
  },

  /**
   * 立即執行自動存儲
   * @param {Object} levelData - 關卡數據
   * @returns {Boolean} 是否成功
   */
  autoSave(levelData) {
    try {
      // 更新最後修改時間
      if (!levelData.metadata) {
        levelData.metadata = {};
      }
      levelData.metadata.modifiedAt = Date.now();

      const jsonString = JSON.stringify(levelData);
      localStorage.setItem('dk_editor_draft_current', jsonString);
      localStorage.setItem('dk_editor_last_modified', Date.now().toString());

      console.log('自動存儲成功');
      return true;
    } catch (error) {
      console.error('自動存儲失敗：', error);

      // 處理容量已滿錯誤
      if (error.name === 'QuotaExceededError') {
        this.showQuotaWarning();
      }

      return false;
    }
  },

  /**
   * 載入自動存儲的草稿
   * @returns {Object | null} 關卡數據（null 表示沒有草稿）
   */
  loadAutoSave() {
    try {
      const jsonString = localStorage.getItem('dk_editor_draft_current');
      if (!jsonString) {
        console.log('沒有自動存儲的草稿');
        return null;
      }

      const levelData = JSON.parse(jsonString);
      console.log('載入自動存儲的草稿成功');
      return levelData;
    } catch (error) {
      console.error('載入自動存儲的草稿失敗：', error);
      return null;
    }
  },

  // ===== 草稿管理 =====

  /**
   * 保存為命名草稿
   * @param {String} name - 草稿名稱
   * @param {Object} levelData - 關卡數據
   * @returns {Object} { success: Boolean, draftId: String, error: String }
   */
  saveDraft(name, levelData) {
    try {
      // 驗證數據
      const validation = this.validate(levelData);
      if (!validation.valid) {
        return {
          success: false,
          draftId: null,
          error: `數據驗證失敗：${validation.errors.join(', ')}`,
        };
      }

      // 生成草稿 ID
      const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 更新元數據
      if (!levelData.metadata) {
        levelData.metadata = {};
      }
      levelData.metadata.modifiedAt = Date.now();

      // 載入草稿列表
      const draftsList = this.listDrafts();

      // 檢查草稿數量上限
      if (draftsList.length >= this.maxDrafts) {
        return {
          success: false,
          draftId: null,
          error: `草稿數量已達上限（${this.maxDrafts}），請刪除舊草稿`,
        };
      }

      // 保存草稿數據
      const key = `dk_editor_draft_${draftId}`;
      localStorage.setItem(key, JSON.stringify(levelData));

      // 更新草稿列表
      draftsList.push({
        id: draftId,
        name: name,
        thumbnail: null,
        modifiedAt: Date.now(),
        levelId: levelData.id,
      });

      localStorage.setItem('dk_editor_drafts_list', JSON.stringify(draftsList));

      console.log(`草稿「${name}」保存成功（ID: ${draftId}）`);
      return { success: true, draftId, error: null };
    } catch (error) {
      console.error('保存草稿失敗：', error);
      return {
        success: false,
        draftId: null,
        error: error.message,
      };
    }
  },

  /**
   * 載入指定草稿
   * @param {String} draftId - 草稿 ID
   * @returns {Object | null} 關卡數據
   */
  loadDraft(draftId) {
    try {
      const key = `dk_editor_draft_${draftId}`;
      const jsonString = localStorage.getItem(key);

      if (!jsonString) {
        console.error(`草稿不存在（ID: ${draftId}）`);
        return null;
      }

      const levelData = JSON.parse(jsonString);
      console.log(`草稿載入成功（ID: ${draftId}）`);
      return levelData;
    } catch (error) {
      console.error('載入草稿失敗：', error);
      return null;
    }
  },

  /**
   * 刪除草稿
   * @param {String} draftId - 草稿 ID
   * @returns {Boolean} 是否成功
   */
  deleteDraft(draftId) {
    try {
      // 刪除草稿數據
      const key = `dk_editor_draft_${draftId}`;
      localStorage.removeItem(key);

      // 更新草稿列表
      const draftsList = this.listDrafts();
      const updatedList = draftsList.filter(d => d.id !== draftId);
      localStorage.setItem('dk_editor_drafts_list', JSON.stringify(updatedList));

      console.log(`草稿刪除成功（ID: ${draftId}）`);
      return true;
    } catch (error) {
      console.error('刪除草稿失敗：', error);
      return false;
    }
  },

  /**
   * 獲取所有草稿列表
   * @returns {Array<Object>} 草稿元數據陣列
   */
  listDrafts() {
    try {
      const jsonString = localStorage.getItem('dk_editor_drafts_list');
      if (!jsonString) {
        return [];
      }

      const draftsList = JSON.parse(jsonString);
      return draftsList;
    } catch (error) {
      console.error('載入草稿列表失敗：', error);
      return [];
    }
  },

  // ===== JSON 匯出/匯入 =====

  /**
   * 匯出為 JSON 檔案（觸發下載）
   * @param {Object} levelData - 關卡數據
   * @param {String} filename - 檔案名稱（預設 'level_<id>.json'）
   * @returns {Object} { success: Boolean, error: String }
   */
  exportJSON(levelData, filename) {
    try {
      // 驗證數據
      const validation = this.validate(levelData);
      if (!validation.valid) {
        return {
          success: false,
          error: `數據驗證失敗：${validation.errors.join(', ')}`,
        };
      }

      // 生成預設檔案名稱
      if (!filename) {
        const levelName = levelData.name || 'untitled';
        const timestamp = Date.now();
        filename = `level_${levelName}_${timestamp}.json`;
      }

      // 確保副檔名是 .json
      if (!filename.endsWith('.json')) {
        filename += '.json';
      }

      // 格式化 JSON（美化輸出）
      const jsonString = JSON.stringify(levelData, null, 2);

      // 建立 Blob
      const blob = new Blob([jsonString], { type: 'application/json' });

      // 建立下載連結
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;

      // 觸發下載
      document.body.appendChild(a);
      a.click();

      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`匯出 JSON 成功：${filename}`);
      return { success: true, error: null };
    } catch (error) {
      console.error('匯出 JSON 失敗：', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * 匯入 JSON 檔案
   * @param {File} file - 檔案物件
   * @param {Function} callback - 回調函數 (error, levelData)
   */
  importJSON(file, callback) {
    // 驗證檔案大小（最大 1 MB）
    if (file.size > 1024 * 1024) {
      callback('檔案大小超過 1 MB', null);
      return;
    }

    // 驗證檔案類型
    if (!file.name.endsWith('.json')) {
      callback('只能匯入 .json 檔案', null);
      return;
    }

    // 讀取檔案
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonString = e.target.result;
        const parseResult = this.parseJSON(jsonString);

        if (!parseResult.valid) {
          callback(`JSON 驗證失敗：${parseResult.errors.join(', ')}`, null);
          return;
        }

        console.log(`匯入 JSON 成功：${file.name}`);
        callback(null, parseResult.data);
      } catch (error) {
        callback(`讀取檔案失敗：${error.message}`, null);
      }
    };

    reader.onerror = () => {
      callback('檔案讀取錯誤', null);
    };

    reader.readAsText(file);
  },

  /**
   * 從 JSON 字串解析關卡數據
   * @param {String} jsonString - JSON 字串
   * @returns {Object} { valid: Boolean, data: Object, errors: Array<String> }
   */
  parseJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      // 檢查危險鍵名（防止 prototype pollution）
      if (!this._isValidJSON(data)) {
        return {
          valid: false,
          data: null,
          errors: ['JSON 包含危險鍵名（__proto__, constructor, prototype）'],
        };
      }

      // 驗證數據結構
      const validation = this.validate(data);

      return {
        valid: validation.valid,
        data: validation.valid ? data : null,
        errors: validation.errors,
      };
    } catch (error) {
      return {
        valid: false,
        data: null,
        errors: [`JSON 解析失敗：${error.message}`],
      };
    }
  },

  // ===== 數據驗證 =====

  /**
   * 驗證關卡數據是否符合規範
   * @param {Object} levelData - 關卡數據
   * @returns {Object} { valid: Boolean, errors: Array<String> }
   */
  validate(levelData) {
    const errors = [];

    // 驗證基本欄位
    if (!levelData.name || typeof levelData.name !== 'string') {
      errors.push('name 欄位必須是字串');
    } else if (levelData.name.length < 1 || levelData.name.length > 50) {
      errors.push('name 長度必須在 1-50 字元之間');
    }

    if (!levelData.description || typeof levelData.description !== 'string') {
      errors.push('description 欄位必須是字串');
    } else if (levelData.description.length > 200) {
      errors.push('description 長度不能超過 200 字元');
    }

    // 驗證 layout
    const layoutValidation = this.validateLayout(levelData.layout);
    if (!layoutValidation.valid) {
      errors.push(...layoutValidation.errors);
    }

    // 驗證 waves
    const wavesValidation = this.validateWaves(levelData.waves);
    if (!wavesValidation.valid) {
      errors.push(...wavesValidation.errors);
    }

    // 驗證遊戲配置
    if (typeof levelData.startingGold !== 'number' || levelData.startingGold < 0 || levelData.startingGold > 10000) {
      errors.push('startingGold 必須是 0-10000 之間的數字');
    }

    if (typeof levelData.dungeonHeartHP !== 'number' || levelData.dungeonHeartHP < 10 || levelData.dungeonHeartHP > 1000) {
      errors.push('dungeonHeartHP 必須是 10-1000 之間的數字');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },

  /**
   * 驗證地圖 layout 是否合法
   * @param {Array<String>} layout - layout 陣列
   * @returns {Object} { valid: Boolean, errors: Array<String> }
   */
  validateLayout(layout) {
    const errors = [];

    // 檢查是否是陣列
    if (!Array.isArray(layout)) {
      errors.push('layout 必須是陣列');
      return { valid: false, errors };
    }

    // 檢查行數（必須 13 行）
    if (layout.length !== 13) {
      errors.push(`layout 必須有 13 行（當前有 ${layout.length} 行）`);
    }

    // 合法字元
    const validChars = ['O', 'W', '.', 'B', 'H', 'P', 'G'];
    const validCharsSet = new Set(validChars);

    // 檢查每一行
    let dungeonHeartCount = 0;
    let portalCount = 0;

    for (let i = 0; i < layout.length; i++) {
      const row = layout[i];

      // 檢查是否是字串
      if (typeof row !== 'string') {
        errors.push(`layout[${i}] 必須是字串`);
        continue;
      }

      // 檢查列數（必須 20 字元）
      if (row.length !== 20) {
        errors.push(`layout[${i}] 必須有 20 字元（當前有 ${row.length} 字元）`);
      }

      // 檢查字元是否合法
      for (let j = 0; j < row.length; j++) {
        const char = row[j];
        if (!validCharsSet.has(char)) {
          errors.push(`layout[${i}][${j}] 包含非法字元 '${char}'`);
        }

        // 統計地心與傳送門
        if (char === 'H') dungeonHeartCount++;
        if (char === 'B') portalCount++;
      }

      // 檢查邊界（第一行與最後一行必須全是 'O'）
      if (i === 0 || i === layout.length - 1) {
        if (!row.split('').every(c => c === 'O')) {
          errors.push(`layout[${i}] 邊界必須全是出界區域（O）`);
        }
      } else {
        // 檢查左右邊界
        if (row[0] !== 'O') {
          errors.push(`layout[${i}] 左邊界必須是出界區域（O）`);
        }
        if (row[row.length - 1] !== 'O') {
          errors.push(`layout[${i}] 右邊界必須是出界區域（O）`);
        }
      }
    }

    // 檢查地心數量（必須 2 個）
    if (dungeonHeartCount !== 2) {
      errors.push(`layout 必須有 2 個地心（H），當前有 ${dungeonHeartCount} 個`);
    }

    // 檢查傳送門數量（至少 1 個）
    if (portalCount < 1) {
      errors.push('layout 必須至少有 1 個傳送門（B）');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },

  /**
   * 驗證波次配置是否合法
   * @param {Array<Object>} waves - waves 陣列
   * @returns {Object} { valid: Boolean, errors: Array<String> }
   */
  validateWaves(waves) {
    const errors = [];

    // 檢查是否是陣列
    if (!Array.isArray(waves)) {
      errors.push('waves 必須是陣列');
      return { valid: false, errors };
    }

    // 檢查波次數量（1-10 波）
    if (waves.length < 1) {
      errors.push('waves 至少需要 1 波');
    }
    if (waves.length > 10) {
      errors.push('waves 最多 10 波');
    }

    // 合法敵人類型
    const validEnemyTypes = ['GOBLIN', 'SKELETON', 'ORC', 'TROLL', 'DARK_KNIGHT'];
    const validEnemyTypesSet = new Set(validEnemyTypes);

    // 檢查每一波
    for (let i = 0; i < waves.length; i++) {
      const wave = waves[i];

      // 檢查 enemies 欄位
      if (!wave.enemies || !Array.isArray(wave.enemies)) {
        errors.push(`waves[${i}].enemies 必須是陣列`);
        continue;
      }

      if (wave.enemies.length === 0) {
        errors.push(`waves[${i}].enemies 不能是空陣列`);
      }

      let totalCount = 0;

      // 檢查每個敵人
      for (let j = 0; j < wave.enemies.length; j++) {
        const enemy = wave.enemies[j];

        // 檢查 type
        if (!enemy.type || !validEnemyTypesSet.has(enemy.type)) {
          errors.push(`waves[${i}].enemies[${j}].type 無效（必須是 ${validEnemyTypes.join(', ')}）`);
        }

        // 檢查 count
        if (typeof enemy.count !== 'number' || enemy.count < 1 || enemy.count > 50) {
          errors.push(`waves[${i}].enemies[${j}].count 必須是 1-50 之間的數字`);
        }

        totalCount += enemy.count || 0;
      }

      // 檢查單波總數（最多 100 隻）
      if (totalCount > 100) {
        errors.push(`waves[${i}] 敵人總數超過 100（當前 ${totalCount}）`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },

  // ===== 測試關卡傳遞 =====

  /**
   * 保存測試關卡（給遊戲讀取）
   * @param {Object} levelData - 關卡數據
   * @returns {Boolean} 是否成功
   */
  saveTestLevel(levelData) {
    try {
      const jsonString = JSON.stringify(levelData);
      localStorage.setItem('dk_test_level', jsonString);
      console.log('測試關卡已保存');
      return true;
    } catch (error) {
      console.error('保存測試關卡失敗：', error);
      return false;
    }
  },

  /**
   * 清除測試關卡
   */
  clearTestLevel() {
    try {
      localStorage.removeItem('dk_test_level');
      console.log('測試關卡已清除');
    } catch (error) {
      console.error('清除測試關卡失敗：', error);
    }
  },

  // ===== 工具函式 =====

  /**
   * 檢查 localStorage 是否可用
   * @returns {Boolean}
   */
  isStorageAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * 檢查 localStorage 使用量
   * @returns {Object} { used: Number, available: Number, percentage: Number }
   */
  checkQuota() {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (key.startsWith('dk_editor_')) {
          used += localStorage[key].length;
        }
      }

      // 假設 localStorage 容量為 5 MB
      const available = 5 * 1024 * 1024;
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch (error) {
      return { used: 0, available: 0, percentage: 0 };
    }
  },

  /**
   * 顯示容量警告
   */
  showQuotaWarning() {
    const quota = this.checkQuota();
    console.warn(`localStorage 使用量已達 ${quota.percentage.toFixed(1)}%`);

    if (quota.percentage > 90) {
      alert('儲存空間即將用盡，請刪除舊草稿或匯出為 JSON 檔案！');
    } else if (quota.percentage > 80) {
      console.warn('儲存空間使用量已超過 80%，建議清理舊草稿');
    }
  },

  /**
   * 刪除最舊的草稿（當容量不足時）
   */
  deleteOldestDraft() {
    const drafts = this.listDrafts();
    if (drafts.length === 0) return false;

    // 按修改時間排序
    drafts.sort((a, b) => a.modifiedAt - b.modifiedAt);

    // 刪除最舊的草稿
    const oldest = drafts[0];
    this.deleteDraft(oldest.id);
    console.log(`已刪除最舊的草稿：${oldest.name}`);

    return true;
  },

  /**
   * 清除所有編輯器數據（危險操作！）
   * @param {Boolean} confirm - 確認參數
   * @returns {Boolean}
   */
  clearAll(confirm = false) {
    if (!confirm) {
      console.error('必須明確確認才能清除所有數據（傳入 confirm: true）');
      return false;
    }

    try {
      // 清除所有 dk_editor_ 開頭的 key
      const keysToRemove = [];
      for (let key in localStorage) {
        if (key.startsWith('dk_editor_')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log(`已清除 ${keysToRemove.length} 個編輯器數據`);
      return true;
    } catch (error) {
      console.error('清除數據失敗：', error);
      return false;
    }
  },

  // ===== 內部工具函式 =====

  /**
   * 檢查 JSON 是否包含危險鍵名
   * @private
   */
  _isValidJSON(obj) {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    function checkKeys(obj) {
      if (typeof obj !== 'object' || obj === null) return true;

      for (let key in obj) {
        if (dangerousKeys.includes(key)) return false;
        if (!checkKeys(obj[key])) return false;
      }
      return true;
    }

    return checkKeys(obj);
  },

  /**
   * 清理使用者輸入（防止 XSS）
   * @private
   */
  _sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },
};
```

---

## 4. 數據驗證規則

### 4.1 Layout 驗證規則

```javascript
const LayoutValidationRules = {
  // 基本格式
  rowCount: 13,                         // 必須 13 行
  colCount: 20,                         // 每行 20 字元

  // 合法字元
  validChars: ['O', 'W', '.', 'B', 'H', 'P', 'G'],

  // 必須元素
  required: {
    dungeonHeart: { char: 'H', min: 2, max: 2 },  // 必須有 2 個 'H'（地心）
    portal: { char: 'B', min: 1 },                 // 至少 1 個 'B'（傳送門）
  },

  // 邊界檢查
  border: {
    top: 'O',                           // 頂部必須全是 'O'
    bottom: 'O',                        // 底部必須全是 'O'
    left: 'O',                          // 左側必須全是 'O'
    right: 'O',                         // 右側必須全是 'O'
  },
};
```

### 4.2 Waves 驗證規則

```javascript
const WavesValidationRules = {
  // 基本格式
  minWaves: 1,                          // 至少 1 波
  maxWaves: 10,                         // 最多 10 波

  // 敵人類型
  validEnemyTypes: ['GOBLIN', 'SKELETON', 'ORC', 'TROLL', 'DARK_KNIGHT'],

  // 敵人數量
  enemyCount: {
    min: 1,                             // 每種敵人至少 1 隻
    max: 50,                            // 每種敵人最多 50 隻
    totalMax: 100,                      // 每波總數最多 100 隻
  },
};
```

### 4.3 基本配置驗證規則

```javascript
const ConfigValidationRules = {
  name: {
    minLength: 1,
    maxLength: 50,
  },
  description: {
    minLength: 0,
    maxLength: 200,
  },
  startingGold: {
    min: 0,
    max: 10000,
  },
  dungeonHeartHP: {
    min: 10,
    max: 1000,
  },
};
```

---

## 5. 錯誤處理策略

### 5.1 localStorage 錯誤類型

```javascript
const StorageErrors = {
  QUOTA_EXCEEDED: 'localStorage 容量已滿',
  NOT_AVAILABLE: 'localStorage 不可用（無痕模式或已禁用）',
  SECURITY_ERROR: 'localStorage 訪問被阻止（安全策略）',
  IO_ERROR: 'localStorage 讀寫錯誤',
  JSON_PARSE_ERROR: 'JSON 解析失敗',
  VALIDATION_ERROR: '數據驗證失敗',
};
```

### 5.2 錯誤處理流程

```javascript
const ErrorHandling = {
  QUOTA_EXCEEDED: {
    action: 'showQuotaWarning',         // 顯示容量警告
    fallback: 'deleteOldestDraft',      // 刪除最舊的草稿
    notify: true,                       // 通知使用者
  },
  NOT_AVAILABLE: {
    action: 'disableAutoSave',          // 禁用自動存儲
    fallback: 'useMemoryOnly',          // 僅使用記憶體
    notify: true,
  },
  JSON_PARSE_ERROR: {
    action: 'showParseError',           // 顯示解析錯誤詳情
    fallback: 'discardInvalidData',     // 丟棄無效數據
    notify: true,
  },
  VALIDATION_ERROR: {
    action: 'showValidationErrors',     // 顯示驗證錯誤列表
    fallback: 'allowManualFix',         // 允許手動修正
    notify: true,
  },
};
```

### 5.3 檔案驗證

```javascript
const FileValidation = {
  maxSize: 1024 * 1024,                 // 1 MB
  allowedExtensions: ['.json'],
  allowedMimeTypes: ['application/json', 'text/plain'],
};

const FileErrors = {
  FILE_TOO_LARGE: '檔案大小超過 1 MB',
  INVALID_EXTENSION: '只能匯入 .json 檔案',
  INVALID_MIME_TYPE: '檔案類型不正確',
  READ_ERROR: '檔案讀取失敗',
};
```

---

## 6. 與 DK.LEVELS 的相容性

### 6.1 從 DK.LEVELS 載入關卡

```javascript
/**
 * 從 DK.LEVELS 載入現有關卡到編輯器
 * @param {Number} levelId - 關卡 ID（1-5）
 * @returns {Object | null} 關卡數據
 */
DK.LevelStorage.loadFromLevels = function(levelId) {
  const level = DK.LEVELS.find(l => l.id === levelId);
  if (!level) {
    console.error(`找不到關卡 ID: ${levelId}`);
    return null;
  }

  // 處理 'original' 標記
  const levelData = {
    ...level,
    metadata: {
      version: '1.0.0',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      author: null,
      tags: [],
      source: 'DK.LEVELS',              // 標記來源
    },
  };

  // 如果是 'original'，從原始配置載入
  if (level.layout === 'original') {
    // 假設有 DK.MapUtils.getOriginalLayout() 方法
    if (typeof DK.MapUtils !== 'undefined' && typeof DK.MapUtils.getOriginalLayout === 'function') {
      levelData.layout = DK.MapUtils.getOriginalLayout();
    } else {
      console.error('無法載入 original layout');
      return null;
    }
  }

  if (level.waves === 'original') {
    if (typeof DK.WAVES !== 'undefined') {
      levelData.waves = JSON.parse(JSON.stringify(DK.WAVES));
    } else {
      console.error('無法載入 original waves');
      return null;
    }
  }

  console.log(`已從 DK.LEVELS 載入關卡 ${levelId}`);
  return levelData;
};
```

### 6.2 匯出為 DK.LEVELS 格式

```javascript
/**
 * 匯出為 DK.LEVELS 格式（可直接貼到 levels.js）
 * @param {Object} levelData - 關卡數據
 * @returns {String} JavaScript 程式碼
 */
DK.LevelStorage.exportToDKFormat = function(levelData) {
  // 移除 metadata（編輯器專用欄位）
  const { metadata, ...cleanData } = levelData;

  // 格式化為 JavaScript 程式碼
  const layoutCode = JSON.stringify(cleanData.layout, null, 6);
  const wavesCode = JSON.stringify(cleanData.waves, null, 6);
  const tutorialCode = cleanData.tutorial ? JSON.stringify(cleanData.tutorial, null, 6) : null;

  const code = `
  // ${cleanData.name}
  {
    id: ${cleanData.id || 'null'},
    name: '${cleanData.name}',
    description: '${cleanData.description}',

    layout: ${layoutCode},

    waves: ${wavesCode},

    startingGold: ${cleanData.startingGold},
    dungeonHeartHP: ${cleanData.dungeonHeartHP},

    ${tutorialCode ? `tutorial: ${tutorialCode},` : ''}
  },
  `.trim();

  return code;
};
```

---

## 7. 使用範例

### 7.1 初始化與自動存儲

```javascript
// main.js 初始化
DK.LevelEditor = {
  init() {
    // 初始化存儲系統
    DK.LevelStorage.init({
      autoSaveInterval: 30000,          // 30 秒自動存儲
      maxDrafts: 10,                    // 最多 10 個草稿
    });

    // 開始自動存儲
    DK.LevelStorage.startAutoSave();

    // 嘗試載入自動存儲的草稿
    const draft = DK.LevelStorage.loadAutoSave();
    if (draft) {
      console.log('已載入自動存儲的草稿');
      this.loadLevel(draft);
    } else {
      console.log('沒有草稿，載入空白關卡');
      this.loadLevel(this.createEmptyLevel());
    }
  },

  // 每次修改時呼叫
  onLevelModified() {
    const levelData = this.getCurrentLevelData();
    DK.LevelStorage.autoSave(levelData);
  },

  // 獲取當前編輯的關卡數據
  getCurrentLevelData() {
    return {
      id: this.currentLevelId,
      name: this.levelName,
      description: this.levelDescription,
      layout: this.layout,
      waves: this.waves,
      startingGold: this.startingGold,
      dungeonHeartHP: this.dungeonHeartHP,
      portals: this.portals,
      tutorial: this.tutorial,
      metadata: {
        version: '1.0.0',
        createdAt: this.createdAt || Date.now(),
        modifiedAt: Date.now(),
        author: this.author || null,
        tags: this.tags || [],
      },
    };
  },
};
```

### 7.2 保存與載入草稿

```javascript
// UI 按鈕事件
document.getElementById('save-draft-btn').addEventListener('click', () => {
  const name = prompt('請輸入草稿名稱：');
  if (!name) return;

  const levelData = DK.LevelEditor.getCurrentLevelData();
  const result = DK.LevelStorage.saveDraft(name, levelData);

  if (result.success) {
    alert(`草稿「${name}」已保存！`);
    updateDraftsList();  // 更新草稿列表 UI
  } else {
    alert(`保存失敗：${result.error}`);
  }
});

// 載入草稿
function loadDraft(draftId) {
  const levelData = DK.LevelStorage.loadDraft(draftId);
  if (levelData) {
    DK.LevelEditor.loadLevel(levelData);
    console.log('已載入草稿');
  } else {
    alert('載入草稿失敗！');
  }
}

// 刪除草稿
function deleteDraft(draftId) {
  if (!confirm('確定要刪除此草稿？')) return;

  const success = DK.LevelStorage.deleteDraft(draftId);
  if (success) {
    console.log('草稿已刪除');
    updateDraftsList();  // 更新草稿列表 UI
  } else {
    alert('刪除草稿失敗！');
  }
}

// 更新草稿列表 UI
function updateDraftsList() {
  const drafts = DK.LevelStorage.listDrafts();
  const container = document.getElementById('drafts-list');

  if (drafts.length === 0) {
    container.innerHTML = '<p>沒有保存的草稿</p>';
    return;
  }

  const listHTML = drafts.map(draft => `
    <div class="draft-item">
      <h3>${draft.name}</h3>
      <p>修改時間：${new Date(draft.modifiedAt).toLocaleString()}</p>
      <button onclick="loadDraft('${draft.id}')">載入</button>
      <button onclick="deleteDraft('${draft.id}')">刪除</button>
    </div>
  `).join('');

  container.innerHTML = listHTML;
}
```

### 7.3 JSON 匯出/匯入

```javascript
// 匯出 JSON
document.getElementById('export-json-btn').addEventListener('click', () => {
  const levelData = DK.LevelEditor.getCurrentLevelData();
  const filename = `level_${levelData.name}_${Date.now()}.json`;

  const result = DK.LevelStorage.exportJSON(levelData, filename);
  if (result.success) {
    console.log('匯出成功！');
  } else {
    alert(`匯出失敗：${result.error}`);
  }
});

// 匯入 JSON
document.getElementById('import-json-btn').addEventListener('click', () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    DK.LevelStorage.importJSON(file, (error, levelData) => {
      if (error) {
        alert(`匯入失敗：${error}`);
        return;
      }

      // 驗證數據
      const validation = DK.LevelStorage.validate(levelData);
      if (!validation.valid) {
        alert(`數據驗證失敗：\n${validation.errors.join('\n')}`);
        return;
      }

      // 載入關卡
      DK.LevelEditor.loadLevel(levelData);
      console.log('匯入成功！');
    });
  };

  fileInput.click();
});
```

### 7.4 測試關卡

```javascript
// 編輯器頁面：保存測試關卡並跳轉
document.getElementById('test-level-btn').addEventListener('click', () => {
  const levelData = DK.LevelEditor.getCurrentLevelData();

  // 驗證數據
  const validation = DK.LevelStorage.validate(levelData);
  if (!validation.valid) {
    alert(`關卡數據有誤：\n${validation.errors.join('\n')}`);
    return;
  }

  // 保存測試關卡
  const success = DK.LevelStorage.saveTestLevel(levelData);
  if (success) {
    // 跳轉到遊戲頁面（新分頁）
    window.open('/game.html?test=1', '_blank');
  } else {
    alert('保存測試關卡失敗！');
  }
});

// 遊戲頁面：載入測試關卡
// game.html 的 main.js
if (window.location.search.includes('test=1')) {
  const testLevel = localStorage.getItem('dk_test_level');
  if (testLevel) {
    try {
      const levelData = JSON.parse(testLevel);

      // 假設有 DK.LevelManager.loadCustomLevel() 方法
      if (typeof DK.LevelManager !== 'undefined' && typeof DK.LevelManager.loadCustomLevel === 'function') {
        DK.LevelManager.loadCustomLevel(levelData);
        console.log('已載入測試關卡');
      }
    } catch (error) {
      console.error('載入測試關卡失敗：', error);
    }
  }
}
```

---

## 8. localStorage 容量管理

### 8.1 容量監控

```javascript
// 定期檢查容量
setInterval(() => {
  DK.LevelStorage.showQuotaWarning();
}, 60000);  // 每 60 秒檢查一次

// 手動檢查容量
function checkStorageUsage() {
  const quota = DK.LevelStorage.checkQuota();

  console.log(`localStorage 使用量：`);
  console.log(`- 已使用：${(quota.used / 1024).toFixed(2)} KB`);
  console.log(`- 總容量：${(quota.available / 1024).toFixed(2)} KB`);
  console.log(`- 使用率：${quota.percentage.toFixed(1)}%`);

  // 在 UI 顯示
  const indicator = document.getElementById('storage-indicator');
  if (indicator) {
    indicator.textContent = `儲存空間：${quota.percentage.toFixed(1)}%`;

    // 根據使用率改變顏色
    if (quota.percentage > 90) {
      indicator.style.color = 'red';
    } else if (quota.percentage > 80) {
      indicator.style.color = 'orange';
    } else {
      indicator.style.color = 'green';
    }
  }
}
```

### 8.2 自動清理

```javascript
// 當容量超過 90% 時，自動刪除最舊的草稿
DK.LevelStorage._autoCleanup = function() {
  const quota = this.checkQuota();

  if (quota.percentage > 90) {
    console.warn('儲存空間不足，嘗試自動清理...');

    const deleted = this.deleteOldestDraft();
    if (deleted) {
      console.log('已刪除最舊的草稿');

      // 遞迴檢查（可能需要刪除多個）
      const newQuota = this.checkQuota();
      if (newQuota.percentage > 90) {
        this._autoCleanup();
      }
    } else {
      console.error('無法清理儲存空間（沒有草稿可刪除）');
    }
  }
};

// 在保存時檢查容量
DK.LevelStorage.saveDraft = function(name, levelData) {
  // 先檢查容量
  this._autoCleanup();

  // 原有的保存邏輯...
  // ...
};
```

---

## 9. 實作優先級

### Phase 1: 核心功能（必須立即實作）

1. ✅ **localStorage 讀寫封裝**
   - `init()`, `isStorageAvailable()`, `autoSave()`, `loadAutoSave()`

2. ✅ **數據驗證**
   - `validate()`, `validateLayout()`, `validateWaves()`

3. ✅ **自動存儲**
   - `startAutoSave()`, `stopAutoSave()`

4. ✅ **JSON 匯出/匯入**
   - `exportJSON()`, `importJSON()`, `parseJSON()`

5. ✅ **測試關卡傳遞**
   - `saveTestLevel()`, `clearTestLevel()`

**優先級：CRITICAL**
**預估工時：4-6 小時**

### Phase 2: 草稿管理（重要功能）

6. ✅ **保存/載入命名草稿**
   - `saveDraft()`, `loadDraft()`

7. ✅ **草稿列表**
   - `listDrafts()`

8. ✅ **草稿刪除**
   - `deleteDraft()`

**優先級：HIGH**
**預估工時：2-3 小時**

### Phase 3: 進階功能（優化）

9. ⭕ **容量監控與警告**
   - `checkQuota()`, `showQuotaWarning()`

10. ⭕ **自動清理舊草稿**
    - `deleteOldestDraft()`, `_autoCleanup()`

11. ⭕ **匯出為 DK.LEVELS 格式**
    - `exportToDKFormat()`

12. ⭕ **從 DK.LEVELS 載入**
    - `loadFromLevels()`

**優先級：MEDIUM**
**預估工時：2-3 小時**

---

## 10. 安全性考量

### 10.1 XSS 防護

```javascript
// 清理使用者輸入（防止 XSS）
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// 在保存前清理
DK.LevelStorage.saveDraft = function(name, levelData) {
  // 清理使用者輸入
  levelData.name = sanitizeInput(levelData.name);
  levelData.description = sanitizeInput(levelData.description);

  // 原有的保存邏輯...
  // ...
};
```

### 10.2 JSON 注入防護

```javascript
// 驗證 JSON 結構（防止 prototype pollution）
function isValidJSON(obj) {
  // 禁止 __proto__, constructor, prototype
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

  function checkKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return true;

    for (let key in obj) {
      if (dangerousKeys.includes(key)) {
        console.error(`發現危險鍵名：${key}`);
        return false;
      }
      if (!checkKeys(obj[key])) return false;
    }
    return true;
  }

  return checkKeys(obj);
}

// 在解析 JSON 後驗證
DK.LevelStorage.parseJSON = function(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (!isValidJSON(data)) {
      return {
        valid: false,
        data: null,
        errors: ['JSON 包含危險鍵名（__proto__, constructor, prototype）'],
      };
    }

    return this.validate(data);
  } catch (error) {
    return {
      valid: false,
      data: null,
      errors: [`JSON 解析失敗：${error.message}`],
    };
  }
};
```

### 10.3 CORS 與 CSP

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
">
```

---

## 11. 總結

此存儲系統設計涵蓋：

✅ **自動存儲** - 防止意外關閉導致數據丟失
✅ **草稿管理** - 支援多個草稿保存/載入
✅ **JSON 匯出/匯入** - 方便分享與備份
✅ **數據驗證** - 確保關卡數據合法
✅ **錯誤處理** - 完善的錯誤處理策略
✅ **容量管理** - 監控與自動清理
✅ **安全性** - XSS 與 JSON 注入防護
✅ **相容性** - 與 DK.LEVELS 格式完全相容

### 實作建議

1. **先實作 Phase 1**（核心功能），確保基本存儲與驗證功能正常運作
2. **再實作 Phase 2**（草稿管理），讓使用者可以保存多個版本
3. **最後實作 Phase 3**（進階功能），優化使用體驗

### 整合建議

- 與 `LevelEditor.js` 整合時，確保編輯器提供 `getCurrentLevelData()` 方法
- 與 `DK.LevelManager` 整合時，確保遊戲端可以載入測試關卡
- UI 設計時，考慮在編輯器頂部顯示自動存儲狀態與容量指示器

---

**文檔版本：** 1.0.0
**最後更新：** 2026-02-10
**維護者：** ProjectDK Team
