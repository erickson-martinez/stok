// models/Product.ts

import mongoose, { Document, Schema } from "mongoose";

export type ProductUnit =
    | "unit"
    | "kg"
    | "package"
    | "box"
    | "liter";

export interface IProduct extends Document {

    name: string;

    brand?: string;

    category?: string;

    barcode?: string;

    packageQuantity?: number;

    unit: ProductUnit;

    status: "active" | "inactive";

    createdAt?: Date;

    updatedAt?: Date;
}

const productSchema = new Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    brand: {
        type: String,
        trim: true
    },

    category: {
        type: String,
        trim: true
    },

    barcode: {
        type: String,
        trim: true
    },

    packageQuantity: {
        type: Number,
        default: null
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

    status: {
        type: String,
        enum: [
            "active",
            "inactive"
        ],
        default: "active"
    }

},
    {
        timestamps: true
    });

export default mongoose.model<IProduct>(
    "Product",
    productSchema
);