/**
 * DK.SoundSystem - 遊戲音效系統
 *
 * 功能：
 * - 音效資源管理
 * - 音量控制（Master, SFX, Music）
 * - 靜音切換
 * - 錯誤處理整合
 * - Placeholder 模式（開發階段）
 */

DK.SoundSystem = {
  // 音效資源池
  sounds: {},

  // 音量設定
  volume: {
    master: 0.5,  // 主音量 (0.0 - 1.0)
    sfx: 0.7,     // 音效音量
    music: 0.3    // 背景音樂音量
  },

  // 靜音狀態
  muted: false,

  // 開發模式（無實際音效檔案時使用 console.log 模擬）
  debugMode: true,

  /**
   * 初始化音效系統
   * 預載所有音效資源
   */
  init() {
    // 定義音效清單
    const soundList = {
      // === UI 音效 ===
      'ui_click': 'sounds/ui_click.mp3',           // 按鈕點擊
      'ui_hover': 'sounds/ui_hover.mp3',           // 懸停反饋
      'ui_error': 'sounds/ui_error.mp3',           // 錯誤提示
      'ui_success': 'sounds/ui_success.mp3',       // 成功提示

      // === 遊戲操作音效 ===
      'trap_place': 'sounds/trap_place.mp3',       // 陷阱放置
      'trap_trigger': 'sounds/trap_trigger.mp3',   // 陷阱觸發
      'trap_destroy': 'sounds/trap_destroy.mp3',   // 陷阱摧毀
      'hero_summon': 'sounds/hero_summon.mp3',     // 英雄召喚
      'hero_death': 'sounds/hero_death.mp3',       // 英雄死亡

      // === 敵人音效 ===
      'enemy_spawn': 'sounds/enemy_spawn.mp3',     // 敵人生成
      'enemy_hit': 'sounds/enemy_hit.mp3',         // 敵人受擊
      'enemy_death': 'sounds/enemy_death.mp3',     // 敵人死亡

      // === 波次事件音效 ===
      'wave_start': 'sounds/wave_start.mp3',       // 波次開始
      'wave_complete': 'sounds/wave_complete.mp3', // 波次完成
      'wave_failed': 'sounds/wave_failed.mp3',     // 波次失敗

      // === 遊戲狀態音效 ===
      'game_over': 'sounds/game_over.mp3',         // 遊戲結束
      'victory': 'sounds/victory.mp3',             // 勝利
      'pause': 'sounds/pause.mp3',                 // 暫停
      'resume': 'sounds/resume.mp3'                // 繼續
    };

    // 載入音效資源
    let loadedCount = 0;
    let failedCount = 0;

    for (const [key, path] of Object.entries(soundList)) {
      DK.ErrorHandler.wrapSync(() => {
        // 建立 Audio 物件（實際檔案存在時才會成功）
        const audio = new Audio();

        // 設定音量
        audio.volume = this.volume.master * this.volume.sfx;

        // 錯誤處理
        audio.onerror = () => {
          if (this.debugMode) {
            console.warn(`[SoundSystem] 音效檔案不存在: ${path} (使用 Placeholder 模式)`);
          }
        };

        // 載入成功
        audio.oncanplaythrough = () => {
          loadedCount++;
        };

        audio.src = path;
        this.sounds[key] = audio;

      }, `Failed to load sound: ${key}`);
    }

    DK.ErrorHandler.log('info', 'Sound system initialized', {
      total: Object.keys(soundList).length,
      loaded: loadedCount,
      failed: failedCount,
      debugMode: this.debugMode
    });

    if (this.debugMode && DK.DEBUG_MODE) {
      console.log(`🔊 [SoundSystem] 初始化完成 (Placeholder 模式)`);
      console.log(`   - 定義音效數量: ${Object.keys(soundList).length}`);
      console.log(`   - 使用 console.log 模擬播放`);
    }
  },

  /**
   * 播放音效
   * @param {string} name - 音效名稱
   * @param {number} volumeMultiplier - 音量倍率 (0.0 - 1.0)
   */
  play(name, volumeMultiplier = 1.0) {
    if (this.muted) return;

    // 開發模式：使用 console.log 模擬
    if (this.debugMode) {
      if (DK.DEBUG_MODE) {
        const finalVolume = this.volume.master * this.volume.sfx * volumeMultiplier;
        console.log(`🔊 [SFX] ${name} (volume: ${finalVolume.toFixed(2)})`);
      }
      return;
    }

    // 實際播放模式（未來有音效檔案時使用）
    const sound = this.sounds[name];
    if (!sound) {
      DK.ErrorHandler.log('warning', `Sound not found: ${name}`);
      return;
    }

    DK.ErrorHandler.wrapSync(() => {
      sound.currentTime = 0;
      sound.volume = this.volume.master * this.volume.sfx * volumeMultiplier;
      sound.play().catch(err => {
        // 瀏覽器自動播放限制處理
        if (err.name === 'NotAllowedError') {
          console.warn('[SoundSystem] 瀏覽器阻止自動播放，需要用戶互動');
        }
      });
    }, `Failed to play sound: ${name}`);
  },

  /**
   * 播放循環音效（背景音樂）
   * @param {string} name - 音效名稱
   */
  playLoop(name) {
    if (this.muted) return;

    const sound = this.sounds[name];
    if (!sound) return;

    DK.ErrorHandler.wrapSync(() => {
      sound.loop = true;
      sound.volume = this.volume.master * this.volume.music;
      sound.play();
    }, `Failed to play loop sound: ${name}`);
  },

  /**
   * 停止音效
   * @param {string} name - 音效名稱
   */
  stop(name) {
    const sound = this.sounds[name];
    if (!sound) return;

    DK.ErrorHandler.wrapSync(() => {
      sound.pause();
      sound.currentTime = 0;
    }, `Failed to stop sound: ${name}`);
  },

  /**
   * 設定音量
   * @param {string} type - 音量類型 (master/sfx/music)
   * @param {number} value - 音量值 (0.0 - 1.0)
   */
  setVolume(type, value) {
    if (!this.volume.hasOwnProperty(type)) {
      DK.ErrorHandler.log('warning', `Invalid volume type: ${type}`);
      return;
    }

    // 限制範圍
    this.volume[type] = Math.max(0, Math.min(1, value));

    // 更新所有音效音量
    if (type === 'master' || type === 'sfx') {
      for (const sound of Object.values(this.sounds)) {
        if (sound.loop) {
          sound.volume = this.volume.master * this.volume.music;
        } else {
          sound.volume = this.volume.master * this.volume.sfx;
        }
      }
    }

    DK.ErrorHandler.log('info', `Volume updated: ${type} = ${this.volume[type]}`);
  },

  /**
   * 切換靜音
   * @returns {boolean} 當前靜音狀態
   */
  toggleMute() {
    this.muted = !this.muted;

    if (this.debugMode && DK.DEBUG_MODE) {
      console.log(`🔇 [SoundSystem] 靜音: ${this.muted ? 'ON' : 'OFF'}`);
    }

    // 實際模式：暫停所有音效
    if (this.muted && !this.debugMode) {
      for (const sound of Object.values(this.sounds)) {
        if (!sound.paused) {
          sound.pause();
        }
      }
    }

    DK.ErrorHandler.log('info', `Sound muted: ${this.muted}`);
    return this.muted;
  },

  /**
   * 獲取當前音量設定
   * @returns {object} 音量設定物件
   */
  getVolume() {
    return { ...this.volume };
  },

  /**
   * 切換開發模式
   * @param {boolean} enabled - 是否啟用開發模式
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    if (DK.DEBUG_MODE) {
      console.log(`[SoundSystem] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }
  }
};
