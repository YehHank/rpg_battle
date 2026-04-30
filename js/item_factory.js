import { ITEMS, RARITY } from './data.js?version=1.0.7';

// 根據稀有度決定屬性浮動幅度（越稀有，浮動越小）
const RARITY_VARIANCE = {
    common: 0.18,
    uncommon: 0.12,
    rare: 0.08,
    epic: 0.05,
    legendary: 0.03
};

// 稀有度對正向修飾詞的放大倍率（只放大正向百分比效果）
const RARITY_POSITIVE_BOOST = {
    epic: 1.2,
    legendary: 1.4
};

// 全域修飾詞池（可套用於任意物品，並帶有正負效果）
const ADJ_POOL = [
    { text: '生鏽的', effects: { atkPercent: -0.20, defPercent: -0.10, pricePercent: -0.15 } },
    { text: '粗糙的', effects: { atkPercent: -0.10, defPercent: -0.05, pricePercent: -0.08 } },
    { text: '老舊的', effects: { atkPercent: -0.08, defPercent: -0.06, pricePercent: -0.07 } },
    { text: '簡陋的', effects: { defPercent: -0.12, speedPercent: -0.05, pricePercent: -0.12 } },
    { text: '普通款', effects: { pricePercent: -0.05 } },

    { text: '銳利的', effects: { atkPercent: 0.18, pricePercent: 0.12 } },
    { text: '精工的', effects: { atkPercent: 0.12, defPercent: 0.12, pricePercent: 0.18 } },
    { text: '均衡的', effects: { atkPercent: 0.08, defPercent: 0.08 } },
    { text: '打磨過的', effects: { atkPercent: 0.10, pricePercent: 0.10 } },

    { text: '藝術家製作', effects: { pricePercent: 0.20 } },
    { text: '名匠之作', effects: { atkPercent: 0.14, defPercent: 0.12, pricePercent: 0.22 } },
    { text: '精緻版', effects: { atkPercent: 0.10, pricePercent: 0.15 } },

    { text: '傳家之寶', effects: { atkPercent: 0.25, defPercent: 0.18, pricePercent: 0.30 } },
    { text: '傳世之作', effects: { atkPercent: 0.20, pricePercent: 0.25 } },
    { text: '史詩刻印', effects: { atkPercent: 0.22, defPercent: 0.15, pricePercent: 0.28 } },

    { text: '神話遺物', effects: { atkPercent: 0.35, defPercent: 0.25, pricePercent: 0.45 } },
    { text: '龍血傳承', effects: { atkPercent: 0.40, defPercent: 0.30, pricePercent: 0.60 } }
];

// 決定產生修飾詞的個數：0 (常態)、1 (偶爾)、2 (稀有)
function decideModifierCount() {
    const r = Math.random();
    if (r < 0.6) return 0;    // 60% 無修飾詞
    if (r < 0.9) return 1;    // 30% 一個
    return 2;                 // 10% 兩個
}

function pickRandomModifiers(count) {
    const out = [];
    const pool = ADJ_POOL.slice();
    for (let i = 0; i < count && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        out.push(pool.splice(idx, 1)[0]);
    }
    return out;
}

function randBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function varianceForRarity(rarity) {
    return RARITY_VARIANCE[rarity] || 0.12;
}

function rollValue(base, variance) {
    // 隨機在 ±variance 範圍內波動，並以整數回傳
    const factor = 1 + randBetween(-variance, variance);
    return Math.max(0, Math.round(base * factor));
}

// 每等級物品屬性放大百分比（指數成長）
// 公式：scaleMultiplier = (1 + ITEM_LEVEL_SCALE)^(level-1)
// 預設 0.03 表示每等級約 +3% 的指數成長（level 86 時約 x10.1）
const ITEM_LEVEL_SCALE = 0.035;

