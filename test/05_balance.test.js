/**
 * test/05_balance.test.js — 完整平衡性測試
 *
 * 包含：裝備、行動配額（速度比）、技能混合、暴擊、閃避、防禦穿透
 *
 * 評估標準：
 *   合格：在一回合循環內（玩家 N 次行動 + 怪物 1 次行動），
 *         玩家能在被殺前擊殺怪物
 */
const { test, expect, describe, summary } = require('./run_tests');
const {
    STAT_COEFFICIENTS, DEFENSE_CONFIG, LEVEL_PENALTY_CONFIG,
    BOSS_CONFIG, computeMonsterScale, computeMonster,
    simulatePlayer, applyDefenseAndPenalty,
    POINTS_PER_LEVEL,
} = require('./formulas');

// ═══════════════════════════════════════════════════════════════════
// 裝備資料（來自 data.js 的實際數值）
// ═══════════════════════════════════════════════════════════════════
const EQUIP_TIERS = [
    // tier 0: 無裝備（lv 1-5）
    { weapon: 0, armor: 0, helm: 0, helmSpd: 0, shoes: 0, shield: 0, accAtk: 0, accDef: 0, accSpd: 0 },
    // tier 1: 普通（lv 6-20）— sword_01/armor_01/helm_01/shoes_01/shield_01/accessory_01
    { weapon: 5, armor: 5, helm: 3, helmSpd: 1, shoes: 2, shield: 4, accAtk: 2, accDef: 2, accSpd: 1 },
    // tier 2: 稀有（lv 21-40）
    { weapon: 12, armor: 12, helm: 8, helmSpd: 2, shoes: 5, shield: 10, accAtk: 5, accDef: 5, accSpd: 2 },
    // tier 3: 極品（lv 41-80）
    { weapon: 25, armor: 25, helm: 18, helmSpd: 4, shoes: 12, shield: 22, accAtk: 12, accDef: 10, accSpd: 5 },
    // tier 4: 傳說（lv 81-140）
    { weapon: 50, armor: 50, helm: 35, helmSpd: 8, shoes: 25, shield: 45, accAtk: 25, accDef: 20, accSpd: 10 },
    // tier 5: 神話（lv 141+）
    { weapon: 100, armor: 100, helm: 80, helmSpd: 15, shoes: 50, shield: 90, accAtk: 50, accDef: 40, accSpd: 20 },
];

function getEquipTier(level) {
    if (level <= 5)   return 0;
    if (level <= 20)  return 1;
    if (level <= 40)  return 2;
    if (level <= 80)  return 3;
    if (level <= 140) return 4;
    return 5;
}

function applyEquipment(player, level) {
    const t = EQUIP_TIERS[getEquipTier(level)];
    return {
        ...player,
        totalAtk:   player.totalAtk   + t.weapon + t.accAtk,
        def:        player.def        + t.armor + t.helm + t.shield + t.accDef,
        totalSpeed: player.totalSpeed + t.shoes + t.helmSpd + t.accSpd,
    };
}

// ═══════════════════════════════════════════════════════════════════
// 完整戰鬥模擬（期望值計算）
// ═══════════════════════════════════════════════════════════════════
function simulateFight(player, monster) {
    const playerSpd  = Math.max(1, player.totalSpeed);
    const monsterSpd = Math.max(1, monster.speed);

    // 行動配額：同 battle.js 邏輯
    const actionQuota = Math.min(5, Math.max(1, Math.floor(playerSpd / monsterSpd)));

    // 玩家每次攻擊的期望傷害（混合普攻和技能）
    // 假設 70% 普攻 + 30% 技能（1.5x 倍率）
    const SKILL_RATIO = 0.3;
    const rawNormal = player.totalAtk;
    const rawSkill  = Math.floor(player.totalAtk * 1.5);

    const normalDmg = applyDefenseAndPenalty(rawNormal, player.level, monster.def, monster.level, player.armorPen);
    const skillDmg  = applyDefenseAndPenalty(rawSkill,  player.level, monster.def, monster.level, player.armorPen);

    // 暴擊期望
    const critMult = STAT_COEFFICIENTS.CRIT_MULT;
    const cc = player.critChance || 0;
    const normalExp = normalDmg * (1 - cc) + Math.floor(normalDmg * critMult) * cc;
    const skillExp  = skillDmg * (1 - cc) + Math.floor(skillDmg * critMult) * cc;

    // 命中率
    const hitRate = player.effectiveAccuracy || 1.0;

    // 每次動作的期望傷害
    const dmgPerAction = Math.floor(
        hitRate * ((1 - SKILL_RATIO) * normalExp + SKILL_RATIO * skillExp)
    );

    // 玩家每回合總傷害（行動配額 × 單次傷害）
    const pDmgPerRound = dmgPerAction * actionQuota;

    // 怪物對玩家的期望傷害（每回合 1 次）
    const mRawDmg = monster.atk;
    const mDefFactor = player.def / (player.def + DEFENSE_CONFIG.BASE_DEF_SCALE + monster.level * DEFENSE_CONFIG.LEVEL_DEF_SCALE);
    const mAfterDef = 1 - mDefFactor;
    let mLvPenalty = 1;
    const gap = player.level - monster.level;
    if (gap > 0) {
        mLvPenalty = Math.max(LEVEL_PENALTY_CONFIG.MIN_PENALTY_MULT, 1 - gap * LEVEL_PENALTY_CONFIG.PENALTY_PER_LEVEL);
    }
    const mBaseDmg = Math.max(1, Math.floor(mRawDmg * mAfterDef * mLvPenalty));
    const dodgeRate = player.dodgeChance || 0;
    const mDmgPerRound = Math.max(1, Math.floor(mBaseDmg * (1 - dodgeRate)));

    // TTK 和 生存回合
    const turnsToKill    = pDmgPerRound > 0 ? Math.ceil(monster.hp / pDmgPerRound) : Infinity;
    const turnsToSurvive = mDmgPerRound > 0 ? Math.ceil(player.effectiveMaxHp / mDmgPerRound) : Infinity;

    return {
        result: turnsToKill <= turnsToSurvive ? 'win' : 'lose',
        turnsToKill, turnsToSurvive,
        pDmgPerAction: dmgPerAction,
        pDmgPerRound,
        mDmgPerRound,
        actionQuota,
    };
}

