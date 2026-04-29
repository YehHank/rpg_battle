import { ITEMS } from './data.js';

export class UIManager {
    constructor() {
        this.scenes = document.querySelectorAll('.scene');
        this.battleLog = document.getElementById('battle-log');
        this.playerHpBar = document.getElementById('player-hp-bar');
        this.playerHpText = document.getElementById('player-hp-text');
        this.enemyHpBar = document.getElementById('enemy-hp-bar');
        this.enemyHpText = document.getElementById('enemy-hp-text');
        this.battleActions = document.getElementById('battle-actions');
    }

    showScene(sceneId) {
        console.log("切換場景至:", sceneId);
        this.scenes.forEach(scene => {
            scene.classList.remove('active');
        });
        const target = document.getElementById(`scene-${sceneId}`);
        if (target) target.classList.add('active');
    }

    updatePlayerPanel(player) {
        const infoDiv = document.getElementById('player-info');
        if (!infoDiv || !player) return;

        infoDiv.innerHTML = `\n            <div class="level-badge">LV.${player.level} ${player.className}</div>\n            <div class="stat-row"><span class="stat-label">❤️ HP</span><span class="stat-value">${Math.ceil(player.hp)}/${player.maxHp}</span></div >\n            <div class="stat-row"><span class="stat-label">⚔️ ATK</span><span class="stat-value">${player.totalAtk}</span></div >\n            <div class="stat-row"><span class="stat-label">🛡️ DEF</span><span class="stat-value">${player.totalDef}</span></div >\n            <div class="stat-row"><span class="stat-label">✨ SPD</span><span class="stat-value">${player.speed}</span></div >\n            <div class="stat-row"><span class="stat-label">💰 GOLD</span><span class="stat-value">${player.gold}</span></div >\n            <div class="exp-bar-container">\n                <div class="exp-bar" style="width: ${(player.exp / player.nextLevelExp) * 100}%</div >\n        `;
        this.renderEquipment(player);
        this.renderInventory(player);
    }

    renderEquipment(player) {
        const equipPanel = document.getElementById('equipment-panel');
        if (!equipPanel || !player) return;
        const slots = [{ id: 'weapon', label: '武器' }, { id: 'armor', label: '防具' }];
        equipPanel.innerHTML = '';

        slots.forEach(slot => {
            const item = player.equipment[slot.id];
            const slotEl = document.createElement('div');
            slotEl.className = `equip-slot ${item ? 'filled' : ''}`;
            // 這裡我們增加一個 data-attribute，讓 main.js 的委派可以抓到它
            slotEl.dataset.slotId = slot.id;
            
            if (item) {
                slotEl.innerHTML = `\n                <div class="equip-slot-label">${slot.label}</div>\n                <div class="equip-slot-item">${item.icon} ${item.name}</div>\n                <button class="btn-unequip" data-slot-id="${slot.id}" style="position: absolute; top: -5px; right: -5px; background: #ff4d4d; border: none; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 12px; cursor: pointer;">✕</button>\n            `;
            } else {
                slotEl.innerHTML = `\n                <div class="equip-slot-label">${slot.label}</div>\n                <div class="equip-slot-item" style="color: #555;">--</div>\n            `;
            }
            equipPanel.appendChild(slotEl);
        });
    }

