import { ITEMS, RARITY, MAPS, MYSTERY_ITEM } from './data.js?version=1.1.3';
import { generateShopVariants } from './item_factory.js?version=1.1.3';

export class UIManager {
    constructor() {
        this.scenes = document.querySelectorAll('.scene');
        this.battleLog = document.getElementById('battle-log');
        this.playerHpBar = document.getElementById('player-hp-bar');
        this.playerHpText = document.getElementById('player-hp-text');
        this.enemyHpBar = document.getElementById('enemy-hp-bar');
        this.enemyHpText = document.getElementById('enemy-hp-text');
        this.battleActions = document.getElementById('battle-actions');
        // 商店快取
        // currentShopVariants: variantId -> itemInstance
        this.currentShopVariants = {};
        // shopVariantsByKey: itemKey -> [variantInstance, ...]
        this.shopVariantsByKey = {};
    }

    showScene(sceneId) {
        console.log("切換場景至:", sceneId);
        this.scenes.forEach(scene => {
            scene.classList.remove('active');
        });
        const target = document.getElementById(`scene-${sceneId}`);
        if (target) target.classList.add('active');
        // 若使用者開啟商店場景時，清除舊的商店快取，讓每次進入商店會重新生成商品
        if (sceneId === 'shop') {
            this.currentShopVariants = {};
            this.shopVariantsByKey = {};
        }
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
            <div class="stat-row"><span class="stat-label">💧 SP</span><span class="stat-value">${Math.ceil(player.sp || 0)}/${player.effectiveMaxSp}</span></div>
            <div class="stat-row"><span class="stat-label">⚔️ ATK</span><span class="stat-value">${player.totalAtk}</span></div>
            <div class="stat-row"><span class="stat-label">🔮 MATK</span><span class="stat-value">${player.effectiveMatk}</span></div>
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
                if (typeof item.matk === 'number') stats.push(`🔮 +${item.matk} MATK`);
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
                if (typeof item.matk === 'number') stats.push(`🔮 +${item.matk} MATK`);
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

    renderShop(player, options = {}) {
        const container = document.getElementById('shop-items-container');
        const goldDisplay = document.getElementById('shop-gold-amount');
        if (!container || !player) return;

        const mode = (options && options.mode) ? options.mode : (this.lastShopMode || 'normal');
        this.lastShopMode = mode;

        // 確保使用正確的玩家實例
        const activePlayer = window.gameInstance ? window.gameInstance.player : player;
        if (activePlayer && goldDisplay) goldDisplay.textContent = activePlayer.gold;
        
        // 更新商店頁面標題與左側分類（依 mode 顯示）
        const sceneHeader = document.querySelector('#scene-shop > h2');
        if (sceneHeader) sceneHeader.textContent = (mode === 'mystery') ? '📦 神秘商店' : '🛒 冒險者商店';
        const leftTitleEl = document.querySelector('#scene-shop .shop-column.shop-left .shop-title');
        if (leftTitleEl) leftTitleEl.textContent = (mode === 'mystery') ? '📦 神秘寶箱' : '精選商品';

        // 根據模式調整版面：
        // - mystery: 顯示左右欄，左側為玩家背包（可販售），右側顯示神秘寶箱
        // - normal: 顯示左右欄，左側為商品清單，右側為玩家背包；隱藏下方獨立神秘區塊
        const shopContainerEl = document.querySelector('#scene-shop .shop-container');
        const msSection = document.querySelector('.mystery-shop-section');
        if (mode === 'mystery') {
            if (shopContainerEl) shopContainerEl.style.display = '';
            if (msSection) msSection.style.display = 'none';
            // 左側顯示神秘寶箱（箱子放左側）
            this.renderMysteryShop(activePlayer, 'shop-items-container');
            // 右側顯示玩家背包（可販售）
            this.renderShopInventory(activePlayer, 'shop-inventory-container');
            return;
        }

        // normal 模式：顯示左/右欄，隱藏神秘商店區塊
        if (shopContainerEl) shopContainerEl.style.display = '';
        if (msSection) msSection.style.display = 'none';

        container.innerHTML = '';
        if (!activePlayer) return;

        // 先按照 type 分組（並跳過神話等級在商店上架）
        const groups = {};
        const typeOrder = ['weapon', 'armor', 'helm', 'shoes', 'shield', 'accessory', 'other'];
        const typeLabels = { weapon: '武器', armor: '胸甲', helm: '頭盔', shoes: '鞋子', shield: '盾牌', accessory: '飾品', other: '其他' };

        // 若 shopVariantsByKey 尚未建立（通常為第一次或已被清除），則為每個上架模板建立變體並快取
        const needGenerate = !this.shopVariantsByKey || Object.keys(this.shopVariantsByKey).length === 0;
        if (needGenerate) {
            this.shopVariantsByKey = {};
            this.currentShopVariants = {};
            Object.keys(ITEMS).forEach(itemKey => {
                const template = ITEMS[itemKey];
                if (!template) return;
                // 神話等級不在商店上架，僅能怪物掉落
                if (template.rarity === 'legendary') return;
                // 普通模式：排除神秘物品
                if (template.isMystery) return;

                const variants = generateShopVariants(itemKey, 1);
                variants.forEach(variant => {
                    if (!variant) return;
                    if (!this.shopVariantsByKey[itemKey]) this.shopVariantsByKey[itemKey] = [];
                    this.shopVariantsByKey[itemKey].push(variant);
                    if (variant.instanceId) this.currentShopVariants[variant.instanceId] = variant;
                });
            });
        }

        // 使用快取的變體來填補分組
        Object.keys(this.shopVariantsByKey).forEach(itemKey => {
            const list = this.shopVariantsByKey[itemKey];
            if (!list || list.length === 0) return;
            const template = ITEMS[itemKey];
            list.forEach(variant => {
                const type = variant.type || (template && template.type) || 'other';
                if (!groups[type]) groups[type] = [];
                groups[type].push(variant);
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
                if (typeof variant.matk === 'number') shopStats.push(`🔮 +${variant.matk} MATK`);
                if (typeof variant.def === 'number') shopStats.push(`🛡️ +${variant.def} DEF`);
                if (typeof variant.speed === 'number') shopStats.push(`💨 +${variant.speed} SPD`);
                if (shopStats.length) {
                    const statRow = `<div style="font-size:12px; color:#a0a0a0; margin-top:6px;">${shopStats.join('  ')}</div>`;
                    shopItemEl.innerHTML = shopItemEl.innerHTML.replace('</div>\n                <button', `</div>${statRow}\n                <button`);
                }

                container.appendChild(shopItemEl);
            });
        });

        // 在生成完商店清單後，同步渲染商店內的玩家背包視圖（右側）
        this.renderShopInventory(activePlayer, 'shop-inventory-container');
    }

    // 供外部（例如 main.js）在購買時取回變體實例
    getShopVariant(variantId) {
        return this.currentShopVariants ? this.currentShopVariants[variantId] : null;
    }

    renderShopInventory(player, containerId = 'shop-inventory-container') {
        const container = document.getElementById(containerId);
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
                if (typeof item.matk === 'number') stats.push(`🔮 +${item.matk} MATK`);
                if (typeof item.def === 'number') stats.push(`🛡️ +${item.def} DEF`);
                if (typeof item.speed === 'number') stats.push(`💨 +${item.speed} SPD`);
                const statsHtml = stats.length ? `<div class=\"item-stats\">${stats.join('  ')}</div>` : '';
                const sellAttr = item.instanceId ? `data-instance-id="${item.instanceId}"` : `data-item-key="${item.id}"`;
                itemEl.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;">\n                        <div>\n                            <div class=\"item-icon\">${item.icon}</div>\n                            <div style=\"font-size:12px; color: ${rarityColor};\">${item.name}</div>\n                            ${statsHtml}\n                        </div>\n                        <div style=\"display:flex; align-items:center; gap:8px;\">${badgeHtml}<button class=\"btn btn-danger btn-sell-item\" ${sellAttr} style=\"padding: 3px 8px; font-size: 11px;\">販售</button></div>\n                    </div>`;
                grid.appendChild(itemEl);
            });
            container.appendChild(grid);
        } else {
            container.innerHTML = '<p style="font-size:12px; color:#a0a0a0; text-align:center;">目前沒有物品</p>';
        }
    }

    renderMysteryShop(player, containerId = 'mystery-shop-container') {
        const container = document.getElementById(containerId);
        const goldDisplay = document.getElementById('shop-gold-amount');
        if (!container || !player) return;

        // 確保使用正確的玩家實例
        const activePlayer = window.gameInstance ? window.gameInstance.player : player;
        if (activePlayer && goldDisplay) goldDisplay.textContent = activePlayer.gold;

        // 讀取神秘商店記錄
        const mysteryShop = window.gameInstance?.mysteryShop || { history: [] };

        container.innerHTML = '';
        if (!activePlayer) return;

        const mysteryShopDiv = document.createElement('div');
        mysteryShopDiv.className = 'mystery-shop-wrapper';
            // 神秘寶箱卡片（通常箱與高級箱）
            const normalBox = document.createElement('div');
            normalBox.className = 'mystery-box';
            const normalItem = ITEMS.mystery_item;
            const normalCanAfford = activePlayer.gold >= (normalItem?.price || 0);
            normalBox.innerHTML = `\n            <div class="mystery-box-icon">📦</div>\n            <div class="mystery-box-title">神秘寶箱</div>\n            <div class="mystery-box-desc">內含隨機物品，可能是傳說裝備或神話神器！<br>（也可能只是普通貨色...）</div>\n            <div class="mystery-box-price">💰 ${normalItem?.price || '--'} 金幣</div>\n            <button class="btn btn-primary btn-buy-mystery" data-mystery-key="mystery_item" ${normalCanAfford ? '' : 'disabled'}>開啟寶箱</button>\n        `;
            mysteryShopDiv.appendChild(normalBox);

            // 高級神秘箱（若存在）
            const premiumTemplate = ITEMS.mystery_premium;
            if (premiumTemplate) {
                const premiumBox = document.createElement('div');
                premiumBox.className = 'mystery-box premium';
                const premiumCanAfford = activePlayer.gold >= premiumTemplate.price;
                premiumBox.innerHTML = `\n                <div class="mystery-box-icon">🧧</div>\n                <div class="mystery-box-title">高級神秘寶箱</div>\n                <div class="mystery-box-desc">高級箱：保證取得極品或更高稀有度的物品（機會包含傳說 / 神話）。</div>\n                <div class="mystery-box-price">💰 ${premiumTemplate.price} 金幣</div>\n                <button class="btn btn-primary btn-buy-mystery" data-mystery-key="mystery_premium" ${premiumCanAfford ? '' : 'disabled'}>開啟高級寶箱</button>\n            `;
                mysteryShopDiv.appendChild(premiumBox);
            }
        // (已將各箱子分別 append) 不再使用未定義的 mysteryBox 變數

        // 已移除「最近購買結果」顯示功能

        container.appendChild(mysteryShopDiv);
    }

    handlePurchase(player, item) {
        if (item.price === undefined) return;
        if (player.gold < item.price) {
            alert("金幣不足！");
            return;
        }

        player.gold -= item.price;
        player.addItem(item);
        const mode = this.lastShopMode || 'normal';
        this.renderShop(player, { mode });
    }

    updateBattleScene(player, enemy) {
        if (this.playerHpBar) this.playerHpBar.style.width = `${(player.hp / player.effectiveMaxHp) * 100}%`;
        if (this.playerHpText) this.playerHpText.textContent = `${Math.ceil(player.hp)}/${player.effectiveMaxHp}`;
        // SP 顯示
        const spText = document.getElementById('player-sp-text');
        if (spText) spText.textContent = `${Math.ceil(player.sp || 0)}/${player.effectiveMaxSp}`;
        const spBar = document.getElementById('player-sp-bar');
        if (spBar) spBar.style.width = `${((player.sp || 0) / player.effectiveMaxSp) * 100}%`;
        if (this.enemyHpBar) this.enemyHpBar.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
        if (this.enemyHpText) this.enemyHpText.textContent = `${Math.ceil(enemy.hp)}/${enemy.maxHp}`;
        document.getElementById('player-name').textContent = player.name;
        document.getElementById('player-icon').textContent = player.icon;
        // 顯示怪物名稱（含 Boss 標記與詞綴）
        const enemyNameEl = document.getElementById('enemy-name');
        if (enemyNameEl) {
            let nameText = enemy.name;
            if (enemy.level) nameText = `Lv.${enemy.level} ${nameText}`;
            if (enemy.isBoss) nameText = `🔥BOSS🔥 ${nameText}`;
            enemyNameEl.textContent = nameText;
        }
        document.getElementById('enemy-icon').textContent = enemy.icon;

        // SP 不足時自動禁用技能按鈕
        const skillBtn = document.getElementById('btn-action-skill');
        if (skillBtn) {
            const spCost = 10;
            skillBtn.disabled = (player.sp || 0) < spCost;
        }
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