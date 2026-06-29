// services/priceRecordService.ts

import PriceRecord from "../models/PriceRecord";
import ShoppingList from "../models/ShoppingList";
import { IShoppingItem } from "../models/ShoppingItem";

class PriceRecordService {

    async upsert(shoppingItem: IShoppingItem): Promise<void> {

        if (!shoppingItem.price || shoppingItem.price <= 0) {
            return;
        }

        const shoppingList = await ShoppingList.findById(
            shoppingItem.shoppingListId
        );

        if (!shoppingList) {
            return;
        }

        const storeId =
            shoppingList.metadata?.storeId ?? null;

        const filter = {
            name: shoppingItem.name,
            brand: shoppingItem.brand,
            barcode: shoppingItem.barcode,
            packageQuantity: shoppingItem.packageQuantity,
            unit: shoppingItem.unit,
            storeId
        };

        await PriceRecord.findOneAndUpdate(
            filter,
            {
                $set: {
                    name: shoppingItem.name,
                    brand: shoppingItem.brand,
                    barcode: shoppingItem.barcode,
                    category: shoppingItem.category,
                    unit: shoppingItem.unit,
                    packageQuantity: shoppingItem.packageQuantity,
                    price: shoppingItem.price,
                    storeId,
                    observedAt: new Date(),
                    createdBy: shoppingList.userId,
                    source: "user",
                    confidence: 100
                }
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );
    }
}

export default new PriceRecordService();