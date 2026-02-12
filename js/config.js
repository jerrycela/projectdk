/**
 * Dungeon Keep - Configuration
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
// Color System - Dungeon Theme
// ========================================
// 系統化色彩管理：6 大分組（環境、UI、元素、角色、特效、系統）
// 支援向後相容的平面結構引用
//
// 設計原則：
// 1. 語義化命名 - 根據功能而非外觀命名
// 2. 層級分組 - 相關顏色組織在一起
// 3. 向後相容 - 保留舊的平面結構
// 4. 可擴展性 - 新增顏色時有明確位置

DK.COLORS = {
  // ========================================
  // 1. 環境色彩（Environment）
  // ========================================
  environment: {
    // 牆壁 - 19 色階（DW3 風格：冷灰藍，增強對比度）
    wall: {
      darkest: '#18191e',
      dark: '#22242a',
      darkMid: '#2a2c34',
      darkShade: '#32343c',
      midDark: '#3a3c46',
      mid: '#42444e',
      midNeutral: '#4a4c56',
      midLight: '#52545e',
      lightMid: '#5a5c66',
      light: '#62646e',
      lightBright: '#6a6c76',
      highlight: '#72747e',
      highlightStrong: '#7a7c86',
      brightest: '#82848e',
      edge: '#8a8c96',
      // 特殊紋理
      mortar: '#16181e',
      moss: '#2a4a42',
      warm: '#42424c',
      crack: '#10121a',
    },

    // 地板 - 14 色階（DW3 風格：冷灰褐，粗糙石地質感）
    floor: {
      darkest: '#2c2e32',
      dark: '#34363c',
      darkMid: '#3c3e46',
      midDark: '#44464e',
      mid: '#4c4e56',
      midNeutral: '#54565e',
      midLight: '#5c5e66',
      lightMid: '#64666e',
      light: '#6c6e76',
      lightBright: '#74767e',
      highlight: '#7c7e86',
      brightest: '#84868e',
      // 特殊紋理
      crack: '#1c1e24',
      dust: '#5c5e66',
    },

    // 深淵 - 9 色階（深邃虛空漸層）
    abyss: {
      void: '#000000',
      darkest: '#030305',
      dark: '#050508',
      midDark: '#08080e',
      mid: '#0e0e18',
      crack: '#0a0a14',
      edgeDark: '#12121e',
      edge: '#1a1a2a',
      rock: '#2a2838',
    },

    // 水池 - 7 色階（深藍漸層）
    pool: {
      darkest: '#0a1a3a',
      dark: '#1a2a4a',
      midDark: '#2a3a5a',
      mid: '#2a4a7a',
      light: '#3a6aaa',
      highlight: '#5a8acc',
      ripple: '#6aaaee',
    },

    // 草地 - 13 色階（含燃燒/焦黑過渡）
    grass: {
      darkest: '#0a2a0a',
      dark: '#1a3a1a',
      midDark: '#254a25',
      mid: '#2a5a2a',
      midLight: '#356a35',
      light: '#3a7a3a',
      highlight: '#4a9a4a',
      // 燃燒狀態
      burningDark: '#aa3311',
      burning: '#cc5522',
      burningLight: '#ee7744',
      // 焦黑狀態
      scorchedDark: '#1a1410',
      scorched: '#2a2420',
      scorchedLight: '#3a3430',
    },

    // 路徑標記
    path: {
      arrow: '#6e6655',
    },
  },

  // ========================================
  // 2. UI 色彩（User Interface）
  // ========================================
  ui: {
    // 背景與面板
    background: {
      main: '#12101e',
      panel: '#1e1a2e',
    },
    // 邊框
    border: {
      normal: '#4a3e6e',
      light: '#6a5e8e',
    },
    // 文字
    text: {
      primary: '#e8e0d0',
      secondary: '#8a8070',
    },
    // 狀態顯示
    status: {
      gold: '#ffd700',
      hp: '#ff4444',
      hpBg: '#441111',
      wave: '#44aaff',
      selected: '#ffaa44',
    },
  },

  // ========================================
  // 3. 元素色彩（Elements）
  // ========================================
  elements: {
    // 陷阱基礎（金屬）
    trap: {
      metal: '#7888a0',
      metalLight: '#98a8c0',
      metalDark: '#586878',
    },
    // 電擊陷阱
    electric: {
      main: '#ffdd44',
      light: '#ffff88',
      dark: '#aa8800',
      plate: '#4a4a5a',
    },
    // 推力陷阱
    push: {
      housing: '#5a5060',
      piston: '#8a8090',
      charge: '#ff6622',
      glow: '#ffaa44',
    },
    // 油漬陷阱
    oil: {
      body: '#3a3020',
      puddle: '#2a2010',
      sheen: '#5a5030',
      dark: '#1a1808',
    },
    // 風壓陷阱
    wind: {
      housing: '#2a3448',
      fan: '#88aacc',
      glow: '#aaddff',
    },
    // 路障
    barricade: {
      stone: '#5a5a6e',
      stoneDark: '#2a2a3a',
      stoneLight: '#7a7a8e',
      mortar: '#3a3a4a',
      crack: '#1a1a2a',
    },
  },

  // ========================================
  // 4. 角色色彩（Characters）
  // ========================================
  characters: {
    // 英雄（魔王女神）
    hero: {
      // 通用屬性
      skin: '#f0dcc8',
      selected: '#44ff44',
      // 金髮漸層（兩位英雄共用）
      hair: {
        dark: '#aa8844',
        mid: '#ddaa55',
        light: '#ffcc77',
      },
      // 皇冠（金色 + 紅寶石）
      crown: {
        gold: '#ffcc00',
        gem: '#cc0000',
      },
      // 利維坦（水法師）深藍紫禮服
      water: {
        robe: '#3a4a8a',
        robeDark: '#2a3a6a',
        robeLight: '#5a6aaa',
        gem: '#88ccff',
        pearl: '#ffffff',
        silver: '#aaccee',
      },
      // 巴爾（火法師）深紅紫禮服
      fire: {
        robe: '#6a3a5a',
        robeDark: '#4a2a3a',
        robeLight: '#8a5a7a',
        gem: '#ffaa44',
      },
      // 通用裝飾
      decoration: {
        gold: '#ffd700',
        furWhite: '#ffffff',
      },
    },

    // 敵人（冒險者）
    enemy: {
      // 劍士（GOBLIN）
      swordsman: {
        skin: '#e8c8a0',
        skinDark: '#c8a878',
        eye: '#4466aa',
      },
      // 弓手（SKELETON）
      archer: {
        leather: '#c8b898',
        leatherDark: '#a89070',
        eye: '#44aa44',
      },
      // 騎士（ORC）
      knight: {
        skin: '#e0c0a0',
        skinDark: '#c0a080',
        armor: '#7080a0',
      },
      // 盜賊（SLIME）
      rogue: {
        body: '#4a4a5a',
        light: '#6a6a7a',
        dark: '#2a2a3a',
        eye: '#ffffff',
      },
    },
  },

  // ========================================
  // 5. 特效色彩（Effects）
  // ========================================
  effects: {
    // 元素屬性
    element: {
      water: '#4488ff',
      waterLight: '#66aaff',
      fire: '#ff6622',
      fireLight: '#ffaa44',
      electric: '#ffdd44',
      electricLight: '#ffff88',
      reaction: '#ffffff',
    },
    // 文字特效
    text: {
      damage: '#ff4444',
      gold: '#ffd700',
      heal: '#44ff44',
    },
  },

  // ========================================
  // 6. 系統色彩（System）
  // ========================================
  system: {
    error: '#ff4444',
    warning: '#ffaa44',
    success: '#44ff44',
    info: '#44aaff',
  },

  // ========================================
  // 7. 細節裝飾色彩（Detail Colors）
  // ========================================
  // Phase 2 Technical Debt - 整理所有硬編碼細節顏色
  detail: {
    // 水池細節
    pool: {
      pebble: '#1a2838',
      pebbleMid: '#1a3040',
      pebbleDark: '#142030',
    },
    // 地板細節
    floor: {
      weatherSpot: '#2a5a2a',
      weatherDark: '#1e3a1e',
      weatherShadow: '#1a3a1a',
      mossSpot: '#2a4a2a',
      highlight: '#9a9080',
      highlightMid: '#8a8070',
      highlightDark: '#7a7060',
    },
    // 鐵道/軌道
    rail: {
      base: '#2a2a1a',
      wood: '#aa8844',
      woodLight: '#ccaa55',
      metal: '#777766',
      metalDark: '#666655',
      gravel: '#1a1a14',
      gravelLight: '#1a1810',
      dust: '#3a3630',
    },
  },

  // ========================================
  // 8. 裝飾物色彩（Decorations）
  // ========================================
  decorations: {
    // 寶箱
    chest: {
      wood: '#4a3020',
      woodMid: '#5a4030',
      woodLight: '#6a5040',
      woodHighlight: '#7a6050',
      gold: '#ffd700',
      goldMid: '#ffaa00',
      goldGlow: '#ffee88',
      goldLight: '#ffdd77',
    },
    // 雕像/石柱
    statue: {
      base: '#5a5a6e',
      mid: '#6a6a7e',
      top: '#7a7a8e',
      topLight: '#8a8a9e',
      bottom: '#4a4a5e',
      highlight: '#9a9aae',
      shadow: '#3a3a4e',
      crack: '#3a3a4e',
      floor: '#5e5648',
    },
    // 骷髏
    skull: {
      bone: '#d0c8b0',
      boneLight: '#e0d8c0',
      boneDark: '#c0b8a0',
      eye: '#1a1a1a',
      eyeMid: '#2a2a2a',
    },
    // 藥水瓶
    potion: {
      blue: '#44aaff',
      blueLight: '#66ccff',
      blueBright: '#88eeff',
      blueDark: '#2288cc',
      orange: '#ff8800',
      orangeHot: '#ffaa00',
      orangeBright: '#ffcc44',
      orangeMid: '#ff9922',
      orangeGlow: '#ffbb33',
      purple: '#aa44ff',
      purpleLight: '#cc66ff',
      purpleBright: '#8833cc',
      purpleMid: '#cc88ff',
      purpleGlow: '#ee99ff',
      purpleHot: '#ffaaff',
      purpleDark: '#bb66ee',
    },
    // 火盆
    brazier: {
      base: '#3a3a3a',
      baseDark: '#2a2a2a',
    },
    // 水晶台
    crystal: {
      base: '#5a5a6e',
      frame: '#4a4a5e',
      wood: '#6a5040',
      shadow: '#3a3a4e',
      gold: '#ffd700',
      goldMid: '#ffaa00',
    },
  },

  // ========================================
  // 9. 傳送門色彩（Portals）
  // ========================================
  portals: {
    // 綠色傳送門（Green Portal）
    green: {
      dark: '#226622',
      darkMid: '#22662a',
      mid: '#338833',
      bright: '#44aa44',
      brightMid: '#66cc66',
      light: '#88ee88',
      glow: '#66ff66',
      glowBright: '#88ff88',
      glowLight: '#aaffaa',
      core: '#0a1a0a',
      rim1: '#1a3820',
      rim2: '#2a5a30',
      rim3: '#44aa44',
      center: '#66ff66',
      centerGlow: '#aaffaa',
      particle: '#88ff88',
      edge: '#0a0a0a',
    },
    // 紅色傳送門（Red Portal）
    red: {
      dark: '#662222',
      darkMid: '#662222',
      mid: '#883333',
      bright: '#aa4444',
      brightMid: '#cc4444',
      light: '#ff6666',
      glow: '#ff8888',
      glowBright: '#ffaaaa',
      core: '#1a0a0a',
      rim1: '#3a1820',
      rim2: '#5a2a30',
      rim3: '#aa4444',
      center: '#ff6666',
      centerGlow: '#ffaaaa',
      particle: '#ff8888',
      bridge: '#ff4444',
      edge: '#0a0a0a',
    },
    // 傳送門通用
    common: {
      edgeColor: '#4a4236',
    },
  },

  // ========================================
  // 10. 地心色彩（Dungeon Heart）
  // ========================================
  heart: {
    background: '#1a0a2a',
    crystal: '#aa44ff',
    crystalGlow: '#ffffff',
    crystalBright: '#cc88ff',
    crystalMid: '#aa66dd',
    stoneBase: '#3a2a4a',
    edge: '#0a0a0a',
  },

  // ========================================
  // 11. 門系統色彩（Doors）
  // ========================================
  doors: {
    // 木門
    wood: {
      base: '#2a2218',
      shadeLight: '#342a1e',
      shadeMid: '#2e2618',
      shadeDark: '#1e1a12',
      moss: '#1a3018',
      mossLight: '#243820',
      weatherLight: '#3a3428',
      weatherDark: '#2a2620',
      scratch: '#3a3020',
    },
    // 石門
    stone: {
      base: '#3a3850',
      mortar: '#282638',
      brick: '#4a4868',
      brickMid: '#3e3c58',
      brickDark: '#343248',
      highlight: '#5a5878',
      highlightStrong: '#4e4c68',
      shadow: '#2a2840',
      crack: '#1a1828',
      glowDot: '#5a5878',
      moss: '#1e3a1e',
    },
    // 水晶門
    crystal: {
      background: '#2a1a3a',
      innerShade1: '#3a2a4e',
      innerShade2: '#342448',
      layer1: '#4a2a5e',
      layer2: '#5a3a6e',
      layer3: '#6a4a80',
      layer4: '#8a6aa0',
      layer5: '#aa8ac0',
      coreHot: '#ddbbff',
      coreMid: '#ccaaee',
      rimBright: '#5a4a6e',
      cornerDark: '#1a0e28',
      glow: '#aa8ac0',
      glowMid: '#9a7ab0',
    },
  },

  // ========================================
  // 12. 高光與陰影（Highlights & Shadows）
  // ========================================
  lighting: {
    // 高光（用於水面、金屬反光等）
    highlight: {
      waterGlow: 'rgba(255, 255, 255, 0.1)',
      metalGlow: 'rgba(255, 255, 255, 0.2)',
      white: '#ffffff',
      warm: '#ffffaa',
      hot: '#ffcc44',
      fire: '#ffaa22',
      fireDark: '#ff8844',
      fireGlow: '#ff6622',
      fireHot: '#ff4400',
    },
    // 陰影
    shadow: {
      soft: 'rgba(0, 0, 0, 0.2)',
      medium: 'rgba(0, 0, 0, 0.4)',
      hard: 'rgba(0, 0, 0, 0.6)',
    },
  },

  // ========================================
  // 13. Tooltip 色彩（Tooltips）
  // ========================================
  tooltips: {
    trap: {
      border: '#6a5a8a',
      evolved: '#ffcc44',
      evolvedMid: '#ffd966',
      type: '#c0b090',
      damage: '#ff8866',
      push: '#ffaa66',
      range: '#88ccff',
      upgrade: '#88ff88',
      cost: '#ffcc44',
      requirement: '#ff8866',
      description: '#a0a090',
    },
    hero: {
      border: '#4488ff',
      name: '#4488ff',
      hpGood: '#88ff88',
      hpMid: '#ffcc44',
      hpLow: '#ff6666',
      damage: '#ff8866',
      range: '#88ccff',
      statusNeutral: '#aaa090',
      statusPatrol: '#88aaff',
      statusAttack: '#ff8866',
      element: '#aa88ff',
      aura: '#8888cc',
    },
    enemy: {
      border: '#ff6666',
      name: '#ff6666',
      hpGood: '#ff8866',
      hpMid: '#ffaa44',
      hpLow: '#ffcc88',
      speed: '#88aaff',
      gold: '#ffcc44',
    },
    button: {
      border: '#6a5a8a',
      description: '#e8e0d0',
      hotkey: '#88aaff',
      cost: '#ffcc44',
    },
  },

  // ========================================
  // 14. 通知系統色彩（Notifications）
  // ========================================
  notifications: {
    error: {
      bg: '#6e3e3e',
      border: '#ff4444',
    },
    warning: {
      bg: '#6e5e3e',
      border: '#ffaa44',
    },
    info: {
      bg: '#3e4e6e',
      border: '#4488ff',
    },
    text: '#f0e8d8',
    highlight: '#ffcc88',
  },

  // ========================================
  // 15. UI 核心色彩擴充（UI Core Extended）
  // ========================================
  uiCore: {
    panel: '#1a1630',
    goldText: '#ffdd44',
    whiteText: '#ffffff',
    resourceDark: '#5a5060',
    resourceMid: '#8a8090',
    resourceLight: '#aaa0b0',
    resourceBright: '#bbb0c0',
    costOrange: '#ff6622',
    costOrangeBright: '#ff8844',
    oilBody: '#3a3020',
    oilDark: '#2a2010',
    oilSheen: '#5a5030',
    oilShadow: '#3a2810',
    oilDetail: '#4a3828',
    windHousing: '#2a3448',
    windFan: '#88aacc',
    windGlow: '#aaddff',
  },

  // ========================================
  // 16. 火焰效果色彩（Flame Effects）
  // ========================================
  flames: {
    // 粒子火焰
    particle: {
      orange: '#ff8844',
      orangeBright: '#ffaa44',
    },
  },

  // ========================================
  // 17. 水花效果色彩（Water Effects）
  // ========================================
  water: {
    splash: '#8accff',
  },

  // ========================================
  // 18. 油漬燃燒效果（Oil Burning）
  // ========================================
  burning: {
    flameDark: '#ee6633',
    flame: '#ffaa22',
    flameBright: '#ffcc44',
  },
};

// ========================================
// 向後相容層（Backward Compatibility）
// ========================================
// 保留舊的平面結構引用，映射至新的層級結構
// 確保現有程式碼不會中斷
(function() {
  const env = DK.COLORS.environment;
  const ui = DK.COLORS.ui;
  const elem = DK.COLORS.elements;
  const chars = DK.COLORS.characters;
  const fx = DK.COLORS.effects;

  const flatColors = {
    // Walls (15 + 4 textures)
    WALL_DARKEST: env.wall.darkest,
    WALL_DARK: env.wall.dark,
    WALL_DARK_MID: env.wall.darkMid,
    WALL_DARK_SHADE: env.wall.darkShade,
    WALL_MID_DARK: env.wall.midDark,
    WALL_MID: env.wall.mid,
    WALL_MID_NEUTRAL: env.wall.midNeutral,
    WALL_MID_LIGHT: env.wall.midLight,
    WALL_LIGHT_MID: env.wall.lightMid,
    WALL_LIGHT: env.wall.light,
    WALL_LIGHT_BRIGHT: env.wall.lightBright,
    WALL_HIGHLIGHT: env.wall.highlight,
    WALL_HIGHLIGHT_STRONG: env.wall.highlightStrong,
    WALL_BRIGHTEST: env.wall.brightest,
    WALL_EDGE: env.wall.edge,
    WALL_MORTAR: env.wall.mortar,
    WALL_MOSS: env.wall.moss,
    WALL_WARM: env.wall.warm,
    WALL_CRACK: env.wall.crack,

    // Floors (12 + 2 textures)
    FLOOR_DARKEST: env.floor.darkest,
    FLOOR_DARK: env.floor.dark,
    FLOOR_DARK_MID: env.floor.darkMid,
    FLOOR_MID_DARK: env.floor.midDark,
    FLOOR_MID: env.floor.mid,
    FLOOR_MID_NEUTRAL: env.floor.midNeutral,
    FLOOR_MID_LIGHT: env.floor.midLight,
    FLOOR_LIGHT_MID: env.floor.lightMid,
    FLOOR_LIGHT: env.floor.light,
    FLOOR_LIGHT_BRIGHT: env.floor.lightBright,
    FLOOR_HIGHLIGHT: env.floor.highlight,
    FLOOR_BRIGHTEST: env.floor.brightest,
    FLOOR_CRACK: env.floor.crack,
    FLOOR_DUST: env.floor.dust,

    // Path
    PATH_ARROW: env.path.arrow,

    // Abyss (9 colors)
    ABYSS_VOID: env.abyss.void,
    ABYSS_DARKEST: env.abyss.darkest,
    ABYSS_DARK: env.abyss.dark,
    ABYSS_MID_DARK: env.abyss.midDark,
    ABYSS_MID: env.abyss.mid,
    ABYSS_CRACK: env.abyss.crack,
    ABYSS_EDGE_DARK: env.abyss.edgeDark,
    ABYSS_EDGE: env.abyss.edge,
    ABYSS_ROCK: env.abyss.rock,

    // Pool (7 colors)
    POOL_DARKEST: env.pool.darkest,
    POOL_DARK: env.pool.dark,
    POOL_MID_DARK: env.pool.midDark,
    POOL_MID: env.pool.mid,
    POOL_LIGHT: env.pool.light,
    POOL_HIGHLIGHT: env.pool.highlight,
    POOL_RIPPLE: env.pool.ripple,

    // Grass (13 colors)
    GRASS_DARKEST: env.grass.darkest,
    GRASS_DARK: env.grass.dark,
    GRASS_MID_DARK: env.grass.midDark,
    GRASS_MID: env.grass.mid,
    GRASS_MID_LIGHT: env.grass.midLight,
    GRASS_LIGHT: env.grass.light,
    GRASS_HIGHLIGHT: env.grass.highlight,
    GRASS_BURNING_DARK: env.grass.burningDark,
    GRASS_BURNING: env.grass.burning,
    GRASS_BURNING_LIGHT: env.grass.burningLight,
    GRASS_SCORCHED_DARK: env.grass.scorchedDark,
    GRASS_SCORCHED: env.grass.scorched,
    GRASS_SCORCHED_LIGHT: env.grass.scorchedLight,

    // Traps
    TRAP_METAL: elem.trap.metal,
    TRAP_METAL_LIGHT: elem.trap.metalLight,
    TRAP_METAL_DARK: elem.trap.metalDark,

    // Electric trap
    TRAP_ELECTRIC: elem.electric.main,
    TRAP_ELECTRIC_LIGHT: elem.electric.light,
    TRAP_ELECTRIC_DARK: elem.electric.dark,
    TRAP_ELECTRIC_PLATE: elem.electric.plate,

    // Push trap
    TRAP_PUSH_HOUSING: elem.push.housing,
    TRAP_PUSH_PISTON: elem.push.piston,
    TRAP_PUSH_CHARGE: elem.push.charge,
    TRAP_PUSH_GLOW: elem.push.glow,

    // Oil trap
    TRAP_OIL_BODY: elem.oil.body,
    TRAP_OIL_PUDDLE: elem.oil.puddle,
    TRAP_OIL_SHEEN: elem.oil.sheen,
    TRAP_OIL_DARK: elem.oil.dark,

    // Wind trap
    TRAP_WIND_HOUSING: elem.wind.housing,
    TRAP_WIND_FAN: elem.wind.fan,
    TRAP_WIND_GLOW: elem.wind.glow,

    // Barricade
    BARRICADE_STONE: elem.barricade.stone,
    BARRICADE_STONE_DARK: elem.barricade.stoneDark,
    BARRICADE_STONE_LIGHT: elem.barricade.stoneLight,
    BARRICADE_MORTAR: elem.barricade.mortar,
    BARRICADE_CRACK: elem.barricade.crack,

    // Enemies
    GOBLIN_SKIN: chars.enemy.swordsman.skin,
    GOBLIN_DARK: chars.enemy.swordsman.skinDark,
    GOBLIN_EYE: chars.enemy.swordsman.eye,
    SKELETON_BONE: chars.enemy.archer.leather,
    SKELETON_DARK: chars.enemy.archer.leatherDark,
    SKELETON_EYE: chars.enemy.archer.eye,
    ORC_SKIN: chars.enemy.knight.skin,
    ORC_DARK: chars.enemy.knight.skinDark,
    ORC_ARMOR: chars.enemy.knight.armor,
    SLIME_BODY: chars.enemy.rogue.body,
    SLIME_LIGHT: chars.enemy.rogue.light,
    SLIME_DARK: chars.enemy.rogue.dark,
    SLIME_EYE: chars.enemy.rogue.eye,

    // UI
    UI_BG: ui.background.main,
    UI_PANEL: ui.background.panel,
    UI_BORDER: ui.border.normal,
    UI_BORDER_LIGHT: ui.border.light,
    UI_TEXT: ui.text.primary,
    UI_TEXT_DIM: ui.text.secondary,
    UI_GOLD: ui.status.gold,
    UI_HP: ui.status.hp,
    UI_HP_BG: ui.status.hpBg,
    UI_WAVE: ui.status.wave,
    UI_SELECTED: ui.status.selected,

    // Text effects
    DAMAGE_TEXT: fx.text.damage,
    GOLD_TEXT: fx.text.gold,
    HEAL_TEXT: fx.text.heal,

    // Elements
    ELEMENT_WATER: fx.element.water,
    ELEMENT_WATER_LIGHT: fx.element.waterLight,
    ELEMENT_ELECTRIC: fx.element.electric,
    ELEMENT_ELECTRIC_LIGHT: fx.element.electricLight,
    ELEMENT_REACTION: fx.element.reaction,
    ELEMENT_FIRE: fx.element.fire,
    ELEMENT_FIRE_LIGHT: fx.element.fireLight,

    // Heroes
    HERO_SKIN: chars.hero.skin,
    HERO_SELECTED: chars.hero.selected,
    HERO_HAIR_DARK: chars.hero.hair.dark,
    HERO_HAIR_MID: chars.hero.hair.mid,
    HERO_HAIR_LIGHT: chars.hero.hair.light,
    HERO_CROWN_GOLD: chars.hero.crown.gold,
    HERO_CROWN_GEM: chars.hero.crown.gem,
    HERO_ROBE: chars.hero.water.robe,
    HERO_ROBE_DARK: chars.hero.water.robeDark,
    HERO_ROBE_LIGHT: chars.hero.water.robeLight,
    HERO_GEM_WATER: chars.hero.water.gem,
    HERO_PEARL: chars.hero.water.pearl,
    HERO_SILVER: chars.hero.water.silver,
    HERO_GOLD: chars.hero.decoration.gold,
    HERO_FUR_WHITE: chars.hero.decoration.furWhite,
    HERO_FIRE_ROBE: chars.hero.fire.robe,
    HERO_FIRE_ROBE_DARK: chars.hero.fire.robeDark,
    HERO_FIRE_ROBE_LIGHT: chars.hero.fire.robeLight,
    HERO_GEM_FIRE: chars.hero.fire.gem,
  };

  // 將平面結構合併到 DK.COLORS（向後相容）
  Object.assign(DK.COLORS, flatColors);
})();

// ========================================
// 色彩工具函式（Color Utilities）
// ========================================
DK.ColorUtils = {
  /**
   * 將 hex 轉為 RGB 物件
   * @param {string} hex - 十六進位色碼 (如 '#ff0000')
   * @returns {{r: number, g: number, b: number}|null}
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  },

  /**
   * 將 RGB 物件轉為 hex
   * @param {number} r - 紅色 (0-255)
   * @param {number} g - 綠色 (0-255)
   * @param {number} b - 藍色 (0-255)
   * @returns {string} - 十六進位色碼
   */
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  /**
   * 調整顏色亮度
   * @param {string} color - 十六進位色碼
   * @param {number} percent - 調整百分比 (-100 到 100)
   * @returns {string} - 調整後的十六進位色碼
   */
  adjustBrightness(color, percent) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const adjust = (value) => {
      const adjusted = value + (value * percent / 100);
      return Math.max(0, Math.min(255, Math.round(adjusted)));
    };

    return this.rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
  },

  /**
   * 取得相對亮度（WCAG 標準）
   * @param {string} color - 十六進位色碼
   * @returns {number} - 相對亮度 (0-1)
   */
  getLuminance(color) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * 計算對比度（WCAG 標準）
   * @param {string} color1 - 第一個顏色
   * @param {string} color2 - 第二個顏色
   * @returns {number} - 對比度 (1-21)
   */
  getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * 檢查對比度是否符合 WCAG AA 標準
   * @param {string} foreground - 前景色
   * @param {string} background - 背景色
   * @returns {{pass: boolean, ratio: string, level: string}}
   */
  checkContrast(foreground, background) {
    const ratio = this.getContrastRatio(foreground, background);
    return {
      pass: ratio >= 4.5,
      ratio: ratio.toFixed(2),
      level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail',
    };
  },

  /**
   * 取得對比色（黑或白）
   * @param {string} color - 十六進位色碼
   * @returns {string} - '#000000' 或 '#ffffff'
   */
  getContrastColor(color) {
    const luminance = this.getLuminance(color);
    return luminance > 0.5 ? '#000000' : '#ffffff';
  },

  /**
   * 混合兩個顏色
   * @param {string} color1 - 第一個顏色
   * @param {string} color2 - 第二個顏色
   * @param {number} ratio - 混合比例 (0-1, 0=全部color1, 1=全部color2)
   * @returns {string} - 混合後的顏色
   */
  mixColors(color1, color2, ratio = 0.5) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    if (!rgb1 || !rgb2) return color1;

    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

    return this.rgbToHex(r, g, b);
  },

  /**
   * Alpha 值轉十六進位（帶補零）
   * @param {number} alpha - Alpha 值 (0-255)
   * @returns {string} - 十六進位字串（如 '4d'）
   */
  alphaToHex(alpha) {
    return Math.floor(alpha).toString(16).padStart(2, '0');
  },

  /**
   * 顏色 + Alpha 值合併為帶透明度的十六進位色碼
   * @param {string} color - 十六進位色碼（如 '#ff0000'）
   * @param {number} alpha - Alpha 值 (0-255)
   * @returns {string} - 帶透明度的色碼（如 '#ff00004d'）
   */
  withAlpha(color, alpha) {
    return color + this.alphaToHex(alpha);
  },
};

