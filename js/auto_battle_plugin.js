import { MAPS } from './data.js?version=1.1.3';
import { AUTO_BATTLE_CONFIG } from './stats_config.js?version=1.1.3';

/**
 * 自動刷怪外掛 — 三段狀態模式
 * - 停止 (stop)
 * - 自動爬塔 (climb): 挑戰最新層，戰敗退回 5 層切換為 grind
 * - 自動刷怪 (grind): 在當前層 - 5 (最低第 1 層) 刷怪，不推進塔層
 */
const AutoBattlePlugin = (() => {
    let running = false;
    let mode = 'stop'; // 'stop' | 'climb' | 'grind'

    function createStopButton() {
        if (document.getElementById('auto-battle-stop-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'auto-battle-stop-btn';
        btn.className = 'floating-stop';
        btn.title = '停止自動腳本';
        btn.textContent = '停止自動';
        btn.style.display = 'none';
        btn.addEventListener('click', () => {
            stopAutoBattle();
        });
        document.body.appendChild(btn);
    }

    function showStopButton(show) {
        const btn = document.getElementById('auto-battle-stop-btn');
        if (!btn) return;
        btn.style.display = show ? 'block' : 'none';
    }

    function updateModeIndicator() {
        const btn = document.getElementById('auto-battle-stop-btn');
        if (!btn) return;
        if (mode === 'climb') {
            btn.textContent = '🗼 停止爬塔';
        } else if (mode === 'grind') {
            btn.textContent = '🔄 停止刷怪';
        }
    }

    function openModal(gameInstance) {
        if (document.getElementById('auto-battle-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'auto-battle-modal';
        modal.className = 'modal-overlay';

        let listHtml = '';
        MAPS.forEach(m => {
            listHtml += `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                <div>
                    <div style="font-weight:bold">${m.name}</div>
                    <div style="font-size:12px; color:#a0a0a0;">等級 ${m.min} ~ ${m.max === Infinity ? '無上限' : m.max}</div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-primary btn-auto-start" data-map-key="${m.key}">開始自動</button>
                </div>
            </div>`;
        });

        const currentFloor = (gameInstance.wave || 0) + 1;
        const grindFloor = Math.max(1, currentFloor - (AUTO_BATTLE_CONFIG.GRIND_OFFSET || 5));

        modal.innerHTML = `
            <div class="modal-content">
                <h3>自動戰鬥系統</h3>
                <div style="margin:8px 0; padding:8px; background:rgba(255,255,255,0.05); border-radius:6px; font-size:13px;">
                    <p>📍 目前進度：第 ${currentFloor} 層</p>
                </div>
                <div style="display:flex; gap:8px; margin-top:8px; justify-content:center;">
                    <button class="btn btn-primary" id="btn-auto-climb">🗼 自動爬塔</button>
                    <button class="btn btn-primary" id="btn-auto-grind">🔄 自動刷怪 (第${grindFloor}層)</button>
                </div>
                <p style="font-size:11px; color:#888; margin-top:6px;">爬塔：挑戰最新層，戰敗退 5 層轉刷怪<br>刷怪：在安全層(當前-5)無傷刷資源</p>
                <hr style="border-color:rgba(255,255,255,0.1); margin:12px 0;">
                <h4 style="margin:4px 0;">地圖刷怪</h4>
                <div style="max-height:250px; overflow:auto; margin-top:8px;">${listHtml}</div>
                <div style="margin-top:12px; text-align:center;"><button class="btn" id="btn-auto-cancel">取消</button></div>
            </div>`;

        document.body.appendChild(modal);

        modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });
        modal.querySelector('#btn-auto-cancel').addEventListener('click', () => modal.remove());

        const btnClimb = modal.querySelector('#btn-auto-climb');
        if (btnClimb) {
            btnClimb.addEventListener('click', () => {
                modal.remove();
                startAutoClimb(gameInstance);
            });
        }

        const btnGrind = modal.querySelector('#btn-auto-grind');
        if (btnGrind) {
            btnGrind.addEventListener('click', () => {
                modal.remove();
                startAutoGrind(gameInstance);
            });
        }

        modal.querySelectorAll('.btn-auto-start').forEach(btn => {
            btn.addEventListener('click', () => {
                const mapKey = btn.dataset.mapKey;
                modal.remove();
                startAutoMapBattle(gameInstance, mapKey);
            });
        });
    }

    async function autoAttackMonitor(gameInstance) {
        while (running) {
            if (!gameInstance || !gameInstance.battle) {
                await new Promise(r => setTimeout(r, 120));
                continue;
            }
            while (running && gameInstance.battle && !gameInstance.battle.isBattleOver) {
                try {
                    if (gameInstance.battle.isPlayerTurn && gameInstance.battle.enemy) {
                        gameInstance.battle.handleAction('attack');
                        await new Promise(r => setTimeout(r, 100));
                    }
                } catch (e) {
                    console.error('AutoBattle monitor error', e);
                }
                await new Promise(r => setTimeout(r, 150));
            }
            await new Promise(r => setTimeout(r, 200));
        }
    }

    function dismissBattleResult(gameInstance) {
        try {
            const returnBtn = document.getElementById('btn-return-game');
            if (returnBtn) {
                try { returnBtn.click(); } catch (e) { /* ignore */ }
            } else {
                if (gameInstance && gameInstance.ui) {
                    gameInstance.ui.showScene('game');
                    gameInstance.updateMainUI();
                }
            }
            const br = document.getElementById('battle-result-container');
            if (br) br.innerHTML = '';
        } catch (e) { console.error(e); }
    }

    async function startAutoClimb(gameInstance) {
        if (!gameInstance || !gameInstance.player) {
            alert('請先建立角色！');
            return;
        }
        if (running) {
            console.warn('自動刷怪外掛已在執行中');
            return;
        }
        running = true;
        mode = 'climb';
        createStopButton();
        showStopButton(true);
        updateModeIndicator();

        const monitor = autoAttackMonitor(gameInstance);

        try {
            while (running && mode === 'climb') {
                let result = false;
                try {
                    if (typeof gameInstance.startTowerBattle === 'function') {
                        result = await gameInstance.startTowerBattle();
                    } else if (gameInstance.battle && typeof gameInstance.battle.startBattle === 'function') {
                        result = await gameInstance.battle.startBattle(gameInstance.wave, gameInstance, { mode: 'tower' });
                        if (result) gameInstance.wave++;
                    }
                } catch (e) {
                    console.error('自動爬塔失敗', e);
                    result = false;
                }

                if (!running) break;

                if (result) {
                    dismissBattleResult(gameInstance);
                    await new Promise(r => setTimeout(r, 300));
                    continue;
                } else {
                    // 戰敗：退回 5 層，切換為刷怪模式
                    const fallback = AUTO_BATTLE_CONFIG.FALLBACK_FLOORS || 5;
                    gameInstance.wave = Math.max(0, (gameInstance.wave || 0) - fallback);
                    console.warn(`自動爬塔：戰敗，退回至第 ${gameInstance.wave + 1} 層，切換為刷怪模式`);
                    dismissBattleResult(gameInstance);
                    await new Promise(r => setTimeout(r, 500));

                    mode = 'grind';
                    updateModeIndicator();
                    await runGrindLoop(gameInstance);
                    break;
                }
            }
        } finally {
            running = false;
            mode = 'stop';
            try { await monitor; } catch (e) { /* ignore */ }
            showStopButton(false);
        }
    }

    async function startAutoGrind(gameInstance) {
        if (!gameInstance || !gameInstance.player) {
            alert('請先建立角色！');
            return;
        }
        if (running) {
            console.warn('自動刷怪外掛已在執行中');
            return;
        }
        running = true;
        mode = 'grind';
        createStopButton();
        showStopButton(true);
        updateModeIndicator();

        const monitor = autoAttackMonitor(gameInstance);

        try {
            await runGrindLoop(gameInstance);
        } finally {
            running = false;
            mode = 'stop';
            try { await monitor; } catch (e) { /* ignore */ }
            showStopButton(false);
        }
    }

    async function runGrindLoop(gameInstance) {
        const offset = AUTO_BATTLE_CONFIG.GRIND_OFFSET || 5;
        while (running && mode === 'grind') {
            const grindWave = Math.max(0, (gameInstance.wave || 0) - offset);
            let result = false;
            try {
                if (gameInstance.battle && typeof gameInstance.battle.startBattle === 'function') {
                    result = await gameInstance.battle.startBattle(grindWave, gameInstance, { mode: 'tower' });
                }
            } catch (e) {
                console.error('自動刷怪失敗', e);
                result = false;
            }

            if (!running) break;

            if (result) {
                dismissBattleResult(gameInstance);
                await new Promise(r => setTimeout(r, 300));
                continue;
            } else {
                console.warn('自動刷怪：在安全層意外戰敗，已停止');
                dismissBattleResult(gameInstance);
                break;
            }
        }
    }

    async function startAutoMapBattle(gameInstance, mapKey) {
        if (!gameInstance || !gameInstance.player) {
            alert('請先建立角色！');
            return;
        }
        if (running) {
            console.warn('自動刷怪外掛已在執行中');
            return;
        }
        running = true;
        mode = 'grind';
        createStopButton();
        showStopButton(true);
        updateModeIndicator();

        const monitor = autoAttackMonitor(gameInstance);

        try {
            while (running) {
                if (!running) break;
                let result = false;
                try {
                    if (typeof gameInstance.startMapBattle === 'function') {
                        result = await gameInstance.startMapBattle(mapKey);
                    } else if (gameInstance.battle && typeof gameInstance.battle.startBattle === 'function') {
                        result = await gameInstance.battle.startBattle(gameInstance.wave, gameInstance, { mode: 'map', mapKey });
                    }
                } catch (e) {
                    console.error('啟動地圖戰鬥失敗', e);
                    result = false;
                }

                if (!running) break;

                if (result) {
                    dismissBattleResult(gameInstance);
                    await new Promise(r => setTimeout(r, 300));
                    continue;
                } else {
                    console.warn('地圖自動刷怪：戰敗，已停止');
                    dismissBattleResult(gameInstance);
                    break;
                }
            }
        } finally {
            try { await monitor; } catch (e) { /* ignore */ }
            showStopButton(false);
            running = false;
            mode = 'stop';
        }
    }

    function stopAutoBattle() {
        running = false;
        mode = 'stop';
        showStopButton(false);
    }

    return {
        openModal,
        startClimb: startAutoClimb,
        startGrind: startAutoGrind,
        startMap: startAutoMapBattle,
        stop: stopAutoBattle,
        isRunning: () => running,
        getMode: () => mode
    };
})();

export default AutoBattlePlugin;
