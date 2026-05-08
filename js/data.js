import { BOSS_CONFIG } from './stats_config.js?version=1.1.3';

// 職業資料
export const CLASSES = {
    warrior: {
        name: '戰士',
        icon: '⚔️',
        desc: '高血量與高攻擊<br>擅長近身戰鬥<br>技能：猛力擊 - 造成 150% 傷害',
        baseHp: 150,
        baseAtk: 20,
        baseDef: 10,
        baseSpeed: 5,
        baseSkill: '猛力擊'
    },
    mage: {
        name: '法師',
        icon: '🔮',
        desc: '高魔法傷害<br>擅長遠程攻擊<br>技能：火球術 - 造成 200% 魔法傷害',
        baseHp: 80,
        baseAtk: 35,
        baseDef: 5,
        baseSpeed: 8,
        baseSkill: '火球術'
    },
    rogue: {
        name: '盜賊',
        icon: '🗡️',
        desc: '高閃避與暴擊<br>擅長偷襲<br>技能：背刺 - 造成 250% 傷害 + 額外傷害',
        baseHp: 100,
        baseAtk: 25,
        baseDef: 7,
        baseSpeed: 12,
        baseSkill: '背刺'
    }
};

// --- 稀有度 ---
export const RARITY = {
    common: { name: '普通', color: '#ffffff', multiplier: 1 },
    uncommon: { name: '稀有', color: '#1aff1a', multiplier: 1.5 },
    rare: { name: '極品', color: '#4a90d9', multiplier: 2 },
    epic: { name: '傳說', color: '#b06aff', multiplier: 3 },
    legendary: { name: '神話', color: '#ffd700', multiplier: 5 }
};

// --- 武器 ---
export const WEAPONS = {
    // 普通
    sword_01: { id: 'sword_01', name: '生鏽的鐵劍', type: 'weapon', atk: 5, price: 50, rarity: 'common', icon: '🗡️' },
    staff_01: { id: 'staff_01', name: '橡木法杖', type: 'weapon', atk: 8, matk: 12, price: 60, rarity: 'common', icon: '🪄' },
    dagger_01: { id: 'dagger_01', name: '短匕首', type: 'weapon', atk: 6, price: 55, rarity: 'common', icon: '🔪' },

    // 稀有
    sword_02: { id: 'sword_02', name: '鋼製長劍', type: 'weapon', atk: 12, price: 150, rarity: 'uncommon', icon: '⚔️' },
    staff_02: { id: 'staff_02', name: '銀製魔杖', type: 'weapon', atk: 15, matk: 25, price: 180, rarity: 'uncommon', icon: '✨' },
    dagger_02: { id: 'dagger_02', name: '鋒利短刀', type: 'weapon', atk: 13, price: 160, rarity: 'uncommon', icon: '🗡️' },

    // 極品
    sword_03: { id: 'sword_03', name: '銀月之刃', type: 'weapon', atk: 25, price: 400, rarity: 'rare', icon: '🌙' },
    staff_03: { id: 'staff_03', name: '水晶法杖', type: 'weapon', atk: 30, matk: 55, price: 450, rarity: 'rare', icon: '💎' },
    dagger_03: { id: 'dagger_03', name: '暗影刺刀', type: 'weapon', atk: 28, price: 420, rarity: 'rare', icon: '🌑' },

    // 傳說
    sword_04: { id: 'sword_04', name: '烈焰聖劍', type: 'weapon', atk: 50, price: 900, rarity: 'epic', icon: '🔥' },
    staff_04: { id: 'staff_04', name: '元素法杖', type: 'weapon', atk: 55, matk: 120, price: 1000, rarity: 'epic', icon: '🌈' },
    dagger_04: { id: 'dagger_04', name: '雷霆匕首', type: 'weapon', atk: 52, price: 950, rarity: 'epic', icon: '⚡' },

    // 神話
    sword_05: { id: 'sword_05', name: '龍之怒氣', type: 'weapon', atk: 100, price: 2000, rarity: 'legendary', icon: '🐉' },
    staff_05: { id: 'staff_05', name: '神諭之杖', type: 'weapon', atk: 110, matk: 250, price: 2200, rarity: 'legendary', icon: '👑' },
    dagger_05: { id: 'dagger_05', name: '時光之刃', type: 'weapon', atk: 105, price: 2100, rarity: 'legendary', icon: '⏳' }
};

