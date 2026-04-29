export class EquipmentManager {
    constructor(player) {
        this.player = player;
    }

    // 穿戴裝備
    equip(item) {
        if (!item) return;

        if (item.type === 'weapon') {
            this.player.equipment.weapon = item;
        } else if (item.type === 'armor') {
            this.player.equipment.armor = item;
        }
        console.log(`${this.player.name} 穿上了 ${item.name}`);
    }

    // 卸下裝備
    unequip(type) {
        if (this.player.equipment[type]) {
            const item = this.player.equipment[type];
            this.player.equipment[type] = null;
            return item;
        }
        return null;
    }

    // 取得當前裝備加成後的屬性 (用於 UI 顯示)
    getStatsBonus() {
        let bonus = { atk: 0, def: 0 };
        if (this.player.equipment.weapon) {
            bonus.atk += this.player.equipment.weapon.atk || 0;
        }
        if (this.player.equipment.armor) {
            bonus.def += this.player.equipment.armor.def || 0;
        }
        return bonus;
    }
}