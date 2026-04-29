// 職業資料
export const CLASSES = {
    warrior: {
        name: '戰士',
        icon: '⚔️',
        desc: '高血量與高攻擊<br>擅長近身戰鬥<br>技能：猛力擊 - 造成 150% 傷害',
        baseHp: 150,
        baseAtk: 20,
        baseDef: 10,
        baseSpeed: 5,
        baseSkill: '猛力擊'
    },
    mage: {
        name: '法師',
        icon: '🔮',
        desc: '高魔法傷害<br>擅長遠程攻擊<br>技能：火球術 - 造成 200% 魔法傷害',
        baseHp: 80,
        baseAtk: 35,
        baseDef: 5,
        baseSpeed: 8,
        baseSkill: '火球術'
    },
    rogue: {
        name: '盜賊',
        icon: '🗡️',
        desc: '高閃避與暴击<br>擅長偷襲<br>技能：背刺 - 造成 250% 傷害 + 額外傷害',
        baseHp: 100,
        baseAtk: 25,
        baseDef: 7,
        baseSpeed: 12,
        baseSkill: '背刺'
    }
};

// 物品資料 (補上 price 屬性)
export const ITEMS = {
    sword_01: { id: 'sword_01', name: '生鏽的鐵劍', type: 'weapon', atk: 5, price: 50, rarity: 'common', icon: '🔪' },
    staff_01: { id: 'staff_01', name: '橡木法杖', type: 'weapon', atk: 8, price: 100, rarity: 'common', icon: '🪄' },
    armor_01: { id: 'armor_01', name: '布甲', type: 'armor', def: 5, price: 40, rarity: 'common', icon: '👕' }
};

// 怪物資料範例
export const MONSTER_TYPES = [
    { name: '史萊姆', icon: '👾', hp: 50, atk: 10, speed: 4, exp: 20, gold: 5 },
    { name: '哥布林', icon: '👺', hp: 100, atk: 15, speed: 7, exp: 50, gold: 20 }
];