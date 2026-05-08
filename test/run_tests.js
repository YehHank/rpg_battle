/**
 * test/run_tests.js — 輕量測試執行器（無外部依賴，Node.js 原生執行）
 * 用法: node test/run_tests.js
 */

let passed = 0, failed = 0, total = 0;
const failMessages = [];

function test(name, fn) {
    total++;
    try {
        fn();
        console.log(`  ✅  ${name}`);
        passed++;
    } catch (e) {
        console.log(`  ❌  ${name}`);
        console.log(`       → ${e.message}`);
        failMessages.push(`[${name}] ${e.message}`);
        failed++;
    }
}

function expect(val) {
    return {
        toBe(expected) {
            if (val !== expected) throw new Error(`期望 ${expected}，實際 ${val}`);
        },
        toBeCloseTo(expected, precision = 2) {
            const factor = Math.pow(10, precision);
            if (Math.round(val * factor) !== Math.round(expected * factor))
                throw new Error(`期望 ≈${expected}，實際 ${val}`);
        },
        toBeGreaterThan(min) {
            if (val <= min) throw new Error(`期望 > ${min}，實際 ${val}`);
        },
        toBeLessThan(max) {
            if (val >= max) throw new Error(`期望 < ${max}，實際 ${val}`);
        },
        toBeGreaterThanOrEqual(min) {
            if (val < min) throw new Error(`期望 >= ${min}，實際 ${val}`);
        },
        toBeLessThanOrEqual(max) {
            if (val > max) throw new Error(`期望 <= ${max}，實際 ${val}`);
        },
        toBeTruthy() {
            if (!val) throw new Error(`期望 truthy，實際 ${val}`);
        },
        toBeFalsy() {
            if (val) throw new Error(`期望 falsy，實際 ${val}`);
        },
    };
}

function describe(suiteName, fn) {
    console.log(`\n📋 ${suiteName}`);
    fn();
}

module.exports = { test, expect, describe, summary };

function summary() {
    console.log('\n' + '─'.repeat(60));
    console.log(`結果: ${passed}/${total} 通過，${failed} 失敗`);
    if (failMessages.length > 0) {
        console.log('\n失敗清單:');
        failMessages.forEach(m => console.log(`  • ${m}`));
    }
    console.log('─'.repeat(60));
    return failed === 0;
}
