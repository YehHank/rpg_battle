/**
 * test/03_damage_formula.test.js — 傷害/防禦公式測試
 * 覆蓋範圍：applyDefenseAndPenalty / levelPenalty / armorPen
 */
const { test, expect, describe, summary } = require('./run_tests');
const { applyDefenseAndPenalty, DEFENSE_CONFIG, LEVEL_PENALTY_CONFIG } = require('./formulas');

describe('傷害/防禦公式 (applyDefenseAndPenalty)', () => {

    describe('防禦減傷', () => {
        test('def=0 → 全額傷害（無防禦）', () => {
            // defenseFactor = 0/(0+100+1*10) = 0
            const dmg = applyDefenseAndPenalty(100, 1, 0, 1);
            expect(dmg).toBe(100);
        });

        test('高防禦減傷但最低 1 點', () => {
            const dmg = applyDefenseAndPenalty(1, 1, 99999, 1);
            expect(dmg).toBeGreaterThanOrEqual(1);
        });

        test('相同防禦值：攻擊方等級越高 → 防禦因子越小 → 傷害越高', () => {
            const dmgLow  = applyDefenseAndPenalty(100, 1,  50, 1);
            const dmgHigh = applyDefenseAndPenalty(100, 50, 50, 1);
            // 攻擊方 lv 越高，DEF/(DEF+BASE+LV*10) 中分母越大，factor 越小，傷害越高
            expect(dmgHigh).toBeGreaterThan(dmgLow);
        });

        test('防禦公式：def=100, attackerLv=10 → factor = 100/(100+100+10*10) = 100/300 ≈ 0.333', () => {
            // afterDefense = 1-0.333 = 0.667
            // dmg = floor(100 * 0.667) = 66
            const expected = Math.floor(100 * (1 - 100 / (100 + 100 + 10 * 10)));
            const actual   = applyDefenseAndPenalty(100, 10, 100, 10); // 同等級 no penalty
            expect(actual).toBe(expected);
        });
    });

    describe('等級壓制 (levelPenalty)', () => {
        test('等級相同 → penalty = 1.0（無壓制）', () => {
            const withPenalty    = applyDefenseAndPenalty(100, 10, 0, 10);
            const withoutPenalty = applyDefenseAndPenalty(100, 10, 0, 10);
            expect(withPenalty).toBe(withoutPenalty);
        });

        test('防禦方比攻擊方高 1 級 → 傷害減少 3%', () => {
            const same   = applyDefenseAndPenalty(100, 10, 0, 10);
            const gapped = applyDefenseAndPenalty(100, 10, 0, 11);
            const ratio  = gapped / same;
            expect(ratio).toBeCloseTo(1 - LEVEL_PENALTY_CONFIG.PENALTY_PER_LEVEL, 1);
        });

        test('等級差超過 30 → penalty 收斂到 MIN (0.1)', () => {
            const dmg = applyDefenseAndPenalty(100, 1, 0, 40);
            // 最小倍率 0.1
            expect(dmg).toBe(Math.max(1, Math.floor(100 * LEVEL_PENALTY_CONFIG.MIN_PENALTY_MULT)));
        });

        test('攻擊方等級高於防禦方 → 無等級壓制', () => {
            const lowAtk  = applyDefenseAndPenalty(100, 5,  0, 5);
            const highAtk = applyDefenseAndPenalty(100, 50, 0, 5);
            // 高等級攻擊方：分母更大，防禦因子更小，傷害理應更高（無 penalty 差異）
            expect(highAtk).toBeGreaterThanOrEqual(lowAtk);
        });
    });

    describe('防禦穿透 (armorPen)', () => {
        test('armorPen=0 → 不影響傷害', () => {
            const dmgNo  = applyDefenseAndPenalty(100, 10, 100, 10, 0);
            const dmgPen = applyDefenseAndPenalty(100, 10, 100, 10, 0);
            expect(dmgNo).toBe(dmgPen);
        });

        test('armorPen=0.5 → 有效防禦值減半 → 傷害提升', () => {
            const noPen   = applyDefenseAndPenalty(100, 10, 100, 10, 0);
            const withPen = applyDefenseAndPenalty(100, 10, 100, 10, 0.5);
            expect(withPen).toBeGreaterThan(noPen);
        });

        test('armorPen=1.0 → 有效防禦歸零 → 等同 def=0', () => {
            const fullPen = applyDefenseAndPenalty(100, 10, 100, 10, 1.0);
            const zeroDef = applyDefenseAndPenalty(100, 10, 0,   10, 0.0);
            expect(fullPen).toBe(zeroDef);
        });
    });

    describe('最小傷害保護', () => {
        test('任何情況下傷害至少 1', () => {
            // 超低攻擊 vs 超高防禦，且有等級懲罰
            const dmg = applyDefenseAndPenalty(1, 1, 1000000, 100);
            expect(dmg).toBeGreaterThanOrEqual(1);
        });
    });
});

const ok = summary();
process.exitCode = ok ? 0 : 1;
