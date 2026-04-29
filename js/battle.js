import { MONSTER_TYPES, ITEMS } from './data.js';

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
    }

    async startBattle(wave, gameInstance) {
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

        // 恢復玩家滿 HP
        this.player.hp = this.player.maxHp;

        const monsterData = MONSTER_TYPES[Math.min(wave, MONSTER_TYPES.length - 1)];
        this.enemy = { ...monsterData };
        this.enemy.hp = Math.floor(this.enemy.hp * (1 + wave * 0.2));
        this.enemy.maxHp = this.enemy.hp;
        this.enemy.atk = Math.floor(this.enemy.atk * (1 + wave * 0.2));
        this.enemy.def = this.enemy.def || 0;
        this.enemy.goldReward = Math.floor(this.enemy.gold * (1 + wave * 0.3));

        console.log(`第 ${wave + 1} 波開始！敵人是: ${this.enemy.name}`);
        this.ui.showScene('battle');

        // 更新波數顯示
        const waveIndicator = document.getElementById('wave-indicator');
        if (waveIndicator) {
            waveIndicator.textContent = `⚔️ 第 ${wave + 1} 波`;
        }

        this.ui.updateBattleScene(this.player, this.enemy);
        this.ui.addLog(`⚔️ 第 ${wave + 1} 波戰鬥開始！`, 'log-system');

        // 主迴圈
        while (!this.isBattleOver) {
            if (this.isPlayerTurn) {
                // 等待玩家動作，這會讓迴圈在這裡「暫停」直到 resolvePlayerTurn 被呼叫
                await this.waitForPlayer();
                console.log("玩家回合結束，準備切換至敵人回合");
            }
            
            if (!this.isBattleOver) {
                // 確保在進入敵人回合前有一點延遲感
                await new Promise(resolve => setTimeout(resolve, 800));
                await this.enemyTurn();
            }
        }
        // 返回本次戰鬥結果（true = 勝利, false = 戰敗）
        return this.battleResult === true;
    }

    async waitForPlayer() {
        return new Promise((resolve) => {
            this.resolvePlayerTurn = resolve;
        });
    }

    async handleAction(actionType) {
        if (!this.isPlayerTurn || this.isBattleOver) return;

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

        // 切換回合標記與按鈕狀態（若戰鬥尚未結束，敵人會在 startBattle 的後續流程執行）
        this.isPlayerTurn = false;
        this.ui.setBattleButtonsEnabled(false);
    }

    async playerAttack() {
        const finalDmg = Math.max(1, this.player.totalAtk - (this.enemy.def || 0));
        this.ui.logCombat(`${this.player.name} 發動了攻擊！`, 'combat');
        await this.executeAttack('enemy', finalDmg);
    }

    async playerSkill() {
        const skillMultiplier = 1.5;
        const finalDmg = Math.max(1, Math.floor(this.player.totalAtk * skillMultiplier) - (this.enemy.def || 0));
        this.ui.logCombat(`${this.player.name} 使用了技能 ${this.player.skillName}！💥`, 'combat');
        await this.executeAttack('enemy', finalDmg);
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

    async executeAttack(targetType, damage) {
        if (targetType === 'enemy') {
            this.enemy.hp -= damage;
            if (this.enemy.hp <= 0) this.enemy.hp = 0;
            this.ui.shakeElement('enemy-combatant');
            this.ui.logCombat(`對 ${this.enemy.name} 造成了 ${damage} 點傷害！`, 'combat');
            if (this.enemy.hp <= 0) {
                await this.handleEnemyDeath();
            }
        } else if (targetType === 'player') {
            const actualDmg = this.player.takeDamage(damage);
            this.ui.shakeElement('player-combatant');
            this.ui.logCombat(`${this.player.name} 受到了 ${actualDmg} 點傷害！`, 'combat');
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
        await new Promise(resolve => setTimeout(resolve, 1000));

        let damage = this.enemy.atk;
        if (this._isDefending) {
            damage = Math.floor(damage * 0.5);
            this.ui.logCombat(`防禦成功！傷害減半。`, 'combat');
            this._isDefending = false;
        }

        // 計算最終傷害 (考慮玩家防禦)
        const finalDmg = Math.max(1, damage - this.player.totalDef);
        
        this.ui.logCombat(`${this.enemy.name} 發動攻擊！`, 'combat');
        await this.executeAttack('player', finalDmg);

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
            const expEarned = this.enemy.exp || 10;
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
        // 檢查是否有掉落物
        if (!this.enemy.drops || this.enemy.drops.length === 0) {
            return;
        }

        // 隨機決定掉落哪些物品
        this.enemy.drops.forEach(itemKey => {
            if (Math.random() < this.enemy.dropRate) {
                const item = ITEMS[itemKey];
                if (item && !this.player.inventory.find(i => i.id === itemKey)) {
                    // 複製物品物件，避免修改原始資料
                    const newItem = { ...item };
                    const added = this.player.addItem(newItem);
                    if (added) {
                        this.ui.logCombat(`🎁 掉落物品：${item.icon} ${item.name}！`, 'system');
                    } else {
                        this.ui.logCombat(`🎁 掉落物品：${item.icon} ${item.name}，但背包已滿無法拾取。`, 'error');
                    }
                }
            }
        });
    }
}