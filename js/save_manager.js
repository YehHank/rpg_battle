const SAVE_KEY = 'brave_hero_save_data';

export class SaveManager {
    // 儲存玩家資料
    static save(player) {
        if (!player) return;
        console.log("正在儲存遊戲進度...");
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
            equipment: player.equipment
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