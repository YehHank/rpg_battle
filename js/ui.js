import { ITEMS, RARITY } from './data.js';

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

        infoDiv.innerHTML = `\n            <div class="level-badge">LV.${player.level} ${player.className}</div>\n            <div class="stat-row"><span class="stat-label">❤️ HP</span><span class="stat-value">${Math.ceil(player.hp)}/${player.maxHp}</span></div >\n            <div class="stat-row"><span class="stat-label">⚔️ ATK</span><span class="stat-value">${player.totalAtk}</span></div >\n            <div class="stat-row"><span class="stat-label">🛡️ DEF</span><span class="stat-value">${player.totalDef}</span></div >\n            <div class="stat-row"><span class="stat-label">✨ SPD</span><span class="stat-value">${player.totalSpeed}</span></div >\n            <div class="stat-row"><span class="stat-label">💰 GOLD</span><span class="stat-value">${player.gold}</span></div >\n            <div class="stat-row"><span class="stat-label">🎒 背包</span><span class="stat-value">${player.inventory.length}/${player.inventoryLimit}</span></div>\n            <div class="exp-bar-container">\n                <div class="exp-bar" style="width: ${(player.exp / player.nextLevelExp) * 100}%</div >\n        `;
        this.renderEquipment(player);
        this.renderInventory(player);
    }

    renderEquipment(player) {
        const equipPanel = document.getElementById('equipment-panel');
        if (!equipPanel || !player) return;
        const slots = [
            { id: 'weapon', label: '武器' },
            { id: 'armor', label: '胸甲' },
            { id: 'helm', label: '頭盔' },
            { id: 'shoes', label: '鞋子' },
            { id: 'shield', label: '盾牌' },
            { id: 'accessory', label: '飾品' }
        ];
        equipPanel.innerHTML = '';

        slots.forEach(slot => {
            const item = player.equipment[slot.id];
            const slotEl = document.createElement('div');
            slotEl.className = `equip-slot ${item ? 'filled' : ''}`;
            // 這裡我們增加一個 data-attribute，讓 main.js 的委派可以抓到它
            slotEl.dataset.slotId = slot.id;
            slotEl.style.cursor = 'pointer';

            if (item) {
                const rarityColor = item.rarity ? RARITY[item.rarity]?.color || '#ffffff' : '#ffffff';
                const rarityName = item.rarity ? RARITY[item.rarity]?.name || item.rarity : '';
                const badgeHtml = (item.rarity && item.rarity !== 'common') ? `<div class="rarity-badge" style="background:${rarityColor}; color:#fff;">${rarityName}</div>` : `<div class="rarity-badge common">${rarityName || '普通'}</div>`;
                // 將稀有度顯示在裝備格中，並以稀有度顏色標示邊框
                slotEl.style.borderColor = item.rarity && item.rarity !== 'common' ? rarityColor : '';
                const stats = [];
                if (typeof item.atk === 'number') stats.push(`⚔️ +${item.atk} ATK`);
                if (typeof item.def === 'number') stats.push(`🛡️ +${item.def} DEF`);
                if (typeof item.speed === 'number') stats.push(`💨 +${item.speed} SPD`);
                const statsHtml = stats.length ? `<div class="item-stats">${stats.join('  ')}</div>` : '';
                slotEl.innerHTML = `\n                <div class="equip-slot-label">${slot.label}</div>\n                <div style="display:flex; flex-direction:column; gap:6px;">\n                    <div style=\"display:flex; align-items:center; justify-content:space-between; gap:8px;\">\n                        <div class=\"equip-slot-item\" style=\"color: ${rarityColor};\">${item.icon} ${item.name}</div>\n                        ${badgeHtml}\n                    </div>\n                    ${statsHtml}\n                </div>\n            `;
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
                const rarityColor = item.rarity ? RARITY[item.rarity]?.color || '#ffffff' : '#ffffff';
                const rarityName = item.rarity ? RARITY[item.rarity]?.name || item.rarity : '';
                const badgeHtml = (item.rarity && item.rarity !== 'common') ? `<div class="rarity-badge small" style="background:${rarityColor}; color:#fff;">${rarityName}</div>` : `<div class="rarity-badge small common">${rarityName || '普通'}</div>`;
                if (item.rarity && item.rarity !== 'common') itemEl.style.borderColor = rarityColor;
                const stats = [];
                if (typeof item.atk === 'number') stats.push(`⚔️ +${item.atk} ATK`);
                if (typeof item.def === 'number') stats.push(`🛡️ +${item.def} DEF`);
                if (typeof item.speed === 'number') stats.push(`💨 +${item.speed} SPD`);
                const statsHtml = stats.length ? `<div class="item-stats">${stats.join('  ')}</div>` : '';
                itemEl.innerHTML = `\n                    <div style="display:flex; justify-content:space-between; align-items:center;">\n                        <div>\n                            <div class=\"item-icon\">${item.icon}</div>\n                            <div class=\"item-name\" style=\"color: ${rarityColor};\">${item.name}</div>\n                            ${statsHtml}\n                        </div>\n                        ${badgeHtml}\n                    </div>`;
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
            const rarityColor = item.rarity ? RARITY[item.rarity]?.color || '#ffffff' : '#ffffff';
            const rarityName = item.rarity ? RARITY[item.rarity]?.name || item.rarity : '';
            const badgeHtml = (item.rarity && item.rarity !== 'common') ? `<div class="rarity-badge small" style="background:${rarityColor}; color:#fff; margin-right:8px;">${rarityName}</div>` : `<div class="rarity-badge small common" style="margin-right:8px;">${rarityName || '普通'}</div>`;

            const shopItemEl = document.createElement('div');
            shopItemEl.className = 'shop-item';
            if (item.rarity && item.rarity !== 'common') {
                shopItemEl.style.borderColor = rarityColor;
            }
            shopItemEl.innerHTML = `\n                <div style="display:flex; align-items:center; gap:10px;">${badgeHtml}<div style="font-size: 24px;">${item.icon}</div></div>\n                <div style="flex: 1; margin-left: 10px;">\n                    <div style="font-weight: bold; color: ${rarityColor};">${item.name}</div>\n                    <div style="font-size: 12px; color: #ffd700;">💰 ${priceText}</div>\n                </div>\n                <button class="btn btn-primary btn-buy-item" data-item-key="${itemKey}" style="padding: 5px 10px; font-size: 12px;">購買</button>\n            `;
            // 插入屬性顯示（若有）下方
            const shopStats = [];
            if (typeof item.atk === 'number') shopStats.push(`⚔️ +${item.atk} ATK`);
            if (typeof item.def === 'number') shopStats.push(`🛡️ +${item.def} DEF`);
            if (typeof item.speed === 'number') shopStats.push(`💨 +${item.speed} SPD`);
            if (shopStats.length) {
                const statRow = `<div style="font-size:12px; color:#a0a0a0; margin-top:6px;">${shopStats.join('  ')}</div>`;
                // 在插入到 DOM 前補上屬性行
                shopItemEl.innerHTML = shopItemEl.innerHTML.replace('</div>\n                <button', `</div>${statRow}\n                <button`);
            }
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
                const rarityColor = item.rarity ? RARITY[item.rarity]?.color || '#ffffff' : '#ffffff';
                const rarityName = item.rarity ? RARITY[item.rarity]?.name || item.rarity : '';
                const badgeHtml = (item.rarity && item.rarity !== 'common') ? `<div class="rarity-badge small" style="background:${rarityColor}; color:#fff;">${rarityName}</div>` : `<div class="rarity-badge small common">${rarityName || '普通'}</div>`;
                if (item.rarity && item.rarity !== 'common') itemEl.style.borderColor = rarityColor;
                const stats = [];
                if (typeof item.atk === 'number') stats.push(`⚔️ +${item.atk} ATK`);
                if (typeof item.def === 'number') stats.push(`🛡️ +${item.def} DEF`);
                if (typeof item.speed === 'number') stats.push(`💨 +${item.speed} SPD`);
                const statsHtml = stats.length ? `<div class=\"item-stats\">${stats.join('  ')}</div>` : '';
                itemEl.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;">\n                        <div>\n                            <div class=\"item-icon\">${item.icon}</div>\n                            <div style=\"font-size:12px; color: ${rarityColor};\">${item.name}</div>\n                            ${statsHtml}\n                        </div>\n                        <div style=\"display:flex; align-items:center; gap:8px;\">${badgeHtml}<button class=\"btn btn-danger btn-sell-item\" data-item-key=\"${item.id}\" style=\"padding: 3px 8px; font-size: 11px;\">販售</button></div>\n                    </div>`;
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