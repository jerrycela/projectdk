/**
 * ProjectDK 關卡編輯器 - 傳送門編輯器
 * 職責：傳送門放置、刪除、路徑驗證、列表管理
 */

DK.EditorPortal = {
  /**
   * HTML 跳脫函式（防止 XSS）
   */
  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // === 選中的傳送門 ===
  selectedPortalId: null,

  /**
   * 初始化傳送門系統
   */
  init() {

    // 確保 currentLevel 有 portals 陣列
    if (!DK.Editor.currentLevel.portals) {
      DK.Editor.currentLevel.portals = [];
    }

    // 設置新增傳送門按鈕
    this.setupAddPortalButton();

    // 渲染傳送門列表
    this.renderPortalList();

  },

  /**
   * 設置新增傳送門按鈕
   */
  setupAddPortalButton() {
    const btn = document.getElementById('btnAddPortal');
    if (btn) {
      btn.disabled = false;
      btn.addEventListener('click', () => {
        this.promptAddPortal();
      });
    }
  },

  /**
   * 提示新增傳送門
   */
  promptAddPortal() {
    const msg = '請在地圖上點擊要放置傳送門的位置\n\n提示：\n- 傳送門必須放在地板 (.) 或外圍 (O) 上\n- 傳送門到地心必須有可達路徑';
    alert(msg);

    // 設置模式為傳送門放置
    DK.Editor.mode = 'portals';
    DK.Editor.selectedTool = 'portal-place';

    // 更新狀態列
    const statusTool = document.getElementById('statusTool');
    if (statusTool) {
      statusTool.textContent = '當前工具: 放置傳送門（點擊地圖）';
    }
  },

  /**
   * 嘗試在指定位置放置傳送門（2×2 物件）
   */
  placePortal(col, row) {
    // 1. 檢查 2×2 區域有效性
    const validation = this.validatePortalSlot2x2(col, row);
    if (!validation.valid) {
      alert(`❌ 無法放置傳送門：\n${validation.errors.join('\n')}`);
      return false;
    }

    // 2. 檢查路徑可達性（從左上角檢查）
    const pathValid = this.validatePortalPath(col, row);
    if (!pathValid) {
      const confirm = window.confirm('⚠️ 此位置到地心沒有可達路徑！\n\n確定要放置嗎？（可能導致關卡無法通關）');
      if (!confirm) return false;
    }

    // 3. 生成唯一 ID
    const id = `portal-${Date.now()}`;

    // 4. 創建傳送門資料
    const portal = {
      id: id,
      col: col,
      row: row,
      type: 'entrance', // 'entrance' | 'exit'
      waves: [
        {
          enemies: [
            { type: 'GOBLIN', count: 5, interval: 500, gold: 10 }
          ]
        }
      ]
    };

    // 5. 加入 portals 陣列
    DK.Editor.currentLevel.portals.push(portal);

    // 6. 更新 layout（設置 2×2 區域為 'E'）
    DK.Editor.setTile(col, row, 'E');
    DK.Editor.setTile(col + 1, row, 'E');
    DK.Editor.setTile(col, row + 1, 'E');
    DK.Editor.setTile(col + 1, row + 1, 'E');

    // 7. 重新渲染列表
    this.renderPortalList();

    // 8. 標記為未儲存
    DK.Editor.markDirty();

    // 9. 保存歷史
    if (DK.EditorTools && DK.EditorTools.saveHistory) {
      DK.EditorTools.saveHistory();
    }


    // 10. 恢復編輯模式
    DK.Editor.mode = 'tiles';
    DK.Editor.selectedTool = 'paint';

    const statusTool = document.getElementById('statusTool');
    if (statusTool) {
      statusTool.textContent = `當前工具: 畫筆(${DK.Editor.selectedTile})`;
    }

    return true;
  },

  /**
   * 驗證傳送門位置（單格，向後相容）
   */
  validatePortalSlot(col, row) {
    const errors = [];

    // 邊界檢查
    if (col < 0 || col >= DK.Editor.cols || row < 0 || row >= DK.Editor.rows) {
      errors.push('位置超出地圖範圍');
      return { valid: false, errors };
    }

    // 取得當前地磚
    const tile = DK.Editor.getTile(col, row);

    // 檢查是否為可放置地磚（地板或外圍）
    if (tile !== '.' && tile !== 'O') {
      errors.push(`此位置是 "${tile}"，傳送門只能放在地板 (.) 或外圍 (O) 上`);
    }

    // 檢查是否已有傳送門
    const existingPortal = this.getPortalAt(col, row);
    if (existingPortal) {
      errors.push('此位置已有傳送門');
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * 驗證傳送門 2×2 區域
   */
  validatePortalSlot2x2(col, row) {
    const errors = [];

    // 邊界檢查（2×2 需要檢查右下角是否超出）
    if (col < 0 || col >= DK.Editor.cols - 1 || row < 0 || row >= DK.Editor.rows - 1) {
      errors.push('2×2 傳送門超出地圖範圍');
      return { valid: false, errors };
    }

    // 檢查所有 4 個格子
    for (let dc = 0; dc < 2; dc++) {
      for (let dr = 0; dr < 2; dr++) {
        const c = col + dc;
        const r = row + dr;
        const tile = DK.Editor.getTile(c, r);

        // 必須是地板或外圍
        if (tile !== '.' && tile !== 'O') {
          errors.push(`位置 (${c},${r}) 是 "${tile}"，傳送門只能放在地板 (.) 或外圍 (O) 上`);
        }

        // 檢查是否已有傳送門
        const existingPortal = this.getPortalAt(c, r);
        if (existingPortal) {
          errors.push(`位置 (${c},${r}) 已有傳送門`);
        }

        // 檢查是否有地城之心
        if (tile === 'H') {
          errors.push(`位置 (${c},${r}) 已有地城之心`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * 驗證傳送門路徑（BFS）
   */
  validatePortalPath(col, row) {
    // 臨時修改 layout（將傳送門位置視為路徑）
    const originalTile = DK.Editor.getTile(col, row);
    DK.Editor.setTile(col, row, '.');

    // 檢查路徑可達性（簡化版 BFS）
    const heartPos = this.findHeartPosition();
    if (!heartPos) {
      DK.Editor.setTile(col, row, originalTile);
      return false;
    }

    const reachable = this.isPathReachable(col, row, heartPos.col, heartPos.row);

    // 恢復原始地磚
    DK.Editor.setTile(col, row, originalTile);

    return reachable;
  },

  /**
   * 簡化的 BFS 路徑檢查
   */
  isPathReachable(startCol, startRow, endCol, endRow) {
    const queue = [{col: startCol, row: startRow}];
    const visited = new Set();
    const key = (c, r) => `${c},${r}`;

    while (queue.length > 0) {
      const {col, row} = queue.shift();
      const k = key(col, row);

      // 跳過已訪問
      if (visited.has(k)) continue;
      visited.add(k);

      // 到達終點
      if (col === endCol && row === endRow) return true;

      // 4 方向鄰格
      const neighbors = [
        {col: col + 1, row},
        {col: col - 1, row},
        {col, row: row + 1},
        {col, row: row - 1}
      ];

      for (const n of neighbors) {
        // 邊界檢查
        if (n.col < 0 || n.col >= DK.Editor.cols || n.row < 0 || n.row >= DK.Editor.rows) continue;

        // 檢查是否可行走
        const tile = DK.Editor.getTile(n.col, n.row);
        if (tile === '.' || tile === 'H' || tile === 'P' || tile === 'G') {
          queue.push(n);
        }
      }
    }

    return false;
  },

  /**
   * 尋找地心位置
   */
  findHeartPosition() {
    for (let row = 0; row < DK.Editor.rows; row++) {
      for (let col = 0; col < DK.Editor.cols; col++) {
        if (DK.Editor.getTile(col, row) === 'H') {
          return { col, row };
        }
      }
    }
    return null;
  },

  /**
   * 取得指定位置的傳送門（檢查 2×2 範圍）
   */
  getPortalAt(col, row) {
    return DK.Editor.currentLevel.portals.find(p => {
      // 檢查 (col, row) 是否在傳送門的 2×2 範圍內
      return col >= p.col && col < p.col + 2 &&
             row >= p.row && row < p.row + 2;
    });
  },

  /**
   * 刪除傳送門（2×2 物件）
   */
  deletePortal(portalId) {
    const portal = DK.Editor.currentLevel.portals.find(p => p.id === portalId);
    if (!portal) return;

    if (!confirm(`確定要刪除傳送門 "${portalId}"？\n位置: (${portal.col}, ${portal.row})`)) {
      return;
    }

    // 1. 從陣列移除
    DK.Editor.currentLevel.portals = DK.Editor.currentLevel.portals.filter(p => p.id !== portalId);

    // 2. 清除 layout 中的 2×2 區域 'E'
    DK.Editor.setTile(portal.col, portal.row, '.');
    DK.Editor.setTile(portal.col + 1, portal.row, '.');
    DK.Editor.setTile(portal.col, portal.row + 1, '.');
    DK.Editor.setTile(portal.col + 1, portal.row + 1, '.');

    // 3. 重新渲染列表
    this.renderPortalList();

    // 4. 標記為未儲存
    DK.Editor.markDirty();

    // 5. 保存歷史
    if (DK.EditorTools && DK.EditorTools.saveHistory) {
      DK.EditorTools.saveHistory();
    }

  },

  /**
   * 複製傳送門
   */
  copyPortal(portalId) {
    const portal = DK.Editor.currentLevel.portals.find(p => p.id === portalId);
    if (!portal) return;

    alert('請在地圖上點擊要放置複製傳送門的位置');

    // 設置複製模式
    DK.Editor.mode = 'portals';
    DK.Editor.selectedTool = 'portal-copy';
    this.portalToCopy = portal;

    const statusTool = document.getElementById('statusTool');
    if (statusTool) {
      statusTool.textContent = '當前工具: 複製傳送門（點擊地圖）';
    }
  },

  /**
   * 執行傳送門複製（2×2 物件）
   */
  executeCopyPortal(col, row) {
    if (!this.portalToCopy) return;

    // 驗證 2×2 位置
    const validation = this.validatePortalSlot2x2(col, row);
    if (!validation.valid) {
      alert(`❌ 無法放置傳送門：\n${validation.errors.join('\n')}`);
      return;
    }

    // 創建新傳送門（深拷貝波次配置）
    const newPortal = {
      id: `portal-${Date.now()}`,
      col: col,
      row: row,
      type: this.portalToCopy.type,
      waves: JSON.parse(JSON.stringify(this.portalToCopy.waves))
    };

    DK.Editor.currentLevel.portals.push(newPortal);

    // 放置 2×2 區域
    DK.Editor.setTile(col, row, 'E');
    DK.Editor.setTile(col + 1, row, 'E');
    DK.Editor.setTile(col, row + 1, 'E');
    DK.Editor.setTile(col + 1, row + 1, 'E');

    this.renderPortalList();
    DK.Editor.markDirty();

    if (DK.EditorTools && DK.EditorTools.saveHistory) {
      DK.EditorTools.saveHistory();
    }


    // 恢復編輯模式
    DK.Editor.mode = 'tiles';
    DK.Editor.selectedTool = 'paint';
    this.portalToCopy = null;

    const statusTool = document.getElementById('statusTool');
    if (statusTool) {
      statusTool.textContent = `當前工具: 畫筆(${DK.Editor.selectedTile})`;
    }
  },

  /**
   * 渲染傳送門列表
   */
  renderPortalList() {
    const container = document.getElementById('portalList');
    if (!container) return;

    const portals = DK.Editor.currentLevel.portals;

    if (portals.length === 0) {
      container.innerHTML = '<p style="color: #8a8070; font-size: 13px;">尚無傳送門，請點擊下方按鈕新增</p>';
      return;
    }

    container.innerHTML = '';

    portals.forEach((portal, index) => {
      const item = document.createElement('div');
      item.className = 'portal-item';
      const portalType = portal.type === 'entrance' ? '入口' : '出口';
      const waveCount = portal.waves ? portal.waves.length : 0;
      const totalEnemies = this.countTotalEnemies(portal.waves);
      item.innerHTML = `
        <div class="portal-header">
          <h4>🚪 傳送門 #${index + 1}</h4>
          <span class="portal-coord">(${this.escapeHTML(String(portal.col))}, ${this.escapeHTML(String(portal.row))})</span>
        </div>
        <div class="portal-info">
          <p>類型: ${this.escapeHTML(portalType)}</p>
          <p>波次: ${this.escapeHTML(String(waveCount))} 波</p>
          <p>總敵人: ${this.escapeHTML(String(totalEnemies))}</p>
        </div>
        <div class="portal-actions">
          <button class="btn-edit" data-id="${this.escapeHTML(portal.id)}">✏️ 編輯波次</button>
          <button class="btn-copy" data-id="${this.escapeHTML(portal.id)}">📋 複製</button>
          <button class="btn-delete" data-id="${this.escapeHTML(portal.id)}">🗑️ 刪除</button>
        </div>
      `;

      // 事件監聽
      item.querySelector('.btn-edit').addEventListener('click', () => {
        this.openWaveEditor(portal.id);
      });

      item.querySelector('.btn-copy').addEventListener('click', () => {
        this.copyPortal(portal.id);
      });

      item.querySelector('.btn-delete').addEventListener('click', () => {
        this.deletePortal(portal.id);
      });

      container.appendChild(item);
    });
  },

  /**
   * 計算總敵人數
   */
  countTotalEnemies(waves) {
    if (!waves) return 0;
    return waves.reduce((total, wave) => {
      return total + (wave.enemies || []).reduce((sum, e) => sum + (e.count || 0), 0);
    }, 0);
  },

  /**
   * 開啟波次編輯器
   */
  openWaveEditor(portalId) {
    if (DK.EditorWave && DK.EditorWave.open) {
      DK.EditorWave.open(portalId);
    } else {
      alert('🚧 波次編輯器（editor-wave.js）尚未載入');
    }
  }
};
