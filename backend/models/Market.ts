import mongoose, { Document, Schema } from 'mongoose';

export interface IMarket extends Document {
    name: string;
    address?: string;
    number?: string;
    zip?: string;
    latitude?: number | null;
    longitude?: number | null;
    status: 'active' | 'inactive';
    createdAt?: Date;
    updatedAt?: Date;
}

const marketSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    number: {
        type: String,
        trim: true
    },
    zip: {
        type: String,
        trim: true
    },
    latitude: {
        type: Number,
        default: null
    },
    longitude: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

export default mongoose.model<IMarket>('Market', marketSchema);