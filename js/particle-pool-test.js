/**
 * Particle Pool Performance Test
 * 測試粒子池系統的效能提升
 */

(function() {
  'use strict';

  // 測試配置
  const TEST_CONFIG = {
    iterations: 10000,    // 每輪測試創建的粒子數
    rounds: 5,            // 測試輪數
    particleTypes: ['trap', 'effect', 'projectile', 'text'],
  };

  // 測試結果
  const results = {
    withPool: { times: [], gcCount: 0, memoryUsed: 0 },
    withoutPool: { times: [], gcCount: 0, memoryUsed: 0 },
  };

  /**
   * 測試：使用粒子池
   */
  function testWithPool() {
    const particles = [];
    const startTime = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    for (let i = 0; i < TEST_CONFIG.iterations; i++) {
      const type = TEST_CONFIG.particleTypes[i % TEST_CONFIG.particleTypes.length];
      const particle = DK.ParticlePool.acquire(type);

      // 模擬使用粒子
      particle.x = Math.random() * 100;
      particle.y = Math.random() * 100;
      particle.timer = 0;
      particle.duration = 1000;

      particles.push(particle);
    }

    // 模擬粒子生命週期結束，回收到池
    for (const particle of particles) {
      DK.ParticlePool.release(particle, particle._poolType);
    }

    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    return {
      time: endTime - startTime,
      memory: endMemory - startMemory,
    };
  }

  /**
   * 測試：不使用粒子池（傳統方法）
   */
  function testWithoutPool() {
    const particles = [];
    const startTime = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    for (let i = 0; i < TEST_CONFIG.iterations; i++) {
      // 傳統方法：每次都 new 一個物件
      const particle = {
        type: '',
        x: Math.random() * 100,
        y: Math.random() * 100,
        timer: 0,
        duration: 1000,
        color: '#ffffff',
        alive: true,
      };

      particles.push(particle);
    }

    // 模擬粒子生命週期結束，直接丟棄（依賴 GC）
    particles.length = 0;

    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    return {
      time: endTime - startTime,
      memory: endMemory - startMemory,
    };
  }

  /**
   * 執行測試
   */
  function runTests() {

    // 預熱（避免首次運行的開銷）
    testWithPool();
    testWithoutPool();

    // 測試多輪
    for (let round = 1; round <= TEST_CONFIG.rounds; round++) {

      // 測試使用粒子池
      const poolResult = testWithPool();
      results.withPool.times.push(poolResult.time);
      results.withPool.memoryUsed += poolResult.memory;

      // 測試不使用粒子池
      const noPoolResult = testWithoutPool();
      results.withoutPool.times.push(noPoolResult.time);
      results.withoutPool.memoryUsed += noPoolResult.memory;

    }

    // 計算平均值
    const avgWithPool = results.withPool.times.reduce((a, b) => a + b, 0) / results.withPool.times.length;
    const avgWithoutPool = results.withoutPool.times.reduce((a, b) => a + b, 0) / results.withoutPool.times.length;
    const improvement = ((1 - avgWithPool / avgWithoutPool) * 100).toFixed(1);


    // 顯示粒子池統計
    const stats = DK.ParticlePool.getStats();
    for (const type in stats) {
      const s = stats[type];
    }

  }

  // 將測試函式綁定到全域
  window.DK = window.DK || {};
  window.DK.ParticlePoolTest = {
    run: runTests,
  };
})();
