import { MONSTER_TYPES, ITEMS, getMonsterTemplateForWave, getRandomMonsterFromMap, MAPS } from './data.js?version=1.1.1';
import { rollItemInstance } from './item_factory.js?version=1.1.1';
import { ATTACK_CONFIG, STAT_COEFFICIENTS } from './stats_config.js?version=1.1.1';

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

        // 恢復玩家滿 HP（使用 VIT 加成後的實際上限）
        this.player.hp = this.player.effectiveMaxHp;

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
        // 調整 wave 的成長曲線為對數緩增（提高係數以加強中高層難度），
        // 並在模板未提供防禦值時，根據 HP 派生一個防禦值，避免玩家單發秒殺
        const wf = Math.max(0, Number(wave) || 0);
        const waveMultiplier = 1 + Math.log1p(wf) * 0.30; // 可調：原本 0.20，調高到 0.30
        this.enemy.hp = Math.floor(this.enemy.hp * waveMultiplier);
        this.enemy.maxHp = this.enemy.hp;
        this.enemy.atk = Math.floor(this.enemy.atk * waveMultiplier);
        // 若怪物模板沒有 def，根據最大血量產生防禦值（比例可微調，預設取 8%）
        if (typeof this.enemy.def === 'undefined' || this.enemy.def === null) {
            this.enemy.def = Math.floor(this.enemy.maxHp * 0.08);
        }
        const goldMultiplier = 1 + Math.log1p(wf) * 0.15;
        this.enemy.goldReward = Math.floor(this.enemy.gold * goldMultiplier);

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
        try {
            switch (actionType) {
                case 'attack':
                    await this.playerAttack();
                    break;
                case 'skill':
                    await this.playerSkill();
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

        // 玩家做了動作後不論是否造成戰鬥結束，都應解除 startBattle 中的等待。
        // 這樣當玩家的動作直接擊敗敵人時，waitForPlayer() 不會永遠懸而未決，
        // handleTraining() 才能在 startBattle 返回後遞增波數。
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
        const atkScale = (ATTACK_CONFIG && ATTACK_CONFIG.ATK_SCALE) ? ATTACK_CONFIG.ATK_SCALE : 50;
        const base = Math.max(1, Math.floor(this.player.totalAtk * (atkScale / (atkScale + (this.enemy.def || 0)))));
        const isCrit = Math.random() < (this.player.critChance || 0);
        const finalDmg = isCrit ? Math.floor(base * this.player.critMultiplier) : base;
        this.ui.logCombat(`${this.player.name} 發動了攻擊！${isCrit ? '（暴擊！）' : ''}`, 'combat');
        await this.executeAttack('enemy', finalDmg, isCrit);
    }

    async playerSkill() {
        const skillMultiplier = 1.5;
        const atkScale = (ATTACK_CONFIG && ATTACK_CONFIG.ATK_SCALE) ? ATTACK_CONFIG.ATK_SCALE : 50;
        // 如果是法師，讓技能參考 effectiveMatk（INT 加成 + 法杖 matk），同時保留少量物理 ATK 加成
        let raw;
        if (this.player && this.player.classKey === 'mage') {
            const matk = this.player.effectiveMatk || 0;
            const physContribution = Math.floor((this.player.totalAtk || 0) * 0.15); // 15% 物理攻擊微量加成
            raw = Math.floor((matk + physContribution) * skillMultiplier);
        } else {
            raw = Math.floor(this.player.totalAtk * skillMultiplier);
        }
        const base = Math.max(1, Math.floor(raw * (atkScale / (atkScale + (this.enemy.def || 0)))));
        const isCrit = Math.random() < (this.player.critChance || 0);
        const finalDmg = isCrit ? Math.floor(base * this.player.critMultiplier) : base;
        this.ui.logCombat(`${this.player.name} 使用了技能 ${this.player.skillName}！💥${isCrit ? '（暴擊！）' : ''}`, 'combat');
        await this.executeAttack('enemy', finalDmg, isCrit);
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
            const actualDmg = this.player.takeDamage(damage);
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

        // 傳遞原始傷害，由 Player.takeDamage() 使用比例化防禦公式計算實際承受量
        this.ui.logCombat(`${this.enemy.name} 發動攻擊！`, 'combat');
        await this.executeAttack('player', damage);

        if (this.player.hp <= 0) {
            // 如果玩家死了，handled 在 executeAttack 的 handlePlayerDeath 中
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
            // 根據目前波數調整經驗值，使用對數緩增以避免高層數爆炸，同時讓高層給予較多經驗加速升等
            const baseExp = this.enemy.exp || 10;
            const wf = Math.max(0, Number(this.currentWave) || 0);
            const expMultiplier = 1 + Math.log1p(wf) * 0.5; // 可調係數：0.5
            const expEarned = Math.floor(baseExp * expMultiplier);
            this.player.gold += goldEarned;
            this.player.gainExp(expEarned);
            this.ui.logCombat(`戰鬥結束！獲得 ${goldEarned} 金幣與 ${expEarned} EXP`, 'system');

            // 掉落機制
            await this.calculateDrops();

            this.ui.showBattleResult(true, this.enemy, this.gameInstance);
        } else {
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