//models/PriceRecord.ts

import mongoose, { Document, Schema } from "mongoose";

export interface IPriceRecord extends Document {

    name: string;

    brand?: string;

    barcode?: string;

    category?: string;

    packageQuantity?: number;

    unit: string;

    price: number;

    storeId?: mongoose.Types.ObjectId | null;

    createdBy: string;

    observedAt: Date;

    source:

    | "user"

    | "store_api"

    | "government"

    | "ocr"

    | "import";

    confidence: number;

}

const priceRecordSchema = new Schema({

    name: {

        type: String,

        required: true,

        index: true

    },

    brand: String,

    barcode: String,

    category: String,

    packageQuantity: Number,

    unit: String,

    price: {

        type: Number,

        required: true

    },

    storeId: {

        type: Schema.Types.ObjectId,

        ref: "Store",

        default: null

    },

    createdBy: {

        type: String,

        required: true

    },

    observedAt: {

        type: Date,

        default: Date.now

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

        default: 100

    }

},
    {
        timestamps: true
    });

priceRecordSchema.index({

    name: 1,

    brand: 1,

    barcode: 1,

    packageQuantity: 1,

    unit: 1,

    storeId: 1

});

export default mongoose.model<IPriceRecord>(
    "PriceRecord",
    priceRecordSchema
);