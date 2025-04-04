import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct {
    name: string;
    type: 'quilo' | 'unidade' | 'pacote' | 'caixa' | 'litro';
    quantity: number;
    packQuantity?: number | null;
    value: number;
    total: number;
    _id?: string;
}

export interface IShoppingList extends Document {
    name: string;
    marketId?: mongoose.Types.ObjectId | null;
    phone: string;
    products: IProduct[];
    completed: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const productSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['quilo', 'unidade', 'pacote', 'caixa', 'litro'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    packQuantity: {
        type: Number,
        default: null,
        min: 1
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    }
});

const shoppingListSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    marketId: {
        type: Schema.Types.ObjectId,
        ref: 'Market',
        default: null
    },
    phone: {
        type: String,
        required: true,
        index: true
    },
    products: [productSchema],
    completed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model<IShoppingList>('ShoppingList', shoppingListSchema);