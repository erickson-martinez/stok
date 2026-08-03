"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shoppingItemService_1 = __importDefault(require("../services/shoppingItemService"));
const shoppingItemController = {
    async getShoppingItems(req, res) {
        try {
            const { id, shoppingListId, name, checked, storeId } = req.query;
            const filter = {};
            if (!shoppingListId) {
                return void res.status(400).json({
                    message: "shoppingListId query parameter is required."
                });
            }
            if (id)
                filter._id = id;
            if (shoppingListId)
                filter.shoppingListId = shoppingListId;
            if (name) {
                filter.name = {
                    $regex: name,
                    $options: "i"
                };
            }
            if (checked !== undefined) {
                filter.checked = checked === "true";
            }
            if (storeId) {
                filter.storeId = storeId;
            }
            const shoppingItems = await shoppingItemService_1.default.get(filter);
            res.status(200).json(shoppingItems);
        }
        catch (error) {
            res.status(500).json({
                message: "Error listing shopping items.",
                error: error.message
            });
        }
    },
    async createShoppingItem(req, res) {
        try {
            const shoppingItem = await shoppingItemService_1.default.create(req.body);
            res.status(201).json(shoppingItem);
        }
        catch (error) {
            res.status(400).json({
                message: "Error creating shopping item.",
                error: error.message
            });
        }
    },
    async updateShoppingItem(req, res) {
        try {
            const shoppingItem = await shoppingItemService_1.default.update(req.params.id, req.body);
            if (!shoppingItem) {
                return void res.status(404).json({
                    message: "Shopping item not found."
                });
            }
            res.status(200).json(shoppingItem);
        }
        catch (error) {
            res.status(400).json({
                message: "Error updating shopping item.",
                error: error.message
            });
        }
    },
    async deleteShoppingItem(req, res) {
        try {
            const deleted = await shoppingItemService_1.default.delete(req.params.id);
            if (!deleted) {
                return void res.status(404).json({
                    message: "Shopping item not found."
                });
            }
            res.status(200).json({
                message: "Shopping item deleted successfully."
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Error deleting shopping item.",
                error: error.message
            });
        }
    }
};
exports.default = shoppingItemController;
//# sourceMappingURL=shoppingItemController.js.map