// services/priceRecordService.ts

import PriceRecord from "../models/PriceRecord";
import { IShoppingItem } from "../models/ShoppingItem";

class PriceRecordService {

    async upsert(shoppingItem: IShoppingItem): Promise<void> {

        if (!shoppingItem.price || shoppingItem.price <= 0) {
            return;
        }

        const filter = {

            name: shoppingItem.name,

            brand: shoppingItem.brand,

            barcode: shoppingItem.barcode,

            packageQuantity: shoppingItem.packageQuantity,

            unit: shoppingItem.unit,

            storeId: shoppingItem.storeId

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

                    storeId: shoppingItem.storeId,

                    observedAt: new Date(),

                    createdBy: shoppingItem.shoppingListId,

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