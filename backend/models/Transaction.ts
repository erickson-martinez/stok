// src/models/Transaction.ts
import { Schema, model, Document } from 'mongoose';
import { ITransaction, TransactionType, TransactionStatus } from '../interfaces/transaction';

const transactionSchema = new Schema<ITransaction & Document>(
    {
        ownerPhone: {
            type: String,
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: ['revenue', 'expense'] as TransactionType[],
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        date: {
            type: Date,
            required: true,
        },

        isControlled: {
            type: Boolean,
            default: false,
        },

        controlId: {
            type: String,
            sparse: true,
            index: true,
        },

        counterpartyPhone: {
            type: String,
            sparse: true,
        },

        status: {
            type: String,
            enum: ['pago', 'nao_pago', 'parcial', 'cancelado'] as TransactionStatus[],
            default: 'nao_pago',
        },

        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        notes: {
            type: String,
            trim: true,
        },

        // Histórico de adições/subtrações (para permitir subtração controlada)
        additions: [
            {
                description: {
                    type: String,
                    required: true,
                    trim: true,
                },
                amount: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                addedAt: {
                    type: Date,
                    default: Date.now,
                },
                addedBy: {
                    type: String,
                    sparse: true, // telefone de quem adicionou
                },
                removed: {
                    type: Boolean,
                    default: false,
                },
                removedAt: {
                    type: Date,
                    sparse: true,
                },
                removedReason: {
                    type: String,
                    trim: true,
                    sparse: true,
                },
            },
        ],

        // Campos de compartilhamento
        sharerPhone: {
            type: String,
            sparse: true,
        },

        aggregate: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    }
);

// Índices úteis
transactionSchema.index({ ownerPhone: 1, date: -1 });
transactionSchema.index({ sharerPhone: 1, aggregate: 1 });
transactionSchema.index({ ownerPhone: 1, status: 1 });
transactionSchema.index({ controlId: 1, type: 1 });

// Hook opcional: recalcular amount baseado nas additions ativas (se quiser automação extra)
transactionSchema.pre('save', function (next) {
    if (this.isModified('additions')) {
        const activeAdditions = this.additions?.filter(add => !add.removed) || [];
        const totalAdditions = activeAdditions.reduce((sum, add) => sum + add.amount, 0);
    }
    next();
});

export default model<ITransaction & Document>('Transaction', transactionSchema);