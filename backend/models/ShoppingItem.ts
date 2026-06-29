// models/ShoppingItem.ts

import mongoose, { Document, Schema } from "mongoose";

export type ProductUnit =
    | "unidade"
    | "pacote"
    | "quilo"
    | "grama"
    | "caixa"
    | "litro"
    | "metro";

export interface IShoppingItem extends Document {

    shoppingListId: mongoose.Types.ObjectId;
    name: string;
    brand?: string;
    barcode?: string;
    category?: string;
    unit: ProductUnit;
    packageQuantity?: number | null;
    quantity: number;
    price?: number | null;
    checked: boolean;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const shoppingItemSchema = new Schema(

    {
        shoppingListId: {
            type: Schema.Types.ObjectId,
            ref: "ShoppingList",
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        brand: {
            type: String,
            trim: true,
            default: ""
        },
        barcode: {
            type: String,
            trim: true,
            default: ""
        },
        category: {
            type: String,
            trim: true,
            default: ""
        },
        unit: {
            type: String,
            enum: [
                "unidade",
                "pacote",
                "quilo",
                "grama",
                "caixa",
                "litro",
                "metro"
            ],
            default: "unidade"
        },
        packageQuantity: {
            type: Number,
            default: null,
            min: 0
        },
        quantity: {
            type: Number,
            required: false,
            default: 1,
            min: 1
        },
        price: {
            type: Number,
            default: null,
            min: 0
        },
        checked: {
            type: Boolean,
            default: false
        },
        notes: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }

);

// Índices para pesquisa
shoppingItemSchema.index({
    shoppingListId: 1,
    checked: 1
});

shoppingItemSchema.index({
    name: "text",
    brand: "text"
});

shoppingItemSchema.index({
    barcode: 1
});

export default mongoose.model<IShoppingItem>(
    "ShoppingItem",
    shoppingItemSchema
);