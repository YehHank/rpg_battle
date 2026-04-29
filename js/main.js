import { CLASSES, ITEMS } from './data.js';
import { Player } from './player.js';
import { BattleEngine } from './battle.js';
import { UIManager } from './ui.js';
import { SaveManager } from './save_manager.js';

class Game {
    constructor() {
        this.ui = new UIManager();
        this.player = null;
        this.battle = null;
        this.selectedClassKey = null;
        this.isInitialized = false;
        
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
                const itemKey = target.dataset.itemKey;
                const item = ITEMS[itemKey];
                if (item) this.handlePurchaseAction(item);
                return;
            }

            // 處理一般 ID 按鈕
            switch (id) {
                case 'btn-start-adventure': 
                    this.createCharacter(); 
                    break;
                case 'btn-start-adventure-main':
                case 'btn-go-training':
                    this.handleTraining();
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
                case 'tip-icon':
                    this.ui.showTip();
                    break;
                case 'tip-close':
                    this.ui.hideTip();
                    break;
            }
        });
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
                    equipment: JSON.parse(JSON.stringify(savedData.equipment || { weapon: null, armor: null }))
                });

                this.player = loadedPlayer;
                console.log("玩家實例重建成功:", this.player);

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

    async handleTraining() {
        if (!this.player) return;
        console.log("啟動訓練流程...");
        this.ui.showScene('battle');
        await this.battle.startBattle(0, this);
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
