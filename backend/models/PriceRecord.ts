// models/PriceRecord.ts

import mongoose, { Document, Schema } from "mongoose";

export type PriceSource =
    | "user"
    | "store_api"
    | "government"
    | "ocr"
    | "import";

export interface IPriceRecord extends Document {

    name: string;

    nameSearch: string;

    brand?: string;

    barcode?: string;

    category?: string;

    packageQuantity?: number;

    unit: string;

    price: number;

    storeId?: mongoose.Types.ObjectId | null;

    createdBy: string;

    observedAt: Date;

    source: PriceSource;

    confidence: number;

    createdAt?: Date;

    updatedAt?: Date;

}

const priceRecordSchema = new Schema(

    {

        name: {
            type: String,
            required: true,
            trim: true
        },

        nameSearch: {
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

        packageQuantity: {
            type: Number,
            default: null
        },

        unit: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        storeId: {
            type: Schema.Types.ObjectId,
            ref: "Store",
            default: null,
            index: true
        },

        createdBy: {
            type: String,
            required: true,
            index: true
        },

        observedAt: {
            type: Date,
            default: Date.now,
            index: true
        },

        source: {
            type: String,
            enum: [
                "user",
                "store_api",
                "government",
                "ocr",
                "import"
            ],
            default: "user"
        },

        confidence: {
            type: Number,
            default: 100,
            min: 0,
            max: 100
        }

    },

    {
        timestamps: true
    }

);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

// Pesquisa principal
priceRecordSchema.index({
    nameSearch: 1
});

// Busca por código de barras
priceRecordSchema.index({
    barcode: 1
});

// Pesquisa por loja
priceRecordSchema.index({
    storeId: 1
});

// Pesquisa por data
priceRecordSchema.index({
    observedAt: -1
});

// Evita duplicidade do mesmo produto na mesma loja
priceRecordSchema.index({

    nameSearch: 1,

    brand: 1,

    barcode: 1,

    packageQuantity: 1,

    unit: 1,

    storeId: 1

});

/*
|--------------------------------------------------------------------------
| Normalize name before save
|--------------------------------------------------------------------------
*/

priceRecordSchema.pre("validate", function (next) {

    this.nameSearch = this.name

        ?.normalize("NFD")

        .replace(/[\u0300-\u036f]/g, "")

        .toLowerCase()

        .trim();

    next();

});

export default mongoose.model<IPriceRecord>(
    "PriceRecord",
    priceRecordSchema
);