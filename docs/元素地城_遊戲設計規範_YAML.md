# **《元素地城》遊戲設計文件（YAML 格式）**

elemental_dungeon_game_design:

  metadata:
    game_title: "元素地城 (Elemental Dungeon)"
    genre: "塔防 (Tower Defense) / 策略 (Strategy)"
    version: "1.0"
    document_date: "2026-02"
    development_period: "12 個月"
    target_platform: "Web (Phaser.js)"
    art_style: "像素藝術 (Pixel Art)"
    base_resolution: "32x32 像素"

  executive_summary:
    concept: "結合元素反應系統的創新塔防遊戲"
    inspiration: "Dungeon Warfare 系列 + 原神元素系統"
    core_innovation:
      - "元素反應連鎖系統"
      - "英雄單位部署機制"
      - "陷阱與法術協同效應"
    unique_selling_points:
      elemental_reactions: "5種基礎元素產生15+種元素反應，帶來深度策略體驗"
      hero_system: "可部署英雄施放元素法術，與陷阱系統產生協同效應"
      classic_gameplay: "繼承《Dungeon Warfare》的優秀地城陷阱設計"
      pixel_art: "精緻像素藝術，兼具懷舊感與現代審美"
      web_based: "基於 Phaser.js，無需下載即可在瀏覽器中遊玩"

  # ═══════════════════════════════════════════════════════════════
  # 第一章：元素系統
  # ═══════════════════════════════════════════════════════════════

  elemental_system:

    base_elements:

      hydro:
        name: "水 (Hydro)"
        color_hex: "#3498DB"
        status_name: "潮濕 (Wet)"
        duration: "8 秒"
        base_effect: "潮濕敵人受到冰/雷傷害增加"
        visual_indicator: "藍色水滴圖標 + 身體泛藍光"

      pyro:
        name: "火 (Pyro)"
        color_hex: "#E74C3C"
        status_name: "灼燒 (Burning)"
        duration: "5 秒"
        base_effect: "每秒造成 5 點傷害"
        visual_indicator: "紅色火焰圖標 + 身體冒火"

      electro:
        name: "雷 (Electro)"
        color_hex: "#9B59B6"
        status_name: "感電 (Electrified)"
        duration: "6 秒"
        base_effect: "移動時 15% 機率麻痺 0.5 秒"
        visual_indicator: "紫色閃電圖標 + 電弧環繞"

      cryo:
        name: "冰 (Cryo)"
        color_hex: "#5DADE2"
        status_name: "冰凍 (Chilled)"
        duration: "6 秒"
        base_effect: "減速 40%"
        visual_indicator: "淺藍雪花圖標 + 身體結霜"

      toxic:
        name: "毒 (Toxic)"
        color_hex: "#27AE60"
        status_name: "中毒 (Poisoned)"
        duration: "10 秒"
        base_effect: "每秒 3 點真實傷害，可疊加 3 層"
        visual_indicator: "綠色骷髏圖標 + 綠色毒霧"

    special_states:

      oil:
        name: "油 (Oil)"
        color_hex: "#8B4513"
        status_name: "油污 (Oiled)"
        duration: "12 秒"
        base_effect: "減速 30%，大幅增加火焰傷害"
        visual_indicator: "棕色油滴圖標 + 黑色油漬"

      metal:
        name: "金屬 (Metal)"
        color_hex: "#BDC3C7"
        status_name: "導電體 (Conductive)"
        duration: "15 秒"
        base_effect: "雷電傷害 +100%，傳導周圍敵人"
        visual_indicator: "銀色齒輪圖標 + 金屬光澤"

    # ─────────────────────────────────────────────────────────────
    # 元素反應矩陣（核心機制）
    # ─────────────────────────────────────────────────────────────

    elemental_reactions:

      # 水系反應
      water_reactions:

        electro_charged:
          name: "感電 (Electro-Charged)"
          trigger: "潮濕 + 雷"
          damage: 80
          damage_type: "雷電"
          control_effect: "麻痺 1.5 秒"
          aoe_range: "2 格"
          aoe_damage_ratio: "50%"
          color_indicator: "#9B59B6"
          priority: "S 級（最強控制）"
          strategy_note: "遊戲中最強力的控制型反應，配合水系英雄可大範圍麻痺敵群"

        vaporize:
          name: "蒸發 (Vaporize)"
          trigger: "潮濕 + 火"
          damage_multiplier: "2.5x"
          secondary_effect: "產生蒸氣雲霧"
          cloud_duration: "3 秒"
          cloud_effect: "視野受阻，移動速度 -20%"
          color_indicator: "#E74C3C"
          priority: "A 級（高傷害）"
          strategy_note: "單體高傷害輸出，適合對付血量高的敵人"

        frozen:
          name: "凍結 (Frozen)"
          trigger: "潮濕 + 冰"
          control_duration: "3 秒"
          control_type: "完全凍結（無法移動與攻擊）"
          physical_damage_bonus: "+30%"
          weakness: "火焰傷害會解除凍結"
          color_indicator: "#3498DB"
          priority: "A 級（強控制）"
          strategy_note: "配合物理陷阱可造成大量傷害，但注意火焰會解除"

        toxic_water:
          name: "毒水 (Toxic Water)"
          trigger: "潮濕 + 毒"
          spread_range: "3 格"
          poison_damage_bonus: "+50%"
          ground_effect: "毒水地帶"
          ground_duration: "5 秒"
          color_indicator: "#1ABC9C"
          priority: "B 級（範圍擴散）"
          strategy_note: "適合對付大量弱小敵人，擴散毒素效率高"

      # 火系反應
      fire_reactions:

        oil_explosion:
          name: "油爆 (Oil Explosion)"
          trigger: "油污 + 火"
          damage: 150
          aoe_range: "3 格"
          ground_fire_duration: "5 秒"
          ground_fire_damage: "10/秒"
          color_indicator: "#E67E22"
          priority: "S 級（最高範圍傷害）"
          strategy_note: "遊戲中傷害最高的範圍反應，油污地板+火焰是經典組合"

        melt:
          name: "融化 (Melt)"
          trigger: "冰凍 + 火"
          damage_multiplier: "3x"
          armor_reduction: "20%"
          removes_frozen: true
          color_indicator: "#E74C3C"
          priority: "A 級（爆發傷害）"
          strategy_note: "先凍後燒的經典連招，對高護甲敵人特別有效"

        overload:
          name: "超載 (Overload)"
          trigger: "感電 + 火 或 灼燒 + 雷"
          damage: 100
          aoe_range: "2 格"
          knockback: "2 格"
          bonus_vs_mechanical: "+100%"
          color_indicator: "#8E44AD"
          priority: "A 級（控制+傷害）"
          strategy_note: "擊退效果可將敵人推回陷阱區，對機械敵人效果翻倍"

        burning_poison:
          name: "燃毒 (Burning Poison)"
          trigger: "中毒 + 火"
          instant_damage: "剩餘毒素傷害 x 300%"
          clears_poison: true
          color_indicator: "#C0392B"
          priority: "B 級（收割）"
          strategy_note: "適合收割殘血敵人，但會清除中毒狀態需謹慎使用"

      # 雷系反應
      lightning_reactions:

        superconduct:
          name: "超導 (Superconduct)"
          trigger: "冰凍 + 雷"
          damage: 60
          aoe_range: "2 格"
          defense_reduction: "物理防禦 -40%"
          debuff_duration: "8 秒"
          color_indicator: "#5DADE2"
          priority: "A 級（減防）"
          strategy_note: "配合物理陷阱使用，大幅提升物理傷害輸出"

        conduction:
          name: "導電 (Conduction)"
          trigger: "金屬 + 雷"
          damage_bonus: "+100%"
          chain_range: "5 格"
          auto_apply_metal: "穿戴盔甲敵人自動附加金屬狀態"
          color_indicator: "#F1C40F"
          priority: "A 級（連鎖）"
          strategy_note: "對付穿戴盔甲的精英敵人特別有效"

        electrolysis:
          name: "電解 (Electrolysis)"
          trigger: "中毒 + 雷"
          aoe_damage: "15/秒"
          aoe_range: "2 格"
          aoe_duration: "6 秒"
          attack_reduction: "-25%"
          color_indicator: "#1ABC9C"
          priority: "B 級（持續削弱）"
          strategy_note: "產生持續範圍傷害並削弱敵人攻擊力"

      # 冰系反應
      ice_reactions:

        cryo_toxin:
          name: "冰毒 (Cryo Toxin)"
          trigger: "冰凍 + 毒"
          poison_duration_extension: "延長至 20 秒"
          poison_damage_bonus: "+25%/秒"
          on_thaw_effect: "解凍時產生毒霧影響周圍"
          color_indicator: "#16A085"
          priority: "B 級（持續傷害）"
          strategy_note: "延長毒素持續時間，適合持久消耗戰"

        frozen_oil:
          name: "寒油 (Frozen Oil)"
          trigger: "油污 + 冰"
          slow_effect: "60%"
          slow_duration: "8 秒"
          delayed_explosion: "受火焰攻擊時，2秒後爆炸，傷害+50%"
          color_indicator: "#2980B9"
          priority: "B 級（陷阱準備）"
          strategy_note: "為後續火焰攻擊做準備，延遲爆炸傷害更高"

    # ─────────────────────────────────────────────────────────────
    # 元素反應速查表
    # ─────────────────────────────────────────────────────────────

    reaction_matrix:
      description: "橫軸為當前狀態，縱軸為觸發元素"
      matrix:
        #           潮濕      灼燒      冰凍      感電      中毒
        水:       [ "-",     "蒸發",   "凍結",   "-",      "毒水"   ]
        火:       [ "蒸發",  "-",      "融化",   "超載",   "燃毒"   ]
        雷:       [ "感電",  "超載",   "超導",   "-",      "電解"   ]
        冰:       [ "凍結",  "融化",   "-",      "超導",   "冰毒"   ]
        毒:       [ "毒水",  "燃毒",   "冰毒",   "電解",   "-"      ]

    element_gauge_system:
      description: "元素附著量系統"
      gauge_units:
        weak_application: "1U（弱附著）"
        strong_application: "2U（強附著）"
      decay_rate: "自然衰減：0.5U/秒"
      reaction_consumption:
        strong_reaction: "消耗 2U（感電、油爆、凍結）"
        normal_reaction: "消耗 1U（蒸發、融化、超導）"
        weak_reaction: "消耗 0.5U（毒水、電解）"

  # ═══════════════════════════════════════════════════════════════
  # 第二章：陷阱系統
  # ═══════════════════════════════════════════════════════════════

  trap_system:

    trap_categories:

      floor_traps:
        description: "放置於地面，敵人踩踏時觸發"
        placement: "走廊地面格子"

        spike_trap:
          name: "尖刺陷阱"
          element: "物理"
          cost: 100
          damage: 30
          cooldown: "0.5 秒"
          special: "無"
          upgrade_path:
            lv2: { cost: 60, damage: 40 }
            lv3: { cost: 100, damage: 55, unlock: "穿透：無視 20% 護甲" }
            lv4: { cost: 150, damage: 70 }
            lv5: { cost: 220, damage: 90, unlock: "致命刺穿：10% 機率造成雙倍傷害" }

        flame_jet:
          name: "火焰噴射器"
          element: "火"
          cost: 200
          damage: "25/秒"
          cooldown: "持續"
          special: "附加灼燒狀態"
          upgrade_path:
            lv2: { cost: 120, damage: "35/秒" }
            lv3: { cost: 200, damage: "45/秒", unlock: "烈焰：灼燒傷害 +50%" }
            lv4: { cost: 300, damage: "60/秒" }
            lv5: { cost: 450, damage: "80/秒", unlock: "地獄火：範圍擴大至相鄰格子" }

        frost_floor:
          name: "冰凍地板"
          element: "冰"
          cost: 180
          damage: 15
          cooldown: "2 秒"
          special: "減速 50%，附加冰凍狀態"
          upgrade_path:
            lv2: { cost: 110, damage: 20, slow: "55%" }
            lv3: { cost: 180, damage: 30, unlock: "極寒：冰凍持續時間 +2 秒" }
            lv4: { cost: 280, damage: 40, slow: "65%" }
            lv5: { cost: 400, damage: 55, unlock: "絕對零度：15% 機率直接凍結 2 秒" }

        shock_plate:
          name: "電擊板"
          element: "雷"
          cost: 250
          damage: 40
          cooldown: "1.5 秒"
          special: "連鎖 3 個目標，附加感電狀態"
          upgrade_path:
            lv2: { cost: 150, damage: 50, chain_targets: 4 }
            lv3: { cost: 250, damage: 65, chain_targets: 5, unlock: "過載：對潮濕目標傷害 +50%" }
            lv4: { cost: 400, damage: 80, chain_targets: 6 }
            lv5: { cost: 600, damage: 100, chain_targets: 8, unlock: "雷霆之怒：20% 機率雙倍傷害" }

        poison_vent:
          name: "毒氣噴口"
          element: "毒"
          cost: 150
          damage: "10/秒"
          cooldown: "持續"
          special: "附加中毒狀態（持續 10 秒）"
          upgrade_path:
            lv2: { cost: 90, damage: "15/秒" }
            lv3: { cost: 150, damage: "20/秒", unlock: "劇毒：中毒可疊加至 5 層" }
            lv4: { cost: 230, damage: "28/秒" }
            lv5: { cost: 350, damage: "38/秒", unlock: "瘟疫：中毒敵人死亡時擴散毒素" }

        oil_slick:
          name: "油污地板"
          element: "油"
          cost: 80
          damage: 0
          cooldown: "-"
          special: "附加油污狀態，減速 30%"
          upgrade_path:
            lv2: { cost: 50, slow: "35%" }
            lv3: { cost: 80, slow: "40%", unlock: "黏稠：油污持續時間 +5 秒" }
            lv4: { cost: 120, slow: "50%" }
            lv5: { cost: 180, unlock: "易燃油：火焰反應傷害 +30%" }

        water_jet:
          name: "水流陷阱"
          element: "水"
          cost: 120
          damage: 5
          cooldown: "1 秒"
          special: "擊退敵人 1 格，附加潮濕狀態"
          upgrade_path:
            lv2: { cost: 70, damage: 10, knockback: "1 格" }
            lv3: { cost: 120, damage: 15, knockback: "2 格", unlock: "激流：潮濕持續時間 +4 秒" }
            lv4: { cost: 180, damage: 25, knockback: "2 格" }
            lv5: { cost: 280, damage: 35, knockback: "3 格", unlock: "洪水：擊退路徑上其他敵人" }

      wall_traps:
        description: "安裝於牆壁上，具有較遠射程"
        placement: "牆壁格子"

        arrow_launcher:
          name: "弓箭發射器"
          element: "物理"
          cost: 150
          damage: 25
          range: "5 格"
          special: "穿透 2 個敵人"

        fireball_launcher:
          name: "火球發射器"
          element: "火"
          cost: 300
          damage: 50
          range: "4 格"
          special: "範圍傷害（1 格），附加灼燒"

        lightning_tower:
          name: "閃電塔"
          element: "雷"
          cost: 400
          damage: 35
          range: "6 格"
          special: "優先攻擊潮濕目標"

        frost_ray:
          name: "寒冰射線"
          element: "冰"
          cost: 280
          damage: "20"
          range: "5 格"
          special: "持續照射減速，最終冰凍"

        spinning_blade:
          name: "旋轉刀片"
          element: "物理"
          cost: 350
          damage: 40
          range: "3 格"
          special: "高頻率攻擊（0.3 秒/次）"

      mechanism_traps:
        description: "大型互動式陷阱，高費用高收益"
        placement: "特殊位置"

        boulder_trap:
          name: "巨石滾落"
          cost: 500
          size: "1x1 觸發點"
          effect: "召喚滾動巨石，沿直線造成 200 傷害並擊退"
          cooldown: "30 秒"

        falling_rocks:
          name: "落石機關"
          cost: 400
          size: "2x2"
          effect: "大範圍物理傷害 150，可砸毀護甲"
          cooldown: "20 秒"

        teleporter:
          name: "傳送門"
          cost: 600
          size: "1x1"
          effect: "將敵人傳送回起點"
          cooldown: "45 秒"

        elemental_furnace:
          name: "元素熔爐"
          cost: 800
          size: "2x2"
          effect: "強化周圍 3 格內陷阱元素效果 +50%"
          type: "被動增益"

  # ═══════════════════════════════════════════════════════════════
  # 第三章：英雄系統
  # ═══════════════════════════════════════════════════════════════

  hero_system:

    hero_mechanics:
      max_deploy_per_level: 2
      deployment_location: "英雄位（特殊格子）"
      can_move: true
      move_restriction: "只能移動至相鄰英雄位"
      death_penalty: "需等待 3 波次才能重新部署"
      mana_regeneration: "自動恢復"
      level_cap: 10

    heroes:

      eileen:
        name: "艾琳 (Eileen)"
        title: "水系法師"
        element: "水 (Hydro)"
        role: "元素附著專家"
        stats:
          health: 200
          mana: 100
          mana_regen: "5/秒"
          attack_range: "4 格"
        color_theme: "#3498DB"

        skills:
          basic_attack:
            name: "水球術 (Water Bolt)"
            type: "普通攻擊"
            mana_cost: 10
            damage: 15
            cooldown: "1 秒"
            effect: "附加潮濕狀態 8 秒"

          skill_2:
            name: "暴雨領域 (Rain Domain)"
            type: "範圍技能"
            mana_cost: 50
            damage: "5/秒"
            cooldown: "15 秒"
            duration: "6 秒"
            aoe: "3x3"
            effect: "範圍內敵人持續附加潮濕狀態"
            unlock_level: 3
            strategy: "配合電擊陷阱可持續觸發感電反應"

          ultimate:
            name: "海嘯 (Tsunami)"
            type: "終極技能"
            mana_cost: 100
            damage: 100
            cooldown: "60 秒"
            effect: "橫掃走廊，擊退 5 格，附加潮濕 15 秒"
            unlock_level: 7

      aether:
        name: "乙太 (Aether)"
        title: "雷系法師"
        element: "雷 (Electro)"
        role: "高傷害輸出"
        stats:
          health: 150
          mana: 120
          mana_regen: "6/秒"
          attack_range: "5 格"
        color_theme: "#9B59B6"

        skills:
          basic_attack:
            name: "雷擊 (Lightning Strike)"
            type: "普通攻擊"
            mana_cost: 15
            damage: 30
            cooldown: "1.5 秒"
            effect: "對潮濕目標傷害 +50% 並觸發感電"

          skill_2:
            name: "連鎖閃電 (Chain Lightning)"
            type: "多目標技能"
            mana_cost: 40
            damage: 25
            cooldown: "8 秒"
            chain_count: 5
            damage_decay: "-10%/次"
            effect: "附加感電狀態"
            unlock_level: 3

          ultimate:
            name: "雷霆風暴 (Thunder Storm)"
            type: "終極技能"
            mana_cost: 120
            damage: "40/0.5秒"
            cooldown: "90 秒"
            duration: "8 秒"
            aoe: "5x5"
            effect: "潮濕敵人全體受到傷害"
            unlock_level: 7

      freya:
        name: "芙蕾雅 (Freya)"
        title: "火系戰士"
        element: "火 (Pyro)"
        role: "近戰坦克"
        stats:
          health: 350
          mana: 80
          mana_regen: "4/秒"
          attack_range: "2 格（近戰）"
        color_theme: "#E74C3C"

        skills:
          basic_attack:
            name: "烈焰斬 (Flame Slash)"
            type: "普通攻擊"
            mana_cost: 10
            damage: 35
            cooldown: "2 秒"
            effect: "扇形範圍，附加灼燒狀態"

          skill_2:
            name: "火焰護盾 (Flame Shield)"
            type: "防禦技能"
            mana_cost: 30
            shield: 100
            cooldown: "12 秒"
            duration: "5 秒"
            aura_damage: "10/秒"
            effect: "吸收傷害，靠近敵人受火焰傷害"
            unlock_level: 3

          passive:
            name: "阻擋者 (Blocker)"
            type: "被動能力"
            effect: "可阻擋最多 3 名敵人前進，被阻擋敵人會攻擊芙蕾雅"

    hero_level_progression:
      per_level_bonus:
        health: "+20"
        mana: "+10"
        damage: "+5%"
      milestone_unlocks:
        lv3: "解鎖技能二"
        lv5: "解鎖被動能力或技能強化"
        lv7: "解鎖終極技能"
        lv10: "解鎖覺醒形態（外觀與能力大幅強化）"

  # ═══════════════════════════════════════════════════════════════
  # 第四章：敵人系統
  # ═══════════════════════════════════════════════════════════════

  enemy_system:

    basic_enemies:

      goblin:
        name: "哥布林"
        health: 50
        speed: "快"
        armor: 0
        gold_reward: 10
        special: "無"

      skeleton:
        name: "骷髏兵"
        health: 80
        speed: "中"
        armor: 5
        gold_reward: 15
        special: "無"

      orc_warrior:
        name: "獸人戰士"
        health: 150
        speed: "慢"
        armor: 15
        gold_reward: 25
        special: "高物理傷害"

      thief:
        name: "盜賊"
        health: 60
        speed: "極快"
        armor: 0
        gold_reward: 20
        special: "閃避 20%"

      elemental_slime:
        name: "元素史萊姆"
        health: 100
        speed: "慢"
        armor: 0
        gold_reward: 30
        special: "免疫對應元素傷害"
        variants: ["水史萊姆", "火史萊姆", "雷史萊姆", "冰史萊姆", "毒史萊姆"]

    advanced_enemies:

      shield_guard:
        name: "盾衛兵"
        health: 300
        gold_reward: 50
        special: "格擋正面 80% 傷害，背面受傷 +50%"
        weakness: "背後攻擊"

      healer_mage:
        name: "治療法師"
        health: 100
        gold_reward: 40
        special: "施放治療法術，恢復周圍敵人生命"
        priority: "優先擊殺"

      bomb_dwarf:
        name: "炸彈矮人"
        health: 80
        gold_reward: 60
        special: "死亡時爆炸，對陷阱造成傷害"
        danger_level: "高"

      troll:
        name: "巨魔"
        health: 500
        gold_reward: 80
        special: "緩慢再生（5/秒），控制抗性 +50%"
        weakness: "火焰（阻止再生）"

      metal_golem:
        name: "金屬傀儡"
        health: 400
        gold_reward: 70
        special: "自帶金屬狀態，免疫物理傷害"
        weakness: "雷電傷害 +100%"

    boss_enemies:

      skeleton_king:
        name: "骷髏王"
        health: 2000
        summon_ability: "每 30 秒召喚一波骷髏兵"
        resurrection: "死亡後復活一次（50% 血量）"
        weakness: "火焰（灼燒傷害 +100%）"

      storm_elemental:
        name: "風暴元素"
        health: 1500
        immunity: "免疫雷電傷害"
        attack_ability: "每 15 秒對隨機陷阱施放閃電"
        weakness: "冰凍（減緩攻擊頻率）"

  # ═══════════════════════════════════════════════════════════════
  # 第五章：關卡設計
  # ═══════════════════════════════════════════════════════════════

  level_design:

    level_structure:
      components:
        - "入口點（敵人進入）"
        - "出口點（地城核心）"
        - "路徑（走廊）"
        - "陷阱位（地面）"
        - "牆壁位（牆壁陷阱）"
        - "英雄位（英雄部署）"
        - "環境要素（水池、熔岩、深淵）"

    terrain_types:

      corridor:
        passable: true
        trap_placeable: true
        effect: "標準地形"

      wall:
        passable: false
        trap_placeable: "僅牆壁陷阱"
        effect: "阻擋移動"

      abyss:
        passable: false
        trap_placeable: false
        effect: "敵人落入即死"

      water_pool:
        passable: true
        trap_placeable: "特定陷阱"
        effect: "自動附加潮濕狀態，減速 20%"

      lava:
        passable: true
        trap_placeable: false
        effect: "持續火焰傷害 10/秒"

    mvp_levels:

      level_1:
        name: "新手地城"
        waves: 5
        entrances: 1
        path_type: "單一直線 + 一個轉角"
        hero_slots: 2
        starting_gold: 500
        tutorial_focus: "基礎陷阱放置、資源管理"
        unlocks: ["尖刺陷阱", "火焰噴射器", "水流陷阱"]

      level_2:
        name: "水晶洞窟"
        waves: 8
        entrances: 2
        path_type: "雙路徑中央交匯"
        special_terrain: "中央水池（自動潮濕）"
        hero_slots: 3
        starting_gold: 600
        tutorial_focus: "元素反應（水+雷=感電）"
        unlocks: ["電擊板", "冰凍地板", "英雄：乙太"]

      level_3:
        name: "熔岩要塞"
        waves: "10 + Boss"
        entrances: 2
        path_type: "複雜多重路徑"
        special_terrain: "熔岩河、可破壞牆壁"
        hero_slots: 4
        starting_gold: 800
        tutorial_focus: "進階元素反應組合、Boss 戰"
        boss: "骷髏王"
        unlocks: ["毒氣噴口", "油污地板", "英雄：芙蕾雅"]

  # ═══════════════════════════════════════════════════════════════
  # 第六章：UI/UX 設計
  # ═══════════════════════════════════════════════════════════════

  ui_ux_design:

    color_palette:

      primary:
        dark_bg:
          hex: "#1A1A2E"
          usage: "主介面背景"
        panel_bg:
          hex: "#16213E"
          usage: "面板背景"
        accent:
          hex: "#E94560"
          usage: "重要按鈕、警告"

      elements:
        water:
          hex: "#3498DB"
          usage: "水系相關 UI"
        fire:
          hex: "#E74C3C"
          usage: "火系相關 UI"
        lightning:
          hex: "#9B59B6"
          usage: "雷系相關 UI"
        ice:
          hex: "#5DADE2"
          usage: "冰系相關 UI"
        poison:
          hex: "#27AE60"
          usage: "毒系相關 UI"

      text:
        primary:
          hex: "#FFFFFF"
          usage: "主要文字"
        secondary:
          hex: "#B0B0B0"
          usage: "次要文字"
        gold:
          hex: "#F1C40F"
          usage: "金幣、獎勵數字"
        damage:
          hex: "#FF6B6B"
          usage: "傷害數字"

    hud_layout:

      top_bar:
        left: "波次進度（當前/總數）"
        center: "地城核心生命值"
        right: "金幣數量、遊戲速度控制"

      bottom_bar:
        left: "英雄頭像 + 技能快捷鍵"
        center: "陷阱選擇面板（可捲動）"
        right: "波次開始按鈕"

      side_panel:
        position: "右側"
        content:
          - "選中陷阱/英雄詳細資訊"
          - "升級選項"
          - "出售選項"
          - "元素狀態說明"

    reaction_feedback:
      floating_text: "反應名稱（如「感電！」）"
      vfx: "依反應類型的特效動畫"
      damage_numbers: "帶元素顏色的傷害數字"
      chain_counter: "連鎖反應計數器"

  # ═══════════════════════════════════════════════════════════════
  # 第七章：技術架構
  # ═══════════════════════════════════════════════════════════════

  technical_architecture:

    tech_stack:
      game_engine: "Phaser.js 3.70+"
      language: "TypeScript"
      build_tool: "Vite"
      state_management: "自訂 ECS (Entity-Component-System)"
      asset_manager: "Phaser Loader + 自訂 AssetManager"
      save_system: "LocalStorage + IndexedDB"
      deployment: "Vercel / Netlify"

    core_systems:

      game_state_machine:
        states:
          - "Loading"
          - "Menu"
          - "Playing"
          - "Paused"
          - "GameOver"
          - "Victory"

      ecs_architecture:
        entities:
          - "Trap"
          - "Enemy"
          - "Hero"
          - "Projectile"
          - "Effect"
        components:
          - "Position"
          - "Health"
          - "Element"
          - "Movement"
          - "Damage"
          - "Status"
        systems:
          - "MovementSystem"
          - "CombatSystem"
          - "ElementReactionSystem"
          - "RenderSystem"
          - "AISystem"

      element_reaction_system:
        ElementStatusManager: "管理每個實體的元素狀態"
        ReactionResolver: "檢測並觸發元素反應"
        ReactionEffectFactory: "產生反應效果（傷害、控制、範圍）"
        GaugeTracker: "追蹤元素附著量與衰減"

    performance_optimization:
      object_pooling: "預建敵人、投射物、特效物件池"
      spatial_partitioning: "格子系統加速碰撞檢測"
      batch_rendering: "合併相同材質繪製呼叫"
      target_fps:
        desktop: 60
        mobile: 30

  # ═══════════════════════════════════════════════════════════════
  # 第八章：商業模式
  # ═══════════════════════════════════════════════════════════════

  business_model:

    monetization: "F2P（免費遊玩）+ 內購"

    free_content:
      levels: "前 5 個關卡"
      traps: "全部基礎陷阱"
      heroes: "2 位免費英雄"
      features: "基礎元素反應系統"

    paid_content:

      full_unlock:
        price: "$9.99 USD"
        includes:
          - "全部 20+ 關卡"
          - "全部陷阱與英雄"
          - "無盡模式"
          - "挑戰模式"

      dlc_packs:
        price: "$4.99 each"
        examples:
          - "新元素系統（如「風」元素）"
          - "新英雄包（3-5 位新英雄）"
          - "主題關卡包（5 個新關卡）"

    target_market:
      primary:
        - "策略遊戲愛好者（25-40 歲）"
        - "塔防遊戲玩家"
        - "原神玩家（熟悉元素反應）"
        - "獨立遊戲愛好者"

  # ═══════════════════════════════════════════════════════════════
  # 第九章：開發時程
  # ═══════════════════════════════════════════════════════════════

  development_timeline:

    total_duration: "12 個月"

    phases:

      phase_1:
        name: "原型開發"
        duration: "2 個月"
        deliverables:
          - "核心遊戲循環"
          - "基礎陷阱系統"
          - "元素反應原型"
          - "1 個測試關卡"

      phase_2:
        name: "MVP 開發"
        duration: "3 個月"
        deliverables:
          - "3 個完整關卡"
          - "6-8 種陷阱"
          - "2-3 位英雄"
          - "4-5 種元素反應"
          - "基礎 UI"

      phase_3:
        name: "Alpha 測試"
        duration: "1 個月"
        deliverables:
          - "內部測試"
          - "Bug 修復"
          - "平衡性調整"
          - "收集反饋"

      phase_4:
        name: "內容擴展"
        duration: "3 個月"
        deliverables:
          - "擴展至 10+ 關卡"
          - "完整英雄陣容"
          - "全部元素反應"
          - "無盡模式"

      phase_5:
        name: "Beta 測試"
        duration: "1 個月"
        deliverables:
          - "公開測試"
          - "社群反饋"
          - "最終平衡調整"

      phase_6:
        name: "發布準備"
        duration: "2 個月"
        deliverables:
          - "美術潤飾"
          - "音效完善"
          - "本地化"
          - "行銷素材"
          - "正式上線"

    mvp_milestone:
      target_date: "第 5 個月末"
      requirements:
        - "完整可玩的 2-3 個關卡"
        - "6-8 種功能完整的陷阱"
        - "2-3 位可操作的英雄"
        - "4-5 種可觸發的元素反應"
        - "基礎 UI 與教學"
        - "流暢的 60 FPS 遊戲體驗"
        - "可在網頁瀏覽器中直接遊玩"

    team_resources:
      game_designer: { count: 1, role: "遊戲機制設計、數值平衡、關卡設計" }
      programmer: { count: 2, role: "核心系統開發、前端實作、效能優化" }
      artist: { count: 1, role: "像素角色、陷阱、特效、UI 設計" }
      sound_designer: { count: "1（兼職）", role: "背景音樂、音效製作" }
      qa_tester: { count: "1（兼職）", role: "品質保證、Bug 回報" }

  # ═══════════════════════════════════════════════════════════════
  # 第十章：風險評估
  # ═══════════════════════════════════════════════════════════════

  risk_assessment:

    risks:

      complexity_risk:
        name: "元素反應系統過於複雜"
        probability: "中"
        impact: "高"
        mitigation:
          - "分階段引入元素"
          - "完善教學系統"
          - "提供反應圖鑑"

      balance_risk:
        name: "遊戲平衡性問題"
        probability: "高"
        impact: "中"
        mitigation:
          - "持續內部測試"
          - "建立數據分析系統"
          - "快速迭代更新"

      performance_risk:
        name: "技術效能瓶頸"
        probability: "中"
        impact: "中"
        mitigation:
          - "早期效能測試"
          - "物件池技術"
          - "漸進式載入"

      schedule_risk:
        name: "開發進度延遲"
        probability: "中"
        impact: "高"
        mitigation:
          - "優先保證 MVP 功能"
          - "彈性調整後期內容範圍"

      market_risk:
        name: "市場競爭"
        probability: "低"
        impact: "中"
        mitigation:
          - "專注差異化優勢"
          - "建立社群"
          - "持續更新"

# ═════════════════════════════════════════════════════════════════
# 文件結束
# ═════════════════════════════════════════════════════════════════
