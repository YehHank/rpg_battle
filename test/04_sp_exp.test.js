/**
 * test/04_sp_exp.test.js — SP 系統 + EXP 曲線測試
 */
const { test, expect, describe, summary } = require('./run_tests');
const {
    STAT_COEFFICIENTS, EXP_CURVE, RECOVERY_CONFIG,
    simulatePlayer, computeExpToLevel, computeCumulativeExp,
} = require('./formulas');

describe('SP 系統', () => {

    describe('effectiveMaxSp 計算', () => {
        test('戰士 Lv1: maxSp(30) + int(2)*5 = 40', () => {
            const p = simulatePlayer('warrior', 1);
            expect(p.effectiveMaxSp).toBe(30 + 2 * STAT_COEFFICIENTS.INT_SP_PER_POINT);
        });

        test('法師 Lv1: maxSp(30) + int(10)*5 = 80', () => {
            const p = simulatePlayer('mage', 1);
            expect(p.effectiveMaxSp).toBe(30 + 10 * STAT_COEFFICIENTS.INT_SP_PER_POINT);
        });

        test('高 INT 法師 Lv50 SP > 戰士 Lv50 SP', () => {
            const mage    = simulatePlayer('mage',    50, { int: 4, vit: 1 });
            const warrior = simulatePlayer('warrior', 50, { str: 4, vit: 1 });
            expect(mage.effectiveMaxSp).toBeGreaterThan(warrior.effectiveMaxSp);
        });
    });
});

describe('EXP 曲線', () => {

    describe('升級所需 EXP 遞增', () => {
        test('每級所需 EXP 嚴格遞增', () => {
            let prev = EXP_CURVE.BASE_EXP;
            for (let lv = 2; lv <= 100; lv++) {
                const cur = computeExpToLevel(lv);
                if (cur <= prev)
                    throw new Error(`lv${lv} 所需 EXP (${cur}) ≤ 前一級 (${prev})`);
                prev = cur;
            }
        });

        test('Lv1→2 所需 EXP = BASE_EXP = 100', () => {
            expect(EXP_CURVE.BASE_EXP).toBe(100);
        });

        test('Lv2→3 所需 EXP = floor(100 * 1.30) = 130（Tier1 multiplier）', () => {
            expect(computeExpToLevel(2)).toBe(Math.floor(EXP_CURVE.BASE_EXP * EXP_CURVE.TIERS[0].multiplier));
        });
    });

    describe('分段倍率切換', () => {
        test('Lv20 仍使用 multiplier 1.30', () => {
            const tier = EXP_CURVE.TIERS.find(t => 20 <= t.maxLevel);
            expect(tier.multiplier).toBe(1.30);
        });

        test('Lv21 切換至 multiplier 1.35', () => {
            const tier = EXP_CURVE.TIERS.find(t => 21 <= t.maxLevel);
            expect(tier.multiplier).toBe(1.35);
        });

        test('Lv51 切換至 multiplier 1.25', () => {
            const tier = EXP_CURVE.TIERS.find(t => 51 <= t.maxLevel);
            expect(tier.multiplier).toBe(1.25);
        });

        test('Lv101 使用 multiplier 1.20', () => {
            const tier = EXP_CURVE.TIERS.find(t => 101 <= t.maxLevel);
            expect(tier.multiplier).toBe(1.20);
        });
    });

    describe('累積 EXP 合理性', () => {
        test('升到 Lv10 累積 EXP < 50000', () => {
            expect(computeCumulativeExp(10)).toBeLessThan(50000);
        });

        test('升到 Lv50 累積 EXP < 1e10', () => {
            expect(computeCumulativeExp(50)).toBeLessThan(1e10);
        });

        test('升到 Lv100 累積 EXP < 1e14（指數曲線，允許大值）', () => {
            expect(computeCumulativeExp(100)).toBeLessThan(1e14);
        });
    });
});

describe('戰鬥恢復 (RECOVERY_CONFIG)', () => {
    test('WIN_HP_PERCENT = 10%', () => {
        expect(RECOVERY_CONFIG.WIN_HP_PERCENT).toBe(0.10);
    });

    test('WIN_SP_PERCENT = 10%', () => {
        expect(RECOVERY_CONFIG.WIN_SP_PERCENT).toBe(0.10);
    });

    test('每場勝利恢復量 = floor(effectiveMaxHp * 0.10)', () => {
        const p = simulatePlayer('warrior', 20);
        const recovered = Math.floor(p.effectiveMaxHp * RECOVERY_CONFIG.WIN_HP_PERCENT);
        expect(recovered).toBeGreaterThan(0);
        expect(recovered).toBeLessThan(p.effectiveMaxHp);
    });
});

const ok = summary();
process.exitCode = ok ? 0 : 1;
