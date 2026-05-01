import { MAPS } from './data.js?version=1.1.0';

const AutoBattlePlugin = (() => {
    let running = false;

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

        modal.innerHTML = `
            <div class="modal-content">
                <h3>自動刷怪外掛</h3>
                <div style="max-height:320px; overflow:auto; margin-top:8px;">${listHtml}</div>
                <div style="margin-top:12px; text-align:center;"><button class="btn" id="btn-auto-cancel">取消</button></div>
            </div>`;

        document.body.appendChild(modal);

        modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });

        modal.querySelector('#btn-auto-cancel').addEventListener('click', () => modal.remove());

        modal.querySelectorAll('.btn-auto-start').forEach(btn => {
            btn.addEventListener('click', () => {
                const mapKey = btn.dataset.mapKey;
                modal.remove();
                startAutoBattle(gameInstance, mapKey);
            });
        });
    }

    async function startAutoBattle(gameInstance, mapKey) {
        if (!gameInstance || !gameInstance.player) {
            alert('請先建立角色！');
            return;
        }
        if (running) {
            console.warn('自動刷怪外掛已在執行中');
            return;
        }
        running = true;
        createStopButton();
        showStopButton(true);

        // 監聽器：整個自動模式期間持續監控玩家回合並在可行時執行普通攻擊
        const monitor = (async () => {
            while (running) {
                if (!gameInstance || !gameInstance.battle) {
                    await new Promise(r => setTimeout(r, 120));
                    continue;
                }
                // 當有戰鬥進行時，持續在玩家回合觸發攻擊
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
                // 戰鬥結束後繼續外層迴圈，等待下一場戰鬥或停止
                await new Promise(r => setTimeout(r, 200));
            }
        })();

        // 主要迴圈：連續發起同一地圖的刷怪，直到使用者停止（running=false）
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

                if (!running) break; // 使用者按下停止後，離開迴圈

                if (result) {
                    // 勝利：嘗試自動關閉戰鬥結果（模擬按下返回按鈕），並確保回到主畫面再開始下一場
                    try {
                        // 若 UI 已渲染返回按鈕，模擬點擊收起結果介面
                        const returnBtn = document.getElementById('btn-return-game');
                        if (returnBtn) {
                            try { returnBtn.click(); } catch (e) { console.warn('模擬點擊返回按鈕失敗', e); }
                        } else {
                            // 若按鈕不存在，直接切換回主畫面
                            if (gameInstance && gameInstance.ui) {
                                gameInstance.ui.showScene('game');
                                gameInstance.updateMainUI();
                            }
                        }

                        // 清理 battle result 容器（以防 UI 未自動移除）
                        const br = document.getElementById('battle-result-container');
                        if (br) br.innerHTML = '';
                    } catch (e) { console.error(e); }
                    // 小延遲，讓介面穩定並給使用者時間停止
                    await new Promise(r => setTimeout(r, 300));
                    // 繼續下一場
                    continue;
                } else {
                    // 戰敗：遵循原先行為，重新載入遊戲（會結束自動模式）
                    location.reload();
                    break;
                }
            }
        } finally {
            // 確保監聽器結束並隱藏停止按鈕
            try { await monitor; } catch (e) { /* ignore */ }
            showStopButton(false);
            running = false;
        }
    }

    function stopAutoBattle() {
        running = false;
        showStopButton(false);
    }

    return { openModal, start: startAutoBattle, stop: stopAutoBattle, isRunning: () => running };
})();

export default AutoBattlePlugin;
