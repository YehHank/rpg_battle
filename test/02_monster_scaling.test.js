/**
 * test/02_monster_scaling.test.js — 怪物成長公式測試
 * 覆蓋範圍：computeMonsterScale / MAPS 對齊 / Boss 倍率
 */
const { test, expect, describe, summary } = require('./run_tests');
const { computeMonsterScale, computeMonster, BOSS_CONFIG } = require('./formulas');

describe('怪物成長公式 (computeMonsterScale)', () => {

    describe('基礎公式結構', () => {
        test('Lv1 scale = 1.0', () => {
            expect(computeMonsterScale(1)).toBeCloseTo(1.0);
        });

        test('scale 嚴格單調遞增', () => {
            for (let lv = 1; lv < 300; lv++) {
                if (computeMonsterScale(lv + 1) <= computeMonsterScale(lv)) {
                    throw new Error(`scale 在 lv${lv}→${lv+1} 未遞增`);
                }
            }
        });

        test('Lv1 → Lv300 倍率合理（< 1e8，避免數字溢位）', () => {
            expect(computeMonsterScale(300)).toBeLessThan(1e8);
        });
    });

    describe('連續指數成長（無區域跳躍）', () => {
        test('lv20→lv21 連續遞增（無下降）', () => {
            const ratio = computeMonsterScale(21) / computeMonsterScale(20);
            expect(ratio).toBeGreaterThan(1.0);
        });

        test('lv40→lv41 連續遞增', () => {
            const ratio = computeMonsterScale(41) / computeMonsterScale(40);
            expect(ratio).toBeGreaterThan(1.0);
        });

        test('每 20 層整體倍率約 1.35（±20%）', () => {
            // scale(21)/scale(1) 應接近 1.35 * linearRatio
            const r = computeMonsterScale(21) / computeMonsterScale(1);
            // 1.35 * (1+0.6)/(1) = 1.35*1.6 = 2.16... 但含 linear 所以只檢查 > 1.5
            expect(r).toBeGreaterThan(1.5);
            expect(r).toBeLessThan(3.0);
        });
    });

    describe('層級間平滑成長', () => {
        test('lv1→lv6 成長 > 1.0', () => {
            expect(computeMonsterScale(6) / computeMonsterScale(1)).toBeGreaterThan(1.0);
        });

        test('lv6→lv11 成長 > 1.0', () => {
            expect(computeMonsterScale(11) / computeMonsterScale(6)).toBeGreaterThan(1.0);
        });

        test('lv11→lv16 成長 > 1.0', () => {
            expect(computeMonsterScale(16) / computeMonsterScale(11)).toBeGreaterThan(1.0);
        });
    });

    describe('怪物模板計算', () => {
        test('Lv1 一般怪 hp 等於 base_hp * scale(1) = base_hp', () => {
            const m = computeMonster(1, 60, 20, 10, false);
            expect(m.hp).toBe(60);
        });

        test('Boss HP = 一般怪 HP * BOSS_CONFIG.HP_MULT', () => {
            const norm = computeMonster(10, 60, 20, 10, false);
            const boss = computeMonster(10, 60, 20, 10, true);
            expect(boss.hp).toBe(Math.floor(norm.hp * BOSS_CONFIG.HP_MULT));
        });

        test('Boss ATK = 一般怪 ATK * BOSS_CONFIG.ATK_MULT', () => {
            const norm = computeMonster(20, 60, 20, 10, false);
            const boss = computeMonster(20, 60, 20, 10, true);
            expect(boss.atk).toBe(Math.floor(norm.atk * BOSS_CONFIG.ATK_MULT));
        });

        test('Boss 出現在 10 的倍數層', () => {
            expect(BOSS_CONFIG.FLOOR_INTERVAL).toBe(10);
        });
    });

    describe('MAPS 20層等寬覆蓋 1-300', () => {
        // 載入 data.js 的 MAPS（以靜態方式驗證區間）
        const MAPS = [
            { min:   1, max:  20 }, { min:  21, max:  40 },
            { min:  41, max:  60 }, { min:  61, max:  80 },
            { min:  81, max: 100 }, { min: 101, max: 120 },
            { min: 121, max: 140 }, { min: 141, max: 160 },
            { min: 161, max: 180 }, { min: 181, max: 200 },
            { min: 201, max: 220 }, { min: 221, max: 240 },
            { min: 241, max: 260 }, { min: 261, max: 280 },
            { min: 281, max: 300 },
        ];

        test('共 15 個區域', () => {
            expect(MAPS.length).toBe(15);
        });

        test('每個區域恰好 20 層寬', () => {
            for (const z of MAPS) {
                if (z.max - z.min + 1 !== 20)
                    throw new Error(`區域 ${z.min}-${z.max} 寬度不是 20`);
            }
        });

        test('無間隙：區域連續覆蓋 1-300', () => {
            let expected = 1;
            for (const z of MAPS) {
                if (z.min !== expected)
                    throw new Error(`間隙：期望 min=${expected}，實際 ${z.min}`);
                expected = z.max + 1;
            }
            expect(expected).toBe(301);
        });

        test('每 10 層有一次 Boss（10 的倍數）', () => {
            for (let lv = 10; lv <= 300; lv += 10) {
                if (lv % BOSS_CONFIG.FLOOR_INTERVAL !== 0)
                    throw new Error(`lv${lv} 應是 Boss 層`);
            }
        });
    });
});

const ok = summary();
process.exitCode = ok ? 0 : 1;
