//controllers/shoppingListController.ts

import { Request, Response } from "express";
import ShoppingList, { IShoppingList } from "../models/ShoppingList";

const shoppingListController = {

    async getShoppingLists(req: Request, res: Response): Promise<void> {

        try {

            const {
                id,
                userId,
                status,
                favorite
            } = req.query;

            const filter: any = {};

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

            const shoppingLists: IShoppingList[] = await ShoppingList.find(filter).sort({
                createdAt: -1
            });

            res.status(200).json(shoppingLists);

        } catch (error: any) {

            res.status(500).json({
                message: "Error listing shopping lists.",
                error: error.message
            });

        }

    },

    async createShoppingList(req: Request, res: Response): Promise<void> {

        try {

            const {
                userId,
                name,
                description,
                favorite,
                sharedWith,
                status
            } = req.body;

            const shoppingList = await ShoppingList.create({

                userId,

                name,

                description,

                favorite,

                sharedWith,

                status

            });

            res.status(201).json(shoppingList);

        } catch (error: any) {

            res.status(400).json({

                message: "Error creating shopping list.",

                error: error.message

            });

        }

    },

    async updateShoppingList(req: Request, res: Response): Promise<void> {

        try {

            const { id } = req.params;

            const shoppingList = await ShoppingList.findByIdAndUpdate(

                id,

                {
                    $set: req.body
                },

                {
                    new: true,
                    runValidators: true
                }

            );

            if (!shoppingList) {

                return void res.status(404).json({

                    message: "Shopping list not found."

                });

            }

            res.status(200).json(shoppingList);

        } catch (error: any) {

            res.status(400).json({

                message: "Error updating shopping list.",

                error: error.message

            });

        }

    },

    async deleteShoppingList(req: Request, res: Response): Promise<void> {

        try {

            const { id } = req.params;

            const shoppingList = await ShoppingList.findByIdAndDelete(id);

            if (!shoppingList) {

                return void res.status(404).json({

                    message: "Shopping list not found."

                });

            }

            res.status(200).json({

                message: "Shopping list deleted successfully."

            });

        } catch (error: any) {

            res.status(500).json({

                message: "Error deleting shopping list.",

                error: error.message

            });

        }

    }

};

export default shoppingListController;