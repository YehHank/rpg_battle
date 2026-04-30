import { ITEMS, RARITY, MAPS } from './data.js?version=1.0.7';
import { generateShopVariants } from './item_factory.js?version=1.0.7';

export class UIManager {
    constructor() {
        this.scenes = document.querySelectorAll('.scene');
        this.battleLog = document.getElementById('battle-log');
        this.playerHpBar = document.getElementById('player-hp-bar');
        this.playerHpText = document.getElementById('player-hp-text');
        this.enemyHpBar = document.getElementById('enemy-hp-bar');
        this.enemyHpText = document.getElementById('enemy-hp-text');
        this.battleActions = document.getElementById('battle-actions');
        // 商店中目前顯示的變體快取（variantId -> itemInstance）
        this.currentShopVariants = {};
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
        // 使用套用 VIT 的實際上限顯示（但存檔仍保存 base maxHp）
        infoDiv.innerHTML = `
            <div class="level-badge">LV.${player.level} ${player.className}</div>
            <div class="stat-row"><span class="stat-label">STR</span><span class="stat-value">${player.str}</span></div>
            <div class="stat-row"><span class="stat-label">AGI</span><span class="stat-value">${player.agi}</span></div>
            <div class="stat-row"><span class="stat-label">VIT</span><span class="stat-value">${player.vit}</span></div>
            <div class="stat-row"><span class="stat-label">INT</span><span class="stat-value">${player.int}</span></div>
            <div class="stat-row"><span class="stat-label">DEX</span><span class="stat-value">${player.dex}</span></div>
            <div class="stat-row"><span class="stat-label">LUK</span><span class="stat-value">${player.luk}</span></div>
            <div class="stat-row"><span class="stat-label">🔷 可分配點數</span><span class="stat-value">${player.statPointsAvailable} <button class="btn btn-primary" id="btn-open-allocate" ${player.statPointsAvailable <= 0 ? 'disabled' : ''}>分配點數</button></span></div>
            <div class="stat-row"><span class="stat-label">❤️ HP</span><span class="stat-value">${Math.ceil(player.hp)}/${player.effectiveMaxHp}</span></div>
            <div class="stat-row"><span class="stat-label">⚔️ ATK</span><span class="stat-value">${player.totalAtk}</span></div>
            <div class="stat-row"><span class="stat-label">🛡️ DEF</span><span class="stat-value">${player.totalDef}</span></div>
            <div class="stat-row"><span class="stat-label">✨ SPD</span><span class="stat-value">${player.totalSpeed}</span></div>
            <div class="stat-row"><span class="stat-label">💰 GOLD</span><span class="stat-value">${player.gold}</span></div>
            <div class="stat-row"><span class="stat-label">🎒 背包</span><span class="stat-value">${player.inventory.length}/${player.inventoryLimit}</span></div>
            <div class="exp-bar-container">
                <div class="exp-bar" style="width: ${(player.exp / player.nextLevelExp) * 100}%"></div>
        `;
        this.renderEquipment(player);
        this.renderInventory(player);
    }

    showFloatingDamage(targetElementId, amount, options = {}) {
        const el = document.getElementById(targetElementId);
        if (!el) return;
        const floatEl = document.createElement('div');
        floatEl.className = 'damage-float' + (options.isCrit ? ' damage-crit' : '');
        floatEl.textContent = amount;
        // 計算絕對位置並放到 body
        const rect = el.getBoundingClientRect();
        floatEl.style.position = 'absolute';
        floatEl.style.left = `${rect.left + rect.width / 2}px`;
        floatEl.style.top = `${rect.top + rect.height * 0.25}px`;
        floatEl.style.transform = 'translate(-50%, 0)';
        document.body.appendChild(floatEl);
        // 自動移除
        setTimeout(() => { if (floatEl && floatEl.parentNode) floatEl.parentNode.removeChild(floatEl); }, 900);
    }

    showStatAllocationModal(player) {
        if (!player) return;
        if (document.getElementById('stat-allocation-modal')) return; // 已開啟
        const modal = document.createElement('div');
        modal.id = 'stat-allocation-modal';
        modal.className = 'modal-overlay';
        const pending = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };

        const rowFor = (label, key) => `
            <div class="alloc-row" data-stat="${key}">
                <div class="alloc-label">${label}</div>
                <div class="alloc-controls">
                    <button class="btn btn-danger btn-alloc-minus" data-stat="${key}">-</button>
                    <span class="alloc-value" data-stat-value="${key}">0</span>
                    <button class="btn btn-primary btn-alloc-plus" data-stat="${key}">+</button>
                </div>
            </div>`;

