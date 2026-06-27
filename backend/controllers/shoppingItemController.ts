// controllers/shoppingItemController.ts

import { Request, Response } from "express";
import ShoppingItem, { IShoppingItem } from "../models/ShoppingItem";

const shoppingItemController = {

    async getShoppingItems(req: Request, res: Response): Promise<void> {

        try {

            const {
                id,
                shoppingListId,
                productId,
                checked
            } = req.query;

            const filter: any = {};

            if (id) filter._id = id;
            if (shoppingListId) filter.shoppingListId = shoppingListId;
            if (productId) filter.productId = productId;
            if (checked !== undefined) filter.checked = checked === "true";

            const items = await ShoppingItem
                .find(filter)
                .populate("productId")
                .sort({ createdAt: 1 });

            res.status(200).json(items);

        } catch (error: any) {

            res.status(500).json({
                message: "Error listing shopping items.",
                error: error.message
            });

        }

    },

    async createShoppingItem(req: Request, res: Response): Promise<void> {

        try {

            const item = await ShoppingItem.create(req.body);

            res.status(201).json(item);

        } catch (error: any) {

            res.status(400).json({
                message: "Error creating shopping item.",
                error: error.message
            });

        }

    },

    async updateShoppingItem(req: Request, res: Response): Promise<void> {

        try {

            const { id } = req.params;

            const item = await ShoppingItem.findByIdAndUpdate(
                id,
                { $set: req.body },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!item) {
                return void res.status(404).json({
                    message: "Shopping item not found."
                });
            }

            res.status(200).json(item);

        } catch (error: any) {

            res.status(400).json({
                message: "Error updating shopping item.",
                error: error.message
            });

        }

    },

    async deleteShoppingItem(req: Request, res: Response): Promise<void> {

        try {

            const { id } = req.params;

            const item = await ShoppingItem.findByIdAndDelete(id);

            if (!item) {

                return void res.status(404).json({
                    message: "Shopping item not found."
                });

            }

            res.status(200).json({
                message: "Shopping item deleted successfully."
            });

        } catch (error: any) {

            res.status(500).json({
                message: "Error deleting shopping item.",
                error: error.message
            });

        }

    }

};

export default shoppingItemController;