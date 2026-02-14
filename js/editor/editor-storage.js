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

    // 5. 設置頁面卸載時清理
    this.setupCleanup();
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

      return true;
    } catch (e) {
      if (DK.ErrorHandler) DK.ErrorHandler.log('error', '儲存失敗: ' + e.message);
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

      return true;
    } catch (e) {
      if (DK.ErrorHandler) DK.ErrorHandler.log('error', '載入草稿失敗: ' + e.message);
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
      if (DK.ErrorHandler) DK.ErrorHandler.log('error', '更新草稿列表失敗: ' + e.message);
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
   * 測試前驗證（更嚴格的規則）
   * @returns {valid: boolean, errors: string[], warnings: string[]}
   */
  validateForTesting(level) {
    const errors = [];
    const warnings = [];

    // 1. 基礎驗證（重用 validate 函式）
    const basicValidation = this.validate(level);
    if (!basicValidation.valid) {
      errors.push(...basicValidation.errors);
    }

    // 2. 傳送門檢查
    if (!level.portals || level.portals.length === 0) {
      errors.push('至少需要一個傳送門才能產生敵人');
    } else {
      // 檢查所有傳送門都有波次配置
      const portalsWithoutWaves = level.portals.filter(p => !p.waves || p.waves.length === 0);
      if (portalsWithoutWaves.length > 0) {
        errors.push(`有 ${portalsWithoutWaves.length} 個傳送門沒有配置波次`);
      }

      // 檢查所有波次都有敵人
      level.portals.forEach((portal, portalIndex) => {
        if (portal.waves) {
          portal.waves.forEach((wave, waveIndex) => {
            if (!wave.enemies || wave.enemies.length === 0) {
              errors.push(`傳送門 ${portalIndex + 1} 的波次 ${waveIndex + 1} 沒有敵人配置`);
            } else {
              // 檢查敵人配置完整性
              wave.enemies.forEach((enemy, enemyIndex) => {
                if (!enemy.type) {
                  errors.push(`傳送門 ${portalIndex + 1} 波次 ${waveIndex + 1} 敵人 ${enemyIndex + 1} 缺少類型`);
                }
                if (!enemy.count || enemy.count <= 0) {
                  errors.push(`傳送門 ${portalIndex + 1} 波次 ${waveIndex + 1} 敵人 ${enemyIndex + 1} 數量必須大於 0`);
                }
              });
            }
          });
        }
      });

      // 統計總敵人數（警告檢查）
      const totalEnemies = level.portals.reduce((sum, p) => {
        return sum + (p.waves || []).reduce((wSum, w) => {
          return wSum + (w.enemies || []).reduce((eSum, e) => eSum + (e.count || 0), 0);
        }, 0);
      }, 0);

      if (totalEnemies === 0) {
        errors.push('關卡沒有任何敵人');
      } else if (totalEnemies < 5) {
        warnings.push('敵人數量過少（少於 5 個），關卡可能太簡單');
      } else if (totalEnemies > 200) {
        warnings.push('敵人數量過多（超過 200 個），可能影響效能');
      }
    }

    // 3. 路徑檢查（檢查地心周圍至少有一個可達的地板）
    if (level.layout) {
      const layoutStr = level.layout.join('');
      const heartCount = (layoutStr.match(/H/g) || []).length;
      if (heartCount === 0) {
        errors.push('缺少地心 (H)');
      } else if (heartCount > 4) {
        errors.push('地心格子數量異常（H 格應為 2x2 = 4 格）');
      }
    }

    // 4. 地圖尺寸檢查
    if (level.layout) {
      const rows = level.layout.length;
      const cols = level.layout[0].length;

      if (rows < 10 || cols < 10) {
        warnings.push('地圖尺寸過小，建議至少 10x10');
      } else if (rows > 50 || cols > 50) {
        warnings.push('地圖尺寸過大（超過 50x50），可能影響效能');
      }
    }

    // 5. 起始金幣與難度平衡警告
    if (level.startingGold && level.portals) {
      const totalWaves = level.portals.reduce((sum, p) => sum + (p.waves?.length || 0), 0);
      const avgGoldPerWave = level.startingGold / Math.max(1, totalWaves);

      if (avgGoldPerWave < 50) {
        warnings.push('起始金幣相對於波次數量偏少，難度可能過高');
      } else if (avgGoldPerWave > 500) {
        warnings.push('起始金幣相對於波次數量過多，難度可能過低');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
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
    // 先清除舊的 interval（防止重複呼叫造成多個 timer）
    this.stopAutoSave();

    this.autoSaveInterval = setInterval(() => {
      if (DK.Editor.isDirty) {
        this.save();
      }
    }, this.autoSaveDelay);
  },

  /**
   * 停止自動儲存
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  },

  /**
   * 設置清理機制（頁面卸載時）
   */
  setupCleanup() {
    window.addEventListener('beforeunload', () => {
      this.stopAutoSave();
    });
  }
};
