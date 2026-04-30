// 屬性與平衡參數集中設定
export const POINTS_PER_LEVEL = 5;

export const STAT_COEFFICIENTS = {
    STR_ATK: 2, // 每點 STR 增加多少物理攻擊
    AGI_ASPD_REDUCTION_MS: 10, // 每點 AGI 減少攻擊冷卻(ms)
    AGI_FLEE_PER_POINT: 0.5,
    VIT_HP_PER_POINT: 10,
    VIT_DEF_PER_POINT: 0.4,
    INT_MATK_PER_POINT: 2,
    INT_SP_PER_POINT: 5,
    INT_SP_REGEN_PER_POINT: 0.05,
    DEX_HIT_PER_POINT: 0.8,
    DEX_CD_REDUCTION_PER_POINT: 0.01,
    LUK_CRIT_BASE: 0.03,
    LUK_CRIT_PER_POINT: 0.003,
    LUK_DODGE_PER_POINT: 0.002,
    CRIT_MULT: 1.5,
    EQUIP_SPEED_MS: 8 // 每點裝備 speed 折算的 ms
};

// 防禦縮放參數：用於計算比例化減傷（實際傷害 = incoming * (DEF_SCALE / (DEF_SCALE + totalDef)))
export const DEFENSE_CONFIG = {
    DEF_SCALE: 100
};

// 攻擊縮放參數：用於計算攻擊 vs 防禦的比例化傷害
export const ATTACK_CONFIG = {
    ATK_SCALE: 50
};

export const DEFAULT_CLASS_STATS = {
    warrior: { str: 8, agi: 4, vit: 8, int: 2, dex: 3, luk: 2 },
    mage:    { str: 2, agi: 4, vit: 3, int:10, dex: 5, luk: 2 },
    rogue:   { str: 4, agi:10, vit: 4, int: 3, dex: 6, luk: 4 }
};
