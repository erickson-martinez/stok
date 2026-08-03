"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const transactionSchema = new mongoose_1.Schema({
    idEmail: {
        type: String,
        required: true,
        index: true,
    },
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
        ],
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
        ],
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
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    },
});
transactionSchema.index({
    idEmail: 1,
    date: -1,
});
transactionSchema.index({
    idEmail: 1,
    status: 1,
});
transactionSchema.index({
    sharedEmail: 1,
});
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
transactionSchema.index({
    status: 1,
});
transactionSchema.index({
    'paymentRequest.requested': 1,
    'paymentRequest.approved': 1,
});
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
    }
    else if (this.paidAmount > 0) {
        this.status = 'parcial';
    }
    next();
});
exports.default = (0, mongoose_1.model)('Transaction', transactionSchema);
//# sourceMappingURL=Transaction.js.map