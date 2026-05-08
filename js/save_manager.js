const SAVE_KEY = 'brave_hero_save_data';

export class SaveManager {
    // 儲存玩家資料。可透過第二個參數傳入額外的遊戲狀態（例如 wave）
    static save(player, meta = {}) {
        if (!player) return;
        console.log("正在儲存遊戲進度...");
        // 若先前存檔包含額外狀態（例如 wave），在未明確提供時保留它，避免覆寫
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (typeof parsed.wave !== 'undefined' && typeof meta.wave === 'undefined') {
                    meta = Object.assign({}, meta, { wave: parsed.wave });
                }
            }
        } catch (e) {
            // 解析失敗則忽略，繼續正常儲存
        }

        const saveData = {
            name: player.name,
            classKey: player.classKey,
            level: player.level,
            exp: player.exp,
            nextLevelExp: player.nextLevelExp,
            hp: player.hp,
            maxHp: player.maxHp,
            atk: player.atk,
            def: player.def,
            speed: player.speed,
            gold: player.gold,
            inventory: player.inventory,
            equipment: player.equipment,
            // 屬性與分配點數
            str: player.str,
            agi: player.agi,
            vit: player.vit,
            int: player.int,
            dex: player.dex,
            luk: player.luk,
            statPointsAvailable: player.statPointsAvailable,
            // SP 系統
            sp: player.sp,
            maxSp: player.maxSp,
            // 將任何額外 meta 加入儲存物件（例如 wave）
            ...meta
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    }

    // 讀取玩家資料 - 加入防禦性檢查
    static load() {
        const data = localStorage.getItem(SAVE_KEY);
        if (!data) return null;

        try {
            const parsed = JSON.parse(data);
            console.log("讀取到的原始資料:", parsed);
            
            // 檢查必要的欄位是否存在，若不存在則回傳 null 強制重新開始
            if (!parsed.name || !parsed.classKey) {
                console.warn("存檔格式不正確 (缺少 name 或 classKey)，將清除舊存檔並重新開始。");
                this.clear();
                return null;
            }

            return parsed;
        } catch (err) {
            console.error("解析存檔失敗:", err);
            return null;
        }
    }

    static clear() {
        localStorage.removeItem(SAVE_KEY);
        console.log("存檔已清除。");
    }
}