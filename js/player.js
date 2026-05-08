import { CLASSES } from './data.js?version=1.1.3';
import { POINTS_PER_LEVEL, STAT_COEFFICIENTS, DEFAULT_CLASS_STATS, DEFENSE_CONFIG, LEVEL_PENALTY_CONFIG, EXP_CURVE, RECOVERY_CONFIG } from './stats_config.js?version=1.1.3';

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
        this.nextLevelExp = EXP_CURVE.BASE_EXP;
        this.gold = 0;

        // SP (魔力) 系統
        this.maxSp = 30; // 基礎 SP (INT 加成會在 getter 中計算)
        this.sp = this.effectiveMaxSp;

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
        // 背包基礎容量（可以調整）；實際容量會依 VIT 擴充
        this.baseInventoryLimit = 20;

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
        // STR 加成：每點 +3 物理攻擊
        const atkFromStats = Math.floor(this.str * STAT_COEFFICIENTS.STR_ATK);
        return this.atk + bonus + atkFromStats;
    }

    get totalDef() {
        let bonus = 0;
        if (this.equipment.armor) bonus += this.equipment.armor.def || 0;
        if (this.equipment.helm) bonus += this.equipment.helm.def || 0;
        if (this.equipment.shield) bonus += this.equipment.shield.def || 0;
        if (this.equipment.accessory) bonus += this.equipment.accessory.def || 0;
        // VIT 加成：每點 +0.7 物理防禦
        const defFromVit = Math.floor(this.vit * STAT_COEFFICIENTS.VIT_DEF_PER_POINT);
        return this.def + bonus + defFromVit;
    }

    get totalSpeed() {
        let bonus = 0;
        if (this.equipment.helm) bonus += this.equipment.helm.speed || 0;
        if (this.equipment.shoes) bonus += this.equipment.shoes.speed || 0;
        if (this.equipment.accessory) bonus += this.equipment.accessory.speed || 0;
        // AGI 加成：每點 +1 速度
        const spdFromAgi = Math.floor(this.agi * STAT_COEFFICIENTS.AGI_SPD_PER_POINT);
        return this.speed + bonus + spdFromAgi;
    }

    get effectiveMatk() {
        // 法術攻擊 = INT 加成 + 武器 matk 屬性
        let bonus = 0;
        if (this.equipment.weapon) bonus += this.equipment.weapon.matk || 0;
        // INT 加成：每點 +3 魔法攻擊
        const matkFromInt = Math.floor(this.int * STAT_COEFFICIENTS.INT_MATK_PER_POINT);
        return matkFromInt + bonus;
    }

    // SP (魔力) 上限：基礎 maxSp + INT 加成
    get effectiveMaxSp() {
        const intBonus = Math.floor((this.int || 0) * STAT_COEFFICIENTS.INT_SP_PER_POINT);
        return Math.max(1, (this.maxSp || 30) + intBonus);
    }

    // 動態背包容量：每 5 點 VIT 增加 1 格（向下取整）
    get inventoryLimit() {
        const extra = Math.floor((this.vit || 0) / 5);
        return Math.max(1, (this.baseInventoryLimit || 20) + extra);
    }

    // --- 屬性衍生值 ---
    get critChance() {
        // LUK 暴擊率：每點 +0.3%
        return Math.min(0.5, this.luk * STAT_COEFFICIENTS.LUK_CRIT_PER_POINT);
    }

    get critMultiplier() {
        return STAT_COEFFICIENTS.CRIT_MULT;
    }

    get dodgeChance() {
        // AGI 閃避 +0.5%/pt + LUK 閃避 +0.2%/pt
        const agiDodge = (this.agi || 0) * STAT_COEFFICIENTS.AGI_DODGE_PER_POINT;
        const lukDodge = (this.luk || 0) * STAT_COEFFICIENTS.LUK_DODGE_PER_POINT;
        return Math.min(0.5, agiDodge + lukDodge);
    }

    get accuracy() {
        // DEX 命中率：基礎 90% + 每點 +0.8%
        return 0.90 + (this.dex || 0) * STAT_COEFFICIENTS.DEX_HIT_PER_POINT;
    }

    get armorPenetration() {
        // 命中率超過 100% 的溢出部分轉化為防禦穿透
        const rawAccuracy = this.accuracy;
        if (rawAccuracy <= 1.0) return 0;
        const overflow = rawAccuracy - 1.0;
        const conversionRate = STAT_COEFFICIENTS.DEX_OVERFLOW_TO_ARMOR_PEN || 0.005;
        return overflow * (conversionRate / STAT_COEFFICIENTS.DEX_HIT_PER_POINT);
    }

    get effectiveAccuracy() {
        // 實際命中率上限 100%
        return Math.min(1.0, this.accuracy);
    }

    // 實際上限血量：基礎 maxHp + VIT 加成（顯示與戰鬥中使用）
    get effectiveMaxHp() {
        const vitBonus = Math.floor((this.vit || 0) * STAT_COEFFICIENTS.VIT_HP_PER_POINT);
        return Math.max(1, Math.floor((this.maxHp || 0) + vitBonus));
    }

    allocateStat(statName, delta) {
        const keys = ['str','agi','vit','int','dex','luk'];
        if (!keys.includes(statName)) return false;
        const amount = Number(delta) || 0;
        if (amount <= 0) return false;
        if (this.statPointsAvailable < amount) return false;
        this[statName] += amount;
        this.statPointsAvailable -= amount;
        // 當屬性變動（特別是 VIT）時，確保當前血量不會超過新的實際上限
        this.hp = Math.min(this.hp, this.effectiveMaxHp);
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

    takeDamage(amount, attackerLevel = 1) {
        // 閃避判定（若閃避則回傳 0）
        if (Math.random() < this.dodgeChance) {
            this._notifyChange();
            return 0;
        }
        const incoming = Math.max(0, Number(amount) || 0);
        const def = Math.max(0, Number(this.totalDef) || 0);
        const atkLv = Math.max(1, Number(attackerLevel) || 1);

        // 新防禦公式：防禦因子 = DEF / (DEF + 100 + 攻擊方等級 * 10)
        const baseDef = DEFENSE_CONFIG.BASE_DEF_SCALE || 100;
        const lvDef = DEFENSE_CONFIG.LEVEL_DEF_SCALE || 10;
        const defenseFactor = def / (def + baseDef + atkLv * lvDef);
        const afterDefense = 1 - defenseFactor;

        // 等級壓制：攻擊方等級 < 防禦方等級時扣減傷害
        let levelPenalty = 1;
        const levelGap = this.level - atkLv;
        if (levelGap > 0) {
            const penaltyRate = LEVEL_PENALTY_CONFIG.PENALTY_PER_LEVEL || 0.03;
            const minMult = LEVEL_PENALTY_CONFIG.MIN_PENALTY_MULT || 0.1;
            levelPenalty = Math.max(minMult, 1 - levelGap * penaltyRate);
        }

        const actualDamage = Math.max(1, Math.floor(incoming * afterDefense * levelPenalty));
        this.hp = Math.max(0, this.hp - actualDamage);
        this._notifyChange();
        return actualDamage;
    }

    gainExp(amount) {
        this.exp += amount;
        while (this.exp >= this.nextLevelExp) {
            this.levelUp();
        }
    }

    // 計算下一級所需經驗值（分段曲線）
    _computeNextLevelExp(currentLevelExp, level) {
        const tier = EXP_CURVE.TIERS.find(t => level <= t.maxLevel) || EXP_CURVE.TIERS[EXP_CURVE.TIERS.length - 1];
        return Math.floor(currentLevelExp * tier.multiplier);
    }

    levelUp() {
        this.level++;
        this.exp -= this.nextLevelExp;
        // 分段升級曲線
        this.nextLevelExp = this._computeNextLevelExp(this.nextLevelExp, this.level);
        this.maxHp += 20;
        this.atk += 5;
        this.def += 2;
        this.speed += 1;
        // 升級時把 HP 和 SP 補滿
        this.hp = this.effectiveMaxHp;
        this.sp = this.effectiveMaxSp;
        // 每次升級額外給予可分配點數
        this.statPointsAvailable += POINTS_PER_LEVEL;
        this._notifyChange();
    }

    // 戰鬥勝利後恢復 HP/SP（依 RECOVERY_CONFIG 設定）
    recoverAfterBattle() {
        const hpRecover = Math.floor(this.effectiveMaxHp * (RECOVERY_CONFIG.WIN_HP_PERCENT || 0.10));
        const spRecover = Math.floor(this.effectiveMaxSp * (RECOVERY_CONFIG.WIN_SP_PERCENT || 0.10));
        this.hp = Math.min(this.effectiveMaxHp, this.hp + hpRecover);
        this.sp = Math.min(this.effectiveMaxSp, (this.sp || 0) + spRecover);
        this._notifyChange();
    }

    // 死亡重生：HP/SP 回滿
    respawn() {
        this.hp = this.effectiveMaxHp;
        this.sp = this.effectiveMaxSp;
        this._notifyChange();
    }

    // 消耗 SP（用於技能），回傳是否成功
    consumeSp(amount) {
        const cost = Math.max(0, Number(amount) || 0);
        if ((this.sp || 0) < cost) return false;
        this.sp -= cost;
        this._notifyChange();
        return true;
    }
}