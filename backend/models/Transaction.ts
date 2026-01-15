import { Schema, model, Document } from 'mongoose';
import { ITransaction, TransactionType, TransactionStatus } from '../interfaces/transaction';

const transactionSchema = new Schema<ITransaction & Document>(
    {
        ownerPhone: { type: String, required: true, index: true },
        type: {
            type: String,
            enum: ['revenue', 'expense'] as TransactionType[],
            required: true
        },
        name: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
        date: { type: Date, required: true },
        isControlled: { type: Boolean, default: false },
        controlId: {
            type: String,
            sparse: true,
            index: true
        },
        counterpartyPhone: {
            type: String,
            sparse: true
        },
        status: {
            type: String,
            enum: ['pago', 'nao_pago', 'parcial', 'cancelado'] as TransactionStatus[],
            default: 'nao_pago'
        },
        paidAmount: { type: Number, default: 0, min: 0 },
        notes: { type: String, trim: true },

        sharerPhone: { type: String, sparse: true },
        aggregate: { type: Boolean, default: false },

    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }
);

// Índices úteis
transactionSchema.index({ ownerPhone: 1, date: -1 });
transactionSchema.index({ sharerPhone: 1, aggregate: 1 });

export default model<ITransaction & Document>('Transaction', transactionSchema);