// ========================================
// 繪圖工具函式庫（Drawing Utilities）
// ========================================
// 抽離重複的繪圖邏輯，提升程式碼可維護性
DK.DrawUtils = {
  /**
   * 繪製等距菱形地磚（四邊形）
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {number} x - 中心 X 座標
   * @param {number} y - 中心 Y 座標
   * @param {number} width - 菱形寬度（水平方向）
   * @param {number} height - 菱形高度（垂直方向）
   * @param {string} color - 填充顏色
   */
  drawIsometricTile(ctx, x, y, width, height, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);                    // 上頂點
    ctx.lineTo(x + width / 2, y + height / 2);  // 右頂點
    ctx.lineTo(x, y + height);           // 下頂點
    ctx.lineTo(x - width / 2, y + height / 2);  // 左頂點
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  /**
   * 繪製等距矩形（帶頂面和側面）
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {number} x - 左上角 X 座標
   * @param {number} y - 左上角 Y 座標
   * @param {number} width - 寬度
   * @param {number} height - 高度
   * @param {string} baseColor - 基礎顏色
   * @param {Object} options - 選項 { showTop, showLeft, showRight }
   */
  drawIsometricRect(ctx, x, y, width, height, baseColor, options = {}) {
    const { showTop = true, showLeft = true, showRight = true } = options;
    const PA = DK.PixelArt;
    const ISO = PA.Isometric;

    const topColor = ISO.topLight(baseColor);
    const sideColor = ISO.sideDark(baseColor);
    const lightColor = PA.lighten(baseColor, 10);

    if (showTop) {
      PA.rect(ctx, x, y, width, 1, topColor);
    }
    if (showLeft) {
      PA.rect(ctx, x, y + 1, 1, height - 1, sideColor);
    }
    PA.rect(ctx, x + 1, y + 1, width - 2, height - 1, baseColor);
    if (showRight) {
      PA.rect(ctx, x + width - 1, y + 1, 1, height - 1, lightColor);
    }
  },

  /**
   * 繪製像素風格邊框（單像素）
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {number} x - 左上角 X 座標
   * @param {number} y - 左上角 Y 座標
   * @param {number} width - 寬度
   * @param {number} height - 高度
   * @param {string} color - 邊框顏色
   */
  drawPixelBorder(ctx, x, y, width, height, color) {
    const PA = DK.PixelArt;
    // 上邊
    PA.rect(ctx, x, y, width, 1, color);
    // 下邊
    PA.rect(ctx, x, y + height - 1, width, 1, color);
    // 左邊
    PA.rect(ctx, x, y + 1, 1, height - 2, color);
    // 右邊
    PA.rect(ctx, x + width - 1, y + 1, 1, height - 2, color);
  },

  /**
   * 繪製帶陰影的矩形（上下左右四邊陰影）
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {number} x - 左上角 X 座標
   * @param {number} y - 左上角 Y 座標
   * @param {number} width - 寬度
   * @param {number} height - 高度
   * @param {string} baseColor - 基礎顏色
   * @param {number} shadowAmount - 陰影深度（建議 10-30）
   */
  drawShadowedRect(ctx, x, y, width, height, baseColor, shadowAmount = 20) {
    const PA = DK.PixelArt;
    PA.rect(ctx, x, y, width, height, baseColor);
    const shadowColor = PA.darken(baseColor, shadowAmount);
    // 上邊陰影
    PA.rect(ctx, x, y, width, 1, shadowColor);
    // 下邊陰影
    PA.rect(ctx, x, y + height - 1, width, 1, shadowColor);
    // 左邊陰影
    PA.rect(ctx, x, y, 1, height, shadowColor);
    // 右邊陰影
    PA.rect(ctx, x + width - 1, y, 1, height, shadowColor);
  },
};

