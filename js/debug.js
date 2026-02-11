/**
 * Dungeon Keep - Debug Module
 * FPS 監控和開發者工具
 */
window.DK = window.DK || {};

DK.Debug = (function() {
  // localStorage key
  const STORAGE_KEY = 'dk_debug_enabled';

  // FPS 計算變數
  let enabled = false;
  let fps = 0;
  let frameCount = 0;
  let lastFpsUpdateTime = 0;
  let frameTimeAccumulator = 0;

  // 初始化：從 localStorage 讀取啟用狀態
  function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    enabled = stored === 'true';
  }

  // 更新 FPS 計算
  function update(dt) {
    frameCount++;
    frameTimeAccumulator += dt;

    // 每秒更新一次 FPS 顯示
    const now = performance.now();
    if (now - lastFpsUpdateTime >= 1000) {
      // 計算平均 FPS
      if (frameTimeAccumulator > 0) {
        fps = Math.round((frameCount * 1000) / frameTimeAccumulator);
      }

      // 重置計數器
      frameCount = 0;
      frameTimeAccumulator = 0;
      lastFpsUpdateTime = now;
    }
  }

  // 渲染 FPS 顯示（右上角）
  function render(ctx) {
    if (!enabled) return;

    const displayWidth = DK.CONFIG.DISPLAY_WIDTH;
    const x = displayWidth - 70; // 右上角，留 10px 邊距
    const y = 20;

    // 背景框（半透明黑色）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - 5, y - 15, 65, 22);

    // FPS 數值（根據性能使用不同顏色）
    let color;
    if (fps >= 55) {
      color = '#00ff00'; // 綠色：良好
    } else if (fps >= 40) {
      color = '#ffcc00'; // 黃色：普通
    } else {
      color = '#ff0000'; // 紅色：差
    }

    ctx.font = '12px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`FPS: ${fps}`, x, y);
  }

  // 切換 FPS 顯示（可綁定快捷鍵）
  function toggle() {
    enabled = !enabled;
    localStorage.setItem(STORAGE_KEY, enabled.toString());

    // 重置計數器
    if (enabled) {
      frameCount = 0;
      frameTimeAccumulator = 0;
      lastFpsUpdateTime = performance.now();
    }

    return enabled;
  }

  // 獲取當前狀態
  function isEnabled() {
    return enabled;
  }

  // 獲取當前 FPS
  function getFPS() {
    return fps;
  }

  // 初始化
  init();

  // 公開 API
  return {
    update,
    render,
    toggle,
    isEnabled,
    getFPS
  };
})();
