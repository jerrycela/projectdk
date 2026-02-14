/**
 * Dungeon Keep - 統一錯誤處理框架
 * 提供集中式錯誤處理、分級記錄、使用者通知整合
 *
 * 使用範例：
 * DK.ErrorHandler.log('error', 'Failed to spawn hero', { heroId: 'water_mage' });
 * DK.ErrorHandler.wrapSync(() => DK.Map.init(), 'Map initialization failed');
 * await DK.ErrorHandler.wrapAsync(async () => loadData(), 'Data loading failed');
 */
window.DK = window.DK || {};

DK.ErrorHandler = {
  // 錯誤級別
  Level: {
    ERROR: 'error',     // 嚴重錯誤（影響功能）
    WARNING: 'warning', // 警告（可能影響體驗）
    INFO: 'info',       // 資訊（正常狀態變化）
    DEBUG: 'debug'      // 除錯（開發模式專用）
  },

  // 內部狀態
  _history: [],
  _maxHistorySize: 100,

  /**
   * 記錄錯誤/警告/資訊
   * @param {string} level - 錯誤級別（'error' | 'warning' | 'info' | 'debug'）
   * @param {string} message - 錯誤訊息
   * @param {object} context - 額外上下文資訊（可選）
   */
  log(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, message, context };

    // Console 輸出（開發模式）
    if (DK.DEBUG_MODE) {
      const style = this._getConsoleStyle(level);
      const prefix = `%c[${level.toUpperCase()}]`;

      if (level === 'error') {
        console.error(prefix, style, message, context);
      } else if (level === 'warning') {
        console.warn(prefix, style, message, context);
      } else {
        console.log(prefix, style, message, context);
      }
    }

    // 錯誤歷史記錄（最多 100 條）
    this._history.push(entry);
    if (this._history.length > this._maxHistorySize) {
      this._history.shift();
    }

    // 顯示給使用者（僅 ERROR 和 WARNING）
    if (level === 'error' || level === 'warning') {
      this._showUserNotification(level, message);
    }
  },

  /**
   * 包裝非同步操作（自動捕獲錯誤）
   * @param {Function} fn - 非同步函式
   * @param {string} errorMessage - 錯誤訊息（可選）
   * @returns {Promise} 函式執行結果
   * @example
   * await DK.ErrorHandler.wrapAsync(
   *   async () => fetch('/api/data'),
   *   'Failed to fetch data'
   * );
   */
  async wrapAsync(fn, errorMessage = 'Operation failed') {
    try {
      return await fn();
    } catch (err) {
      this.log('error', errorMessage, {
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  },

  /**
   * 包裝同步操作（自動捕獲錯誤）
   * @param {Function} fn - 同步函式
   * @param {string} errorMessage - 錯誤訊息（可選）
   * @returns 函式執行結果
   * @example
   * DK.ErrorHandler.wrapSync(
   *   () => DK.Map.init(),
   *   'Map initialization failed'
   * );
   */
  wrapSync(fn, errorMessage = 'Operation failed') {
    try {
      return fn();
    } catch (err) {
      this.log('error', errorMessage, {
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  },

  /**
   * 包裝帶返回值的操作（捕獲錯誤並返回預設值）
   * @param {Function} fn - 函式
   * @param {*} defaultValue - 錯誤時的預設返回值
   * @param {string} errorMessage - 錯誤訊息（可選）
   * @returns 函式執行結果或預設值
   * @example
   * const data = DK.ErrorHandler.wrapWithDefault(
   *   () => JSON.parse(userInput),
   *   {},
   *   'Invalid JSON input'
   * );
   */
  wrapWithDefault(fn, defaultValue, errorMessage = 'Operation failed') {
    try {
      return fn();
    } catch (err) {
      this.log('error', errorMessage, {
        error: err.message,
        stack: err.stack
      });
      return defaultValue;
    }
  },

  /**
   * 取得錯誤歷史
   * @param {string} level - 過濾級別（可選）
   * @returns {Array} 錯誤歷史陣列
   */
  getHistory(level = null) {
    if (level) {
      return this._history.filter(e => e.level === level);
    }
    return this._history;
  },

  /**
   * 清除錯誤歷史
   */
  clearHistory() {
    this._history = [];
  },

  /**
   * 取得統計資訊
   * @returns {object} 錯誤統計
   */
  getStats() {
    const stats = {
      total: this._history.length,
      error: 0,
      warning: 0,
      info: 0,
      debug: 0
    };

    for (const entry of this._history) {
      if (stats.hasOwnProperty(entry.level)) {
        stats[entry.level]++;
      }
    }

    return stats;
  },

  /**
   * 取得最近的錯誤
   * @param {number} count - 數量（預設 10）
   * @returns {Array} 最近的錯誤陣列
   */
  getRecent(count = 10) {
    return this._history.slice(-count);
  },

  // ========================================
  // 內部方法
  // ========================================

  /**
   * 取得 Console 樣式
   * @private
   */
  _getConsoleStyle(level) {
    const styles = {
      error: 'color: #ff4444; font-weight: bold;',
      warning: 'color: #ffaa44; font-weight: bold;',
      info: 'color: #44aaff;',
      debug: 'color: #888888;'
    };
    return styles[level] || '';
  },

  /**
   * 顯示使用者通知
   * @private
   */
  _showUserNotification(level, message) {
    // 整合現有的 DK.UI.ErrorNotification 系統
    if (DK.UI && DK.UI.ErrorNotification) {
      DK.UI.ErrorNotification.show(message, level);
    }
  },

  /**
   * 格式化錯誤訊息
   * @param {Error} error - 錯誤物件
   * @returns {string} 格式化後的訊息
   */
  formatError(error) {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    return error.message || error.toString();
  },

  // ========================================
  // 可操作錯誤訊息系統
  // ========================================

  /**
   * 常見錯誤與可操作建議映射
   */
  CommonErrors: {
    insufficient_gold: {
      message: '金幣不足',
      action: '擊敗更多敵人或升級現有陷阱'
    },
    invalid_trap_position: {
      message: '無法在此位置放置陷阱',
      action: '選擇靠近路徑的空地板格子'
    },
    hero_limit_reached: {
      message: '英雄數量已達上限',
      action: '等待現有英雄完成任務或召回英雄'
    },
    trap_occupied: {
      message: '此位置已有陷阱',
      action: '選擇其他空格或移除現有陷阱'
    },
    wave_not_ready: {
      message: '尚未準備好開始波次',
      action: '請先放置至少一個陷阱或召喚一個英雄'
    },
    upgrade_not_available: {
      message: '無法升級此陷阱',
      action: '檢查是否達到最高等級或缺少所需金幣'
    },
    cannot_deploy_hero_here: {
      message: '無法在此位置部署英雄',
      action: '選擇空的地板格子（避開牆壁、陷阱、傳送門）'
    },
    hero_already_deployed: {
      message: '該英雄類型已經部署了',
      action: '每個英雄類型只能部署一隻，請召回現有英雄後再部署'
    },
    invalid_wall_trap_slot: {
      message: '此牆壁無法放置陷阱',
      action: '選擇靠近路徑的內牆格子'
    },
    undo_wrong_phase: {
      message: '只能在準備階段撤銷操作',
      action: '等待當前波次結束後再進行撤銷'
    }
  },

  /**
   * 記錄錯誤並顯示可操作建議
   * @param {string} level - 錯誤級別
   * @param {string} message - 錯誤訊息
   * @param {string} actionSuggestion - 可操作建議
   * @param {object} context - 額外上下文資訊（可選）
   */
  logWithAction(level, message, actionSuggestion, context = {}) {
    // 記錄原始錯誤
    this.log(level, message, context);

    // 顯示可操作建議（僅 ERROR 和 WARNING）
    if (actionSuggestion && (level === 'error' || level === 'warning')) {
      this._showActionableNotification(message, actionSuggestion);
    }
  },

  /**
   * 顯示預定義的錯誤訊息
   * @param {string} errorKey - 錯誤鍵值（來自 CommonErrors）
   * @param {object} context - 額外上下文資訊（可選）
   */
  showError(errorKey, context = {}) {
    const error = this.CommonErrors[errorKey];
    if (error) {
      this.logWithAction('error', error.message, error.action, context);
    } else {
      this.log('error', errorKey, context);
    }
  },

  /**
   * 顯示可操作通知
   * @private
   */
  _showActionableNotification(message, action) {
    // 整合現有通知系統，顯示錯誤 + 建議
    if (DK.UI && DK.UI.ErrorNotification) {
      const fullMessage = `${message}\n💡 ${action}`;
      // 使用自訂持續時間（6 秒）讓玩家有足夠時間閱讀建議
      const notification = {
        message: fullMessage,
        type: 'error',
        timer: 0,
        duration: 6000,
        position: { x: 480, y: 300 }
      };
      DK.UI.ErrorNotification.queue.push(notification);
    }
  }
};

// ========================================
// 除錯模式開關（可在 config.js 設定）
// ========================================
// 開發環境：顯示所有錯誤訊息
// 生產環境：僅記錄錯誤，不輸出到 console
if (typeof DK.DEBUG_MODE === 'undefined') {
  DK.DEBUG_MODE = true; // 預設開啟（稍後可在 config.js 關閉）
}

// ========================================
// 全域錯誤捕獲（捕獲未處理的錯誤）
// ========================================
window.addEventListener('error', (event) => {
  DK.ErrorHandler.log('error', 'Uncaught error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error ? event.error.stack : null
  });
});

window.addEventListener('unhandledrejection', (event) => {
  DK.ErrorHandler.log('error', 'Unhandled promise rejection', {
    reason: event.reason,
    promise: event.promise
  });
});
