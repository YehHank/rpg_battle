/**
 * formulas.js — 從遊戲 JS 複製的純函數版本（無 DOM 依賴）
 * 供所有測試共用。同步維護時請比對 js/ 下的原始檔案。
 */

// ── stats_config.js ──────────────────────────────────────────────
const POINTS_PER_LEVEL = 5;

const STAT_COEFFICIENTS = {
    STR_ATK: 3,
    AGI_SPD_PER_POINT: 1,
    AGI_DODGE_PER_POINT: 0.005,
    VIT_HP_PER_POINT: 15,
    VIT_DEF_PER_POINT: 0.7,
    INT_MATK_PER_POINT: 3,
    INT_SP_PER_POINT: 5,
    DEX_HIT_PER_POINT: 0.008,
    DEX_OVERFLOW_TO_ARMOR_PEN: 0.005,
    LUK_CRIT_PER_POINT: 0.003,
    LUK_DODGE_PER_POINT: 0.002,
    CRIT_MULT: 1.5,
};

const DEFENSE_CONFIG = {
    BASE_DEF_SCALE: 100,
    LEVEL_DEF_SCALE: 10,
};

const LEVEL_PENALTY_CONFIG = {
    PENALTY_PER_LEVEL: 0.03,
    MIN_PENALTY_MULT: 0.1,
};

const BOSS_CONFIG = {
    FLOOR_INTERVAL: 10,
    HP_MULT: 3,
    DEF_MULT: 3,
    ATK_MULT: 1.5,
    EXP_MULT: 3,
    GOLD_MULT: 5,
};

const EXP_CURVE = {
    BASE_EXP: 100,
    TIERS: [
        { maxLevel: 20,       multiplier: 1.30 },
        { maxLevel: 50,       multiplier: 1.35 },
        { maxLevel: 100,      multiplier: 1.25 },
        { maxLevel: Infinity, multiplier: 1.20 },
    ],
};

const RECOVERY_CONFIG = {
    WIN_HP_PERCENT: 0.10,
    WIN_SP_PERCENT: 0.10,
};

// ── data.js ──────────────────────────────────────────────────────
/**
 * 連續指數怪物成長公式 v2（同 data.js）
 * expGrowth  = 1.35^((lv-1)/20) — 每 20 層約 ×1.35
 * linearMult = 1 + (lv-1)*0.03  — 線性微調
 */
function computeMonsterScale(level) {
    const lv = Math.max(1, level);
    const expGrowth  = Math.pow(1.35, (lv - 1) / 20);
    const linearMult = 1 + (lv - 1) * 0.03;
    return expGrowth * linearMult;
}

/** 依 level 計算怪物模板（以 baseHp/baseAtk 為基準） */
function computeMonster(level, baseHp = 60, baseAtk = 20, baseSpeed = 10, isBoss = false) {
    const scale = computeMonsterScale(level);
    let hp  = Math.floor(baseHp  * scale);
    let atk = Math.floor(baseAtk * scale);
    let def = Math.floor(baseHp  * 0.08 * scale);
    let spd = Math.max(1, Math.floor(baseSpeed * Math.sqrt(scale)));
    if (isBoss) {
        hp  = Math.floor(hp  * BOSS_CONFIG.HP_MULT);
        def = Math.floor(def * BOSS_CONFIG.DEF_MULT);
        atk = Math.floor(atk * BOSS_CONFIG.ATK_MULT);
    }
    return { hp, atk, def, speed: spd, level, isBoss };
}

// ── player.js ────────────────────────────────────────────────────
const CLASSES = {
    warrior: { baseHp: 150, baseAtk: 20, baseDef: 10, baseSpeed: 5 },
    mage:    { baseHp:  80, baseAtk: 35, baseDef:  5, baseSpeed: 8 },
    rogue:   { baseHp: 100, baseAtk: 25, baseDef:  7, baseSpeed: 12 },
};

