// services/shoppingItemService.ts

import ShoppingItem, { IShoppingItem } from "../models/ShoppingItem";
import priceRecordService from "./priceRecordService";

class ShoppingItemService {

    async create(data: Partial<IShoppingItem>): Promise<IShoppingItem> {

        const shoppingItem = await ShoppingItem.create(data);

        await priceRecordService.upsert(shoppingItem);

        return shoppingItem;

    }

    async update(

        id: string,

        data: Partial<IShoppingItem>

    ): Promise<IShoppingItem | null> {

        const shoppingItem = await ShoppingItem.findByIdAndUpdate(

            id,

            {

                $set: data

            },

            {

                new: true,

                runValidators: true

            }

        );

        if (!shoppingItem) {

            return null;

        }

        await priceRecordService.upsert(shoppingItem);

        return shoppingItem;

    }

    async delete(id: string): Promise<boolean> {

        const shoppingItem = await ShoppingItem.findByIdAndDelete(id);

        return !!shoppingItem;

    }

    async get(filter: any): Promise<IShoppingItem[]> {

        return ShoppingItem.find(filter)

            .populate("shoppingListId", "name")

            .populate("storeId", "organization name")

            .sort({

                createdAt: 1

            });

    }

}

export default new ShoppingItemService();