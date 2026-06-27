// models/ShoppingItem.ts

import mongoose, { Document, Schema } from "mongoose";

export type ProductUnit =
    | "unit"
    | "kg"
    | "package"
    | "box"
    | "liter";

export interface IShoppingItem extends Document {

    shoppingListId: mongoose.Types.ObjectId;

    productId: mongoose.Types.ObjectId;

    quantity: number;

    unit: ProductUnit;

    notes?: string;

    checked: boolean;

    createdAt?: Date;

    updatedAt?: Date;
}

const shoppingItemSchema = new Schema({

    shoppingListId: {
        type: Schema.Types.ObjectId,
        ref: "ShoppingList",
        required: true,
        index: true
    },

    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
    },

    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 0
    },

    unit: {
        type: String,
        enum: [
            "unit",
            "kg",
            "package",
            "box",
            "liter"
        ],
        default: "unit"
    },

    notes: {
        type: String,
        trim: true,
        default: ""
    },

    checked: {
        type: Boolean,
        default: false
    }

},
    {
        timestamps: true
    });

export default mongoose.model<IShoppingItem>(
    "ShoppingItem",
    shoppingItemSchema
);