import { CLASSES } from './data.js';

export class Player {
    constructor(name, classKey) {
        const classData = CLASSES[classKey];
        this.name = name;
        this.classKey = classKey;
        this.className = classData.name;
        this.icon = classData.icon;
        
        // 基礎屬性
        this.maxHp = classData.baseHp;
        this.hp = classData.baseHp;
        this.atk = classData.baseAtk;
        this.def = classData.baseDef;
        this.speed = classData.baseSpeed;
        this.skillName = classData.baseSkill;

        // 成長屬性
        this.level = 1;
        this.exp = 0;
        this.nextLevelExp = 100;
        this.gold = 0;

        // 裝備與背包初始化
        this.equipment = {
            weapon: null,
            armor: null
        };
        this.inventory = [];

        this._onChanged = null;
    }

    setOnChanged(callback) {
        this._onChanged = callback;
    }

    _notifyChange() {
        if (this._onChanged) this._onChanged();
    }

    set gold(value) { this._gold = value; this._notifyChange(); }
    get gold() { return this._gold; }

    set exp(value) { this._exp = value; this._notifyChange(); }
    get exp() { return this._exp; }

    // 取得加成後的屬性 (使用 Getter)
    get totalAtk() {
        let bonus = 0;
        if (this.equipment.weapon) bonus += this.equipment.weapon.atk || 0;
        return this.atk + bonus;
    }

    get totalDef() {
        let bonus = 0;
        if (this.equipment.armor) bonus += this.equipment.armor.def || 0;
        return this.def + bonus;
    }

    // --- 裝備功能 ---
    equipItem(item) {
        if (!item) return false;
        const slot = item.type === 'weapon' ? 'weapon' : (item.type === 'armor' ? 'armor' : null);
        if (!slot) return false;

        // 如果該欄位已有物品，先退回背包
        if (this.equipment[slot]) {
            this.inventory.push(this.equipment[slot]);
        }

        this.equipment[slot] = item;

        // 從背包中移除新穿上的物品
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
        }

        console.log(`${this.name} 穿上了 ${item.name}`);
        this._notifyChange();
        return true;
    }

    // --- 新增：脫下功能 ---
    unequipItem(slot) {
        if (!this.equipment[slot]) return false;

        const item = this.equipment[slot];
        console.log(`${this.name} 脫下了 ${item.name}`);
        
        // 將物品放回背包
        this.inventory.push(item);
        // 清空欄位
        this.equipment[slot] = null;

        this._notifyChange();
        return true;
    }

    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.totalDef);
        this.hp = Math.max(0, this.hp - actualDamage);
        this._notifyChange();
        return actualDamage;
    }

    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.nextLevelExp) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.exp -= this.nextLevelExp;
        this.nextLevelExp = Math.floor(this.nextLevelExp * 1.5);
        this.maxHp += 20;
        this.hp = this.maxHp;
        this.atk += 5;
        this.def += 2;
        this.speed += 1;
        this._notifyChange();
    }
}