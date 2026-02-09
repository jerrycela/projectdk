window.DK = window.DK || {};

// 關卡定義陣列
DK.LEVELS = [
  // Level 1: 破牆試煉
  {
    id: 1,
    name: '破牆試煉',
    description: '學習破除路障與埋設障礙物的基礎技能',

    // 簡化地圖 20×13（每行精確 20 字元）
    layout: [
      'OOOOOOOOOOOOOOOOOOOO',
      'OWBBBBBBBBBBBBBBBBWO',
      'OW................WO',
      'OW................WO',
      'OW................WO',
      'OW................WO',
      'OW.......H........WO',
      'OW................WO',
      'OW................WO',
      'OW................WO',
      'OW................WO',
      'OWWWWWWWWWWWWWWWWWWO',
      'OOOOOOOOOOOOOOOOOOOO',
    ],

    waves: [
      { enemies: [{ type: 'GOBLIN', count: 3 }] },
      { enemies: [{ type: 'GOBLIN', count: 5 }] },
      { enemies: [{ type: 'GOBLIN', count: 4 }, { type: 'SKELETON', count: 2 }] },
    ],

    startingGold: 1000,
    dungeonHeartHP: 50,

    tutorial: {
      steps: [
        {
          id: 'welcome',
          trigger: 'onLoad',
          message: '歡迎來到地層防禦訓練！這是第一關：破牆試煉。\n你將學習如何埋設路障與應對破牆攻擊。',
          nextTrigger: 'auto',
          autoDelay: 3000,
        },
        {
          id: 'place-barricade',
          trigger: 'afterStep:welcome',
          message: '點擊右下角的「路障」按鈕，然後在地圖上放置一個路障。\n路障可以延遲敵人的前進速度。',
          highlight: { type: 'ui', element: 'barricadeButton' },
          nextTrigger: 'condition',
          condition: { type: 'barricadePlaced', count: 1 },
        },
        {
          id: 'start-wave',
          trigger: 'afterStep:place-barricade',
          message: '做得好！現在點擊「開始第 1 波」按鈕，\n讓我們看看敵人如何破牆。',
          highlight: { type: 'ui', element: 'waveButton' },
          nextTrigger: 'condition',
          condition: { type: 'waveStarted', wave: 1 },
        },
        {
          id: 'observe-breach',
          trigger: 'afterStep:start-wave',
          message: '注意觀察！敵人會破壞路障，\n但這給了你寶貴的時間來佈置陷阱。',
          nextTrigger: 'auto',
          autoDelay: 4000,
        },
        {
          id: 'place-trap',
          trigger: 'afterStep:observe-breach',
          message: '現在放置一個陷阱（電擊或火焰都可以），\n在敵人必經之路上消滅他們！',
          nextTrigger: 'condition',
          condition: { type: 'trapPlaced', count: 1 },
        },
      ],
    },
  },

  // Level 2: 水坑戰術
  {
    id: 2,
    name: '水坑戰術',
    description: '掌握水元素與電擊陷阱的協同作戰',

    layout: [
      'OOOOOOOOOOOOOOOOOOOO',
      'OWBBBBBBBBBBBBBBBBWO',
      'OW................WO',
      'OW..PP............WO',
      'OW..PP............WO',
      'OW................WO',
      'OW.......H........WO',
      'OW................WO',
      'OW................WO',
      'OW................WO',
      'OW................WO',
      'OWWWWWWWWWWWWWWWWWWO',
      'OOOOOOOOOOOOOOOOOOOO',
    ],

    waves: [
      { enemies: [{ type: 'GOBLIN', count: 5 }] },
      { enemies: [{ type: 'GOBLIN', count: 6 }, { type: 'SKELETON', count: 2 }] },
      { enemies: [{ type: 'SKELETON', count: 4 }, { type: 'ORC', count: 1 }] },
    ],

    startingGold: 1200,
    dungeonHeartHP: 60,

    tutorial: {
      steps: [
        {
          id: 'welcome',
          trigger: 'onLoad',
          message: '這是第二關：水坑戰術。\n學習如何利用水坑強化電擊陷阱的威力！',
          nextTrigger: 'auto',
          autoDelay: 3000,
        },
        {
          id: 'puddle-intro',
          trigger: 'afterStep:welcome',
          message: '地圖上的水坑（藍色區域）可以傳導電流。\n在水坑附近放置電擊陷阱將產生範圍傷害！',
          nextTrigger: 'auto',
          autoDelay: 3000,
        },
        {
          id: 'place-shock',
          trigger: 'afterStep:puddle-intro',
          message: '試著在水坑旁邊放置一個電擊陷阱。',
          nextTrigger: 'condition',
          condition: { type: 'trapPlaced', trapType: 'shock', count: 1 },
        },
        {
          id: 'start-wave',
          trigger: 'afterStep:place-shock',
          message: '很好！現在點擊「開始波次」按鈕，\n看看水坑與電擊的組合效果！',
          highlight: { type: 'ui', element: 'waveButton' },
          nextTrigger: 'condition',
          condition: { type: 'waveStarted', wave: 1 },
        },
      ],
    },
  },

  // Level 3: 火焰軌道
  {
    id: 3,
    name: '火焰軌道',
    description: '運用軌道與油坑製造火海',

    layout: [
      'OOOOOOOOOOOOOOOOOOOO',
      'OWBBBBBBBBBBBBBBBBWO',
      'OW................WO',
      'OW................WO',
      'OW..RRRRRR........WO',
      'OW..RRRRRR........WO',
      'OW.......H........WO',
      'OW................WO',
      'OW................WO',
      'OW................WO',
      'OW................WO',
      'OWWWWWWWWWWWWWWWWWWO',
      'OOOOOOOOOOOOOOOOOOOO',
    ],

    waves: [
      { enemies: [{ type: 'GOBLIN', count: 8 }] },
      { enemies: [{ type: 'SKELETON', count: 5 }, { type: 'ORC', count: 2 }] },
      { enemies: [{ type: 'ORC', count: 3 }, { type: 'TROLL', count: 1 }] },
    ],

    startingGold: 1500,
    dungeonHeartHP: 70,

    tutorial: {
      steps: [
        {
          id: 'welcome',
          trigger: 'onLoad',
          message: '第三關：火焰軌道。\n軌道會引導投射物，結合油坑陷阱製造火海！',
          nextTrigger: 'auto',
          autoDelay: 3000,
        },
        {
          id: 'rail-intro',
          trigger: 'afterStep:welcome',
          message: '軌道（灰色區域）可以改變投射物的方向。\n利用它們建立火焰封鎖線！',
          nextTrigger: 'auto',
          autoDelay: 3000,
        },
        {
          id: 'place-oil',
          trigger: 'afterStep:rail-intro',
          message: '放置油坑陷阱，再用火焰陷阱點燃它！',
          nextTrigger: 'condition',
          condition: { type: 'trapPlaced', trapType: 'oil', count: 1 },
        },
      ],
    },
  },

  // Level 4: 組合攻勢
  {
    id: 4,
    name: '組合攻勢',
    description: '綜合運用所有元素反應',

    layout: [
      'OOOOOOOOOOOOOOOOOOOO',
      'OWBBBBBBBBBBBBBBBBWO',
      'OW................WO',
      'OW..PP......RR....WO',
      'OW..PP......RR....WO',
      'OW................WO',
      'OW.......H........WO',
      'OW................WO',
      'OW................WO',
      'OW................WO',
      'OW................WO',
      'OWWWWWWWWWWWWWWWWWWO',
      'OOOOOOOOOOOOOOOOOOOO',
    ],

    waves: [
      { enemies: [{ type: 'GOBLIN', count: 10 }] },
      { enemies: [{ type: 'SKELETON', count: 6 }, { type: 'ORC', count: 3 }] },
      { enemies: [{ type: 'ORC', count: 4 }, { type: 'TROLL', count: 2 }] },
      { enemies: [{ type: 'TROLL', count: 3 }, { type: 'DARK_KNIGHT', count: 1 }] },
    ],

    startingGold: 2000,
    dungeonHeartHP: 80,

    tutorial: {
      steps: [
        {
          id: 'welcome',
          trigger: 'onLoad',
          message: '第四關：組合攻勢。\n這裡同時有水坑和軌道，運用你學到的所有技巧！',
          nextTrigger: 'auto',
          autoDelay: 3000,
        },
        {
          id: 'combo-intro',
          trigger: 'afterStep:welcome',
          message: '嘗試組合不同的陷阱與元素反應，\n創造最強的防禦線！',
          nextTrigger: 'auto',
          autoDelay: 3000,
        },
      ],
    },
  },

  // Level 5: 完整挑戰
  {
    id: 5,
    name: '完整挑戰',
    description: '綜合運用所有技能的最終試煉',
    layout: 'original',
    waves: 'original',
    startingGold: null,
    dungeonHeartHP: null,
    tutorial: null,
  },
];

