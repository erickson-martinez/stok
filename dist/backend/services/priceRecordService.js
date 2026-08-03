"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PriceRecord_1 = __importDefault(require("../models/PriceRecord"));
const ShoppingList_1 = __importDefault(require("../models/ShoppingList"));
class PriceRecordService {
    normalize(value) {
        return value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }
    async upsert(shoppingItem) {
        if (shoppingItem.price === null ||
            shoppingItem.price === undefined ||
            shoppingItem.price <= 0) {
            return;
        }
        const shoppingList = await ShoppingList_1.default.findById(shoppingItem.shoppingListId);
        if (!shoppingList) {
            return;
        }
        const storeId = shoppingList.metadata?.storeId ?? null;
        const nameSearch = this.normalize(shoppingItem.name);
        const filter = {
            nameSearch,
            brand: shoppingItem.brand ?? "",
            barcode: shoppingItem.barcode ?? "",
            packageQuantity: shoppingItem.packageQuantity ?? null,
            unit: shoppingItem.unit,
            storeId
        };
        await PriceRecord_1.default.findOneAndUpdate(filter, {
            $set: {
                name: shoppingItem.name,
                nameSearch,
                brand: shoppingItem.brand ?? "",
                barcode: shoppingItem.barcode ?? "",
                category: shoppingItem.category ?? "",
                packageQuantity: shoppingItem.packageQuantity ?? null,
                unit: shoppingItem.unit,
                price: shoppingItem.price,
                storeId,
                observedAt: new Date(),
                createdBy: shoppingList.userId,
                source: "user",
                confidence: 100
            }
        }, {
            upsert: true,
            new: true,
            runValidators: true
        });
    }
}
exports.default = new PriceRecordService();
//# sourceMappingURL=priceRecordService.js.map