import { CLASSES, ITEMS } from './data.js?version=1.0.4';
import { Player } from './player.js?version=1.0.4';
import { BattleEngine } from './battle.js?version=1.0.4';
import { UIManager } from './ui.js?version=1.0.4';
import { SaveManager } from './save_manager.js?version=1.0.4';
import { POINTS_PER_LEVEL } from './stats_config.js?version=1.0.4';

class Game {
    constructor() {
        this.ui = new UIManager();
        this.player = null;
        this.battle = null;
        this.selectedClassKey = null;
        this.isInitialized = false;
        this.wave = 0; // 戰鬥波數

        this.init();
    }

    async init() {
        console.log("勇者養成戰記 - 啟動中...");
        try {
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }

            // 1. 先嘗試載入存檔，這會建立 this.player
            await this.tryLoadGame();

            // 2. 如果沒有存檔，則準備職業選擇
            if (!this.player) {
                this.renderClassSelection();
            }

            // 3. 重要：註冊全域變數給 UI 使用
            window.gameInstance = this;

            // 4. 最後才掛載事件監聽器，確保 init 完成後才能點擊
            this.setupGlobalEventListeners();
            
            this.isInitialized = true;
            console.log("遊戲引擎已完全就緒!");
        } catch (err) {
            console.error("初始化過程中發生嚴重錯誤:", err);
        }
    }

    setupGlobalEventListeners() {
        const container = document.getElementById('game-container');
        if (!container) return;

        container.addEventListener('click', async (event) => {
            // --- 絕對防禦：如果引擎還沒初始化完成，直接無視所有點擊 ---
            if (!this.isInitialized) {
                console.warn("⚠️ 嘗試在初始化完成前進行操作，已攔截。");
                return;
            }

            const target = event.target.closest('button') || 
                           event.target.closest('.inventory-item') || 
                           event.target.closest('.equip-slot');
            if (!target) return;

            const id = target.id;

            // 處理點擊裝備格（脫下裝備）
            if (target.classList.contains('equip-slot')) {
                const slotId = target.dataset.slotId;
                if (this.player && typeof this.player.unequipItem === 'function') {
                    this.player.unequipItem(slotId);
                    this.ui.updatePlayerPanel(this.player);
                }
                return;
            }

            // 處理具有 class 的按鈕 (例如：btn-unequip, btn-buy-item)
            if (target.classList.contains('btn-unequip')) {
                const slotId = target.dataset.slotId;
                if (this.player && typeof this.player.unequipItem === 'function') {
                    this.player.unequipItem(slotId);
                    this.ui.updatePlayerPanel(this.player);
                }
                return;
            }

            if (target.classList.contains('inventory-item')) {
                // 檢查是否在商店場景中，如果是則不觸發裝備功能
                const shopScene = document.getElementById('scene-shop');
                if (shopScene && shopScene.classList.contains('active')) {
                    return;
                }

                const itemName = target.dataset.itemName;
                if (this.player && typeof this.player.equipItem === 'function') {
                    const item = this.player.inventory.find(i => i.name === itemName);
                    if (item) {
                        const success = this.player.equipItem(item);
                        if (success) this.ui.updatePlayerPanel(this.player);
                    }
                }
                return;
            }

            if (target.classList.contains('btn-buy-item')) {
                // 支援商店變體（data-variant-id）或舊式 data-item-key
                const variantId = target.dataset.variantId;
                if (variantId && this.ui && typeof this.ui.getShopVariant === 'function') {
                    const variantItem = this.ui.getShopVariant(variantId);
                    if (variantItem) {
                        this.handlePurchaseAction(variantItem);
                        return;
                    }
                }

                const itemKey = target.dataset.itemKey;
                const item = ITEMS[itemKey];
                if (item) this.handlePurchaseAction(item);
                return;
            }

            // 處理販售按鈕（支援 instanceId 或 舊的 itemKey）
            if (target.classList.contains('btn-sell-item')) {
                const instanceId = target.dataset.instanceId || target.dataset.itemKey;
                this.handleSellAction(instanceId);
                return;
            }

            // 處理一般 ID 按鈕
            switch (id) {
                case 'btn-start-adventure': 
                    this.createCharacter(); 
                    break;
                case 'btn-start-adventure-main':
                case 'btn-go-training':
                    // 顯示戰鬥模式選單（試煉塔或地圖刷怪）
                    if (this.player) this.ui.showBattleModeSelection(this);
                    break;
                case 'btn-go-shop':
                    if (this.player) {
                        this.ui.showScene('shop');
                        this.ui.renderShop(this.player);
                    } else {
                        alert("請先建立角色！");
                    }
                    break;
                case 'btn-back-to-game':
                    this.ui.showScene('game');
                    if (this.player) this.updateMainUI();
                    break;
                // btn-restart 已移除（採用浮動按鈕 btn-restart-floating）
                case 'btn-open-allocate':
                    if (this.player) this.ui.showStatAllocationModal(this.player);
                    break;
                case 'btn-toggle-player-info':
                    this.ui.togglePanel('player-info');
                    break;
                case 'btn-toggle-inventory':
                    this.ui.togglePanel('inventory-panel');
                    break;
                case 'btn-action-attack':
                    if (this.battle) this.battle.handleAction('attack');
                    break;
                case 'btn-action-skill':
                    if (this.battle) this.battle.handleAction('skill');
                    break;
                case 'btn-action-defend':
                    if (this.battle) this.battle.handleAction('defend');
                    break;
                case 'btn-action-flee':
                    if (this.battle) this.battle.handleAction('flee');
                    break;
                // TIP 功能已停用，相關元素與事件已移除
            }
        });

        // 支援按住持續攻擊（pointer 事件）
        const attackBtn = document.getElementById('btn-action-attack');
        if (attackBtn) {
            attackBtn.addEventListener('pointerdown', (e) => {
                if (e.preventDefault) e.preventDefault();
                if (this.battle) this.battle.playerAutoAttacking = true;
            });
            const stopAttack = () => { if (this.battle) this.battle.playerAutoAttacking = false; };
            attackBtn.addEventListener('pointerup', stopAttack);
            attackBtn.addEventListener('pointerleave', stopAttack);
            attackBtn.addEventListener('pointercancel', stopAttack);
        }

        // 齒輪選單綁定（包含重置選項）
        const gameMenuBtn = document.getElementById('btn-game-menu');
        const gameMenu = document.getElementById('game-menu');
        const menuReset = document.getElementById('menu-reset-game');

        if (gameMenuBtn && gameMenu) {
            // 點齒輪：切換選單顯示
            gameMenuBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const isShown = gameMenu.classList.toggle('show');
                gameMenuBtn.setAttribute('aria-expanded', isShown ? 'true' : 'false');
                if (!isShown) gameMenu.hidden = true; else gameMenu.hidden = false;
            });

            // 點擊頁面任意處關閉選單
            document.addEventListener('click', (ev) => {
                if (!gameMenu.contains(ev.target) && ev.target !== gameMenuBtn) {
                    gameMenu.classList.remove('show');
                    gameMenuBtn.setAttribute('aria-expanded', 'false');
                    gameMenu.hidden = true;
                }
            });
        }

        if (menuReset) {
            menuReset.addEventListener('click', (ev) => {
                ev.stopPropagation();
                try {
                    if (confirm('確認要重新開始嗎？這會清除所有本地存檔並重新載入遊戲。')) {
                        SaveManager.clear();
                        setTimeout(() => location.reload(), 120);
                    }
                } catch (e) {
                    console.error('重新開始時發生錯誤', e);
                }
            });
        }
    }

    handlePurchaseAction(item) {
        // --- 雙重身分驗證：確保 player 不是 null 且具有 addItem 方法 ---
        if (!this.player || typeof this.player.addItem !== 'function') {
            console.error("❌ 購買失敗：玩家實例無效或尚未準備好。目前 Player 是否為實例?", this.player instanceof Player);
            return;
        }

        if (item.price > this.player.gold) {
            alert("金幣不足！");
            return;
        }

        this.player.gold -= item.price;
        this.player.addItem(item);
        console.log(`成功購買: ${item.name}`);
        this.ui.renderShop(this.player);
    }

    handleSellAction(itemKey) {
        // --- 驗證 player 實例 ---
        if (!this.player) {
            console.error("❌ 販售失敗：玩家實例無效");
            return;
        }

        // 允許傳入 instanceId 或 base id
        const key = itemKey;
        if (!key) {
            console.error("❌ 販售失敗：未指定物品識別碼");
            return;
        }

        const index = this.player.inventory.findIndex(i => i.instanceId === key || i.id === key || i.baseId === key || i.id === key || i.name === key);
        if (index === -1) {
            console.error("❌ 販售失敗：玩家沒有此物品", key);
            return;
        }

        const item = this.player.inventory[index];
        const basePrice = (typeof item.price === 'number') ? item.price : (ITEMS[item.baseId || item.id]?.price || 0);
        const sellPrice = Math.max(0, Math.floor(basePrice * 0.5));
        // 將物品從背包移除並給予金幣
        this.player.inventory.splice(index, 1);
        this.player.gold += sellPrice;
        console.log(`成功販售: ${item.name}，獲得 ${sellPrice} 金幣`);
        this.ui.renderShop(this.player);
    }

    renderClassSelection() {
        const container = document.getElementById('class-grid-container');
        if (!container) return;
        container.innerHTML = '';

        Object.keys(CLASSES).forEach(key => {
            const cls = CLASSES[key];
            const card = document.createElement('div');
            card.className = 'class-card';
            card.innerHTML = `\n                <div class="class-icon">${cls.icon}</div>\n                <div class="class-name">${cls.name}</div>\n                <div class="class-desc">${cls.desc}</div>\n            `;
            card.onclick = () => this.selectClass(key);
            container.appendChild(card);
        });
    }

    selectClass(classKey) {
        this.selectedClassKey = classKey;
        const cls = CLASSES[classKey];
        const infoDiv = document.getElementById('class-info');
        if (infoDiv) {
            infoDiv.innerHTML = `<strong style="color:#ffd700">${cls.name}</strong><br>基礎 HP: ${cls.baseHp} | 攻擊: ${cls.baseAtk}`;
        }
        this.ui.showScene('character-create');
    }

    async createCharacter() {
        const nameInput = document.getElementById('char-name');
        const name = nameInput.value.trim() || "無名勇者";

        if (!this.selectedClassKey) {
            alert("請先選擇職業！");
            return;
        }

        try {
            this.player = new Player(name, this.selectedClassKey);
            console.log("角色建立成功:", this.player);
            
            this.battle = new BattleEngine(this.player, this.ui);
            this.bindPlayerListeners(this.player);
            SaveManager.save(this.player);

            this.ui.showScene('game');
            this.updateMainUI();
        } catch (err) {
            console.error("建立角色失敗:", err);
        }
    }

    async tryLoadGame() {
        const savedData = SaveManager.load();
        if (savedData) {
            console.log("偵測到存檔，開始重建實例...");
            try {
                const loadedPlayer = new Player(savedData.name, savedData.classKey);
                Object.assign(loadedPlayer, {
                    level: savedData.level,
                    exp: savedData.exp,
                    nextLevelExp: savedData.nextLevelExp,
                    hp: savedData.hp,
                    maxHp: savedData.maxHp,
                    atk: savedData.atk,
                    def: savedData.def,
                    speed: savedData.speed,
                    gold: savedData.gold,
                    inventory: JSON.parse(JSON.stringify(savedData.inventory || [])),
                    equipment: JSON.parse(JSON.stringify(savedData.equipment || {
                        weapon: null,
                        armor: null,
                        helm: null,
                        shoes: null,
                        shield: null,
                        accessory: null
                    }))
                });

                    // 如果舊存檔沒有屬性欄位，給予自由分配點數作為補償
                    const hasSavedStats = (typeof savedData.str !== 'undefined') && (typeof savedData.agi !== 'undefined') && (typeof savedData.vit !== 'undefined') && (typeof savedData.int !== 'undefined') && (typeof savedData.dex !== 'undefined') && (typeof savedData.luk !== 'undefined');
                    if (hasSavedStats) {
                        // 恢復屬性（若存在）與剩餘點數
                        loadedPlayer.str = typeof savedData.str !== 'undefined' ? savedData.str : loadedPlayer.str;
                        loadedPlayer.agi = typeof savedData.agi !== 'undefined' ? savedData.agi : loadedPlayer.agi;
                        loadedPlayer.vit = typeof savedData.vit !== 'undefined' ? savedData.vit : loadedPlayer.vit;
                        loadedPlayer.int = typeof savedData.int !== 'undefined' ? savedData.int : loadedPlayer.int;
                        loadedPlayer.dex = typeof savedData.dex !== 'undefined' ? savedData.dex : loadedPlayer.dex;
                        loadedPlayer.luk = typeof savedData.luk !== 'undefined' ? savedData.luk : loadedPlayer.luk;
                        loadedPlayer.statPointsAvailable = typeof savedData.statPointsAvailable !== 'undefined' ? savedData.statPointsAvailable : 0;
                    } else {
                        // 舊存檔：沒有素質資料，將所有素質設為 0 並給予補償點數
                        loadedPlayer.str = 0;
                        loadedPlayer.agi = 0;
                        loadedPlayer.vit = 0;
                        loadedPlayer.int = 0;
                        loadedPlayer.dex = 0;
                        loadedPlayer.luk = 0;
                        loadedPlayer.statPointsAvailable = 30 + (loadedPlayer.level * POINTS_PER_LEVEL);
                    }

                    this.player = loadedPlayer;
                console.log("玩家實例重建成功:", this.player);

                // 復原波數（如有）
                this.wave = savedData.wave || 0;

                this.battle = new BattleEngine(this.player, this.ui);
                this.bindPlayerListeners(this.player);

                this.ui.showScene('game');
                this.updateMainUI();
            } catch (err) {
                console.error("重建玩家實例時發生致命錯誤:", err);
                SaveManager.clear(); 
            }
        }
    }

    bindPlayerListeners(player) {
        player.setOnChanged(() => {
            SaveManager.save(player);
            this.updateMainUI();
        });
    }

    // 啟動試煉塔（以 wave 作為塔層）
    async startTowerBattle() {
        if (!this.player) return;
        console.log(`啟動試煉塔 第 ${this.wave + 1} 層...`);
        this.ui.showScene('battle');
        const result = await this.battle.startBattle(this.wave, this, { mode: 'tower' });
        if (result) {
            this.wave++;
        } else {
            this.wave = Math.max(1, this.wave - 1);
        }
        SaveManager.save(this.player, { wave: this.wave });
    }

    // 在選定地圖上開始一次刷怪（單次），可重複由使用者再次啟動
    async startMapBattle(mapKey) {
        if (!this.player) return;
        console.log(`開始地圖刷怪：${mapKey}`);
        this.ui.showScene('battle');
        const result = await this.battle.startBattle(this.wave, this, { mode: 'map', mapKey });
        // 地圖戰鬥不改變塔層（wave），僅給予獎勵。結果返回後回到地圖選單或主畫面。
        SaveManager.save(this.player, { wave: this.wave });
    }

    updateMainUI() {
        if (this.player) {
            this.ui.updatePlayerPanel(this.player);
        }
    }

    showScene(sceneId) {
        this.ui.showScene(sceneId);
    }
}

// 啟動遊戲流程
const game = new Game();
