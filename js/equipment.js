export class EquipmentManager {
    constructor(player) {
        this.player = player;
    }

    // 穿戴裝備
    equip(item) {
        if (!item) return;

        const slotMap = {
            'weapon': 'weapon',
            'armor': 'armor',
            'helm': 'helm',
            'shoes': 'shoes',
            'shield': 'shield',
            'accessory': 'accessory'
        };
        const slot = slotMap[item.type];
        if (!slot) return;
        this.player.equipment[slot] = item;
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
        let bonus = { atk: 0, def: 0, speed: 0 };
        if (this.player.equipment.weapon) {
            bonus.atk += this.player.equipment.weapon.atk || 0;
        }
        if (this.player.equipment.armor) {
            bonus.def += this.player.equipment.armor.def || 0;
        }
        if (this.player.equipment.helm) {
            bonus.def += this.player.equipment.helm.def || 0;
            bonus.speed += this.player.equipment.helm.speed || 0;
        }
        if (this.player.equipment.shoes) {
            bonus.speed += this.player.equipment.shoes.speed || 0;
        }
        if (this.player.equipment.shield) {
            bonus.def += this.player.equipment.shield.def || 0;
        }
        if (this.player.equipment.accessory) {
            bonus.atk += this.player.equipment.accessory.atk || 0;
            bonus.def += this.player.equipment.accessory.def || 0;
            bonus.speed += this.player.equipment.accessory.speed || 0;
        }
        return bonus;
    }
}