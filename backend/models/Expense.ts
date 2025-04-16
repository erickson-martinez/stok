import { Schema, model } from 'mongoose';
import { IValue, ITransaction, IExpense } from '../interfaces/expense';

const valueSchema = new Schema<IValue>({
    name: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    paid: { type: Boolean, default: false },
    notify: { type: Boolean, default: false }
});

const transactionSchema = new Schema<ITransaction>({
    _id: { type: String },
    name: { type: String, required: true },
    whenPay: { type: Date, required: true },
    total: { type: Number, required: true },
    paid: { type: Boolean, required: true },
    isDebt: { type: Boolean, default: false },
    idOrigem: { type: String },
    idDebts: { type: String },
    notify: { type: Boolean, default: false },
    totalPaid: { type: Number, default: 0 },
    values: [valueSchema]
});

const expenseSchema = new Schema<IExpense>({
    idUser: { type: String, required: true, unique: true },
    idUserShared: { type: String },
    receitas: [transactionSchema],
    despesas: [transactionSchema],
    createAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now }
});

export default model<IExpense>('Expense', expenseSchema);