// ========================================
// 緩動函式庫（Easing Functions）
// ========================================
// 消除線性 Math.sin 動畫的機械感，提供自然流暢的緩動曲線
// 基於 Robert Penner's Easing Functions 與現代 CSS easing 標準
//
// 命名規則：
// - easeIn: 慢 → 快（加速）
// - easeOut: 快 → 慢（減速）
// - easeInOut: 慢 → 快 → 慢（先加速後減速）
//
// 參數：
// - t: 時間進度 (0-1)，0 = 起點，1 = 終點
// - 返回：緩動後的進度 (0-1)
//
// 性能：所有函式執行時間 <0.1ms，適合 60fps 動畫

DK.Easing = {
  // ========================================
  // Linear（線性）- 向後相容
  // ========================================
  /**
   * 線性插值（無緩動）
   * 用途：保持現有線性動畫行為
   */
  linear: (t) => t,

  // ========================================
  // Quadratic（二次方）- 基礎緩動
  // ========================================
  /**
   * 二次方緩入（慢 → 快）
   * 用途：平滑啟動的動畫（如：淡入、粒子加速）
   */
  easeInQuad: (t) => t * t,

  /**
   * 二次方緩出（快 → 慢）
   * 用途：平滑結束的動畫（如：淡出、減速停止）
   */
  easeOutQuad: (t) => t * (2 - t),

  /**
   * 二次方緩入緩出（慢 → 快 → 慢）
   * 用途：UI 過渡、相機平移、平滑位移
   */
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // ========================================
  // Cubic（三次方）- 強烈緩動
  // ========================================
  /**
   * 三次方緩入（極慢 → 極快）
   * 用途：戲劇性加速（如：Boss 出場、強力技能蓄力）
   */
  easeInCubic: (t) => t * t * t,

  /**
   * 三次方緩出（極快 → 極慢）
   * 用途：戲劇性減速（如：爆炸衝擊波、強力打擊）
   */
  easeOutCubic: (t) => (--t) * t * t + 1,

  /**
   * 三次方緩入緩出（極慢 → 極快 → 極慢）
   * 用途：大幅度位移、英雄移動、敵人衝刺
   */
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // ========================================
  // Quartic（四次方）- 極強緩動
  // ========================================
  /**
   * 四次方緩入（超慢 → 超快）
   * 用途：極端加速（如：隕石墜落、閃電擊中）
   */
  easeInQuart: (t) => t * t * t * t,

  /**
   * 四次方緩出（超快 → 超慢）
   * 用途：極端減速（如：彈跳結束、震波擴散）
   */
  easeOutQuart: (t) => 1 - (--t) * t * t * t,

  /**
   * 四次方緩入緩出（超慢 → 超快 → 超慢）
   * 用途：超大幅度動畫（如：Boss 瞬移、場景切換）
   */
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // ========================================
  // Sine（正弦）- 柔和緩動
  // ========================================
  /**
   * 正弦緩入（柔和加速）
   * 用途：替代線性 Math.sin，自然啟動（如：火把搖曳、水波蕩漾）
   */
  easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),

  /**
   * 正弦緩出（柔和減速）
   * 用途：自然結束（如：粒子落下、光暈消散）
   */
  easeOutSine: (t) => Math.sin(t * Math.PI / 2),

  /**
   * 正弦緩入緩出（最柔和）
   * 用途：最自然的動畫（如：地城之心脈動、傳送門旋轉、UI 淡入淡出）
   * 🌟 推薦：替代所有 Math.sin 週期動畫
   */
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // ========================================
  // Exponential（指數）- 急速變化
  // ========================================
  /**
   * 指數緩入（極慢 → 爆發）
   * 用途：魔法蓄力、能量爆發前奏
   */
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),

  /**
   * 指數緩出（爆發 → 極慢）
   * 用途：魔法爆發後、能量散逸
   */
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),

  /**
   * 指數緩入緩出（極慢 → 爆發 → 極慢）
   * 用途：強力技能全過程（如：雷暴電擊、油焰爆炸）
   */
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // ========================================
  // Elastic（彈性）- 彈簧效果
  // ========================================
  /**
   * 彈性緩出（彈簧回彈）
   * 用途：UI 彈出、按鈕按下、錯誤通知晃動
   * 🌟 推薦：替代線性 pulse 動畫
   */
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  /**
   * 彈性緩入（向後拉伸再彈出）
   * 用途：蓄力動畫、拉弓射箭
   */
  easeInElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },

  /**
   * 彈性緩入緩出（拉伸 + 彈簧）
   * 用途：極具張力的動畫（如：Boss 咆哮、強力推力陷阱）
   */
  easeInOutElastic: (t) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // ========================================
  // Bounce（彈跳）- 落地回彈
  // ========================================
  /**
   * 彈跳緩出（落地多次回彈）
   * 用途：敵人掉落、道具掉落、物理碰撞
   * 🌟 推薦：替代線性跳躍動畫
   */
  easeOutBounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },

  /**
   * 彈跳緩入（先彈跳再起飛）
   * 用途：跳躍蓄力、敵人起跳
   */
  easeInBounce: (t) => 1 - DK.Easing.easeOutBounce(1 - t),

  /**
   * 彈跳緩入緩出（兩端彈跳）
   * 用途：來回彈跳（如：電擊板反彈、推力陷阱連續推動）
   */
  easeInOutBounce: (t) => t < 0.5
    ? (1 - DK.Easing.easeOutBounce(1 - 2 * t)) / 2
    : (1 + DK.Easing.easeOutBounce(2 * t - 1)) / 2,

  // ========================================
  // Back（回彈）- 超過目標再回彈
  // ========================================
  /**
   * 回彈緩出（超過終點再回彈）
   * 用途：UI 彈性按鈕、選單項目選中
   */
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  /**
   * 回彈緩入（向後拉再加速）
   * 用途：英雄蓄力、拉弓動作
   */
  easeInBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },

  /**
   * 回彈緩入緩出（兩端超過目標）
   * 用途：相機搖晃、畫面震動
   */
  easeInOutBack: (t) => {
    const c1 = 1.70158, c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // ========================================
  // Circ（圓形）- 圓弧軌跡
  // ========================================
  /**
   * 圓形緩入（沿圓弧加速）
   * 用途：圓形路徑動畫、漩渦吸入
   */
  easeInCirc: (t) => 1 - Math.sqrt(1 - Math.pow(t, 2)),

  /**
   * 圓形緩出（沿圓弧減速）
   * 用途：圓形路徑動畫、漩渦噴出
   */
  easeOutCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),

  /**
   * 圓形緩入緩出（完整圓弧）
   * 用途：傳送門漩渦、魔法陣旋轉
   * 🌟 推薦：替代線性旋轉動畫
   */
  easeInOutCirc: (t) => t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
};

