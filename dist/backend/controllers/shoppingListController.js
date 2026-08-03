"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShoppingList_1 = __importDefault(require("../models/ShoppingList"));
const shoppingListController = {
    async getShoppingLists(req, res) {
        try {
            const { id, userId, status, favorite } = req.query;
            const filter = {};
            if (id) {
                filter._id = id;
            }
            if (userId) {
                filter.userId = userId;
            }
            if (status) {
                filter.status = status;
            }
            if (favorite !== undefined) {
                filter.favorite = favorite === "true";
            }
            const shoppingLists = await ShoppingList_1.default.find(filter).sort({
                createdAt: -1
            });
            res.status(200).json(shoppingLists);
        }
        catch (error) {
            res.status(500).json({
                message: "Error listing shopping lists.",
                error: error.message
            });
        }
    },
    async createShoppingList(req, res) {
        try {
            const { userId, name, description, favorite, metadata, sharedWith, status } = req.body;
            const shoppingList = await ShoppingList_1.default.create({
                userId,
                name,
                description,
                favorite,
                sharedWith,
                status,
                metadata
            });
            res.status(201).json(shoppingList);
        }
        catch (error) {
            res.status(400).json({
                message: "Error creating shopping list.",
                error: error.message
            });
        }
    },
    async updateShoppingList(req, res) {
        try {
            const { id } = req.params;
            const shoppingList = await ShoppingList_1.default.findByIdAndUpdate(id, {
                $set: req.body
            }, {
                new: true,
                runValidators: true
            });
            if (!shoppingList) {
                return void res.status(404).json({
                    message: "Shopping list not found."
                });
            }
            res.status(200).json(shoppingList);
        }
        catch (error) {
            res.status(400).json({
                message: "Error updating shopping list.",
                error: error.message
            });
        }
    },
    async deleteShoppingList(req, res) {
        try {
            const { id } = req.params;
            const shoppingList = await ShoppingList_1.default.findByIdAndDelete(id);
            if (!shoppingList) {
                return void res.status(404).json({
                    message: "Shopping list not found."
                });
            }
            res.status(200).json({
                message: "Shopping list deleted successfully."
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Error deleting shopping list.",
                error: error.message
            });
        }
    }
};
exports.default = shoppingListController;
//# sourceMappingURL=shoppingListController.js.map