        modal.innerHTML = `
            <div class="modal-content">
                <h3>分配屬性點</h3>
                <div class="alloc-rows">
                    ${rowFor('STR', 'str')}
                    ${rowFor('AGI', 'agi')}
                    ${rowFor('VIT', 'vit')}
                    ${rowFor('INT', 'int')}
                    ${rowFor('DEX', 'dex')}
                    ${rowFor('LUK', 'luk')}
                </div>
                <div class="alloc-remaining">剩餘點數：<span id="alloc-remaining">${player.statPointsAvailable}</span></div>
                <div style="margin-top:12px; display:flex; gap:8px; justify-content:center;">
                    <button class="btn btn-primary" id="alloc-confirm">確認</button>
                    <button class="btn btn-danger" id="alloc-reset">重置</button>
                    <button class="btn" id="alloc-cancel">取消</button>
                </div>
            </div>`;

        document.body.appendChild(modal);

        function updateRemaining(n) {
            const el = document.getElementById('alloc-remaining');
            if (el) el.textContent = n;
        }

        modal.addEventListener('click', (ev) => {
            if (ev.target === modal) {
                modal.remove();
            }
        });

        modal.querySelectorAll('.btn-alloc-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.stat;
                if (Object.values(pending).reduce((a,b)=>a+b,0) >= player.statPointsAvailable) return;
                pending[key] = (pending[key] || 0) + 1;
                modal.querySelector(`[data-stat-value="${key}"]`).textContent = pending[key];
                updateRemaining(player.statPointsAvailable - Object.values(pending).reduce((a,b)=>a+b,0));
            });
        });

        modal.querySelectorAll('.btn-alloc-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.stat;
                if ((pending[key] || 0) <= 0) return;
                pending[key] = (pending[key] || 0) - 1;
                modal.querySelector(`[data-stat-value="${key}"]`).textContent = pending[key];
                updateRemaining(player.statPointsAvailable - Object.values(pending).reduce((a,b)=>a+b,0));
            });
        });

        const confirmBtn = modal.querySelector('#alloc-confirm');
        const resetBtn = modal.querySelector('#alloc-reset');
        const cancelBtn = modal.querySelector('#alloc-cancel');

        resetBtn.addEventListener('click', () => {
            Object.keys(pending).forEach(k => { pending[k] = 0; modal.querySelector(`[data-stat-value="${k}"]`).textContent = '0'; });
            updateRemaining(player.statPointsAvailable);
        });

        cancelBtn.addEventListener('click', () => modal.remove());

        confirmBtn.addEventListener('click', () => {
            const success = player.applyAllocation(pending);
            if (!success) {
                alert('分配失敗：剩餘點數不足');
                return;
            }
            modal.remove();
            this.updatePlayerPanel(player);
        });
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

        // 清空快取
        this.currentShopVariants = {};

        // 先按照 type 分組（並跳過神話等級在商店上架）
        const groups = {};
        const typeOrder = ['weapon', 'armor', 'helm', 'shoes', 'shield', 'accessory', 'other'];
        const typeLabels = { weapon: '武器', armor: '胸甲', helm: '頭盔', shoes: '鞋子', shield: '盾牌', accessory: '飾品', other: '其他' };

        Object.keys(ITEMS).forEach(itemKey => {
            const template = ITEMS[itemKey];
            if (!template) return;
            // 神話等級不在商店上架，僅能怪物掉落
            if (template.rarity === 'legendary') return;

            const variants = generateShopVariants(itemKey, 1);
            variants.forEach(variant => {
                if (!variant) return;
                const type = variant.type || template.type || 'other';
                if (!groups[type]) groups[type] = [];
                groups[type].push(variant);
                if (variant.instanceId) this.currentShopVariants[variant.instanceId] = variant;
            });
        });

        // 依照順序渲染各類別
        typeOrder.forEach(t => {
            const list = groups[t];
            if (!list || list.length === 0) return;
            const header = document.createElement('div');
            header.className = 'shop-group';
            header.innerHTML = `<div class="shop-group-title">${typeLabels[t] || t}</div>`;
            container.appendChild(header);

            list.forEach(variant => {
                const priceText = (variant.price !== undefined) ? `${variant.price} 金幣` : '--';
                const rarityColor = variant.rarity ? RARITY[variant.rarity]?.color || '#ffffff' : '#ffffff';
                const rarityName = variant.rarity ? RARITY[variant.rarity]?.name || variant.rarity : '';
                const badgeHtml = (variant.rarity && variant.rarity !== 'common') ? `<div class="rarity-badge small" style="background:${rarityColor}; color:#fff; margin-right:8px;">${rarityName}</div>` : `<div class="rarity-badge small common" style="margin-right:8px;">${rarityName || '普通'}</div>`;

                const shopItemEl = document.createElement('div');
                shopItemEl.className = 'shop-item';
                if (variant.rarity && variant.rarity !== 'common') {
                    shopItemEl.style.borderColor = rarityColor;
                }

                const variantIdAttr = variant.instanceId ? `data-variant-id="${variant.instanceId}"` : `data-item-key="${variant.baseId || variant.id}"`;

                shopItemEl.innerHTML = `\n                <div style="display:flex; align-items:center; gap:10px;">${badgeHtml}<div style="font-size: 24px;">${variant.icon}</div></div>\n                <div style="flex: 1; margin-left: 10px;">\n                    <div style="font-weight: bold; color: ${rarityColor};">${variant.name}</div>\n                    <div style="font-size: 12px; color: #ffd700;">💰 ${priceText}</div>\n                </div>\n                <button class="btn btn-primary btn-buy-item" ${variantIdAttr} style="padding: 5px 10px; font-size: 12px;">購買</button>\n            `;

                const shopStats = [];
                if (typeof variant.atk === 'number') shopStats.push(`⚔️ +${variant.atk} ATK`);
                if (typeof variant.def === 'number') shopStats.push(`🛡️ +${variant.def} DEF`);
                if (typeof variant.speed === 'number') shopStats.push(`💨 +${variant.speed} SPD`);
                if (shopStats.length) {
                    const statRow = `<div style="font-size:12px; color:#a0a0a0; margin-top:6px;">${shopStats.join('  ')}</div>`;
                    shopItemEl.innerHTML = shopItemEl.innerHTML.replace('</div>\n                <button', `</div>${statRow}\n                <button`);
                }

                container.appendChild(shopItemEl);
            });
        });

        // 在生成完商店清單後，同步渲染商店內的玩家背包視圖
        this.renderShopInventory(activePlayer);
    }

    // 供外部（例如 main.js）在購買時取回變體實例
    getShopVariant(variantId) {
        return this.currentShopVariants ? this.currentShopVariants[variantId] : null;
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
        if (this.playerHpBar) this.playerHpBar.style.width = `${(player.hp / player.effectiveMaxHp) * 100}%`;
        if (this.playerHpText) this.playerHpText.textContent = `${Math.ceil(player.hp)}/${player.effectiveMaxHp}`;
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

    // 顯示戰鬥模式選單（試煉塔 / 地圖刷怪）
    showBattleModeSelection(gameInstance) {
        if (document.getElementById('battle-mode-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'battle-mode-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>選擇戰鬥模式</h3>
                <div style="display:flex; gap:10px; justify-content:center; margin-top:12px;">
                    <button class="btn btn-primary" id="btn-mode-tower">🗼 試煉塔</button>
                    <button class="btn" id="btn-mode-map">🌍 地圖刷怪</button>
                </div>
                <div style="margin-top:12px; text-align:center;"><button class="btn" id="btn-mode-cancel">取消</button></div>
            </div>`;
        document.body.appendChild(modal);

        modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });

        modal.querySelector('#btn-mode-cancel').addEventListener('click', () => modal.remove());
        modal.querySelector('#btn-mode-tower').addEventListener('click', () => {
            modal.remove();
            if (gameInstance && typeof gameInstance.startTowerBattle === 'function') gameInstance.startTowerBattle();
        });
        modal.querySelector('#btn-mode-map').addEventListener('click', () => {
            modal.remove();
            this.showMapSelectionModal(gameInstance);
        });
    }

    // 顯示地圖選擇器（列出 MAPS）
    showMapSelectionModal(gameInstance) {
        if (document.getElementById('map-selection-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'map-selection-modal';
        modal.className = 'modal-overlay';
        let listHtml = '';
        MAPS.forEach(m => {
            listHtml += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                <div>
                    <div style="font-weight:bold">${m.name}</div>
                    <div style="font-size:12px; color:#a0a0a0;">等級 ${m.min} ~ ${m.max === Infinity ? '無上限' : m.max}</div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-primary btn-start-map" data-map-key="${m.key}">開始挑戰</button>
                </div>
            </div>`;
        });

        modal.innerHTML = `
            <div class="modal-content">
                <h3>選擇地圖</h3>
                <div style="max-height:320px; overflow:auto; margin-top:8px;">${listHtml}</div>
                <div style="margin-top:12px; text-align:center;"><button class="btn" id="btn-map-cancel">取消</button></div>
            </div>`;
        document.body.appendChild(modal);

        modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });
        modal.querySelector('#btn-map-cancel').addEventListener('click', () => modal.remove());

        modal.querySelectorAll('.btn-start-map').forEach(btn => {
            btn.addEventListener('click', () => {
                const mapKey = btn.dataset.mapKey;
                modal.remove();
                if (gameInstance && typeof gameInstance.startMapBattle === 'function') gameInstance.startMapBattle(mapKey);
            });
        });
    }
}