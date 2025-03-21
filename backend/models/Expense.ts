import { Schema, model, Document } from 'mongoose';

interface IAppellant {
    initial?: Date;
    finily?: Date;
}

interface ITransaction {
    _id: any;
    name: string;
    value: number;
    date: Date;
    appellant?: IAppellant;
}

interface IExpense extends Document {
    phone: string;
    phoneShared?: string;
    receita: ITransaction[];
    despesa: ITransaction[];
    createAt: Date;
    updateAt: Date;
}

const appellantSchema = new Schema<IAppellant>({
    initial: { type: Date },
    finily: { type: Date }
});

const transactionSchema = new Schema<ITransaction>({
    name: { type: String, required: true },
    value: { type: Number, required: true },
    date: { type: Date, required: true },
    appellant: appellantSchema
});

const expenseSchema = new Schema<IExpense>({
    phone: {
        type: String,
        required: true,
        unique: true
    },
    phoneShared: {
        type: String
    },
    receita: [transactionSchema],
    despesa: [transactionSchema],
    createAt: {
        type: Date,
        default: Date.now
    },
    updateAt: {
        type: Date,
        default: Date.now
    }
});

export default model<IExpense>('Expense', expenseSchema);