// LevelManager
DK.LevelManager = {
  currentLevelIndex: 0,
  currentLevel: null,

  init() {
    this.loadLevel(0);
  },

  loadLevel(index) {
    if (index < 0 || index >= DK.LEVELS.length) return false;

    this.currentLevelIndex = index;
    this.currentLevel = DK.LEVELS[index];

    // 覆寫波次（如果不是 'original'）
    if (this.currentLevel.waves && this.currentLevel.waves !== 'original') {
      DK.WAVES = JSON.parse(JSON.stringify(this.currentLevel.waves));
    }

    // 覆寫遊戲配置
    if (this.currentLevel.startingGold) {
      DK.CONFIG.STARTING_GOLD = this.currentLevel.startingGold;
    }
    if (this.currentLevel.dungeonHeartHP) {
      DK.CONFIG.DUNGEON_HEART_HP = this.currentLevel.dungeonHeartHP;
    }

    // 初始化教學系統（向下相容檢查）
    if (this.currentLevel.tutorial && DK.Tutorial) {
      DK.Tutorial.init(this.currentLevel.tutorial);
    }

    return true;
  },

  nextLevel() {
    const nextIndex = this.currentLevelIndex + 1;
    if (nextIndex >= DK.LEVELS.length) {
      return false; // 所有關卡完成
    }

    this.loadLevel(nextIndex);
    // 重新初始化遊戲
    if (DK.Game) DK.Game.init();
    return true;
  },

  getCurrentLevel() {
    return this.currentLevel;
  },

  getTotalLevels() {
    return DK.LEVELS.length;
  },

  getCurrentLevelIndex() {
    return this.currentLevelIndex;
  },
};
