//backend/models/Expense.ts
import { Schema, model, Document } from 'mongoose';
import { IValue, ITransaction, IExpense } from '../interfaces/expense';
import crypto from 'crypto';

const valueSchema = new Schema<IValue>({
    name: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    _id: { type: Schema.Types.ObjectId, auto: true },
    paid: { type: Boolean, default: false },
    notify: { type: Boolean, default: false },
    uuid: {
        type: String,
        required: true,
        match: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        default: () => crypto.randomUUID() // Gera UUID automaticamente se não fornecido
    }
}, { _id: false });

const transactionSchema = new Schema<ITransaction>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    whenPay: { type: Date, required: true },
    total: { type: Number, required: true },
    paid: { type: Boolean, default: false },
    isDebt: { type: Boolean, default: false },
    idOrigem: { type: String },
    idReceita: { type: String },
    idDespesa: { type: String },
    idDebts: { type: String },
    notify: { type: Boolean, default: false },
    totalPaid: { type: Number, default: 0 },
    values: [valueSchema]
}, { _id: true });

const expenseSchema = new Schema<IExpense>({
    idUser: { type: String, required: true },
    idUserShared: { type: String },
    receitas: [transactionSchema],
    despesas: [transactionSchema],
    createAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'createAt', updatedAt: 'updateAt' }
});

export default model<IExpense>('Expense', expenseSchema);