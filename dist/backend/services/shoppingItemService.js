"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShoppingItem_1 = __importDefault(require("../models/ShoppingItem"));
const priceRecordService_1 = __importDefault(require("./priceRecordService"));
class ShoppingItemService {
    async create(data) {
        const shoppingItem = await ShoppingItem_1.default.create(data);
        await priceRecordService_1.default.upsert(shoppingItem);
        return shoppingItem;
    }
    async update(id, data) {
        const shoppingItem = await ShoppingItem_1.default.findByIdAndUpdate(id, {
            $set: data
        }, {
            new: true,
            runValidators: true
        });
        if (!shoppingItem) {
            return null;
        }
        await priceRecordService_1.default.upsert(shoppingItem);
        return shoppingItem;
    }
    async delete(id) {
        const shoppingItem = await ShoppingItem_1.default.findByIdAndDelete(id);
        return !!shoppingItem;
    }
    async get(filter) {
        return ShoppingItem_1.default.find(filter)
            .populate("shoppingListId", "name metadata")
            .sort({
            createdAt: 1
        });
    }
}
exports.default = new ShoppingItemService();
//# sourceMappingURL=shoppingItemService.js.map