// --- 防具（胸甲） ---
export const ARMORS = {
    // 普通
    armor_01: { id: 'armor_01', name: '布甲', type: 'armor', def: 5, price: 40, rarity: 'common', icon: '👕' },

    // 稀有
    armor_02: { id: 'armor_02', name: '鋼製胸甲', type: 'armor', def: 12, price: 140, rarity: 'uncommon', icon: '🛡️' },

    // 極品
    armor_03: { id: 'armor_03', name: '銀甲', type: 'armor', def: 25, price: 380, rarity: 'rare', icon: '🏅' },

    // 傳說
    armor_04: { id: 'armor_04', name: '龍鱗甲', type: 'armor', def: 50, price: 850, rarity: 'epic', icon: '🐲' },

    // 神話
    armor_05: { id: 'armor_05', name: '神聖铠甲', type: 'armor', def: 100, price: 1800, rarity: 'legendary', icon: '🔱' }
};

// --- 頭盔 ---
export const HELMS = {
    // 普通
    helm_01: { id: 'helm_01', name: '皮帽', type: 'helm', def: 3, speed: 1, price: 30, rarity: 'common', icon: '🧢' },

    // 稀有
    helm_02: { id: 'helm_02', name: '鐵頭盔', type: 'helm', def: 8, speed: 2, price: 100, rarity: 'uncommon', icon: '⛑️' },

    // 極品
    helm_03: { id: 'helm_03', name: '騎士盔', type: 'helm', def: 18, speed: 4, price: 300, rarity: 'rare', icon: '🪖' },

    // 傳說
    helm_04: { id: 'helm_04', name: '帝王冠', type: 'helm', def: 35, speed: 8, price: 700, rarity: 'epic', icon: '👑' },

    // 神話
    helm_05: { id: 'helm_05', name: '諸神頭盔', type: 'helm', def: 80, speed: 15, price: 1500, rarity: 'legendary', icon: '💫' }
};

// --- 鞋子 ---
export const SHOES = {
    // 普通
    shoes_01: { id: 'shoes_01', name: '布鞋', type: 'shoes', speed: 2, price: 35, rarity: 'common', icon: '👞' },

    // 稀有
    shoes_02: { id: 'shoes_02', name: '皮革長靴', type: 'shoes', speed: 5, price: 120, rarity: 'uncommon', icon: '👢' },

    // 極品
    shoes_03: { id: 'shoes_03', name: '疾風靴', type: 'shoes', speed: 12, price: 350, rarity: 'rare', icon: '💨' },

    // 傳說
    shoes_04: { id: 'shoes_04', name: '雷霆之靴', type: 'shoes', speed: 25, price: 800, rarity: 'epic', icon: '⚡' },

    // 神話
    shoes_05: { id: 'shoes_05', name: '神行鞋', type: 'shoes', speed: 50, price: 1600, rarity: 'legendary', icon: '🌟' }
};

// --- 盾牌 ---
export const SHIELDS = {
    // 普通
    shield_01: { id: 'shield_01', name: '木盾', type: 'shield', def: 4, price: 35, rarity: 'common', icon: '🛡️' },

    // 稀有
    shield_02: { id: 'shield_02', name: '鋼盾', type: 'shield', def: 10, price: 130, rarity: 'uncommon', icon: '🛡️' },

    // 極品
    shield_03: { id: 'shield_03', name: '銀盾', type: 'shield', def: 22, price: 360, rarity: 'rare', icon: '🏅' },

    // 傳說
    shield_04: { id: 'shield_04', name: '龍鱗盾', type: 'shield', def: 45, price: 820, rarity: 'epic', icon: '🐲' },

    // 神話
    shield_05: { id: 'shield_05', name: '神聖盾', type: 'shield', def: 90, price: 1700, rarity: 'legendary', icon: '✨' }
};

// --- 飾品 ---
export const ACCESSORIES = {
    // 普通
    accessory_01: { id: 'accessory_01', name: '銅戒指', type: 'accessory', atk: 2, def: 2, speed: 1, price: 40, rarity: 'common', icon: '💍' },

    // 稀有
    accessory_02: { id: 'accessory_02', name: '銀項鏈', type: 'accessory', atk: 5, def: 5, speed: 2, price: 150, rarity: 'uncommon', icon: '📿' },

    // 極品
    accessory_03: { id: 'accessory_03', name: '魔力水晶', type: 'accessory', atk: 12, def: 10, speed: 5, price: 400, rarity: 'rare', icon: '💎' },

    // 傳說
    accessory_04: { id: 'accessory_04', name: '龍血吊墜', type: 'accessory', atk: 25, def: 20, speed: 10, price: 900, rarity: 'epic', icon: '🩸' },

    // 神話
    accessory_05: { id: 'accessory_05', name: '諸神戒指', type: 'accessory', atk: 50, def: 40, speed: 20, price: 2000, rarity: 'legendary', icon: '🌈' }
};

