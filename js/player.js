import { CLASSES } from './data.js?version=1.0.5';
import { POINTS_PER_LEVEL, STAT_COEFFICIENTS, DEFAULT_CLASS_STATS, DEFENSE_CONFIG } from './stats_config.js?version=1.0.5';

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

        // --- 新增：基礎六屬性（可由 stats_config 提供預設） ---
        const stats = DEFAULT_CLASS_STATS[classKey] || { str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5 };
        this.str = stats.str;
        this.agi = stats.agi;
        this.vit = stats.vit;
        this.int = stats.int;
        this.dex = stats.dex;
        this.luk = stats.luk;

        // 可分配的升級點數（升級時增加 POINTS_PER_LEVEL）
        this.statPointsAvailable = 0;

        // 成長屬性
        this.level = 1;
        this.exp = 0;
        this.nextLevelExp = 100;
        this.gold = 0;

        // 裝備與背包初始化
        this.equipment = {
            weapon: null,
            armor: null,
            helm: null,
            shoes: null,
            shield: null,
            accessory: null
        };
        this.inventory = [];
        // 背包容量（可以調整）
        this.inventoryLimit = 20;

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
        if (this.equipment.accessory) bonus += this.equipment.accessory.atk || 0;
        // 包含來自屬性的攻擊加成
        const atkFromStats = Math.floor(this.str * STAT_COEFFICIENTS.STR_ATK);
        return this.atk + bonus + atkFromStats;
    }

    get totalDef() {
        let bonus = 0;
        if (this.equipment.armor) bonus += this.equipment.armor.def || 0;
        if (this.equipment.helm) bonus += this.equipment.helm.def || 0;
        if (this.equipment.shield) bonus += this.equipment.shield.def || 0;
        if (this.equipment.accessory) bonus += this.equipment.accessory.def || 0;
        const defFromVit = Math.floor(this.vit * STAT_COEFFICIENTS.VIT_DEF_PER_POINT);
        return this.def + bonus + defFromVit;
    }

    get totalSpeed() {
        let bonus = 0;
        if (this.equipment.helm) bonus += this.equipment.helm.speed || 0;
        if (this.equipment.shoes) bonus += this.equipment.shoes.speed || 0;
        if (this.equipment.accessory) bonus += this.equipment.accessory.speed || 0;
        return this.speed + bonus;
    }

    // --- 屬性衍生值 ---
    get attackCooldownMs() {
        const base = 1000;
        const agiReduction = Math.floor(this.agi * STAT_COEFFICIENTS.AGI_ASPD_REDUCTION_MS);
        const equipReduction = Math.floor(this.totalSpeed * STAT_COEFFICIENTS.EQUIP_SPEED_MS);
        return Math.max(120, base - agiReduction - equipReduction);
    }

    get critChance() {
        return Math.min(0.5, STAT_COEFFICIENTS.LUK_CRIT_BASE + this.luk * STAT_COEFFICIENTS.LUK_CRIT_PER_POINT);
    }

    get critMultiplier() {
        return STAT_COEFFICIENTS.CRIT_MULT;
    }

    get dodgeChance() {
        return Math.min(0.5, this.luk * STAT_COEFFICIENTS.LUK_DODGE_PER_POINT);
    }

    allocateStat(statName, delta) {
        const keys = ['str','agi','vit','int','dex','luk'];
        if (!keys.includes(statName)) return false;
        const amount = Number(delta) || 0;
        if (amount <= 0) return false;
        if (this.statPointsAvailable < amount) return false;
        this[statName] += amount;
        this.statPointsAvailable -= amount;
        this._notifyChange();
        return true;
    }

    applyAllocation(pendingAlloc) {
        if (!pendingAlloc) return false;
        const keys = ['str','agi','vit','int','dex','luk'];
        let total = 0;
        keys.forEach(k => { total += Math.max(0, Number(pendingAlloc[k] || 0)); });
        if (total > this.statPointsAvailable) return false;
        keys.forEach(k => {
            const v = Math.max(0, Number(pendingAlloc[k] || 0));
            if (v > 0) this.allocateStat(k, v);
        });
        return true;
    }

    // --- 新增：加入物品功能 ---
    addItem(item) {
        if (!item) return false;
        if (this.inventory.length >= this.inventoryLimit) {
            console.warn(`${this.name} 的背包已滿，無法獲得 ${item.name}`);
            return false;
        }
        this.inventory.push(item);
        console.log(`${this.name} 獲得了 ${item.name}`);
        this._notifyChange();
        return true;
    }

    // --- 裝備功能 ---
    equipItem(item) {
        if (!item) return false;
        const slot = item.type === 'weapon' ? 'weapon' :
                     item.type === 'armor' ? 'armor' :
                     item.type === 'helm' ? 'helm' :
                     item.type === 'shoes' ? 'shoes' :
                     item.type === 'shield' ? 'shield' :
                     item.type === 'accessory' ? 'accessory' : null;
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
        
        // 如果背包已滿，阻止脫下並回報
        if (this.inventory.length >= this.inventoryLimit) {
            console.warn(`${this.name} 的背包已滿，無法脫下 ${item.name}`);
            return false;
        }
        // 將物品放回背包
        this.inventory.push(item);
        // 清空欄位
        this.equipment[slot] = null;

        this._notifyChange();
        return true;
    }

    takeDamage(amount) {
        // 閃避判定（若閃避則回傳 0）
        if (Math.random() < this.dodgeChance) {
            this._notifyChange();
            return 0;
        }
        const incoming = Math.max(0, Number(amount) || 0);
        const def = Math.max(0, Number(this.totalDef) || 0);
        const defScale = (DEFENSE_CONFIG && DEFENSE_CONFIG.DEF_SCALE) ? DEFENSE_CONFIG.DEF_SCALE : 100;
        // 比例化減傷：實際傷害 = incoming * (defScale / (defScale + def))
        const reductionFactor = defScale / (defScale + def);
        const actualDamage = Math.max(1, Math.floor(incoming * reductionFactor));
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
        // 每次升級額外給予可分配點數
        this.statPointsAvailable += POINTS_PER_LEVEL;
        this._notifyChange();
    }
}