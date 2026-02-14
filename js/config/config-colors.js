/**
 * Dungeon Keep - Color System
 * 系統化色彩管理：18 大分組 + 向後相容層
 */

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
        // 深海女巫風格新增色彩
        cloak: '#1a3a6a',
        cloakDark: '#0e2a4a',
        cloakEdge: '#4488cc',
        hairDark: '#3a5a8a',
        hairMid: '#6a8aaa',
        hairLight: '#8aaacc',
        hairTip: '#aaccee',
        crown: '#c0d0e8',
        crownGem: '#4488dd',
        eyeShadow: '#6688aa',
        wavePattern: '#2a4a7a',
      },
      // 巴爾（火法師）深紅紫禮服
      fire: {
        robe: '#6a3a5a',
        robeDark: '#4a2a3a',
        robeLight: '#8a5a7a',
        gem: '#ffaa44',
        // 火焰女皇風格新增色彩
        cloak: '#5a2030',
        cloakDark: '#3a1020',
        cloakEdge: '#8a4060',
        armor: '#8a6a40',
        armorLight: '#ccaa60',
        armorDark: '#5a4a20',
        hairTip: '#ffaa44',
        crownDark: '#cc8800',
        flameTip: '#ffdd66',
        emblem: '#ff6622',
        chainGold: '#ddaa30',
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

    // Heroes (共用)
    HERO_SKIN: chars.hero.skin,
    HERO_SELECTED: chars.hero.selected,
    HERO_HAIR_DARK: chars.hero.hair.dark,
    HERO_HAIR_MID: chars.hero.hair.mid,
    HERO_HAIR_LIGHT: chars.hero.hair.light,
    HERO_CROWN_GOLD: chars.hero.crown.gold,
    HERO_CROWN_GEM: chars.hero.crown.gem,
    HERO_GOLD: chars.hero.decoration.gold,
    HERO_FUR_WHITE: chars.hero.decoration.furWhite,

    // Water Mage (Leviathan) - Deep Sea Witch
    HERO_ROBE: chars.hero.water.robe,
    HERO_ROBE_DARK: chars.hero.water.robeDark,
    HERO_ROBE_LIGHT: chars.hero.water.robeLight,
    HERO_GEM_WATER: chars.hero.water.gem,
    HERO_PEARL: chars.hero.water.pearl,
    HERO_SILVER: chars.hero.water.silver,
    HERO_WATER_CLOAK: chars.hero.water.cloak,
    HERO_WATER_CLOAK_DARK: chars.hero.water.cloakDark,
    HERO_WATER_CLOAK_EDGE: chars.hero.water.cloakEdge,
    HERO_WATER_HAIR_DARK: chars.hero.water.hairDark,
    HERO_WATER_HAIR_MID: chars.hero.water.hairMid,
    HERO_WATER_HAIR_LIGHT: chars.hero.water.hairLight,
    HERO_WATER_HAIR_TIP: chars.hero.water.hairTip,
    HERO_WATER_CROWN: chars.hero.water.crown,
    HERO_WATER_CROWN_GEM: chars.hero.water.crownGem,
    HERO_WATER_EYE_SHADOW: chars.hero.water.eyeShadow,
    HERO_WATER_WAVE_PATTERN: chars.hero.water.wavePattern,

    // Fire Mage (Baal) - Fire Queen
    HERO_FIRE_ROBE: chars.hero.fire.robe,
    HERO_FIRE_ROBE_DARK: chars.hero.fire.robeDark,
    HERO_FIRE_ROBE_LIGHT: chars.hero.fire.robeLight,
    HERO_GEM_FIRE: chars.hero.fire.gem,
    HERO_FIRE_CLOAK: chars.hero.fire.cloak,
    HERO_FIRE_CLOAK_DARK: chars.hero.fire.cloakDark,
    HERO_FIRE_CLOAK_EDGE: chars.hero.fire.cloakEdge,
    HERO_FIRE_ARMOR: chars.hero.fire.armor,
    HERO_FIRE_ARMOR_LIGHT: chars.hero.fire.armorLight,
    HERO_FIRE_ARMOR_DARK: chars.hero.fire.armorDark,
    HERO_FIRE_HAIR_TIP: chars.hero.fire.hairTip,
    HERO_FIRE_CROWN_DARK: chars.hero.fire.crownDark,
    HERO_FIRE_FLAME_TIP: chars.hero.fire.flameTip,
    HERO_FIRE_EMBLEM: chars.hero.fire.emblem,
    HERO_FIRE_CHAIN_GOLD: chars.hero.fire.chainGold,
  };

  // 將平面結構合併到 DK.COLORS（向後相容）
  Object.assign(DK.COLORS, flatColors);
})();
