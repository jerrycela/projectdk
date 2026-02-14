window.DK = window.DK || {};

// 關卡定義陣列
DK.LEVELS = [
  // Level 1: 破牆試煉
  {
    id: 1,
    name: '破牆試煉',
    description: '學習破除路障與埋設障礙物的基礎技能',

    // 直線走廊（修正版 - 路徑完全連通）
    layout: [
      'OOOOOOOOOOOOOOOOOOOO',
      'OWWWWWWWEE..WWWWWWWO',  // 改為 EE..（2×2 傳送門區域）
      'OW......EE..WW....WO',  // 改為 EE..（2×2 傳送門區域）
      'OW..........WW....WO',
      'OW..........WW....WO',
      'OW..........WW....WO',
      'OW..........WW....WO',
      'OW..........WW....WO',
      'OW..........WW....WO',
      'OW..........HH....WO',  // HH 是地城之心
      'OW..........WW....WO',
      'OWWWWWWWWWWWWWWWWWWO',
      'OOOOOOOOOOOOOOOOOOOO',
    ],

    // 傳送門配置（新增）
    portals: [
      {
        id: 1,
        col: 8,   // 左上角列位置
        row: 1,   // 左上角行位置
        type: 'green',
        waves: [
          { enemies: [{ type: 'GOBLIN', count: 3 }] },
          { enemies: [{ type: 'GOBLIN', count: 5 }] },
          { enemies: [{ type: 'GOBLIN', count: 4 }, { type: 'SKELETON', count: 2 }] },
        ]
      }
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

    // L 型走廊（修正版 - 路徑完全連通）
    layout: [
      'OOOOOOOOOOOOOOOOOOOO',
      'OWWWWWWWBBWWWWWWWWWO',
      'OWEE......WW......WO',
      'OWEE......WW......WO',
      'OW........WW......WO',
      'OW........WW......WO',
      'OW........WW......WO',
      'OW..PP....WW......WO',
      'OW..PP............WO',
      'OW................WO',
      'OW..............HHWO',
      'OWWWWWWWWWWWWWWWWWWO',
      'OOOOOOOOOOOOOOOOOOOO',
    ],

    // 傳送門配置（藍色傳送門，與水坑主題搭配）
    portals: [
      {
        id: 1,
        col: 2,
        row: 2,
        type: 'blue',
        entrance: { x: 2, y: 2 },
        waves: [1, 2, 3], // 所有波次都從這個傳送門出兵
      }
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

  // Level 3: 火焰戰術
  {
    id: 3,
    name: '火焰戰術',
    description: '運用油坑與火焰陷阱製造火海',

    // Z 型走廊 + 油坑區域設計（迭代 10 最終版）
    layout: [
      'OOOOOOOOOOOOOOOOOOOO',
      'OWWWWWWWBBWWWWWWWWWO',
      'OW........WW......WO',
      'OW........WW......WO',
      'OW........WW......WO',
      'OW..GG....WWWWWWWWWO',
      'OW..GG............WO',
      'OW..WW............WO',
      'OW..WW............WO',
      'OW..WW....HH....WWWO',
      'OW..WWWWWWWWWWWWWWWO',
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
          message: '第三關：火焰戰術。\n運用油坑與火焰陷阱製造致命火海！',
          nextTrigger: 'auto',
          autoDelay: 3000,
        },
        {
          id: 'oil-intro',
          trigger: 'afterStep:welcome',
          message: '地圖上的油坑（綠色區域）可以被點燃。\n放置火焰陷阱引燃油坑，製造火焰封鎖線！',
          nextTrigger: 'auto',
          autoDelay: 3000,
        },
        {
          id: 'place-fire',
          trigger: 'afterStep:oil-intro',
          message: '試著在油坑旁邊放置火焰陷阱，\n點燃油坑製造連鎖燃燒！',
          nextTrigger: 'condition',
          condition: { type: 'trapPlaced', trapType: 'fire', count: 1 },
        },
      ],
    },
  },

  // Level 4: 組合攻勢
  {
    id: 4,
    name: '組合攻勢',
    description: '綜合運用所有元素反應',

    // 雙路徑開放區域（修正版 - 路徑完全連通）
    layout: [
      'OOOOOOOOOOOOOOOOOOOO',
      'OWWWWBBWWWWWWWBBWWWO',
      'OW................WO',
      'OW................WO',
      'OW..GG............WO',
      'OW..GG............WO',
      'OW........HH......WO',
      'OW..........PP....WO',
      'OW..........PP....WO',
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
          message: '第四關：組合攻勢。\n這裡同時有水坑和油坑，還有雙重路徑需要防守！',
          nextTrigger: 'auto',
          autoDelay: 3000,
        },
        {
          id: 'combo-intro',
          trigger: 'afterStep:welcome',
          message: '運用你學到的所有技巧：\n水坑配電擊、油坑配火焰，同時防守兩條路徑！',
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
  currentLevelIndex: 0,  // 載入 Level 1（測試傳送門系統）
  currentLevel: null,
  isTestMode: false,  // 測試模式標記

  init() {
    // 檢查 URL 參數是否為測試模式
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('test');

    if (testMode === '1') {
      this.isTestMode = true;
      this.loadTestLevel();
    } else {
      // 正常模式：載入預設關卡
      this.loadLevel(0);  // 載入 Level 1（測試傳送門系統）
    }
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
    // 只在明確請求時啟動 Tutorial（避免強制打斷遊戲流程）
    if (this.currentLevel.tutorial && DK.Tutorial && DK.Game.tutorialRequested) {
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

  /**
   * 載入測試關卡（從 localStorage）
   */
  loadTestLevel() {
    try {
      // 1. 從 localStorage 讀取測試關卡
      const testLevelData = localStorage.getItem('dk_test_level');
      if (!testLevelData) {
        alert('❌ 找不到測試關卡資料\n\n請先在編輯器中點擊「測試」按鈕。');
        // 回到正常模式
        this.isTestMode = false;
        this.loadLevel(4);
        return false;
      }

      // 2. 解析 JSON
      const level = JSON.parse(testLevelData);

      // 3. 設定為當前關卡
      this.currentLevel = level;
      this.currentLevelIndex = -1;  // 測試模式沒有 index

      // 4. 覆寫遊戲配置
      if (level.startingGold) {
        DK.CONFIG.STARTING_GOLD = level.startingGold;
      }
      if (level.dungeonHeartHP) {
        DK.CONFIG.DUNGEON_HEART_HP = level.dungeonHeartHP;
      }

      // 5. 轉換 portals 為 waves（向下相容）
      // 編輯器使用 portals 格式，遊戲使用 waves 格式
      if (level.portals && level.portals.length > 0) {
        // 合併所有傳送門的波次
        const allWaves = [];
        level.portals.forEach(portal => {
          if (portal.waves && portal.waves.length > 0) {
            allWaves.push(...portal.waves);
          }
        });

        // 設定為遊戲波次
        if (allWaves.length > 0) {
          DK.WAVES = JSON.parse(JSON.stringify(allWaves));
        }
      } else if (level.waves) {
        // 如果是舊格式（直接使用 waves）
        DK.WAVES = JSON.parse(JSON.stringify(level.waves));
      }

      // 6. 在控制台顯示測試關卡資訊（DEBUG 模式）
      if (DK.DEBUG_MODE) {
        DK.ErrorHandler.log('info', 'Test level loaded', {
          name: level.name,
          size: `${level.layout[0].length}×${level.layout.length}`,
          portals: level.portals?.length || 0,
          waves: DK.WAVES?.length || 0,
          gold: level.startingGold,
          hp: level.dungeonHeartHP
        });
      }

      return true;
    } catch (e) {
      console.error('❌ 載入測試關卡失敗:', e);
      alert(`❌ 載入測試關卡失敗：\n\n${e.message}\n\n將回到正常模式。`);
      // 回到正常模式
      this.isTestMode = false;
      this.loadLevel(4);
      return false;
    }
  },
};
