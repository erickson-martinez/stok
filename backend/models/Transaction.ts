// src/models/Transaction.ts

import { Schema, model, Document } from 'mongoose';
import {
    ITransaction,
    TransactionStatus,
    TransactionType,
} from '../interfaces/transaction';

const transactionSchema = new Schema<ITransaction & Document>(
    {
        /**
         * UID Firebase do proprietário
         */
        idEmail: {
            type: String,
            required: true,
            index: true,
        },

        /**
         * Email ou telefone do usuário compartilhado
         */
        sharedEmail: {
            type: String,
            sparse: true,
            index: true,
            lowercase: true,
            trim: true,
        },

        targetEmail: {
            type: String,
            sparse: true,
            index: true,
            lowercase: true,
            trim: true,
        },
        targetPhone: {
            type: String,
            sparse: true,
            index: true,
            trim: true,
        },
        sharedPhone: {
            type: String,
            sparse: true,
            index: true,
            trim: true,
        },

        type: {
            type: String,
            enum: [
                'revenue',
                'expense',
                'investment'
            ] as TransactionType[],
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

        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        date: {
            type: Date,
            required: true,
        },

        /**
         * Compartilhada ou não
         */
        isControlled: {
            type: Boolean,
            default: false,
        },

        status: {
            type: String,
            enum: [
                'pendente',
                'pago',
                'nao_pago',
                'investimento',
                'parcial',
                'cancelado',
            ] as TransactionStatus[],
            default: 'nao_pago',
        },

        notes: {
            type: String,
            trim: true,
        },

        affectsCash: {
            type: Boolean,
            default: true,
        },

        investment: {
            percentage: {
                type: Number,
                min: 0,
            },
            renderDay: {
                type: Number,
                min: 0,
            },
            type: {
                type: String,
                enum: [
                    'CDI',
                    'CDB'
                ],
            },
        },

        aggregate: {
            type: Boolean,
            default: false,
        },

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
                },

                removed: {
                    type: Boolean,
                    default: false,
                },

                removedAt: {
                    type: Date,
                },

                removedReason: {
                    type: String,
                    trim: true,
                },
            },
        ],

        /**
         * Solicitação de pagamento
         */
        paymentRequest: {
            requested: {
                type: Boolean,
                default: false,
            },

            requestedAt: {
                type: Date,
            },

            requestedBy: {
                type: String,
                trim: true,
                lowercase: true,
            },

            message: {
                type: String,
                trim: true,
            },

            approved: {
                type: Boolean,
                default: false,
            },

            approvedAt: {
                type: Date,
            },

            approvedBy: {
                type: String,
            },

            rejected: {
                type: Boolean,
                default: false,
            },

            rejectedAt: {
                type: Date,
            },

            rejectedReason: {
                type: String,
                trim: true,
            },
        },
    },
    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt',
        },
    }
);

/**
 * Índices
 */

// Transações do proprietário
transactionSchema.index({
    idEmail: 1,
    date: -1,
});

// Dashboard
transactionSchema.index({
    idEmail: 1,
    status: 1,
});

// Compartilhadas comigo
transactionSchema.index({
    sharedEmail: 1,
});

// Compartilhadas + agregadas
transactionSchema.index({
    sharedEmail: 1,
    aggregate: 1,
});

transactionSchema.index({
    targetEmail: 1,
    aggregate: 1,
});

transactionSchema.index({
    targetPhone: 1,
    aggregate: 1,
});

// Busca por status
transactionSchema.index({
    status: 1,
});

// Solicitações pendentes
transactionSchema.index({
    'paymentRequest.requested': 1,
    'paymentRequest.approved': 1,
});

/**
 * Garantir consistência do status
 */
transactionSchema.pre('save', function (next) {

    if (this.type === 'investment') {
        this.status = 'investimento';
        this.paidAmount = this.amount;
        return next();
    }

    if (this.paidAmount === undefined) {
        this.paidAmount = 0;
    }

    if (this.paidAmount >= this.amount && this.amount > 0) {
        this.status = 'pago';
        this.paidAmount = this.amount;
    } else if (this.paidAmount > 0) {
        this.status = 'parcial';
    }

    next();
});

export default model<ITransaction & Document>(
    'Transaction',
    transactionSchema
);