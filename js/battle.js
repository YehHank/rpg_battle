import { MONSTER_TYPES, ITEMS, getMonsterTemplateForWave, getRandomMonsterFromMap, MAPS, computeMonsterScale } from './data.js?version=1.1.3';
import { rollItemInstance } from './item_factory.js?version=1.1.3';
import { DEFENSE_CONFIG, LEVEL_PENALTY_CONFIG, STAT_COEFFICIENTS } from './stats_config.js?version=1.1.3';

export class BattleEngine {
    constructor(player, ui) {
        this.player = player;
        this.ui = ui;
        this.currentWave = 0;
        this.enemy = null;
        this.isBattleOver = false;
        this.turnCount = 0;
        this.isPlayerTurn = true;
        this._isDefending = false;
        this.playerActionQuota = 1; // 本輪玩家可連續行動次數（由 AGI 計算決定）
        this.playerAutoAttacking = false; // 由 UI pointer 事件控制（main.js 會設置）
    }

    async startBattle(wave, gameInstance, opts = {}) {
        this.currentWave = wave;
        this.isBattleOver = false;
        this.turnCount = 0;
        this.isPlayerTurn = true;
        this.gameInstance = gameInstance;
        this._isDefending = false;

        // 清除戰鬥結果視窗
        const resultContainer = document.getElementById('battle-result-container');
        if (resultContainer) {
            resultContainer.innerHTML = '';
        }

        // 重置戰鬥按鈕狀態
        this.ui.setBattleButtonsEnabled(true);

        // 清除戰鬥紀錄（可選，如果想要保留歷史紀錄可移除這行）
        const battleLog = document.getElementById('battle-log');
        if (battleLog) {
            battleLog.innerHTML = '';
        }

        // 不再每場戰鬥前回滿 HP；只有升級和死亡重生才回滿

        // 選怪：若是地圖模式 (opts.mode === 'map' 且有 mapKey)，則從該地圖隨機挑怪
        let monsterTemplate;
        if (opts.mode === 'map' && opts.mapKey) {
            monsterTemplate = getRandomMonsterFromMap(opts.mapKey);
            this.enemyMapInfo = MAPS.find(m => m.key === opts.mapKey) || null;
        } else {
            monsterTemplate = getMonsterTemplateForWave(wave);
            this.enemyMapInfo = null;
        }
        this.enemy = { ...monsterTemplate };
        this.enemy.maxHp = this.enemy.hp;
        // 確保怪物有等級屬性（用於等級壓制計算）
        if (!this.enemy.level) {
            this.enemy.level = Math.max(1, (Number(wave) || 0) + 1);
        }
        // 確保怪物有防禦值
        if (typeof this.enemy.def === 'undefined' || this.enemy.def === null) {
            this.enemy.def = Math.floor(this.enemy.maxHp * 0.08);
        }
        this.enemy.goldReward = this.enemy.gold || 0;

        if (opts.mode === 'map' && this.enemyMapInfo) {
            console.log(`地圖 ${this.enemyMapInfo.name} 開始！敵人是: ${this.enemy.name}`);
        } else {
            console.log(`試煉塔 第 ${Math.max(1, (Number(wave) || 0) + 1)} 層開始！敵人是: ${this.enemy.name}`);
        }
        this.ui.showScene('battle');

        // 更新波數 / 區域顯示
        const waveIndicator = document.getElementById('wave-indicator');
        if (waveIndicator) {
            if (opts.mode === 'map' && this.enemyMapInfo) {
                waveIndicator.textContent = `🔹 地圖：${this.enemyMapInfo.name}`;
            } else {
                waveIndicator.textContent = `🗼 試煉塔 第 ${Math.max(1, (Number(wave) || 0) + 1)} 層`;
            }
        }

        this.ui.updateBattleScene(this.player, this.enemy);
        if (opts.mode === 'map' && this.enemyMapInfo) {
            this.ui.addLog(`⚔️ 進入 ${this.enemyMapInfo.name}，遭遇 ${this.enemy.name}！`, 'log-system');
        } else {
            this.ui.addLog(`⚔️ 第 ${wave + 1} 層戰鬥開始！`, 'log-system');
        }

        // 主迴圈（AGI 行動配額）：根據玩家/敵人速度比計算本輪玩家可連續行動次數
        while (!this.isBattleOver) {
            // 計算本輪玩家行動配額（至少 1），上限保護為 5 次
            this.playerActionQuota = this.computePlayerActionQuota();
            this.ui.addLog(`行動系統：本輪你可行動 ${this.playerActionQuota} 次`, 'log-system');

            // 玩家連續動作階段
            for (let actionCount = 0; actionCount < this.playerActionQuota && !this.isBattleOver; actionCount++) {
                this.isPlayerTurn = true;
                this.ui.setBattleButtonsEnabled(true);
                // 等待玩家動作（handleAction 會呼叫 resolvePlayerTurn）
                await this.waitForPlayer();
                // 給動畫與視覺上小空隙
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // 玩家階段結束，鎖定按鈕並交給敵人
            this.isPlayerTurn = false;
            this.ui.setBattleButtonsEnabled(false);

            if (this.isBattleOver) break;

            // 敵人回合
            await new Promise(resolve => setTimeout(resolve, 300));
            await this.enemyTurn();
        }
        // 返回本次戰鬥結果（true = 勝利, false = 戰敗）
        return this.battleResult === true;
    }

    async waitForPlayer() {
        return new Promise((resolve) => {
            this.resolvePlayerTurn = resolve;
        });
    }

    computePlayerActionQuota() {
        // 以玩家與敵人的速度比決定本輪玩家可連續動作次數
        if (!this.player || !this.enemy) return 1;
        const playerSpeed = Math.max(1, Number(this.player.totalSpeed || this.player.speed || 1));
        const enemySpeed = Math.max(1, Number(this.enemy.speed || 1));
        const ratio = playerSpeed / enemySpeed;
        let quota = Math.max(1, Math.floor(ratio));
        // 為避免極端數值，設置合理上限
        quota = Math.min(quota, 5);
        return quota;
    }

    async handleAction(actionType) {
        if (!this.isPlayerTurn || this.isBattleOver) return;
        // 在處理動作時暫時鎖按鈕以防止重複點擊
        try { this.ui.setBattleButtonsEnabled(false); } catch (e) { /* ignore */ }
        let actionResult;
        try {
            switch (actionType) {
                case 'attack':
                    await this.playerAttack();
                    break;
                case 'skill':
                    actionResult = await this.playerSkill();
                    break;
                case 'defend':
                    await this.playerDefend();
                    break;
                case 'flee':
                    await this.playerFlee();
                    break;
            }
        } catch (error) {
            console.error("處理動作時發生錯誤:", error);
        }

        // SP 不足時 playerSkill 回傳 'sp_fail'，不消耗行動（由 playerSkill 內部重新啟用按鈕等待重選）
        if (actionResult === 'sp_fail') return;

        // 玩家做了動作後不論是否造成戰鬥結束，都應解除 startBattle 中的等待。
        if (this.resolvePlayerTurn) {
            try {
                this.resolvePlayerTurn();
            } catch (e) {
                console.warn('resolvePlayerTurn 執行時發生例外:', e);
            }
            // 清除引用以避免重複呼叫
            this.resolvePlayerTurn = null;
        }

        // 回合切換與按鈕由主迴圈（startBattle）及敵人回合負責管理
    }

    async playerAttack() {
        // 命中判定
        if (Math.random() > (this.player.effectiveAccuracy || 1)) {
            this.ui.logCombat(`${this.player.name} 的攻擊落空了！`, 'system');
            if (this.ui && typeof this.ui.showFloatingDamage === 'function') {
                this.ui.showFloatingDamage('enemy-combatant', 'Miss', { isCrit: false });
            }
            return;
        }
        const damage = this.calcPlayerDamage(1.0);
        const isCrit = Math.random() < (this.player.critChance || 0);
        const finalDmg = isCrit ? Math.floor(damage * this.player.critMultiplier) : damage;
        this.ui.logCombat(`${this.player.name} 發動了攻擊！${isCrit ? '（暴擊！）' : ''}`, 'combat');
        await this.executeAttack('enemy', finalDmg, isCrit);
    }

    async playerSkill() {
        const skillMultiplier = 1.5;
        const spCost = 10; // 技能 SP 消耗

        // 檢查 SP 是否足夠 — 不足時不消耗行動回合
        if (!this.player.consumeSp(spCost)) {
            this.ui.logCombat(`${this.player.name} 魔力不足，無法使用技能！`, 'error');
            // 重新啟用按鈕讓玩家重新選擇行動（resolvePlayerTurn 保留，等下次行動使用）
            this.ui.setBattleButtonsEnabled(true);
            return 'sp_fail';
        }

        // 命中判定
        if (Math.random() > (this.player.effectiveAccuracy || 1)) {
            this.ui.logCombat(`${this.player.name} 的技能落空了！`, 'system');
            if (this.ui && typeof this.ui.showFloatingDamage === 'function') {
                this.ui.showFloatingDamage('enemy-combatant', 'Miss', { isCrit: false });
            }
            return;
        }

        // 如果是法師，技能參考 effectiveMatk
        let raw;
        if (this.player && this.player.classKey === 'mage') {
            const matk = this.player.effectiveMatk || 0;
            const physContribution = Math.floor((this.player.totalAtk || 0) * 0.15);
            raw = Math.floor((matk + physContribution) * skillMultiplier);
        } else {
            raw = Math.floor(this.player.totalAtk * skillMultiplier);
        }

        // 套用防禦減傷與等級壓制
        const damage = this.applyDefenseAndPenalty(raw, this.player.level, this.enemy.def, this.enemy.level);
        const isCrit = Math.random() < (this.player.critChance || 0);
        const finalDmg = isCrit ? Math.floor(damage * this.player.critMultiplier) : damage;
        this.ui.logCombat(`${this.player.name} 使用了技能 ${this.player.skillName}！💥${isCrit ? '（暴擊！）' : ''}`, 'combat');
        await this.executeAttack('enemy', finalDmg, isCrit);
    }

    /**
     * 計算玩家對怪物的傷害（含防禦減傷+等級壓制）
     * @param {number} skillMult - 技能倍率（普攻=1.0）
     */
    calcPlayerDamage(skillMult = 1.0) {
        const rawAtk = Math.floor(this.player.totalAtk * skillMult);
        return this.applyDefenseAndPenalty(rawAtk, this.player.level, this.enemy.def, this.enemy.level);
    }

    /**
     * 通用防禦減傷 + 等級壓制計算
     * 防禦因子 = DEF / (DEF + 100 + 攻擊方等級 * 10)
     * 等級壓制 = max(0.1, 1 - (防禦方等級 - 攻擊方等級) * 0.03)
     * 防禦穿透（DEX 溢出）：減少防禦方有效 DEF
     */
    applyDefenseAndPenalty(rawDmg, attackerLevel, defenderDef, defenderLevel) {
        const atkLv = Math.max(1, attackerLevel || 1);
        let defVal = Math.max(0, defenderDef || 0);
        const defLv = Math.max(1, defenderLevel || 1);

        // 防禦穿透：DEX 溢出轉化（僅限玩家攻擊怪物時）
        const armorPen = this.player ? (this.player.armorPenetration || 0) : 0;
        if (armorPen > 0) {
            defVal = Math.max(0, Math.floor(defVal * (1 - armorPen)));
        }

        const baseDef = DEFENSE_CONFIG.BASE_DEF_SCALE || 100;
        const lvDef = DEFENSE_CONFIG.LEVEL_DEF_SCALE || 10;
        const defenseFactor = defVal / (defVal + baseDef + atkLv * lvDef);
        const afterDefense = 1 - defenseFactor;

        // 等級壓制
        let levelPenalty = 1;
        const levelGap = defLv - atkLv;
        if (levelGap > 0) {
            const penaltyRate = LEVEL_PENALTY_CONFIG.PENALTY_PER_LEVEL || 0.03;
            const minMult = LEVEL_PENALTY_CONFIG.MIN_PENALTY_MULT || 0.1;
            levelPenalty = Math.max(minMult, 1 - levelGap * penaltyRate);
        }

        return Math.max(1, Math.floor(rawDmg * afterDefense * levelPenalty));
    }

    async playerDefend() {
        this._isDefending = true;
        this.ui.logCombat(`${this.player.name} 進入防禦狀態，降低傷害能力。`, 'combat');
    }

    async playerFlee() {
        if (Math.random() > 0.3) {
            this.ui.logCombat(`${this.player.name} 成功逃跑了！`, 'system');
            this.endBattle(false, true);
        } else {
            this.ui.logCombat(`${this.player.name} 逃跑失敗...`, 'error');
        }
    }

    async executeAttack(targetType, damage, isCrit = false) {
        if (targetType === 'enemy') {
            this.enemy.hp -= damage;
            if (this.enemy.hp <= 0) this.enemy.hp = 0;
            this.ui.shakeElement('enemy-combatant');
            // 顯示浮動傷害
            if (this.ui && typeof this.ui.showFloatingDamage === 'function') {
                this.ui.showFloatingDamage('enemy-combatant', damage, { isCrit });
            }
            this.ui.logCombat(`對 ${this.enemy.name} 造成了 ${damage} 點傷害！`, 'combat');
            if (this.enemy.hp <= 0) {
                await this.handleEnemyDeath();
            }
        } else if (targetType === 'player') {
            // 傳遞敵人等級給 takeDamage 用於等級壓制計算
            const actualDmg = this.player.takeDamage(damage, this.enemy.level || 1);
            this.ui.shakeElement('player-combatant');
            if (actualDmg === 0) {
                this.ui.logCombat(`${this.player.name} 閃避了攻擊！`, 'system');
                if (this.ui && typeof this.ui.showFloatingDamage === 'function') {
                    this.ui.showFloatingDamage('player-combatant', 'Miss', { isCrit: false });
                }
            } else {
                this.ui.logCombat(`${this.player.name} 受到了 ${actualDmg} 點傷害！`, 'combat');
                if (this.ui && typeof this.ui.showFloatingDamage === 'function') {
                    this.ui.showFloatingDamage('player-combatant', actualDmg, { isCrit: false });
                }
            }
            if (this.player.hp <= 0) {
                await this.handlePlayerDeath();
            }
        }
        this.ui.updateBattleScene(this.player, this.enemy);
    }

    async handleEnemyDeath() {
        this.ui.logCombat(`${this.enemy.name} 被擊敗了！`, 'system');
        this.isBattleOver = true;
        this.endBattle(true);
    }

    async handlePlayerDeath() {
        this.ui.logCombat(`${this.player.name} 倒下了...`, 'error');
        this.isBattleOver = true;
        this.endBattle(false);
    }

    async enemyTurn() {
        if (this.isBattleOver) return;

        // 確保敵人回合時，玩家按鈕是鎖定的
        this.ui.setBattleButtonsEnabled(false);
        
        this.ui.logCombat(`${this.enemy.name} 正在準備攻擊...`, 'combat');
        await new Promise(resolve => setTimeout(resolve, 400));

        let damage = this.enemy.atk;
        if (this._isDefending) {
            damage = Math.floor(damage * 0.5);
            this.ui.logCombat(`防禦成功！傷害減半。`, 'combat');
            this._isDefending = false;
        }

        // 傳遞敵人等級，由 Player.takeDamage() 使用新防禦公式計算實際承受量
        this.ui.logCombat(`${this.enemy.name} 發動攻擊！`, 'combat');
        await this.executeAttack('player', damage);

        if (this.player.hp <= 0) {
            return;
        }

        // 敵人回合結束，準備下一輪玩家回合
        this.isPlayerTurn = true;
        this.ui.setBattleButtonsEnabled(true);
    }

    async endBattle(isVictory, isFlee = false) {
        this.isBattleOver = true;
        this.ui.setBattleButtonsEnabled(false);

        // 記錄戰鬥結果，供 startBattle 或呼叫端判斷
        this.battleResult = !!isVictory;

        if (isVictory) {
            const goldEarned = this.enemy.goldReward || 0;
            // 經驗值直接使用怪物模板中已計算好的 exp（含 scale 與 boss 加成）
            const expEarned = this.enemy.exp || 10;
            this.player.gold += goldEarned;
            this.player.gainExp(expEarned);

            // 戰鬥勝利後恢復 10% HP/SP（而非回滿）
            this.player.recoverAfterBattle();

            this.ui.logCombat(`戰鬥結束！獲得 ${goldEarned} 金幣與 ${expEarned} EXP`, 'system');

            // 掉落機制
            await this.calculateDrops();

            this.ui.showBattleResult(true, this.enemy, this.gameInstance);
        } else {
            if (!isFlee) {
                // 戰敗死亡重生：HP/SP 回滿
                this.player.respawn();
            }
            this.ui.showBattleResult(false, this.enemy, this.gameInstance);
        }
    }

    async calculateDrops() {
        // 新的掉落機制：不再依賴 enemy.drops 清單，而是以機率從整個 ITEMS 池隨機抽樣
        const allKeys = Object.keys(ITEMS || {});
        if (!allKeys || allKeys.length === 0) return;

        // 掉落嘗試次數（改為較緩和成長：每 30 波 +1，避免高層爆炸式增加）
        const attempts = 1 + Math.floor(Math.max(0, this.currentWave) / 30);

        // 稀有度對掉落權重的調整（較小值 => 掉率較低）
        const RARITY_DROP_MOD = { common: 2.0, uncommon: 1.2, rare: 0.5, epic: 0.20, legendary: 0.06 };

        for (let i = 0; i < attempts; i++) {
            // 隨機挑一個模板
            const key = allKeys[Math.floor(Math.random() * allKeys.length)];
            const template = ITEMS[key];
            if (!template) continue;

            const rarity = template.rarity || 'common';
            const rarityMod = RARITY_DROP_MOD[rarity] || 0.5;

            // 擴大掉率隨 wave 緩慢增加（改為每波 +0.5%），再套用稀有度與怪物基本掉率，並以 0.95 為上限
            const waveBonus = 1 + (this.currentWave || 0) * 0.005;
            const baseChance = (this.enemy.dropRate || 0) * rarityMod * waveBonus;
            const finalChance = Math.min(0.95, baseChance);

            if (Math.random() < finalChance) {
                // 依據 wave 放大物品屬性
                const levelForItem = Math.max(1, (this.currentWave || 0) + 1);
                const newItem = rollItemInstance(template, { level: levelForItem }) || { ...template };
                const added = this.player.addItem(newItem);
                if (added) {
                    this.ui.logCombat(`🎁 掉落物品：${template.icon} ${newItem.name}！`, 'system');
                } else {
                    this.ui.logCombat(`🎁 掉落物品：${template.icon} ${newItem.name}，但背包已滿無法拾取。`, 'error');
                }
            }
        }
    }
}