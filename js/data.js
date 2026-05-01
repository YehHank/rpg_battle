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
export const MONSTER_TYPES = [
    // 等級 1-5：新手村
    { name: '史萊姆', icon: '👾', hp: 50, atk: 10, speed: 4, exp: 20, gold: 5, dropRate: 0.15, drops: ['sword_01', 'armor_01', 'shield_01', 'shoes_01'] },
    { name: '哥布林', icon: '👺', hp: 80, atk: 12, speed: 6, exp: 30, gold: 10, dropRate: 0.18, drops: ['dagger_01', 'helm_01', 'accessory_01'] },
    { name: '蝙蝠', icon: '🦇', hp: 60, atk: 8, speed: 10, exp: 25, gold: 8, dropRate: 0.12, drops: ['dagger_01', 'shoes_01'] },

    // 等級 6-15：森林區域
    { name: '狼', icon: '🐺', hp: 150, atk: 20, speed: 12, exp: 60, gold: 25, dropRate: 0.20, drops: ['sword_02', 'dagger_02', 'shoes_02'] },
    { name: '魔術師', icon: '🧙', hp: 120, atk: 25, speed: 8, exp: 70, gold: 30, dropRate: 0.22, drops: ['staff_02', 'armor_02', 'accessory_02'] },
    { name: '巨魔', icon: '👹', hp: 200, atk: 18, speed: 5, exp: 80, gold: 35, dropRate: 0.25, drops: ['sword_02', 'helm_02', 'shield_02'] },

    // 等級 16-30：洞穴區域
    { name: '骷髏兵', icon: '💀', hp: 300, atk: 35, speed: 10, exp: 120, gold: 50, dropRate: 0.25, drops: ['sword_03', 'armor_03', 'shield_03'] },
    { name: '巫師', icon: '🧛', hp: 250, atk: 40, speed: 12, exp: 140, gold: 60, dropRate: 0.28, drops: ['staff_03', 'helm_03', 'accessory_03'] },
    { name: '暗影盜賊', icon: '🥷', hp: 280, atk: 38, speed: 18, exp: 130, gold: 55, dropRate: 0.30, drops: ['dagger_03', 'shoes_03'] },

    // 等級 31-50：地下城
    { name: '騎士', icon: '🏰', hp: 500, atk: 55, speed: 15, exp: 250, gold: 100, dropRate: 0.30, drops: ['sword_04', 'armor_04', 'shield_04'] },
    { name: '女巫', icon: '🧙‍♀️', hp: 400, atk: 60, speed: 18, exp: 280, gold: 120, dropRate: 0.35, drops: ['staff_04', 'helm_04', 'accessory_04'] },
    { name: '暗影刺客', icon: '🌑', hp: 450, atk: 58, speed: 25, exp: 260, gold: 110, dropRate: 0.32, drops: ['dagger_04', 'shoes_04'] },

    // 等級 51+：Boss 區域
    { name: '龍', icon: '🐉', hp: 1000, atk: 80, speed: 20, exp: 500, gold: 300, dropRate: 0.50, drops: ['sword_05', 'armor_05', 'shield_05'] },
    { name: '魔王', icon: '👿', hp: 1200, atk: 90, speed: 15, exp: 600, gold: 400, dropRate: 0.55, drops: ['staff_05', 'helm_05', 'accessory_05'] },
    { name: '神話盜魁', icon: '🎭', hp: 900, atk: 85, speed: 30, exp: 550, gold: 350, dropRate: 0.50, drops: ['dagger_05', 'shoes_05'] },

    // 深淵區域 (51-70)
    { name: '深淵巡行者', icon: '🌊', hp: 1400, atk: 95, speed: 22, exp: 700, gold: 400, dropRate: 0.40, drops: ['sword_04', 'accessory_04', 'shield_04'] },
    { name: '腐化巨像', icon: '🗿', hp: 2200, atk: 110, speed: 8, exp: 900, gold: 500, dropRate: 0.45, drops: ['armor_04', 'helm_04'] },
    { name: '噬魂狼王', icon: '🐺', hp: 1200, atk: 100, speed: 28, exp: 750, gold: 420, dropRate: 0.42, drops: ['dagger_04', 'shoes_04'] },

    // 虛空區域 (71-85)
    { name: '虛無騎士', icon: '⚔️', hp: 3000, atk: 130, speed: 25, exp: 1200, gold: 800, dropRate: 0.50, drops: ['sword_05', 'armor_05'] },
    { name: '寂滅女巫', icon: '🪄', hp: 2600, atk: 140, speed: 22, exp: 1300, gold: 850, dropRate: 0.55, drops: ['staff_05', 'accessory_05'] },

    // 天界 / 終章區域 (86+)
    { name: '天界守衛', icon: '👼', hp: 5000, atk: 160, speed: 30, exp: 2000, gold: 1500, dropRate: 0.60, drops: ['helm_05', 'accessory_05'] },
    { name: '終焉龍王', icon: '🐲', hp: 8000, atk: 220, speed: 20, exp: 5000, gold: 3000, dropRate: 0.70, drops: ['sword_05', 'armor_05', 'shield_05'] },
    { name: '虛空終結者', icon: '🌌', hp: 6500, atk: 180, speed: 28, exp: 3200, gold: 1800, dropRate: 0.65, drops: ['dagger_05', 'staff_05'] }
];