// 產生 item template 的實例（會加入 instanceId 與浮動屬性）
// opts: { level }
export function rollItemInstance(template, opts = {}) {
    if (!template) return null;
    const rarity = template.rarity || 'common';
    const variance = varianceForRarity(rarity);
    const level = Math.max(1, Number(opts.level) || 1);
    const scaleMultiplier = Math.pow(1 + ITEM_LEVEL_SCALE, level - 1);

    // 深拷貝 template
    const inst = JSON.parse(JSON.stringify(template));
    inst.baseId = template.id || template.name || 'unknown';
    inst.instanceId = `${inst.baseId}-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    // 將 instanceId 設為 id，方便 UI 與儲存識別
    inst.id = inst.instanceId;

    // 先根據等級放大基礎值，再套入浮動
    if (typeof inst.atk === 'number') inst.atk = rollValue(Math.max(0, Math.round(inst.atk * scaleMultiplier)), variance);
    if (typeof inst.def === 'number') inst.def = rollValue(Math.max(0, Math.round(inst.def * scaleMultiplier)), variance);
    if (typeof inst.speed === 'number') inst.speed = rollValue(Math.max(0, Math.round(inst.speed * scaleMultiplier)), variance);
    // 價格稍微隨屬性浮動（最多 ±10%），也放大
    if (typeof inst.price === 'number') {
        const priceBase = Math.max(1, Math.round(inst.price * scaleMultiplier));
        const priceVariance = Math.min(0.10, variance * 0.6);
        inst.price = Math.max(1, Math.round(priceBase * (1 + randBetween(-priceVariance, priceVariance))));
    }

    // 決定是否加入修飾詞（有機率 0/1/2 個），修飾詞不再限制於物品稀有度
    const modCount = decideModifierCount();
    if (modCount > 0) {
        const mods = pickRandomModifiers(modCount);
        inst._modifiers = mods.map(m => m.text);
        // 若稀有度為 epic/legendary，放大正向百分比效果
        const positiveBoost = RARITY_POSITIVE_BOOST[rarity] || 1;
        mods.forEach(m => {
            const ef = m.effects || {};
            if (typeof ef.atkPercent === 'number' && typeof inst.atk === 'number') {
                const pct = ef.atkPercent > 0 ? ef.atkPercent * positiveBoost : ef.atkPercent;
                inst.atk = Math.max(0, Math.round(inst.atk * (1 + pct)));
            }
            if (typeof ef.defPercent === 'number' && typeof inst.def === 'number') {
                const pct = ef.defPercent > 0 ? ef.defPercent * positiveBoost : ef.defPercent;
                inst.def = Math.max(0, Math.round(inst.def * (1 + pct)));
            }
            if (typeof ef.speedPercent === 'number' && typeof inst.speed === 'number') {
                const pct = ef.speedPercent > 0 ? ef.speedPercent * positiveBoost : ef.speedPercent;
                inst.speed = Math.max(0, Math.round(inst.speed * (1 + pct)));
            }
            if (typeof ef.pricePercent === 'number' && typeof inst.price === 'number') {
                const pct = ef.pricePercent > 0 ? ef.pricePercent * positiveBoost : ef.pricePercent;
                inst.price = Math.max(1, Math.round(inst.price * (1 + pct)));
            }
            if (typeof ef.allPercent === 'number') {
                const pct = ef.allPercent > 0 ? ef.allPercent * positiveBoost : ef.allPercent;
                ['atk','def','speed','price'].forEach(k => {
                    if (typeof inst[k] === 'number') inst[k] = Math.max(k === 'price' ? 1 : 0, Math.round(inst[k] * (1 + pct)));
                });
            }
        });
        const modsText = mods.map(m => m.text).join(' ');
        inst.name = `${modsText} ${inst.name}`;
    }

    return inst;
}

// 為商店生成多個變體（預設 1 個；商店不需大量變體）
export function generateShopVariants(itemKey, count = 1) {
    const template = ITEMS[itemKey];
    if (!template) return [];
    const variants = [];
    for (let i = 0; i < count; i++) {
        variants.push(rollItemInstance(template));
    }
    return variants;
}

export default { rollItemInstance, generateShopVariants };
