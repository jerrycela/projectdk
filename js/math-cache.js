/**
 * Dungeon Keep - Math Cache System
 *
 * 預計算三角函式查找表 + 動態值快取系統
 * 用於優化重複計算的 Math.sin/cos，提升動畫性能
 */
window.DK = window.DK || {};

// ========================================
// 1. 三角函式查找表（預計算）
// ========================================
DK.MathCache = {
  // 查找表（360 度，精度 1 度）
  sinTable: [],
  cosTable: [],

  // 是否已初始化
  _initialized: false,

  /**
   * 初始化查找表
   * 必須在遊戲啟動時呼叫一次
   */
  init() {
    if (this._initialized) return;

    for (let i = 0; i < 360; i++) {
      const rad = (i * Math.PI) / 180;
      this.sinTable[i] = Math.sin(rad);
      this.cosTable[i] = Math.cos(rad);
    }

    this._initialized = true;
  },

  /**
   * 快速 sin（角度制，0-360）
   * @param {number} degrees - 角度（自動正規化）
   * @returns {number} sin 值
   */
  sin(degrees) {
    const normalized = ((degrees % 360) + 360) % 360;
    return this.sinTable[Math.floor(normalized)];
  },

  /**
   * 快速 cos（角度制，0-360）
   * @param {number} degrees - 角度（自動正規化）
   * @returns {number} cos 值
   */
  cos(degrees) {
    const normalized = ((degrees % 360) + 360) % 360;
    return this.cosTable[Math.floor(normalized)];
  },

  /**
   * 時間轉角度（常用模式）
   * @param {number} time - 時間（毫秒）
   * @param {number} frequency - 頻率係數（預設 0.002）
   * @returns {number} 角度（0-360）
   */
  timeToAngle(time, frequency = 0.002) {
    return (time * frequency * 360) % 360;
  },

  /**
   * 時間轉弧度（直接輸出弧度，用於需要弧度的場合）
   * @param {number} time - 時間（毫秒）
   * @param {number} frequency - 頻率係數
   * @returns {number} 弧度
   */
  timeToRad(time, frequency = 0.002) {
    return (time * frequency * Math.PI * 2) % (Math.PI * 2);
  },

  /**
   * 快速 sin（直接輸入時間，自動轉換）
   * 等效於 Math.sin(time * frequency)
   * @param {number} time - 時間（毫秒）
   * @param {number} frequency - 頻率係數（預設 0.002）
   * @returns {number} sin 值
   */
  sinTime(time, frequency = 0.002) {
    const angle = this.timeToAngle(time, frequency);
    return this.sin(angle);
  },

  /**
   * 快速 cos（直接輸入時間，自動轉換）
   * 等效於 Math.cos(time * frequency)
   * @param {number} time - 時間（毫秒）
   * @param {number} frequency - 頻率係數（預設 0.002）
   * @returns {number} cos 值
   */
  cosTime(time, frequency = 0.002) {
    const angle = this.timeToAngle(time, frequency);
    return this.cos(angle);
  }
};

// ========================================
// 2. 動態值快取系統（Runtime Cache）
// ========================================
DK.AnimationCache = {
  // LRU 快取
  cache: new Map(),

  // 快取大小限制（避免記憶體溢出）
  maxSize: 1000,

  /**
   * 取得或計算值
   * @param {string} key - 快取鍵（建議格式：'function_name:param1:param2'）
   * @param {Function} computeFn - 計算函式
   * @returns {*} 快取或計算的值
   */
  get(key, computeFn) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const value = computeFn();

    // LRU：當超過大小限制時，刪除最舊的項目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
    return value;
  },

  /**
   * 清除快取（可用於關卡切換或記憶體管理）
   */
  clear() {
    this.cache.clear();
  },

  /**
   * 取得快取狀態（除錯用）
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this._hits / (this._hits + this._misses) || 0
    };
  },

  // 內部統計（選用）
  _hits: 0,
  _misses: 0
};

// ========================================
// 3. 常用動畫曲線（Easing Functions）
// ========================================
DK.MathCache.easing = {
  /**
   * 線性插值
   */
  linear(t) {
    return t;
  },

  /**
   * 緩入緩出（基於 sin）
   * 使用查找表優化
   */
  smoothstep(t) {
    // smoothstep: 3t² - 2t³
    return t * t * (3 - 2 * t);
  },

  /**
   * 彈跳效果（基於 sin）
   */
  bounce(t) {
    // 使用快取的 sin
    const angle = t * 180; // 0-1 映射到 0-180 度
    return DK.MathCache.sin(angle);
  },

  /**
   * 脈動效果（0.5 ± 0.5 * sin）
   * 常用於火把、傳送門動畫
   */
  pulse(time, frequency = 0.002) {
    return 0.5 + 0.5 * DK.MathCache.sinTime(time, frequency);
  }
};
