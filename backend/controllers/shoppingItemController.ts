//controllers/shoppingItemController.ts

import { Request, Response } from "express";
import shoppingItemService from "../services/shoppingItemService";

const shoppingItemController = {

    async getShoppingItems(req: Request, res: Response): Promise<void> {

        try {

            const {
                id,
                shoppingListId,
                name,
                checked,
                storeId
            } = req.query;

            const filter: any = {};

            if (id) filter._id = id;

            if (shoppingListId) filter.shoppingListId = shoppingListId;

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

            const shoppingItems = await shoppingItemService.get(filter);

            res.status(200).json(shoppingItems);

        } catch (error: any) {

            res.status(500).json({

                message: "Error listing shopping items.",

                error: error.message

            });

        }

    },

    async createShoppingItem(req: Request, res: Response): Promise<void> {

        try {

            const shoppingItem = await shoppingItemService.create(req.body);

            res.status(201).json(shoppingItem);

        } catch (error: any) {

            res.status(400).json({

                message: "Error creating shopping item.",

                error: error.message

            });

        }

    },

    async updateShoppingItem(req: Request, res: Response): Promise<void> {

        try {

            const shoppingItem = await shoppingItemService.update(

                req.params.id,

                req.body

            );

            if (!shoppingItem) {

                return void res.status(404).json({

                    message: "Shopping item not found."

                });

            }

            res.status(200).json(shoppingItem);

        } catch (error: any) {

            res.status(400).json({

                message: "Error updating shopping item.",

                error: error.message

            });

        }

    },

    async deleteShoppingItem(req: Request, res: Response): Promise<void> {

        try {

            const deleted = await shoppingItemService.delete(

                req.params.id

            );

            if (!deleted) {

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