// 提供依照波數（wave, 0-based）挑選怪物的工具函式
// 地圖/區域定義 (可擴充)
export const MAPS = [
    { key: 'village', name: '新手村', min: 1, max: 5, indices: [0,1,2] },
    { key: 'forest', name: '森林區域', min: 6, max: 15, indices: [3,4,5] },
    { key: 'cave', name: '洞穴區域', min: 16, max: 30, indices: [6,7,8] },
    { key: 'dungeon', name: '地下城', min: 31, max: 50, indices: [9,10,11] },
    { key: 'abyss', name: '深淵', min: 51, max: 70, indices: [12,13,14] },
    { key: 'void', name: '虛空', min: 71, max: 85, indices: [15,16] },
    { key: 'heaven', name: '天界', min: 86, max: 100, indices: [17,18,19] },
    { key: 'village_higher', name: '高級新手村', min: 101, max: 105, indices: [0,1,2] },
    { key: 'forest_higher', name: '高級森林', min: 106, max: 115, indices: [3,4,5] },
    { key: 'cave_higher', name: '高級洞穴', min: 116, max: 130, indices: [6,7,8] },
    { key: 'dungeon_higher', name: '高級地下城', min: 131, max: 150, indices: [9,10,11] },
    { key: 'abyss_higher', name: '深淵進階', min: 151, max: 170, indices: [12,13,14] },
    { key: 'void_higher', name: '虛空深處', min: 171, max: 185, indices: [15,16] },
    { key: 'heaven_higher', name: '天界進階', min: 186, max: 200, indices: [17,18,19] },
    // 超過 200 則使用最高階區域作為預設（保護性回退）
    { key: 'cosmic', name: '宇宙之境', min: 201, max: Infinity, indices: [20,21,22] }
];

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
    // 回傳模板的淺拷貝，並在 100 層以上套用額外素質加強
    const template = { ...MONSTER_TYPES[chosenIndex] };
    if (level >= 101) {
        // 每 10 層一個階段（tier 1 = 101-110, tier 2 = 111-120, ...）
        const tier = Math.ceil((level - 100) / 10);

        // HP/EXP/GOLD：以 2^(tier+3) 做指數成長
        //   tier 1 = ×16, tier 2 = ×32, tier 3 = ×64, tier 5 = ×256, tier 10 = ×8192
        // 設計用意：天界 HP ~5000 vs 新手村 HP ~50（差距約 100×），
        //   tier 3 起大致追平天界難度，tier 5+ 開始顯著超越
        const hpMultiplier  = Math.pow(2, tier + 3);

        // ATK：以 2^(tier+1) 較緩成長，避免低層數時秒殺玩家
        //   tier 1 = ×4, tier 2 = ×8, tier 3 = ×16, tier 5 = ×64
        const atkMultiplier = Math.pow(2, tier + 1);

        template.hp    = Math.floor((template.hp    || 1) * hpMultiplier);
        template.atk   = Math.floor((template.atk   || 1) * atkMultiplier);
        // 速度每階段 +2，上限 100（加快敵人行動頻率）
        template.speed = Math.min(100, (template.speed || 4) + tier * 2);
        template.exp   = Math.max(1,  Math.floor((template.exp   || 0) * hpMultiplier));
        template.gold  = Math.max(0,  Math.floor((template.gold  || 0) * hpMultiplier));
        template.dropRate = Math.min(0.95, (template.dropRate || 0) + tier * 0.04);
    }
    return template;
}

export function getRandomMonsterFromMap(mapKey) {
    const map = MAPS.find(m => m.key === mapKey) || MAPS[0];
    const indices = (map.indices || []).filter(i => i >= 0 && i < MONSTER_TYPES.length);
    if (indices.length === 0) return { ...MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)] };
    const idx = indices[Math.floor(Math.random() * indices.length)];
    return { ...MONSTER_TYPES[idx] };
}
