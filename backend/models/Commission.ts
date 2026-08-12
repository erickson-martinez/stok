import mongoose, { Schema, Document } from "mongoose";

export interface ICommission extends Document {
    email: string;
    valorComissao: number;
    data: string;
    status: "pendente" | "pago" | "cancelado";
    linkId: string;
    barbeiroNome: string;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CommissionSchema: Schema = new Schema({
    email: {
        type: String,
        required: true,
    },
    valorComissao: {
        type: Number,
        required: true,
    },
    data: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pendente", "pago", "cancelado"],
        default: "pendente",
    },
    linkId: {
        type: String,
        required: true,
        index: true,
    },
    barbeiroNome: {
        type: String,
        required: true,
    },
    paidAt: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model<ICommission>("Commission", CommissionSchema);