const DEFAULT_CLASS_STATS = {
    warrior: { str: 8, agi: 4, vit: 8, int: 2, dex: 3, luk: 2 },
    mage:    { str: 2, agi: 4, vit: 3, int: 10, dex: 5, luk: 2 },
    rogue:   { str: 4, agi: 10, vit: 4, int: 3, dex: 6, luk: 4 },
};

/**
 * 模擬玩家成長至 targetLevel
 * @param {string} classKey - 'warrior'|'mage'|'rogue'
 * @param {number} targetLevel
 * @param {object} pointAlloc - 每 POINTS_PER_LEVEL 點的分配比例 e.g. {str:2,agi:1,vit:1,dex:1}
 */
function simulatePlayer(classKey, targetLevel, pointAlloc = { str: 2, agi: 1, vit: 1, dex: 1 }) {
    const cls   = CLASSES[classKey];
    const stats = { ...DEFAULT_CLASS_STATS[classKey] };
    let maxHp   = cls.baseHp;
    let atk     = cls.baseAtk;
    let def     = cls.baseDef;
    let speed   = cls.baseSpeed;
    let maxSp   = 30;

    for (let lv = 2; lv <= targetLevel; lv++) {
        maxHp += 20;
        atk   += 5;
        def   += 2;
        speed += 1;
        // 分配本次升級點數
        const total = Object.values(pointAlloc).reduce((a, b) => a + b, 0);
        const pts = POINTS_PER_LEVEL;
        for (const [stat, weight] of Object.entries(pointAlloc)) {
            stats[stat] += Math.round(pts * weight / total);
        }
    }

    const effectiveMaxHp  = maxHp  + Math.floor(stats.vit * STAT_COEFFICIENTS.VIT_HP_PER_POINT);
    const effectiveDef    = def    + Math.floor(stats.vit * STAT_COEFFICIENTS.VIT_DEF_PER_POINT);
    const totalAtk        = atk    + Math.floor(stats.str * STAT_COEFFICIENTS.STR_ATK);
    const totalSpeed      = speed  + Math.floor(stats.agi * STAT_COEFFICIENTS.AGI_SPD_PER_POINT);
    const effectiveMaxSp  = maxSp  + Math.floor(stats.int * STAT_COEFFICIENTS.INT_SP_PER_POINT);
    const rawAccuracy     = 0.90   + stats.dex * STAT_COEFFICIENTS.DEX_HIT_PER_POINT;
    const critChance      = Math.min(0.5, stats.luk * STAT_COEFFICIENTS.LUK_CRIT_PER_POINT);
    const dodgeChance     = Math.min(0.5,
        stats.agi * STAT_COEFFICIENTS.AGI_DODGE_PER_POINT +
        stats.luk * STAT_COEFFICIENTS.LUK_DODGE_PER_POINT);
    const armorPen = rawAccuracy > 1.0
        ? (rawAccuracy - 1.0) * (STAT_COEFFICIENTS.DEX_OVERFLOW_TO_ARMOR_PEN / STAT_COEFFICIENTS.DEX_HIT_PER_POINT)
        : 0;

    return {
        level: targetLevel, classKey,
        maxHp, effectiveMaxHp, atk, def: effectiveDef,
        totalAtk, totalSpeed, effectiveMaxSp,
        critChance, dodgeChance, armorPen,
        effectiveAccuracy: Math.min(1.0, rawAccuracy),
        stats,
    };
}

// ── battle.js ────────────────────────────────────────────────────
function applyDefenseAndPenalty(rawDmg, attackerLevel, defenderDef, defenderLevel, armorPen = 0) {
    const atkLv = Math.max(1, attackerLevel);
    let defVal  = Math.max(0, defenderDef);
    const defLv = Math.max(1, defenderLevel);

    if (armorPen > 0) {
        defVal = Math.max(0, Math.floor(defVal * (1 - armorPen)));
    }

    const baseDef = DEFENSE_CONFIG.BASE_DEF_SCALE;
    const lvDef   = DEFENSE_CONFIG.LEVEL_DEF_SCALE;
    const defenseFactor  = defVal / (defVal + baseDef + atkLv * lvDef);
    const afterDefense   = 1 - defenseFactor;

    let levelPenalty = 1;
    const levelGap = defLv - atkLv;
    if (levelGap > 0) {
        levelPenalty = Math.max(
            LEVEL_PENALTY_CONFIG.MIN_PENALTY_MULT,
            1 - levelGap * LEVEL_PENALTY_CONFIG.PENALTY_PER_LEVEL
        );
    }

    return Math.max(1, Math.floor(rawDmg * afterDefense * levelPenalty));
}

