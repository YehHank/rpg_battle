// 屬性與平衡參數集中設定
export const POINTS_PER_LEVEL = 5;

export const STAT_COEFFICIENTS = {
    STR_ATK: 3, // 每點 STR 增加 3 物理攻擊
    AGI_SPD_PER_POINT: 1, // 每點 AGI 增加 1 速度
    AGI_DODGE_PER_POINT: 0.005, // 每點 AGI 增加 0.5% 閃避率
    VIT_HP_PER_POINT: 15, // 每點 VIT 增加 15 最大生命
    VIT_DEF_PER_POINT: 0.7, // 每點 VIT 增加 0.7 物理防禦
    INT_MATK_PER_POINT: 3, // 每點 INT 增加 3 魔法攻擊
    INT_SP_PER_POINT: 5, // 每點 INT 增加 5 最大魔力
    DEX_HIT_PER_POINT: 0.008, // 每點 DEX 增加 0.8% 命中率
    DEX_OVERFLOW_TO_ARMOR_PEN: 0.005, // 命中率超過 100% 時，每溢出 1% 轉化為 0.5% 防禦穿透
    LUK_CRIT_PER_POINT: 0.003, // 每點 LUK 增加 0.3% 暴擊率
    LUK_DODGE_PER_POINT: 0.002, // 每點 LUK 增加 0.2% 閃避率
    CRIT_MULT: 1.5,
    EQUIP_SPEED_MS: 8 // 每點裝備 speed 折算的 ms (legacy, 保留兼容)
};

// 防禦公式參數：防禦因子 = DEF / (DEF + BASE_DEF_SCALE + 攻擊方等級 * LEVEL_DEF_SCALE)
export const DEFENSE_CONFIG = {
    BASE_DEF_SCALE: 100,
    LEVEL_DEF_SCALE: 10
};

// 等級壓制參數：每差 1 級扣減 PENALTY_PER_LEVEL 傷害，最低為 MIN_PENALTY_MULT
export const LEVEL_PENALTY_CONFIG = {
    PENALTY_PER_LEVEL: 0.03,
    MIN_PENALTY_MULT: 0.1
};

// Boss 加成設定
export const BOSS_CONFIG = {
    FLOOR_INTERVAL: 10, // 每 10 層出現 Boss
    HP_MULT: 3,
    DEF_MULT: 3,
    ATK_MULT: 1.5,
    EXP_MULT: 3,
    GOLD_MULT: 5,
    AFFIXES: [
        { name: '裝甲', effect: 'def', mult: 1.5, icon: '🛡️' },
        { name: '狂暴', effect: 'atk', mult: 1.5, icon: '💢' },
        { name: '迅捷', effect: 'speed', mult: 1.5, icon: '💨' },
        { name: '堅韌', effect: 'hp', mult: 1.5, icon: '❤️' }
    ]
};

// 戰鬥恢復設定
export const RECOVERY_CONFIG = {
    WIN_HP_PERCENT: 0.10, // 勝利後恢復 10% HP
    WIN_SP_PERCENT: 0.10  // 勝利後恢復 10% SP
};

// 經驗值升級曲線係數（依等級段分段）
export const EXP_CURVE = {
    BASE_EXP: 100, // 1 級升 2 級所需經驗
    TIERS: [
        { maxLevel: 20, multiplier: 1.30 },
        { maxLevel: 50, multiplier: 1.35 },
        { maxLevel: 100, multiplier: 1.25 },
        { maxLevel: Infinity, multiplier: 1.20 }
    ]
};

export const DEFAULT_CLASS_STATS = {
    warrior: { str: 8, agi: 4, vit: 8, int: 2, dex: 3, luk: 2 },
    mage:    { str: 2, agi: 4, vit: 3, int:10, dex: 5, luk: 2 },
    rogue:   { str: 4, agi:10, vit: 4, int: 3, dex: 6, luk: 4 }
};

// 自動刷怪退回層數
export const AUTO_BATTLE_CONFIG = {
    FALLBACK_FLOORS: 5, // 戰敗後退回的層數
    GRIND_OFFSET: 5     // 刷怪模式在當前層 - GRIND_OFFSET 進行
};
