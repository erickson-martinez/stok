// models/ShoppingList.ts

import mongoose, { Document, Schema } from "mongoose";

export type ShoppingListStatus =
    | "active"
    | "completed"
    | "archived";

export interface IShoppingList extends Document {

    userId: string;

    name: string;

    description?: string;

    favorite: boolean;

    sharedWith: string[];

    status: ShoppingListStatus;

    createdAt?: Date;

    updatedAt?: Date;
}

const shoppingListSchema = new Schema({

    userId: {
        type: String,
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true,
        default: ""
    },

    favorite: {
        type: Boolean,
        default: false
    },

    sharedWith: [{
        type: String
    }],

    status: {
        type: String,
        enum: [
            "active",
            "completed",
            "archived"
        ],
        default: "active"
    }

},
    {
        timestamps: true
    });

export default mongoose.model<IShoppingList>(
    "ShoppingList",
    shoppingListSchema
);