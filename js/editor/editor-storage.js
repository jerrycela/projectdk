/**
 * ProjectDK 關卡編輯器 - 存儲系統
 * 職責：localStorage 儲存/載入、JSON 匯出/匯入、自動儲存、驗證
 */

DK.EditorStorage = {
  // === localStorage Keys ===
  KEYS: {
    DRAFT_CURRENT: 'dk_editor_draft_current',
    DRAFTS_LIST: 'dk_editor_drafts_list',
    CONFIG: 'dk_editor_config'
  },

  // === 自動儲存 ===
  autoSaveInterval: null,
  autoSaveDelay: 30000, // 30 秒

  /**
   * 初始化存儲系統
   */
  init() {
    console.log('💾 初始化存儲系統...');

    // 1. 檢查 localStorage 可用性
    if (!this.isStorageAvailable()) {
      alert('⚠️ localStorage 不可用，無法儲存關卡');
      return;
    }

    // 2. 載入上次的草稿（如果有）
    this.loadDraft();

    // 3. 啟動自動儲存
    this.startAutoSave();

    // 4. 設置匯入按鈕
    this.setupImportButton();

    console.log('✅ 存儲系統初始化完成');
  },

  /**
   * 檢查 localStorage 可用性
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * 儲存當前關卡
   */
  save() {
    try {
      const level = this.getCurrentLevelData();

      // 驗證關卡
      const validation = this.validate(level);
      if (!validation.valid) {
        alert(`❌ 關卡驗證失敗：\n${validation.errors.join('\n')}`);
        return false;
      }

      // 儲存到 localStorage
      localStorage.setItem(this.KEYS.DRAFT_CURRENT, JSON.stringify(level));

      // 更新草稿列表
      this.updateDraftsList(level);

      console.log('✅ 關卡已儲存');
      return true;
    } catch (e) {
      console.error('❌ 儲存失敗:', e);
      alert(`❌ 儲存失敗：${e.message}`);
      return false;
    }
  },

  /**
   * 載入草稿
   */
  loadDraft() {
    try {
      const data = localStorage.getItem(this.KEYS.DRAFT_CURRENT);
      if (!data) {
        console.log('無儲存的草稿');
        return false;
      }

      const level = JSON.parse(data);

      // 驗證資料
      const validation = this.validate(level);
      if (!validation.valid) {
        console.warn('草稿資料不完整，使用預設關卡');
        return false;
      }

      // 載入到編輯器
      DK.Editor.currentLevel = level;
      DK.Editor.layout = [...level.layout];
      DK.Editor.cols = level.layout[0].length;
      DK.Editor.rows = level.layout.length;

      // 更新 UI
      document.getElementById('inputLevelName').value = level.name || '新關卡';
      document.getElementById('inputGold').value = level.startingGold || 1000;
      document.getElementById('inputHeartHP').value = level.dungeonHeartHP || 100;
      document.getElementById('levelName').textContent = level.name || '新關卡';

      console.log('✅ 草稿已載入');
      return true;
    } catch (e) {
      console.error('❌ 載入草稿失敗:', e);
      return false;
    }
  },

  /**
   * 取得當前關卡資料
   */
  getCurrentLevelData() {
    return {
      id: DK.Editor.currentLevel.id || null,
      name: DK.Editor.currentLevel.name || '新關卡',
      description: '',
      layout: [...DK.Editor.layout],
      portals: DK.Editor.currentLevel.portals || [],
      startingGold: DK.Editor.currentLevel.startingGold || 1000,
      dungeonHeartHP: DK.Editor.currentLevel.dungeonHeartHP || 100,
      metadata: {
        version: '1.0',
        createdAt: DK.Editor.currentLevel.metadata?.createdAt || Date.now(),
        modifiedAt: Date.now(),
        author: DK.Editor.currentLevel.metadata?.author || '',
        tags: DK.Editor.currentLevel.metadata?.tags || []
      }
    };
  },

  /**
   * 更新草稿列表
   */
  updateDraftsList(level) {
    try {
      let drafts = [];
      const data = localStorage.getItem(this.KEYS.DRAFTS_LIST);
      if (data) {
        drafts = JSON.parse(data);
      }

      // 查找是否已存在
      const existingIndex = drafts.findIndex(d => d.id === level.id);

      const draft = {
        id: level.id || `draft-${Date.now()}`,
        name: level.name,
        preview: {
          size: `${level.layout[0].length}x${level.layout.length}`,
          portals: level.portals.length,
          waves: level.portals.reduce((sum, p) => sum + (p.waves?.length || 0), 0)
        },
        modifiedAt: Date.now(),
        sizeKB: new Blob([JSON.stringify(level)]).size / 1024
      };

      if (existingIndex >= 0) {
        drafts[existingIndex] = draft;
      } else {
        drafts.push(draft);
      }

      // 限制草稿數量（最多 20 個）
      if (drafts.length > 20) {
        drafts.shift();
      }

      localStorage.setItem(this.KEYS.DRAFTS_LIST, JSON.stringify(drafts));
    } catch (e) {
      console.error('❌ 更新草稿列表失敗:', e);
    }
  },

  /**
   * 驗證關卡資料
   */
  validate(level) {
    const errors = [];

    // 必要欄位
    if (!level.name) errors.push('關卡名稱不可為空');
    if (!level.layout || level.layout.length === 0) errors.push('缺少 layout');

    // Layout 驗證
    if (level.layout) {
      // 檢查每行長度一致
      const cols = level.layout[0].length;
      for (let i = 0; i < level.layout.length; i++) {
        if (level.layout[i].length !== cols) {
          errors.push(`第 ${i} 行長度不一致（應為 ${cols}，實際 ${level.layout[i].length}）`);
        }
      }

      // 檢查必要元素
      const layoutStr = level.layout.join('');
      if (!layoutStr.includes('H')) errors.push('缺少地心 (H)');
    }

    // 參數範圍
    if (level.startingGold < 100 || level.startingGold > 9999) {
      errors.push('起始金幣必須在 100-9999 之間');
    }

    if (level.dungeonHeartHP < 50 || level.dungeonHeartHP > 500) {
      errors.push('地心生命值必須在 50-500 之間');
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * 匯出 JSON
   */
  exportJSON() {
    try {
      const level = this.getCurrentLevelData();

      // 驗證
      const validation = this.validate(level);
      if (!validation.valid) {
        alert(`❌ 無法匯出：\n${validation.errors.join('\n')}`);
        return;
      }

      // 生成 JSON
      const json = JSON.stringify(level, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // 下載
      const a = document.createElement('a');
      a.href = url;
      a.download = `${level.name || 'level'}.json`;
      a.click();

      URL.revokeObjectURL(url);

      console.log('✅ JSON 已匯出');
      alert('✅ JSON 已匯出成功');
    } catch (e) {
      console.error('❌ 匯出失敗:', e);
      alert(`❌ 匯出失敗：${e.message}`);
    }
  },

  /**
   * 設置匯入按鈕
   */
  setupImportButton() {
    const btnImport = document.getElementById('btnImport');
    if (!btnImport) return;

    btnImport.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = event.target.result;
            const level = JSON.parse(json);

            // 驗證
            const validation = this.validate(level);
            if (!validation.valid) {
              alert(`❌ 匯入失敗：\n${validation.errors.join('\n')}`);
              return;
            }

            // 載入到編輯器
            DK.Editor.currentLevel = level;
            DK.Editor.layout = [...level.layout];
            DK.Editor.cols = level.layout[0].length;
            DK.Editor.rows = level.layout.length;

            // 更新 UI
            document.getElementById('inputLevelName').value = level.name || '新關卡';
            document.getElementById('inputGold').value = level.startingGold || 1000;
            document.getElementById('inputHeartHP').value = level.dungeonHeartHP || 100;
            document.getElementById('levelName').textContent = level.name || '新關卡';

            DK.Editor.markDirty();

            alert('✅ 關卡已匯入成功');
          } catch (err) {
            alert(`❌ 匯入失敗：${err.message}`);
          }
        };

        reader.readAsText(file);
      });

      input.click();
    });
  },

  /**
   * 啟動自動儲存
   */
  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      if (DK.Editor.isDirty) {
        console.log('🔄 自動儲存中...');
        this.save();
      }
    }, this.autoSaveDelay);

    console.log(`✅ 自動儲存已啟動（每 ${this.autoSaveDelay / 1000} 秒）`);
  },

  /**
   * 停止自動儲存
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('⏸️ 自動儲存已停止');
    }
  }
};
