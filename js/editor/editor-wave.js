/**
 * ProjectDK 關卡編輯器 - 波次配置 UI
 * 職責：波次編輯 Modal、敵人配置、波次預覽
 */

DK.EditorWave = {
  // === 當前編輯的傳送門 ===
  currentPortalId: null,
  currentPortal: null,

  // === Modal 元素 ===
  modal: null,

  // === 敵人類型定義（簡化版） ===
  enemyTypes: [
    { id: 'GOBLIN', name: '哥布林', defaultGold: 10 },
    { id: 'SKELETON', name: '骷髏', defaultGold: 15 },
    { id: 'ORC', name: '獸人', defaultGold: 20 },
    { id: 'DEMON', name: '惡魔', defaultGold: 30 }
  ],

  /**
   * 初始化波次編輯器
   */
  init() {
    console.log('📊 初始化波次編輯器...');

    // 創建 Modal HTML
    this.createModal();

    console.log('✅ 波次編輯器初始化完成');
  },

  /**
   * 創建 Modal HTML
   */
  createModal() {
    const modal = document.createElement('div');
    modal.id = 'waveEditorModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>📊 編輯傳送門波次配置</h2>
          <button class="modal-close" id="closeWaveModal">✕</button>
        </div>
        <div class="modal-body">
          <div id="waveList"></div>
          <button id="btnAddWave" class="btn-add-wave">+ 新增 Wave</button>
        </div>
        <div class="modal-footer">
          <button id="btnCancelWave">取消</button>
          <button id="btnSaveWave" class="btn-primary">儲存變更</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;

    // 事件監聽
    document.getElementById('closeWaveModal').addEventListener('click', () => this.close());
    document.getElementById('btnCancelWave').addEventListener('click', () => this.close());
    document.getElementById('btnSaveWave').addEventListener('click', () => this.save());
    document.getElementById('btnAddWave').addEventListener('click', () => this.addWave());

    // 點擊外部關閉
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });
  },

  /**
   * 開啟 Modal
   */
  open(portalId) {
    this.currentPortalId = portalId;
    this.currentPortal = DK.Editor.currentLevel.portals.find(p => p.id === portalId);

    if (!this.currentPortal) {
      alert('❌ 找不到傳送門');
      return;
    }

    // 確保有 waves 陣列
    if (!this.currentPortal.waves) {
      this.currentPortal.waves = [];
    }

    // 渲染波次列表
    this.renderWaveList();

    // 顯示 Modal
    this.modal.style.display = 'flex';
  },

  /**
   * 關閉 Modal
   */
  close() {
    this.modal.style.display = 'none';
    this.currentPortalId = null;
    this.currentPortal = null;
  },

  /**
   * 儲存波次配置
   */
  save() {
    // 驗證波次配置
    const validation = this.validateWaves();
    if (!validation.valid) {
      alert(`❌ 波次配置不完整：\n${validation.errors.join('\n')}`);
      return;
    }

    // 更新傳送門資料（已經在 renderWaveList 中即時更新）
    const portal = DK.Editor.currentLevel.portals.find(p => p.id === this.currentPortalId);
    if (portal) {
      portal.waves = this.currentPortal.waves;
    }

    // 標記為未儲存
    DK.Editor.markDirty();

    // 重新渲染傳送門列表
    if (DK.EditorPortal && DK.EditorPortal.renderPortalList) {
      DK.EditorPortal.renderPortalList();
    }

    alert('✅ 波次配置已儲存');
    this.close();
  },

  /**
   * 驗證波次配置
   */
  validateWaves() {
    const errors = [];

    if (!this.currentPortal.waves || this.currentPortal.waves.length === 0) {
      errors.push('至少需要一個波次');
    }

    this.currentPortal.waves.forEach((wave, waveIndex) => {
      if (!wave.enemies || wave.enemies.length === 0) {
        errors.push(`波次 ${waveIndex + 1} 沒有敵人配置`);
      }

      wave.enemies.forEach((enemy, enemyIndex) => {
        if (!enemy.type) {
          errors.push(`波次 ${waveIndex + 1} 敵人 ${enemyIndex + 1} 缺少類型`);
        }
        if (!enemy.count || enemy.count <= 0) {
          errors.push(`波次 ${waveIndex + 1} 敵人 ${enemyIndex + 1} 數量必須大於 0`);
        }
      });
    });

    return { valid: errors.length === 0, errors };
  },

  /**
   * 新增波次
   */
  addWave() {
    this.currentPortal.waves.push({
      enemies: [
        { type: 'GOBLIN', count: 5, interval: 500, gold: 10 }
      ]
    });

    this.renderWaveList();
  },

  /**
   * 刪除波次
   */
  deleteWave(waveIndex) {
    if (!confirm(`確定要刪除波次 ${waveIndex + 1}？`)) return;

    this.currentPortal.waves.splice(waveIndex, 1);
    this.renderWaveList();
  },

  /**
   * 上移波次
   */
  moveWaveUp(waveIndex) {
    if (waveIndex === 0) return;

    const temp = this.currentPortal.waves[waveIndex];
    this.currentPortal.waves[waveIndex] = this.currentPortal.waves[waveIndex - 1];
    this.currentPortal.waves[waveIndex - 1] = temp;

    this.renderWaveList();
  },

  /**
   * 下移波次
   */
  moveWaveDown(waveIndex) {
    if (waveIndex >= this.currentPortal.waves.length - 1) return;

    const temp = this.currentPortal.waves[waveIndex];
    this.currentPortal.waves[waveIndex] = this.currentPortal.waves[waveIndex + 1];
    this.currentPortal.waves[waveIndex + 1] = temp;

    this.renderWaveList();
  },

  /**
   * 新增敵人到波次
   */
  addEnemy(waveIndex) {
    this.currentPortal.waves[waveIndex].enemies.push({
      type: 'GOBLIN',
      count: 5,
      interval: 500,
      gold: 10
    });

    this.renderWaveList();
  },

  /**
   * 刪除敵人
   */
  deleteEnemy(waveIndex, enemyIndex) {
    this.currentPortal.waves[waveIndex].enemies.splice(enemyIndex, 1);

    // 如果沒有敵人了，刪除整個波次
    if (this.currentPortal.waves[waveIndex].enemies.length === 0) {
      this.currentPortal.waves.splice(waveIndex, 1);
    }

    this.renderWaveList();
  },

  /**
   * 渲染波次列表
   */
  renderWaveList() {
    const container = document.getElementById('waveList');
    if (!container) return;

    container.innerHTML = '';

    if (this.currentPortal.waves.length === 0) {
      container.innerHTML = '<p style="color: #8a8070; text-align: center; padding: 20px;">尚無波次配置，請點擊下方按鈕新增</p>';
      return;
    }

    this.currentPortal.waves.forEach((wave, waveIndex) => {
      const waveItem = document.createElement('div');
      waveItem.className = 'wave-item';

      // 波次標題
      const header = document.createElement('div');
      header.className = 'wave-header';
      header.innerHTML = `
        <h3>⚔️ Wave ${waveIndex + 1}</h3>
        <div class="wave-actions">
          <button class="btn-icon" data-action="up" data-index="${waveIndex}" title="上移">↑</button>
          <button class="btn-icon" data-action="down" data-index="${waveIndex}" title="下移">↓</button>
          <button class="btn-icon" data-action="delete" data-index="${waveIndex}" title="刪除">🗑️</button>
        </div>
      `;

      // 敵人列表
      const enemyList = document.createElement('div');
      enemyList.className = 'enemy-list';

      wave.enemies.forEach((enemy, enemyIndex) => {
        const enemyItem = document.createElement('div');
        enemyItem.className = 'enemy-item';
        enemyItem.innerHTML = `
          <select data-wave="${waveIndex}" data-enemy="${enemyIndex}" data-field="type">
            ${this.enemyTypes.map(et => `<option value="${et.id}" ${enemy.type === et.id ? 'selected' : ''}>${et.name}</option>`).join('')}
          </select>
          <input type="number" value="${enemy.count}" min="1" max="100" data-wave="${waveIndex}" data-enemy="${enemyIndex}" data-field="count" placeholder="數量">
          <input type="number" value="${enemy.interval || 500}" min="100" max="5000" step="100" data-wave="${waveIndex}" data-enemy="${enemyIndex}" data-field="interval" placeholder="間隔(ms)">
          <input type="number" value="${enemy.gold || 10}" min="0" max="1000" data-wave="${waveIndex}" data-enemy="${enemyIndex}" data-field="gold" placeholder="獎勵">
          <button class="btn-icon" data-action="delete-enemy" data-wave="${waveIndex}" data-enemy="${enemyIndex}">✕</button>
        `;

        enemyList.appendChild(enemyItem);
      });

      // 新增敵人按鈕
      const addEnemyBtn = document.createElement('button');
      addEnemyBtn.className = 'btn-add-enemy';
      addEnemyBtn.textContent = '+ 新增敵人';
      addEnemyBtn.dataset.wave = waveIndex;
      enemyList.appendChild(addEnemyBtn);

      waveItem.appendChild(header);
      waveItem.appendChild(enemyList);
      container.appendChild(waveItem);
    });

    // 設置事件監聽
    this.setupEventListeners();
  },

  /**
   * 設置事件監聽
   */
  setupEventListeners() {
    const container = document.getElementById('waveList');
    if (!container) return;

    // 波次操作按鈕
    container.querySelectorAll('.wave-actions .btn-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const index = parseInt(e.target.dataset.index);

        if (action === 'up') this.moveWaveUp(index);
        else if (action === 'down') this.moveWaveDown(index);
        else if (action === 'delete') this.deleteWave(index);
      });
    });

    // 敵人配置輸入
    container.querySelectorAll('.enemy-item select, .enemy-item input').forEach(input => {
      input.addEventListener('input', (e) => {
        const waveIndex = parseInt(e.target.dataset.wave);
        const enemyIndex = parseInt(e.target.dataset.enemy);
        const field = e.target.dataset.field;
        let value = e.target.value;

        // 轉換數字類型
        if (field === 'count' || field === 'interval' || field === 'gold') {
          value = parseInt(value) || 0;
        }

        // 更新資料
        this.currentPortal.waves[waveIndex].enemies[enemyIndex][field] = value;
      });
    });

    // 刪除敵人按鈕
    container.querySelectorAll('[data-action="delete-enemy"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const waveIndex = parseInt(e.target.dataset.wave);
        const enemyIndex = parseInt(e.target.dataset.enemy);
        this.deleteEnemy(waveIndex, enemyIndex);
      });
    });

    // 新增敵人按鈕
    container.querySelectorAll('.btn-add-enemy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const waveIndex = parseInt(e.target.dataset.wave);
        this.addEnemy(waveIndex);
      });
    });
  }
};