// ═══════════════════════════════════════════════════════════════════
// 測試
// ═══════════════════════════════════════════════════════════════════

const ZONES = [
    [  1,  20, '新手村'],      [ 21,  40, '黑暗森林'],
    [ 41,  60, '腐化洞穴'],    [ 61,  80, '黑暗地下城'],
    [ 81, 100, '熔岩深淵'],    [101, 120, '深淵邊境'],
    [121, 140, '虛空裂縫'],    [141, 160, '天界前庭'],
    [161, 180, '混沌之域'],    [181, 200, '神魔戰場'],
    [201, 220, '星界之境'],    [221, 240, '時間廢墟'],
    [241, 260, '永恆虛無'],    [261, 280, '創世神域'],
    [281, 300, '終焉之地'],
];

// lv1-220 = 必過（正常內容）；lv221-300 = endgame（允許失敗，僅顯示 info）
const REQUIRED_MAX_LV = 220;
const REQUIRED_MAX_BOSS_LV = 200; // Area-Boss 較難，要求到 lv200

const ALLOC = { str: 2, vit: 1, agi: 1, dex: 1 };
const BASE_HP  = 62;
const BASE_ATK = 20;
const BASE_SPD = 12;

describe('完整平衡性（含裝備/速度/技能/暴擊）', () => {

    describe('戰士 vs 首層普通怪', () => {
        for (const [start, end, name] of ZONES) {
            const raw    = simulatePlayer('warrior', start, ALLOC);
            const player = applyEquipment(raw, start);
            const monster= computeMonster(start, BASE_HP, BASE_ATK, BASE_SPD, false);
            const fight  = simulateFight(player, monster);
            const isRequired = start <= REQUIRED_MAX_LV;

            test(`${name} lv${start}: ${fight.result.toUpperCase()} TTK=${fight.turnsToKill} 存活=${fight.turnsToSurvive} 配額=${fight.actionQuota} pDmg/r=${fight.pDmgPerRound} mDmg/r=${fight.mDmgPerRound}${!isRequired ? ' [endgame]' : ''}`, () => {
                if (isRequired && fight.result !== 'win') {
                    throw new Error(
                        `ATK=${player.totalAtk} DEF=${player.def} HP=${player.effectiveMaxHp} SPD=${player.totalSpeed} | ` +
                        `怪 HP=${monster.hp} ATK=${monster.atk} DEF=${monster.def} SPD=${monster.speed}`
                    );
                }
            });
        }
    });

    describe('戰士 vs Mid-Boss (lv+9)', () => {
        for (const [start, end, name] of ZONES) {
            const bossLv = start + 9;
            const raw    = simulatePlayer('warrior', bossLv, ALLOC);
            const player = applyEquipment(raw, bossLv);
            const boss   = computeMonster(bossLv, BASE_HP, BASE_ATK, BASE_SPD, true);
            const fight  = simulateFight(player, boss);
            const isRequired = bossLv <= REQUIRED_MAX_LV;

            test(`${name} Mid-Boss lv${bossLv}: ${fight.result.toUpperCase()} TTK=${fight.turnsToKill} 存活=${fight.turnsToSurvive} 配額=${fight.actionQuota}${!isRequired ? ' [endgame]' : ''}`, () => {
                if (isRequired && fight.result !== 'win') {
                    throw new Error(
                        `Boss HP=${boss.hp} ATK=${boss.atk} DEF=${boss.def} SPD=${boss.speed} | ` +
                        `玩家 ATK=${player.totalAtk} DEF=${player.def} HP=${player.effectiveMaxHp} SPD=${player.totalSpeed}`
                    );
                }
            });
        }
    });

    describe('戰士 vs Area-Boss (lv+19)', () => {
        for (const [start, end, name] of ZONES) {
            const bossLv = end;
            const raw    = simulatePlayer('warrior', bossLv, ALLOC);
            const player = applyEquipment(raw, bossLv);
            const boss   = computeMonster(bossLv, BASE_HP, BASE_ATK, BASE_SPD, true);
            const fight  = simulateFight(player, boss);
            const isRequired = bossLv <= REQUIRED_MAX_BOSS_LV;

            test(`${name} Area-Boss lv${bossLv}: ${fight.result.toUpperCase()} TTK=${fight.turnsToKill} 存活=${fight.turnsToSurvive} 配額=${fight.actionQuota}${!isRequired ? ' [endgame]' : ''}`, () => {
                if (isRequired && fight.result !== 'win') {
                    throw new Error(
                        `Boss HP=${boss.hp} ATK=${boss.atk} DEF=${boss.def} SPD=${boss.speed} | ` +
                        `玩家 ATK=${player.totalAtk} DEF=${player.def} HP=${player.effectiveMaxHp} SPD=${player.totalSpeed}`
                    );
                }
            });
        }
    });

    describe('法師 vs 首層怪', () => {
        const MAGE_ALLOC = { int: 3, vit: 1, dex: 1 };
        for (const [start, end, name] of ZONES) {
            const raw    = simulatePlayer('mage', start, MAGE_ALLOC);
            const player = applyEquipment(raw, start);
            const monster= computeMonster(start, BASE_HP, BASE_ATK, BASE_SPD, false);
            const fight  = simulateFight(player, monster);
            const isRequired = start <= REQUIRED_MAX_LV;

            test(`法師 ${name} lv${start}: ${fight.result.toUpperCase()} TTK=${fight.turnsToKill} 存活=${fight.turnsToSurvive}${!isRequired ? ' [endgame]' : ''}`, () => {
                if (isRequired && fight.result !== 'win') {
                    throw new Error(`法師 ATK=${player.totalAtk} HP=${player.effectiveMaxHp} vs 怪HP=${monster.hp}`);
                }
            });
        }
    });

    describe('盜賊 vs 首層怪', () => {
        const ROGUE_ALLOC = { agi: 2, str: 1, dex: 1, vit: 1 };
        for (const [start, end, name] of ZONES) {
            const raw    = simulatePlayer('rogue', start, ROGUE_ALLOC);
            const player = applyEquipment(raw, start);
            const monster= computeMonster(start, BASE_HP, BASE_ATK, BASE_SPD, false);
            const fight  = simulateFight(player, monster);
            const isRequired = start <= REQUIRED_MAX_LV;

            test(`盜賊 ${name} lv${start}: ${fight.result.toUpperCase()} TTK=${fight.turnsToKill} 存活=${fight.turnsToSurvive} 配額=${fight.actionQuota}${!isRequired ? ' [endgame]' : ''}`, () => {
                if (isRequired && fight.result !== 'win') {
                    throw new Error(`盜賊 ATK=${player.totalAtk} SPD=${player.totalSpeed} vs 怪HP=${monster.hp}`);
                }
            });
        }
    });
});

