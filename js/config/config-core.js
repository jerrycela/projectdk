/**
 * Dungeon Keep - Core Configuration
 * 核心常數、除錯模式、視覺設定
 */
window.DK = window.DK || {};

DK.CONFIG = {
  // Tile sizes
  TILE_SIZE: 16,        // Pixel art tile size
  SCALE: 3,             // Display scale factor
  DISPLAY_TILE: 48,     // TILE_SIZE * SCALE

  // Grid dimensions (viewport)
  GRID_COLS: 20,
  GRID_ROWS: 13,

  // World dimensions (full map)
  WORLD_COLS: 40,
  WORLD_ROWS: 26,
  WORLD_WIDTH: 640,     // 40 * 16
  WORLD_HEIGHT: 416,    // 26 * 16

  // Canvas sizes (viewport)
  GAME_WIDTH: 320,      // 20 * 16
  GAME_HEIGHT: 208,     // 13 * 16
  DISPLAY_WIDTH: 960,   // 320 * 3
  DISPLAY_HEIGHT: 720,  // Includes UI area

  // UI area
  UI_TOP: 624,          // 208 * 3 = 624
  UI_HEIGHT: 96,

  // Game settings
  STARTING_GOLD: 350,
  DUNGEON_HEART_HP: 100,
  WAVE_DELAY: 5000,
  WAVE_AUTO_DELAY: 2000,
  ENEMY_SPAWN_INTERVAL: 500,
  OUTER_PATROL_SPEED: 0.5,

  // FPS
  TARGET_FPS: 60,

  // 動畫與效果時長
  DAMAGE_FLASH_DURATION: 300,
  DAMAGE_SHAKE_INTENSITY: 3,
  DAMAGE_SHAKE_DURATION: 200,
  DAMAGE_EFFECT_DURATION: 800,
  WAVE_START_DURATION: 1500,
  ENEMY_SPAWN_FADE_DURATION: 300,
  ENEMY_ANIM_FRAME_DURATION: 250,
  TRAP_ANIM_FRAME_DURATION: 200,
  TRAP_FLASH_DURATION: 150,
  ATTACK_INTERVAL: 1000,

  // Barricade
  BARRICADE_HP: 100,
  BARRICADE_MAX: 5,
};

// ========================================
// 除錯模式開關
// ========================================
// 開發環境：true（顯示所有錯誤訊息）
// 生產環境：false（僅記錄錯誤，不輸出到 console）
DK.DEBUG_MODE = true;

// ========================================
// Visual Settings System (Fixed DW3 Style)
// ========================================
// 視覺優化系統 - 固定使用 Dungeon Warfare 3 設計理念
//
// 核心設計原則：
// - **Refined（精煉）**：減少過度裝飾，保留核心質感
// - **Clarity（清晰）**：降低光暈/暈影強度 40-50%，突出重點元素
// - **Polished（流暢）**：保留核心動畫（火把、地心、傳送門）
// - **Vivid（鮮豔）**：保持色彩飽和度，減少疊加層
// - **Atmospheric（氛圍感）**：保留火把動畫和暈影，但降低強度
// - **Not cluttered（不雜亂）**：視覺減法，讓玩家專注遊戲機制
//
// 核心理念：「在黑暗地牢中，只看見重要的東西」
//
// 使用方式：
// - DK.VISUAL_SETTINGS.isEnabled('vignette'); // 檢查功能是否啟用
// - DK.VISUAL_SETTINGS.vignette; // 直接存取屬性

DK.VISUAL_SETTINGS = {
  // ========================================
  // 環境光效（體現 DW3 的 Atmospheric but not cluttered）
  // ========================================
  vignette: true,              // 視角暗角（保留，但強度降低至 0.6）
  ambientOcclusion: false,     // 環境光遮蔽（關閉，效能成本高）

  // ========================================
  // 動畫效果（體現 DW3 的 Polished）
  // ========================================
  puddleAnimation: true,       // 水潭波紋動畫（保留但優化）
  portalSwirl: true,           // 傳送門漩渦動畫（核心元素，保留）
  heartPulse: true,            // 地城之心脈動（核心元素，保留）
  grassAnimation: true,        // 草叢動畫（保留）
  abyssAnimation: true,        // 深淵動畫（保留）

  // ========================================
  // 粒子系統（體現 DW3 的 Not cluttered）
  // ========================================
  particleEffects: true,       // 粒子特效（火花、水花）
  particleDensity: 0.7,        // 粒子密度降低 30%（避免雜亂）

  // ========================================
  // 後處理效果（體現 DW3 的 Clarity）
  // ========================================
  bloomEffect: false,          // 光暈效果（關閉，避免過度發光）
  colorGrading: true,          // 色調調整（保留色彩豐富度）

  // ========================================
  // 進階渲染（體現 DW3 的 Refined）
  // ========================================
  gradientLighting: true,      // 漸層光照（牆面/地板）
  smoothShading: false,        // 平滑著色（關閉，效能成本高）
  detailTextures: true,        // 細節紋理（保留核心質感）

  // ========================================
  // 特效強度（體現 DW3 的降低 40-50% 理念）
  // ========================================
  glowIntensity: 0.5,          // 光暈強度降低 50%（Clarity：突出重點）
  shadowIntensity: 0.6,        // 陰影強度降低 40%（Refined：減少壓迫感）
  vignetteIntensity: 0.6,      // 暈影強度降低 40%（Atmospheric but not too dark）
  warmOverlayIntensity: 0.5,   // 暖色覆蓋降低 50%（Vivid：避免過黃）
  animationSpeed: 1.0,         // 動畫速度（標準）

  // ========================================
  // 檢查功能是否啟用
  // ========================================
  /**
   * 檢查某個視覺功能是否啟用
   * @param {string} feature - 功能名稱（如 'vignette'）
   * @returns {boolean | number} - 布林值或數值（強度參數）
   * @example
   * if (DK.VISUAL_SETTINGS.isEnabled('particleEffects')) {
   *   renderParticles();
   * }
   */
  isEnabled(feature) {
    return this[feature];
  },
};
