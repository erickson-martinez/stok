// services/priceRecordService.ts

import PriceRecord from "../models/PriceRecord";
import ShoppingList from "../models/ShoppingList";
import { IShoppingItem } from "../models/ShoppingItem";

class PriceRecordService {

    /**
     * Normaliza o texto para pesquisa.
     * Exemplo:
     * Café -> cafe
     * Açúcar -> acucar
     */
    private normalize(value: string): string {

        return value

            .normalize("NFD")

            .replace(/[\u0300-\u036f]/g, "")

            .toLowerCase()

            .trim();

    }

    /**
     * Cria ou atualiza um PriceRecord.
     * É chamado automaticamente pelo ShoppingItemService.
     */
    async upsert(shoppingItem: IShoppingItem): Promise<void> {

        // Não compartilha itens sem preço
        if (
            shoppingItem.price === null ||
            shoppingItem.price === undefined ||
            shoppingItem.price <= 0
        ) {
            return;
        }

        // Descobre a lista
        const shoppingList = await ShoppingList.findById(
            shoppingItem.shoppingListId
        );

        if (!shoppingList) {
            return;
        }

        // Descobre a loja da lista
        const storeId =
            shoppingList.metadata?.storeId ?? null;

        // Nome utilizado para pesquisa
        const nameSearch = this.normalize(
            shoppingItem.name
        );

        // Produto único dentro da loja
        const filter = {

            nameSearch,

            brand: shoppingItem.brand ?? "",

            barcode: shoppingItem.barcode ?? "",

            packageQuantity:
                shoppingItem.packageQuantity ?? null,

            unit: shoppingItem.unit,

            storeId

        };

        await PriceRecord.findOneAndUpdate(

            filter,

            {

                $set: {

                    name: shoppingItem.name,

                    nameSearch,

                    brand:
                        shoppingItem.brand ?? "",

                    barcode:
                        shoppingItem.barcode ?? "",

                    category:
                        shoppingItem.category ?? "",

                    packageQuantity:
                        shoppingItem.packageQuantity ?? null,

                    unit:
                        shoppingItem.unit,

                    price:
                        shoppingItem.price,

                    storeId,

                    observedAt:
                        new Date(),

                    createdBy:
                        shoppingList.userId,

                    source:
                        "user",

                    confidence:
                        100

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