describe('數值曲線連續性（lv1-220）', () => {
    const REQUIRED_ZONES = ZONES.filter(([s]) => s <= REQUIRED_MAX_LV);

    test('戰士 TTK 不超過生存回合（lv1-220 正常怪可擊殺）', () => {
        for (const [start] of REQUIRED_ZONES) {
            const raw    = simulatePlayer('warrior', start, ALLOC);
            const player = applyEquipment(raw, start);
            const monster= computeMonster(start, BASE_HP, BASE_ATK, BASE_SPD, false);
            const fight  = simulateFight(player, monster);
            if (fight.turnsToKill > fight.turnsToSurvive)
                throw new Error(`lv${start} TTK(${fight.turnsToKill}) > 生存(${fight.turnsToSurvive})`);
        }
    });

    test('怪物每回合對玩家傷害遞增', () => {
        let prev = 0;
        for (const [start] of REQUIRED_ZONES) {
            const raw    = simulatePlayer('warrior', start, ALLOC);
            const player = applyEquipment(raw, start);
            const monster= computeMonster(start, BASE_HP, BASE_ATK, BASE_SPD, false);
            const fight  = simulateFight(player, monster);
            if (fight.mDmgPerRound <= prev)
                throw new Error(`lv${start} mDmg/r(${fight.mDmgPerRound}) ≤ 前區(${prev})`);
            prev = fight.mDmgPerRound;
        }
    });
});

const ok = summary();
process.exitCode = ok ? 0 : 1;
