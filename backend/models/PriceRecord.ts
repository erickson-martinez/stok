// models/PriceRecord.ts

import mongoose, { Document, Schema } from "mongoose";

export interface IPriceRecord extends Document {

    productId: mongoose.Types.ObjectId;

    storeId: mongoose.Types.ObjectId;

    price: number;

    promotion: boolean;

    observedAt: Date;

    createdBy: string;

    confidence: number;

    createdAt?: Date;

    updatedAt?: Date;
}

const priceRecordSchema = new Schema({

    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
    },

    storeId: {
        type: Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    promotion: {
        type: Boolean,
        default: false
    },

    observedAt: {
        type: Date,
        default: Date.now
    },

    createdBy: {
        type: String,
        required: true
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
    });

export default mongoose.model<IPriceRecord>(
    "PriceRecord",
    priceRecordSchema
);