    renderInventory(player) {
        const invPanel = document.getElementById('inventory-panel');
        if (!invPanel || !player) return;
        invPanel.innerHTML = '';

        if (player.inventory && player.inventory.length > 0) {
            const grid = document.createElement('div');
            grid.className = 'inventory-grid';
            player.inventory.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'inventory-item';
                // 這裡也要使用 data-attribute，方便 main.js 的事件委派捕捉點擊物品的動作
                itemEl.dataset.itemName = item.name;
                itemEl.innerHTML = `<div class="item-icon">${item.icon}</div><div class="item-name">${item.name}</div>`;
                grid.appendChild(itemEl);
            });
            invPanel.appendChild(grid);
        } else {
            invPanel.innerHTML = '<p style="font-size:12px; color:#a0a0a0; text-align:center;">背包空空如也</p>';
        }
    }

    renderShop(player) {
        const container = document.getElementById('shop-items-container');
        const goldDisplay = document.getElementById('shop-gold-amount');
        if (!container || !player) return;

        // 確保使用正確的玩家實例
        const activePlayer = window.gameInstance ? window.gameInstance.player : player;
        if (activePlayer && goldDisplay) goldDisplay.textContent = activePlayer.gold;
        
        container.innerHTML = ''; 
        if (!activePlayer) return;

        Object.keys(ITEMS).forEach(itemKey => {
            const item = ITEMS[itemKey];
            const priceText = (item.price !== undefined) ? `${item.price} 金幣` : '--';
            
            const shopItemEl = document.createElement('div');
            shopItemEl.className = 'shop-item';
            shopItemEl.innerHTML = `\n                <div style="font-size: 24px;">${item.icon}</div>\n                <div style="flex: 1; margin-left: 10px;">\n                    <div style="font-weight: bold;">${item.name}</div>\n                    <div style="font-size: 12px; color: #ffd700;">💰 ${priceText}</div>\n                </div>\n                <button class="btn btn-primary btn-buy-item" data-item-key="${itemKey}" style="padding: 5px 10px; font-size: 12px;">購買</button>\n            `;
            container.appendChild(shopItemEl);
        });

        this.renderShopInventory(activePlayer);
    }

    renderShopInventory(player) {
        const container = document.getElementById('shop-inventory-container');
        if (!container || !player) return;
        container.innerHTML = '';

        if (player.inventory && player.inventory.length > 0) {
            const grid = document.createElement('div');
            grid.className = 'inventory-grid'; 
            player.inventory.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'inventory-item';
                // 這裡也用 data-attribute，因為這是在商店場景內的背包
                itemEl.dataset.itemName = item.name;
                itemEl.innerHTML = `<div class="item-icon">${item.icon}</div><div style="font-size:12px;">${item.name}</div>`;
                grid.appendChild(itemEl);
            });
            container.appendChild(grid);
        } else {
            container.innerHTML = '<p style="font-size:12px; color:#a0a0a0; text-align:center;">目前沒有物品</p>';
        }
    }

    handlePurchase(player, item) {
        if (item.price === undefined) return;
        if (player.gold < item.price) {
            alert("金幣不足！");
            return;
        }

        player.gold -= item.price;
        player.addItem(item);
        this.renderShop(player);
    }

    updateBattleScene(player, enemy) {
        if (this.playerHpBar) this.playerHpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
        if (this.playerHpText) this.playerHpText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
        if (this.enemyHpBar) this.enemyHpBar.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
        if (this.enemyHpText) this.enemyHpText.textContent = `${Math.ceil(enemy.hp)}/${enemy.maxHp}`;
        document.getElementById('player-name').textContent = player.name;
        document.getElementById('player-icon').textContent = player.icon;
        document.getElementById('enemy-name').textContent = enemy.name;
        document.getElementById('enemy-icon').textContent = enemy.icon;
    }

    setBattleButtonsEnabled(enabled) {
        const buttons = this.battleActions?.querySelectorAll('button');
        if (buttons) buttons.forEach(btn => btn.disabled = !enabled);
    }

    logSystem(message) { this.addLog(`[系統] ${message}`, 'log-system'); }
    logCombat(message, type) { this.addLog(message, `log-${type}`); }

    addLog(message, className) {
        const logDiv = document.getElementById('battle-log');
        if (!logDiv) return;
        const p = document.createElement('p');
        p.className = className;
        p.textContent = message;
        logDiv.appendChild(p);
        logDiv.scrollTop = logDiv.scrollHeight;
    }

    shakeElement(elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 300);
    }

    showBattleResult(isVictory, enemy, gameInstance) {
        const container = document.getElementById('battle-result-container');
        if (!container) return;

        let content = isVictory ? 
            `<div class="battle-result"><h2 class="result-title victory">勝利！</h2><p>獲得金幣: ${enemy.goldReward}</p><button class="btn btn-primary" id="btn-return-game">返回主畫面</button></div>` :
            `<div class="battle-result"><h2 class="result-title defeat">戰敗...</h2><button class="btn btn-danger" id="btn-return-game">重新開始冒險</button></div>`;
        container.innerHTML = content;

        const returnBtn = document.getElementById('btn-return-game');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                if (isVictory && gameInstance) {
                    gameInstance.ui.showScene('game');
                    gameInstance.updateMainUI();
                } else if (!isVictory) {
                    location.reload();
                }
            });
        }
    }

    togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.toggle('expanded');
    }

    showTip() {}
    hideTip() {}
}