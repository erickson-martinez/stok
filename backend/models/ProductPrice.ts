import mongoose, { Document, Schema } from 'mongoose';

export interface IProductPrice extends Document {
    productName: string;
    marketId: mongoose.Types.ObjectId;
    currentPrice: number;
    brand: string;
    type: 'quilo' | 'unidade' | 'pacote' | 'caixa' | 'litro';
    lastUpdated: Date;
    updatedBy: string;
}

const productPriceSchema: Schema = new Schema({
    productName: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    marketId: {
        type: Schema.Types.ObjectId,
        ref: 'Market',
        required: true,
        index: true
    },
    currentPrice: {
        type: Number,
        required: true,
        min: 0
    },
    brand: {
        type: String,
        require: true
    },
    type: {
        type: String,
        enum: ['quilo', 'unidade', 'pacote', 'caixa', 'litro'],
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Índice composto para garantir apenas um registro por produto/mercado
productPriceSchema.index({ productName: 1, marketId: 1 }, { unique: true });

export default mongoose.model<IProductPrice>('ProductPrice', productPriceSchema);