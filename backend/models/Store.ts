import mongoose, { Document, Schema } from 'mongoose';

export interface IStore extends Document {
    name: string;
    organization?: string;
    type: StoreType;

    cnpj?: string;

    address?: string;
    number?: string;
    district?: string;
    city?: string;
    state?: string;
    zip?: string;

    latitude?: number | null;
    longitude?: number | null;

    phone?: string;
    website?: string;

    status: 'active' | 'inactive';

    createdBy?: string;

    createdAt?: Date;
    updatedAt?: Date;
}

export type StoreType =
    | 'supermarket'
    | 'wholesale'
    | 'bakery'
    | 'butcher'
    | 'pharmacy'
    | 'petshop'
    | 'convenience'
    | 'hardware'
    | 'restaurant'
    | 'other';

const storeSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        organization: {
            type: String,
            trim: true
        },

        type: {
            type: String,
            enum: [
                'supermarket',
                'wholesale',
                'bakery',
                'butcher',
                'pharmacy',
                'petshop',
                'convenience',
                'hardware',
                'restaurant',
                'other'
            ],
            default: 'supermarket'
        },

        cnpj: {
            type: String,
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

        district: {
            type: String,
            trim: true
        },

        city: {
            type: String,
            trim: true
        },

        state: {
            type: String,
            trim: true,
            uppercase: true
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

        phone: {
            type: String,
            trim: true
        },

        website: {
            type: String,
            trim: true
        },

        createdBy: {
            type: String
        },

        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    {
        timestamps: true
    }
);

storeSchema.index({
    name: 1,
    city: 1,
    state: 1
});

export default mongoose.model<IStore>('Store', storeSchema);