// --- 物品總覽 ---
export const ITEMS = {
    ...WEAPONS,
    ...ARMORS,
    ...HELMS,
    ...SHOES,
    ...SHIELDS,
    ...ACCESSORIES
};

// --- 神秘商店物品定義 ---
// 神秘商店的「問號」物品模板（購買時隨機拆成其他物品）
export const MYSTERY_ITEM = {
    id: 'mystery_item',
    name: '神秘寶箱',
    type: 'other',
    price: 500,
    rarity: 'epic',
    icon: '📦',
    isMystery: true  // 標記為神秘物品
};

// 將神秘商店物品加入 ITEMS
ITEMS.mystery_item = MYSTERY_ITEM;

// 高級神秘寶箱（保證極品或以上）
export const MYSTERY_PREMIUM_ITEM = {
    id: 'mystery_premium',
    name: '高級神秘寶箱',
    type: 'other',
    price: 2000,
    rarity: 'legendary',
    icon: '🧧',
    isMystery: true
};

ITEMS.mystery_premium = MYSTERY_PREMIUM_ITEM;

// --- 怪物資料 ---
// 所有 hp/atk/speed 為「基礎值」，實際數值由 computeMonsterScale(level) 動態縮放。
// 勿直接把這裡的數值當戰鬥參考；請看 getMonsterTemplateForWave 的輸出。
export const MONSTER_TYPES = [
    // [0-2] Z1 新手村 (1-20)
    { name: '史萊姆',     icon: '👾', hp: 50, atk: 10, speed: 4,  dropRate: 0.15, drops: ['sword_01', 'armor_01', 'shield_01', 'shoes_01'] },
    { name: '哥布林',     icon: '👺', hp: 65, atk: 14, speed: 6,  dropRate: 0.18, drops: ['dagger_01', 'helm_01', 'accessory_01'] },
    { name: '蝙蝠',       icon: '🦇', hp: 45, atk: 12, speed: 14, dropRate: 0.12, drops: ['dagger_01', 'shoes_01'] },

    // [3-5] Z2 黑暗森林 (21-40)
    { name: '惡狼',       icon: '🐺', hp: 65, atk: 20, speed: 14, dropRate: 0.20, drops: ['sword_02', 'dagger_02', 'shoes_02'] },
    { name: '森林魔法師', icon: '🧙', hp: 55, atk: 26, speed: 9,  dropRate: 0.22, drops: ['staff_02', 'armor_02', 'accessory_02'] },
    { name: '食人樹妖',   icon: '🌳', hp: 82, atk: 18, speed: 4,  dropRate: 0.25, drops: ['sword_02', 'helm_02', 'shield_02'] },

    // [6-8] Z3 腐化洞穴 (41-60)
    { name: '骷髏兵',     icon: '💀', hp: 72, atk: 22, speed: 10, dropRate: 0.25, drops: ['sword_03', 'armor_03', 'shield_03'] },
    { name: '地穴巫師',   icon: '🧛', hp: 58, atk: 28, speed: 12, dropRate: 0.28, drops: ['staff_03', 'helm_03', 'accessory_03'] },
    { name: '暗影盜賊',   icon: '🥷', hp: 62, atk: 25, speed: 20, dropRate: 0.30, drops: ['dagger_03', 'shoes_03'] },

    // [9-11] Z4 黑暗地下城 (61-80)
    { name: '鐵甲騎士',   icon: '🏰', hp: 85, atk: 26, speed: 12, dropRate: 0.30, drops: ['sword_04', 'armor_04', 'shield_04'] },
    { name: '黑暗女巫',   icon: '🧙‍♀️', hp: 65, atk: 32, speed: 16, dropRate: 0.35, drops: ['staff_04', 'helm_04', 'accessory_04'] },
    { name: '暗影刺客',   icon: '🌑', hp: 68, atk: 28, speed: 24, dropRate: 0.32, drops: ['dagger_04', 'shoes_04'] },

    // [12-14] Z5 熔岩深淵 (81-100)
    { name: '熔岩巨人',   icon: '🌋', hp: 92, atk: 30, speed: 8,  dropRate: 0.40, drops: ['sword_05', 'armor_05', 'shield_05'] },
    { name: '地獄犬',     icon: '🐕', hp: 72, atk: 34, speed: 20, dropRate: 0.42, drops: ['dagger_05', 'shoes_05'] },
    { name: '炎焰術士',   icon: '🔥', hp: 65, atk: 38, speed: 16, dropRate: 0.45, drops: ['staff_05', 'accessory_05'] },

    // [15-17] Z6 深淵邊境 (101-120)
    { name: '深淵巡行者', icon: '🌊', hp: 80, atk: 32, speed: 18, dropRate: 0.40, drops: ['sword_05', 'armor_05', 'shield_05'] },
    { name: '腐化巨像',   icon: '🗿', hp: 102, atk: 26, speed: 5, dropRate: 0.45, drops: ['helm_05', 'shield_05'] },
    { name: '噬魂狼王',   icon: '🐾', hp: 70, atk: 36, speed: 26, dropRate: 0.42, drops: ['dagger_05', 'shoes_05'] },

    // [18-19] Z7 虛空裂縫 (121-140) — 第三個怪物見 index 23
    { name: '虛無騎士',   icon: '⚔️', hp: 88, atk: 36, speed: 18, dropRate: 0.50, drops: ['sword_05', 'armor_05'] },
    { name: '寂滅女巫',   icon: '🪄', hp: 75, atk: 44, speed: 16, dropRate: 0.52, drops: ['staff_05', 'accessory_05'] },

    // [20-22] Z8 天界前庭 (141-160)
    { name: '天界守衛',   icon: '👼', hp: 86, atk: 38, speed: 20, dropRate: 0.55, drops: ['helm_05', 'accessory_05'] },
    { name: '天界聖騎',   icon: '🛡️', hp: 96, atk: 36, speed: 16, dropRate: 0.58, drops: ['sword_05', 'armor_05', 'shield_05'] },
    { name: '天界煉金師', icon: '✨', hp: 78, atk: 46, speed: 18, dropRate: 0.55, drops: ['staff_05', 'helm_05'] },

    // [23] Z7 虛空裂縫 補充第三隻
    { name: '裂縫侵蝕者', icon: '🌀', hp: 78, atk: 38, speed: 24, dropRate: 0.50, drops: ['dagger_05', 'shoes_05'] },

    // [24-26] Z9 混沌之域 (161-180)
    { name: '混沌巨獸',   icon: '🌪️', hp: 96, atk: 38, speed: 12, dropRate: 0.55, drops: ['sword_05', 'armor_05', 'shield_05'] },
    { name: '混沌術士',   icon: '💜', hp: 78, atk: 50, speed: 16, dropRate: 0.58, drops: ['staff_05', 'helm_05', 'accessory_05'] },
    { name: '混沌侵蝕者', icon: '🔮', hp: 84, atk: 44, speed: 22, dropRate: 0.56, drops: ['dagger_05', 'shoes_05'] },

    // [27-29] Z10 神魔戰場 (181-200)
    { name: '墮落天使',   icon: '😈', hp: 88, atk: 46, speed: 22, dropRate: 0.58, drops: ['sword_05', 'accessory_05'] },
    { name: '破滅騎士',   icon: '💔', hp: 102, atk: 42, speed: 15, dropRate: 0.60, drops: ['armor_05', 'shield_05', 'helm_05'] },
    { name: '命運女神',   icon: '⚖️', hp: 80, atk: 52, speed: 19, dropRate: 0.60, drops: ['staff_05', 'dagger_05'] },

    // [30-32] Z11 星界之境 (201-220)
    { name: '星際漫游者', icon: '🌠', hp: 85, atk: 48, speed: 24, dropRate: 0.60, drops: ['sword_05', 'shoes_05'] },
    { name: '黑洞吞噬者', icon: '🕳️', hp: 116, atk: 44, speed: 8,  dropRate: 0.62, drops: ['armor_05', 'shield_05', 'helm_05'] },
    { name: '星塵精靈',   icon: '💫', hp: 70, atk: 56, speed: 30, dropRate: 0.62, drops: ['dagger_05', 'staff_05', 'accessory_05'] },

    // [33-35] Z12 時間廢墟 (221-240)
    { name: '時間守衛者', icon: '⏰', hp: 92, atk: 52, speed: 16, dropRate: 0.62, drops: ['sword_05', 'armor_05', 'shield_05'] },
    { name: '歷史幽靈',   icon: '👻', hp: 78, atk: 62, speed: 22, dropRate: 0.65, drops: ['staff_05', 'helm_05'] },
    { name: '命運操控者', icon: '🎭', hp: 86, atk: 58, speed: 15, dropRate: 0.63, drops: ['dagger_05', 'shoes_05', 'accessory_05'] },

    // [36-38] Z13 永恆虛無 (241-260)
    { name: '永恆傀儡',   icon: '🤖', hp: 102, atk: 55, speed: 12, dropRate: 0.65, drops: ['armor_05', 'shield_05', 'helm_05'] },
    { name: '虛無傳道士', icon: '🌑', hp: 82, atk: 66, speed: 18, dropRate: 0.68, drops: ['staff_05', 'accessory_05'] },
    { name: '滅世先驅',   icon: '☠️', hp: 90, atk: 60, speed: 24, dropRate: 0.66, drops: ['sword_05', 'dagger_05', 'shoes_05'] },

    // [39-41] Z14 創世神域 (261-280)
    { name: '創世神衛',   icon: '🔱', hp: 106, atk: 62, speed: 16, dropRate: 0.68, drops: ['armor_05', 'shield_05', 'helm_05'] },
    { name: '神域法師',   icon: '⚡', hp: 85, atk: 74, speed: 18, dropRate: 0.70, drops: ['staff_05', 'accessory_05'] },
    { name: '創世龍靈',   icon: '🐉', hp: 96, atk: 68, speed: 20, dropRate: 0.70, drops: ['sword_05', 'dagger_05', 'shoes_05'] },

    // [42-44] Z15 終焉之地 (281-300)
    { name: '終焉先鋒',   icon: '☄️',  hp: 102, atk: 70, speed: 22, dropRate: 0.72, drops: ['sword_05', 'armor_05', 'dagger_05'] },
    { name: '末日審判者', icon: '🌌', hp: 122, atk: 68, speed: 14, dropRate: 0.75, drops: ['shield_05', 'helm_05', 'accessory_05'] },
    { name: '宇宙終結者', icon: '💥', hp: 112, atk: 76, speed: 18, dropRate: 0.75, drops: ['staff_05', 'shoes_05', 'accessory_05'] },
];

