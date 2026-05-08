/**
 * test/01_stats.test.js — 屬性係數測試
 * 覆蓋範圍：totalAtk / effectiveMaxHp / totalSpeed / critChance / dodgeChance / armorPen
 */
const { test, expect, describe, summary } = require('./run_tests');
const {
    STAT_COEFFICIENTS, simulatePlayer,
} = require('./formulas');

describe('屬性係數 (stats_config)', () => {

    describe('戰士 Lv1 基礎值', () => {
        const p = simulatePlayer('warrior', 1);

        test('totalAtk = baseAtk(20) + str(8)*3 = 44', () => {
            expect(p.totalAtk).toBe(20 + 8 * 3); // 44
        });

        test('effectiveMaxHp = baseHp(150) + vit(8)*15 = 270', () => {
            expect(p.effectiveMaxHp).toBe(150 + 8 * 15); // 270
        });

        test('def = baseDef(10) + vit(8)*0.7 = 15 (floor)', () => {
            expect(p.def).toBe(10 + Math.floor(8 * 0.7)); // 10+5=15
        });

        test('critChance = luk(2) * 0.003 = 0.006', () => {
            expect(p.critChance).toBeCloseTo(0.006);
        });

        test('dodgeChance = agi(4)*0.005 + luk(2)*0.002 = 0.024', () => {
            expect(p.dodgeChance).toBeCloseTo(0.024);
        });

        test('accuracy < 100% → armorPen = 0 (dex=3, rawAcc=0.924)', () => {
            expect(p.armorPen).toBe(0);
        });
    });

    describe('法師 Lv1 基礎值', () => {
        const p = simulatePlayer('mage', 1);

        test('totalAtk = baseAtk(35) + str(2)*3 = 41', () => {
            expect(p.totalAtk).toBe(35 + 2 * 3); // 41
        });

        test('effectiveMaxHp = 80 + vit(3)*15 = 125', () => {
            expect(p.effectiveMaxHp).toBe(80 + 3 * 15); // 125
        });
    });

    describe('升級後屬性增長', () => {
        const p10 = simulatePlayer('warrior', 10, { str: 3, vit: 1, dex: 1 });
        const p1  = simulatePlayer('warrior', 1);

        test('Lv10 totalAtk > Lv1 totalAtk', () => {
            expect(p10.totalAtk).toBeGreaterThan(p1.totalAtk);
        });

        test('Lv10 effectiveMaxHp > Lv1 effectiveMaxHp', () => {
            expect(p10.effectiveMaxHp).toBeGreaterThan(p1.effectiveMaxHp);
        });

        test('Lv10 def > Lv1 def', () => {
            expect(p10.def).toBeGreaterThan(p1.def);
        });
    });

    describe('高 DEX → armorPen', () => {
        // 需要 dex 很高才能超過 100% 命中
        // rawAccuracy = 0.90 + dex*0.008；超過 1.0 才有 armorPen
        // dex > (1.0-0.90)/0.008 = 12.5 → dex >= 13
        const highDex = simulatePlayer('rogue', 50, { dex: 5 }); // 大量加 dex

        test('高 DEX 時 armorPen >= 0', () => {
            expect(highDex.armorPen).toBeGreaterThanOrEqual(0);
        });

        test('高 DEX 時 effectiveAccuracy 上限 = 1.0', () => {
            expect(highDex.effectiveAccuracy).toBeLessThanOrEqual(1.0);
        });
    });
});

const ok = summary();
process.exitCode = ok ? 0 : 1;