// ========================================
// 動畫工具函式（Animation Utilities）
// ========================================
DK.AnimationUtils = {
  /**
   * 線性插值（Lerp）
   * @param {number} start - 起始值
   * @param {number} end - 結束值
   * @param {number} t - 時間進度 (0-1)
   * @returns {number} - 插值結果
   * @example
   * DK.AnimationUtils.lerp(0, 100, 0.5) // 50
   */
  lerp: (start, end, t) => start + (end - start) * t,

  /**
   * 帶緩動的插值
   * @param {number} start - 起始值
   * @param {number} end - 結束值
   * @param {number} t - 時間進度 (0-1)
   * @param {function} easingFn - 緩動函式（預設：easeInOutQuad）
   * @returns {number} - 插值結果
   * @example
   * // 柔和過渡
   * DK.AnimationUtils.easedLerp(0, 100, 0.5, DK.Easing.easeInOutSine)
   *
   * // 彈性效果
   * DK.AnimationUtils.easedLerp(0, 100, 0.8, DK.Easing.easeOutElastic)
   */
  easedLerp: (start, end, t, easingFn = DK.Easing.easeInOutQuad) => {
    return DK.AnimationUtils.lerp(start, end, easingFn(t));
  },

  /**
   * 循環動畫（Ping-Pong）：0 → 1 → 0
   * @param {number} t - 時間（任意數值）
   * @returns {number} - 循環進度 (0-1)
   * @example
   * // 替代 Math.sin 的來回動畫
   * const progress = DK.AnimationUtils.pingPong(time / 500); // 0.5秒週期
   * const y = baseY + progress * 10; // 上下浮動 10px
   */
  pingPong: (t) => {
    t = t % 2;
    return t > 1 ? 2 - t : t;
  },

  /**
   * 循環動畫（帶緩動）：0 → 1 → 0（柔和過渡）
   * @param {number} t - 時間（任意數值）
   * @param {function} easingFn - 緩動函式（預設：easeInOutSine）
   * @returns {number} - 循環進度 (0-1)
   * @example
   * // 柔和的脈動動畫（替代 Math.sin 的地城之心脈動）
   * const progress = DK.AnimationUtils.easedPingPong(time / 1000, DK.Easing.easeInOutSine);
   * const alpha = 0.5 + progress * 0.3; // 0.5-0.8 脈動
   */
  easedPingPong: (t, easingFn = DK.Easing.easeInOutSine) => {
    return easingFn(DK.AnimationUtils.pingPong(t));
  },

  /**
   * 平滑步進（Smooth Step）：階梯函式的平滑版本
   * @param {number} edge0 - 起始邊界
   * @param {number} edge1 - 結束邊界
   * @param {number} x - 輸入值
   * @returns {number} - 平滑結果 (0-1)
   * @example
   * // 替代線性閾值檢查
   * const alpha = DK.AnimationUtils.smoothStep(0.3, 0.7, hpPercent); // HP 30%-70% 平滑過渡
   */
  smoothStep: (edge0, edge1, x) => {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  },

  /**
   * 更平滑的步進（Smoother Step）：比 smoothStep 更柔和
   * @param {number} edge0 - 起始邊界
   * @param {number} edge1 - 結束邊界
   * @param {number} x - 輸入值
   * @returns {number} - 平滑結果 (0-1)
   * @example
   * // 超柔和過渡
   * const color = DK.ColorUtils.mixColors('#ff0000', '#00ff00',
   *   DK.AnimationUtils.smootherStep(0, 100, enemy.hp));
   */
  smootherStep: (edge0, edge1, x) => {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * t * (t * (t * 6 - 15) + 10);
  },

  /**
   * 時間正規化（將時間戳轉換為 0-1 進度）
   * @param {number} elapsed - 已經過時間（ms）
   * @param {number} duration - 總持續時間（ms）
   * @returns {number} - 進度 (0-1)，超過 1 會 clamp
   * @example
   * const progress = DK.AnimationUtils.normalize(effect.timer, 500);
   * const alpha = DK.Easing.easeOutQuad(progress);
   */
  normalize: (elapsed, duration) => {
    return Math.max(0, Math.min(1, elapsed / duration));
  },

  /**
   * 脈動動畫（Pulse）：基於時間的週期性脈動
   * @param {number} time - 當前時間戳（ms）
   * @param {number} period - 週期（ms，預設 1000）
   * @param {number} min - 最小值（預設 0）
   * @param {number} max - 最大值（預設 1）
   * @param {function} easingFn - 緩動函式（預設：easeInOutSine）
   * @returns {number} - 脈動值
   * @example
   * // 替代：const pulse = 0.5 + 0.3 * Math.sin(time / 1000 * Math.PI)
   * const pulse = DK.AnimationUtils.pulse(time, 1000, 0.5, 0.8); // 0.5-0.8 脈動
   *
   * // 地城之心受傷時快速脈動
   * const pulse = DK.AnimationUtils.pulse(time, hpPercent < 0.3 ? 300 : 1000, 0.5, 1.0);
   */
  pulse: (time, period = 1000, min = 0, max = 1, easingFn = DK.Easing.easeInOutSine) => {
    const t = (time % period) / period;
    const eased = DK.AnimationUtils.easedPingPong(t * 2, easingFn);
    return min + (max - min) * eased;
  },

  /**
   * 波動動畫（Wave）：多相位波動（替代多個 Math.sin 組合）
   * @param {number} time - 當前時間戳（ms）
   * @param {number} period - 週期（ms）
   * @param {number} phase - 相位偏移 (0-1)
   * @param {number} amplitude - 振幅（預設 1）
   * @returns {number} - 波動值 (-amplitude ~ +amplitude)
   * @example
   * // 替代：const flicker = Math.sin(time / 150 + col * 3 + row * 7)
   * const flicker = DK.AnimationUtils.wave(time, 150, col * 0.3 + row * 0.7);
   */
  wave: (time, period, phase = 0, amplitude = 1) => {
    const t = ((time / period) + phase) % 1;
    return (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2 * amplitude * 2 - amplitude;
  },
};

// Trap definitions
DK.TRAP_TYPES = {
  // Floor traps
  SHOCK_PLATE: {
    id: 'shock_plate',
    name: '電擊板',
    description: '電擊敵人，潮濕時觸發感電',
    cost: 45,
    damage: 18,
    range: 0,
    cooldown: 1200,
    type: 'floor',
    element: 'electric',
    icon: 'shock_plate',
  },
  PUSH_TRAP: {
    id: 'push_trap',
    name: '推力陷阱',
    description: '定時推動敵人，可推入深淵秒殺',
    cost: 35,
    damage: 0,
    range: 0,
    cooldown: 3000,
    type: 'wall',
    pushForce: 2,
    icon: 'push_trap',
  },
  OIL_TRAP: {
    id: 'oil_trap',
    name: '油漬陷阱',
    description: '踩到時噴灑油漬，大幅緩速並附加油污',
    cost: 50,
    damage: 0,
    range: 0,
    cooldown: 4000,
    type: 'floor',
    element: null,
    oilDuration: 2000,
    oilSlowAmount: 0.4,
    icon: 'oil_trap',
  },
  WIND_TRAP: {
    id: 'wind_trap',
    name: '風壓陷阱',
    description: '釋放風壓推動敵人，冰凍印記觸發暴風雪',
    cost: 45,
    damage: 0,
    range: 0,
    cooldown: 3000,
    type: 'wall',
    pushForce: 1,
    element: 'ice',
    icon: 'wind_trap',
  },
};

// Evolution definitions (aura upgrade system)
DK.EVOLUTION_TYPES = {
  thunder_shock_plate: {
    baseTrap: 'shock_plate',
    name: '雷暴電擊板',
    cost: 60,
    requiredHeroElement: 'water',
    description: '連鎖範圍+2格、感電範圍+50%',
    chainRangeBonus: 2,
    electrocuteRangeBonus: 0.5,
  },
  inferno_oil_trap: {
    baseTrap: 'oil_trap',
    name: '油焰陷阱',
    cost: 80,
    requiredHeroElement: 'fire',
    description: '九宮格油沼、5秒持續、75%緩速、引爆眩暈1秒',
    oilDuration: 5000,
    oilSlowAmount: 0.25,
    igniteDamageBonus: 0.4,
    igniteDotBonus: 0.4,
    igniteRangeBonus: 0.5,
    stunDuration: 1000,
  },
  glacial_wind_trap: {
    baseTrap: 'wind_trap',
    name: '極寒風壓',
    cost: 70,
    requiredHeroElement: 'ice',
    description: '暴風雪×1.5、凍結+1秒、可推中型敵',
    blizzardMultiplier: 1.5,
    freezeBonus: 1000,
    pushMassBonus: 1,
  },
};

DK.AURA_PAIRS = {
  water: 'shock_plate',
  fire: 'oil_trap',
  ice: 'wind_trap',
};

// Enemy wave definitions
DK.ENEMY_TYPES = {
  GOBLIN: {
    id: 'goblin',
    name: '劍士',
    hp: 60,
    speed: 1.0,
    reward: 10,
    size: 0.7,
    mass: 1,
    heartDamage: 10,
  },
  SKELETON: {
    id: 'skeleton',
    name: '弓手',
    hp: 100,
    speed: 0.8,
    reward: 15,
    size: 0.85,
    mass: 2,
    heartDamage: 15,
  },
  ORC: {
    id: 'orc',
    name: '騎士',
    hp: 200,
    speed: 0.5,
    reward: 25,
    size: 1.0,
    mass: 3,
    heartDamage: 25,
  },
  SLIME: {
    id: 'slime',
    name: '盜賊',
    hp: 80,
    speed: 0.9,
    reward: 12,
    size: 0.65,
    mass: 1,
    splits: true,
    heartDamage: 5,
  },
};

// Door types
DK.DOOR_TYPES = {
  wooden: {
    name: '木門',
    maxHp: 100,
    defense: 5,
    cost: 50,
    color: '#6a5040',
    lockColor: '#4a3020', // 鎖定狀態顏色
  },
  iron: {
    name: '鐵門',
    maxHp: 300,
    defense: 15,
    cost: 150,
    color: '#5a5a6e',
    lockColor: '#3a3a4e',
  },
  magic: {
    name: '魔法門',
    maxHp: 500,
    defense: 30,
    cost: 300,
    color: '#aa44ff',
    lockColor: '#7a2acc',
  },
};

// Wave definitions
DK.WAVES = [
  { enemies: [{ type: 'GOBLIN', count: 10 }] },
  { enemies: [{ type: 'GOBLIN', count: 14 }] },
  { enemies: [{ type: 'GOBLIN', count: 8 }, { type: 'SKELETON', count: 6 }] },
  { enemies: [{ type: 'SKELETON', count: 10 }, { type: 'GOBLIN', count: 8 }] },
  { enemies: [{ type: 'ORC', count: 6 }, { type: 'GOBLIN', count: 10 }] },
  { enemies: [{ type: 'SLIME', count: 14 }] },
  { enemies: [{ type: 'ORC', count: 8 }, { type: 'SKELETON', count: 8 }] },
  { enemies: [{ type: 'GOBLIN', count: 15 }, { type: 'ORC', count: 6 }, { type: 'SLIME', count: 8 }] },
  { enemies: [{ type: 'SKELETON', count: 12 }, { type: 'ORC', count: 10 }] },
  { enemies: [{ type: 'ORC', count: 12 }, { type: 'SLIME', count: 12 }, { type: 'SKELETON', count: 8 }] },
];

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
