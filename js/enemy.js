import { MONSTER_TYPES } from './data.js?version=1.1.1';

export class Enemy {
    constructor(typeIndex) {
        const typeData = MONSTER_TYPES[typeIndex];
        this.name = typeData.name;
        this.icon = typeData.icon;
        
        // 怪物屬性 (複製一份，避免直接修改原始資料)
        this.maxHp = typeData.hp;
        this.hp = typeData.hp;
        this.atk = typeData.atk;
        this.speed = typeData.speed; // 新增速度屬性
        
        // 掉落與經驗值
        this.expReward = typeData.exp;
        this.goldReward = typeData.gold;
    }

    // 受到傷害
    takeDamage(amount) {
        const actualDamage = Math.max(1, amount);
        this.hp = Math.max(0, this.hp - actualDamage);
        return actualDamage;
    }

    // 檢查是否死亡
    isDead() {
        return this.hp <= 0;
    }
}