// 地圖/區域定義：15 大區 × 20 層 = 300 層，對齊成長公式（每 20 層一大區）
// Boss 每 10 層出現一次：每區 Mid-Boss(+9) + Area-Boss(+19)
export const MAPS = [
    { key: 'village',   name: '新手村',   min:   1, max:  20, indices: [0,1,2]     },
    { key: 'darkforest',name: '黑暗森林', min:  21, max:  40, indices: [3,4,5]     },
    { key: 'cave',      name: '腐化洞穴', min:  41, max:  60, indices: [6,7,8]     },
    { key: 'dungeon',   name: '黑暗地下城',min: 61, max:  80, indices: [9,10,11]   },
    { key: 'lava',      name: '熔岩深淵', min:  81, max: 100, indices: [12,13,14]  },
    { key: 'abyss',     name: '深淵邊境', min: 101, max: 120, indices: [15,16,17]  },
    { key: 'voidrift',  name: '虛空裂縫', min: 121, max: 140, indices: [18,19,23]  },
    { key: 'heaven',    name: '天界前庭', min: 141, max: 160, indices: [20,21,22]  },
    { key: 'chaos',     name: '混沌之域', min: 161, max: 180, indices: [24,25,26]  },
    { key: 'divbattle', name: '神魔戰場', min: 181, max: 200, indices: [27,28,29]  },
    { key: 'stellar',   name: '星界之境', min: 201, max: 220, indices: [30,31,32]  },
    { key: 'timeruins', name: '時間廢墟', min: 221, max: 240, indices: [33,34,35]  },
    { key: 'eternalvoid',name:'永恆虛無', min: 241, max: 260, indices: [36,37,38]  },
    { key: 'creation',  name: '創世神域', min: 261, max: 280, indices: [39,40,41]  },
    { key: 'endofdays', name: '終焉之地', min: 281, max: 300, indices: [42,43,44]  },
    // 301+ 保護性回退
    { key: 'beyond',    name: '宇宙彼端', min: 301, max: Infinity, indices: [42,43,44] }
];

