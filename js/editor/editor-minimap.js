/**
 * ProjectDK 關卡編輯器 - 小地圖系統
 * 職責：在編輯器右上角顯示整體地圖縮略圖
 */

if (typeof DK === 'undefined') {
  window.DK = {};
}

DK.EditorMinimap = {
  // === 配置 ===
  width: 160,           // 小地圖寬度（40 tiles × 4px）
  height: 104,          // 小地圖高度（26 tiles × 4px）
  tileSize: 4,          // 每個地磚在小地圖上的大小（4px）
  padding: 10,          // 距離右上角的內邊距

  // === Canvas ===
  canvas: null,
  ctx: null,
  x: 0,                 // 小地圖左上角 X 座標（螢幕座標）
  y: 0,                 // 小地圖左上角 Y 座標（螢幕座標）

  // === 快取 ===
  terrainCache: null,   // 地形快取（預渲染的 canvas）
  isDirty: true,        // 是否需要重新渲染快取

  // === 動畫 ===
  pulsePhase: 0,        // 地城之心脈動相位（0-2π）

  /**
   * 初始化小地圖
   */
  init() {
    // 使用現有的 uiCanvas 繪製小地圖
    if (!DK.Editor.uiCanvas) {
      console.error('❌ 找不到 uiCanvas');
      return;
    }

    this.canvas = DK.Editor.uiCanvas;
    this.ctx = DK.Editor.uiCtx;

    // 計算小地圖位置（右上角）
    this.x = this.canvas.width - this.width - this.padding;
    this.y = this.padding;

    // 初始化地形快取
    this.initCache();

    // 設置點擊事件
    this.setupClickHandler();
  },

  /**
   * 設置點擊事件處理
   */
  setupClickHandler() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // 檢查點擊是否在小地圖範圍內
      if (
        clickX >= this.x &&
        clickX <= this.x + this.width &&
        clickY >= this.y &&
        clickY <= this.y + this.height
      ) {
        // 計算點擊的地圖座標（4px/tile）
        const clickCol = Math.floor((clickX - this.x) / this.tileSize);
        const clickRow = Math.floor((clickY - this.y) / this.tileSize);

        // 計算視野大小
        const scale = 4; // Canvas 顯示倍率
        const tileSize = 16; // 原始地磚大小
        const viewportCols = DK.Editor.gameCanvas.width / tileSize / DK.Editor.camera.zoom;
        const viewportRows = DK.Editor.gameCanvas.height / tileSize / DK.Editor.camera.zoom;

        // 移動 camera 到該位置（居中）
        DK.Editor.camera.x = clickCol - viewportCols / 2;
        DK.Editor.camera.y = clickRow - viewportRows / 2;

        // 邊界限制
        DK.Editor.camera.x = Math.max(0, Math.min(DK.Editor.camera.x, DK.Editor.cols - viewportCols));
        DK.Editor.camera.y = Math.max(0, Math.min(DK.Editor.camera.y, DK.Editor.rows - viewportRows));
      }
    });
  },

  /**
   * 初始化地形快取
   */
  initCache() {
    this.terrainCache = document.createElement('canvas');
    this.terrainCache.width = this.width;
    this.terrainCache.height = this.height;
    this.isDirty = true;
  },

  /**
   * 清除快取（地圖變更時呼叫）
   */
  invalidateCache() {
    this.isDirty = true;
  },

  /**
   * 更新地形快取
   */
  updateCache() {
    if (!this.terrainCache) return;

    const ctx = this.terrainCache.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);

    // 繪製地形
    for (let row = 0; row < DK.Editor.rows; row++) {
      for (let col = 0; col < DK.Editor.cols; col++) {
        const tile = DK.Editor.getTile(col, row);
        const x = col * this.tileSize;
        const y = row * this.tileSize;

        ctx.fillStyle = this.getTileColor(tile);
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
      }
    }

    this.isDirty = false;
  },

  /**
   * 取得地磚顏色（縮略圖用）
   */
  getTileColor(tile) {
    switch (tile) {
      case 'W': return '#2d2d44';  // 牆壁（深灰）
      case '.': return '#2e322e';  // 地板（深灰綠色）
      case 'O': return '#1a1828';  // 外圍（黑色）
      case 'H': return '#aa3333';  // 地城之心（紅色）- 會被脈動覆蓋
      case 'E': return '#33aa33';  // 入口傳送門（綠色）
      case 'M': return '#aa3333';  // 出口傳送門（紅色）
      case 'P': return '#2a4a7a';  // 水潭（深藍）
      case 'A': return '#050508';  // 深淵（黑色）
      case 'G': return '#2a5a2a';  // 草叢（綠色）
      case 'B': return '#5a5a6e';  // 路障（灰色）
      case 'D': return '#6a5040';  // 木門（棕色）
      case 'I': return '#5a5a6e';  // 鐵門（灰色）
      case 'Z': return '#aa44ff';  // 魔法門（紫色）
      case 'C': return '#ffd700';  // 寶箱（金色）
      case 'L': return '#4a4a5a';  // 石柱（深灰）
      case 'S': return '#c8b898';  // 骸骨（米色）
      case 'U': return '#8844ff';  // 符文（紫色）
      case 'F': return '#ff6622';  // 火盆（火焰紅）
      case 'X': return '#88ccff';  // 水晶（冰藍）
      default: return '#5e5648';   // 預設地板色
    }
  },

  /**
   * 渲染小地圖
   */
  render() {
    if (!this.ctx) return;

    // 更新脈動動畫
    this.pulsePhase += 0.05;
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase -= Math.PI * 2;
    }

    // 更新快取（如果需要）
    if (this.isDirty) {
      this.updateCache();
    }

    // === 1. 繪製背景 ===
    this.ctx.fillStyle = '#12101e';
    this.ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

    // === 2. 繪製地形快取 ===
    if (this.terrainCache) {
      this.ctx.drawImage(this.terrainCache, this.x, this.y);
    }

    // === 3. 繪製地城之心（脈動動畫）===
    this.renderDungeonHeart();

    // === 4. 繪製傳送門標記 ===
    this.renderPortals();

    // === 5. 繪製視野框 ===
    this.renderViewport();

    // === 6. 繪製邊框 ===
    this.ctx.strokeStyle = '#4a3e6e';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
  },

  /**
   * 渲染地城之心（脈動動畫）
   */
  renderDungeonHeart() {
    // 尋找地城之心位置
    for (let row = 0; row < DK.Editor.rows; row++) {
      for (let col = 0; col < DK.Editor.cols; col++) {
        const tile = DK.Editor.getTile(col, row);
        if (tile === 'H') {
          const x = this.x + col * this.tileSize;
          const y = this.y + row * this.tileSize;

          // 脈動效果（改變不透明度）- 使用快取的三角函式
          const MC = DK.MathCache;
          const pulseSin = MC.sin(this.pulsePhase * 180 / Math.PI); // 弧度轉角度
          const alpha = 0.6 + pulseSin * 0.4;
          this.ctx.fillStyle = `rgba(255, 68, 68, ${alpha})`;
          this.ctx.fillRect(x, y, this.tileSize, this.tileSize);

          // 外圍光暈
          if (pulseSin > 0.5) {
            this.ctx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x - 1, y - 1, this.tileSize + 2, this.tileSize + 2);
          }
        }
      }
    }
  },

  /**
   * 渲染傳送門標記
   */
  renderPortals() {
    // 尋找傳送門位置（只標記 2×2 的左上角）
    const marked = new Set(); // 避免重複標記同一個傳送門

    for (let row = 0; row < DK.Editor.rows - 1; row++) {
      for (let col = 0; col < DK.Editor.cols - 1; col++) {
        const tile = DK.Editor.getTile(col, row);

        // 檢查是否為 2×2 傳送門的左上角
        if ((tile === 'E' || tile === 'M') && !marked.has(`${col},${row}`)) {
          const isValid2x2 =
            DK.Editor.getTile(col + 1, row) === tile &&
            DK.Editor.getTile(col, row + 1) === tile &&
            DK.Editor.getTile(col + 1, row + 1) === tile;

          if (isValid2x2) {
            // 標記四個格子
            marked.add(`${col},${row}`);
            marked.add(`${col + 1},${row}`);
            marked.add(`${col},${row + 1}`);
            marked.add(`${col + 1},${row + 1}`);

            // 繪製標記（使用 2×2 的中心）
            const centerX = this.x + col * this.tileSize + this.tileSize;
            const centerY = this.y + row * this.tileSize + this.tileSize;

            // 入口 = 綠色，出口 = 紅色
            const color = tile === 'E' ? '#44ff44' : '#ff4444';

            // 繪製小圓圈
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
            this.ctx.fill();

            // 繪製外圍邊框
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
              this.x + col * this.tileSize,
              this.y + row * this.tileSize,
              this.tileSize * 2,
              this.tileSize * 2
            );
          }
        }
      }
    }
  },

  /**
   * 渲染視野框（顯示當前編輯器視角）
   */
  renderViewport() {
    const { x: camX, y: camY, zoom } = DK.Editor.camera;
    const scale = 4; // Canvas 顯示倍率
    const tileSize = 16; // 原始地磚大小

    // 計算當前視野的地磚範圍
    const viewportCols = DK.Editor.gameCanvas.width / tileSize / zoom;
    const viewportRows = DK.Editor.gameCanvas.height / tileSize / zoom;

    // 轉換為小地圖座標
    const frameX = this.x + camX * this.tileSize;
    const frameY = this.y + camY * this.tileSize;
    const frameW = viewportCols * this.tileSize;
    const frameH = viewportRows * this.tileSize;

    // 繪製半透明遮罩（視野外的區域）
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';

    // 上方遮罩
    if (frameY > this.y) {
      this.ctx.fillRect(this.x, this.y, this.width, frameY - this.y);
    }
    // 下方遮罩
    if (frameY + frameH < this.y + this.height) {
      this.ctx.fillRect(this.x, frameY + frameH, this.width, this.y + this.height - (frameY + frameH));
    }
    // 左方遮罩
    if (frameX > this.x) {
      this.ctx.fillRect(this.x, frameY, frameX - this.x, frameH);
    }
    // 右方遮罩
    if (frameX + frameW < this.x + this.width) {
      this.ctx.fillRect(frameX + frameW, frameY, this.x + this.width - (frameX + frameW), frameH);
    }

    // 繪製金色視野框
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(frameX, frameY, frameW, frameH);

    // 繪製半透明金色內框（讓視野框更明顯）
    this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(frameX + 1, frameY + 1, frameW - 2, frameH - 2);
  }
};