/** 玩家對怪物的期望傷害（含暴擊期望值，不含命中浮動） */
function playerExpectedDmg(player, monster) {
    const raw    = player.totalAtk;
    const base   = applyDefenseAndPenalty(raw, player.level, monster.def, monster.level, player.armorPen);
    const crit   = applyDefenseAndPenalty(Math.floor(raw * STAT_COEFFICIENTS.CRIT_MULT), player.level, monster.def, monster.level, player.armorPen);
    return Math.floor(base * (1 - player.critChance) + crit * player.critChance);
}

/** 怪物對玩家的期望傷害（不含閃避，玩家防禦） */
function monsterExpectedDmg(monster, player) {
    const raw = monster.atk;
    const baseDef = DEFENSE_CONFIG.BASE_DEF_SCALE;
    const lvDef   = DEFENSE_CONFIG.LEVEL_DEF_SCALE;
    const def  = player.def;
    const defenseFactor = def / (def + baseDef + monster.level * lvDef);
    const afterDef = 1 - defenseFactor;

    // 等級壓制（怪打玩家：怪level < 玩家level）
    let levelPenalty = 1;
    const gap = player.level - monster.level;
    if (gap > 0) {
        levelPenalty = Math.max(
            LEVEL_PENALTY_CONFIG.MIN_PENALTY_MULT,
            1 - gap * LEVEL_PENALTY_CONFIG.PENALTY_PER_LEVEL
        );
    }
    const dmg = Math.max(1, Math.floor(raw * afterDef * levelPenalty));
    return Math.floor(dmg * (1 - player.dodgeChance)); // 扣除期望閃避
}

/** 估算 TTK（Turn To Kill）：以「行動配額」為單位 */
function estimateTTK(player, monster) {
    const dmg = playerExpectedDmg(player, monster);
    if (dmg <= 0) return Infinity;
    return Math.ceil(monster.hp / dmg);
}

/** 估算玩家可撐幾回合（怪物每回合的攻擊次數=1，玩家每回合行動配額>=1） */
function estimateSurvivalRounds(player, monster) {
    const incomingPerRound = monsterExpectedDmg(monster, player);
    if (incomingPerRound <= 0) return Infinity;
    return Math.ceil(player.effectiveMaxHp / incomingPerRound);
}

// ── EXP 曲線 ─────────────────────────────────────────────────────
function computeExpToLevel(fromLevel) {
    let exp = EXP_CURVE.BASE_EXP;
    for (let lv = 2; lv <= fromLevel; lv++) {
        const tier = EXP_CURVE.TIERS.find(t => lv <= t.maxLevel);
        exp = Math.floor(exp * tier.multiplier);
    }
    return exp;
}

function computeCumulativeExp(targetLevel) {
    let total = 0;
    let cur   = EXP_CURVE.BASE_EXP;
    for (let lv = 2; lv <= targetLevel; lv++) {
        const tier = EXP_CURVE.TIERS.find(t => lv <= t.maxLevel);
        cur    = Math.floor(cur * tier.multiplier);
        total += cur;
    }
    return total;
}

module.exports = {
    STAT_COEFFICIENTS, DEFENSE_CONFIG, LEVEL_PENALTY_CONFIG,
    BOSS_CONFIG, EXP_CURVE, RECOVERY_CONFIG, POINTS_PER_LEVEL,
    computeMonsterScale, computeMonster,
    simulatePlayer, applyDefenseAndPenalty,
    playerExpectedDmg, monsterExpectedDmg,
    estimateTTK, estimateSurvivalRounds,
    computeExpToLevel, computeCumulativeExp,
};