/**
 * 連續指數怪物成長公式（v2）
 * expGrowth  = 1.35^((lv-1)/20) — 每 20 層約 ×1.35，連續無跳躍
 * linearMult = 1 + (lv-1)*0.03  — 線性微調
 * scale = expGrowth * linearMult
 */
export function computeMonsterScale(level) {
    const lv = Math.max(1, level);
    const expGrowth  = Math.pow(1.35, (lv - 1) / 20);
    const linearMult = 1 + (lv - 1) * 0.03;
    return expGrowth * linearMult;
}

export function getMonsterTemplateForWave(wave) {
    const level = Math.max(1, (Number(wave) || 0) + 1);
    const pool = MAPS.find(p => level >= p.min && level <= p.max) || MAPS[0];
    const indices = (pool.indices || []).filter(i => i >= 0 && i < MONSTER_TYPES.length);
    let chosenIndex;
    if (indices.length > 0) {
        chosenIndex = indices[Math.floor(Math.random() * indices.length)];
    } else {
        chosenIndex = Math.floor(Math.random() * MONSTER_TYPES.length);
    }

    const base = MONSTER_TYPES[chosenIndex];
    const scale = computeMonsterScale(level);
    const template = {
        ...base,
        hp: Math.floor((base.hp || 50) * scale),
        atk: Math.floor((base.atk || 10) * scale),
        def: Math.floor((base.hp || 50) * 0.08 * scale), // 基礎防禦：HP 的 8% * scale
        speed: Math.max(1, Math.floor((base.speed || 5) * Math.sqrt(scale))),
        exp: Math.floor(20 * scale),
        gold: Math.floor(8 * scale),
        level: level,
        isBoss: false,
        affixes: []
    };

    // Boss 判定：每 BOSS_CONFIG.FLOOR_INTERVAL 層出現 Boss
    if (level % BOSS_CONFIG.FLOOR_INTERVAL === 0) {
        template.isBoss = true;
        template.hp = Math.floor(template.hp * BOSS_CONFIG.HP_MULT);
        template.def = Math.floor(template.def * BOSS_CONFIG.DEF_MULT);
        template.atk = Math.floor(template.atk * BOSS_CONFIG.ATK_MULT);
        template.exp = Math.floor(template.exp * BOSS_CONFIG.EXP_MULT);
        template.gold = Math.floor(template.gold * BOSS_CONFIG.GOLD_MULT);
        template.name = `👑 ${template.name}`;
        // 隨機詞綴（1~2個）
        const numAffixes = 1 + (Math.random() < 0.3 ? 1 : 0);
        const shuffled = [...BOSS_CONFIG.AFFIXES].sort(() => Math.random() - 0.5);
        for (let i = 0; i < numAffixes && i < shuffled.length; i++) {
            const affix = shuffled[i];
            template[affix.effect] = Math.floor((template[affix.effect] || 0) * affix.mult);
            template.affixes.push(affix);
            template.name += ` ${affix.icon}`;
        }
    }

    return template;
}

export function getRandomMonsterFromMap(mapKey) {
    const map = MAPS.find(m => m.key === mapKey) || MAPS[0];
    const indices = (map.indices || []).filter(i => i >= 0 && i < MONSTER_TYPES.length);
    let chosenIndex;
    if (indices.length === 0) {
        chosenIndex = Math.floor(Math.random() * MONSTER_TYPES.length);
    } else {
        chosenIndex = indices[Math.floor(Math.random() * indices.length)];
    }
    const base = MONSTER_TYPES[chosenIndex];
    // 區域固定等級：使用地圖等級範圍的中位數作為 scale 基準
    const zoneLevel = Math.floor((map.min + Math.min(map.max, 200)) / 2);
    const scale = computeMonsterScale(zoneLevel);
    return {
        ...base,
        hp: Math.floor((base.hp || 50) * scale),
        atk: Math.floor((base.atk || 10) * scale),
        def: Math.floor((base.hp || 50) * 0.08 * scale),
        speed: Math.max(1, Math.floor((base.speed || 5) * Math.sqrt(scale))),
        exp: Math.floor(20 * scale),
        gold: Math.floor(8 * scale),
        level: zoneLevel,
        isBoss: false,
        affixes: []
    };
}
