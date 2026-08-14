import mongoose, { Schema, Document } from "mongoose";

export interface IBarber extends Document {
    nome: string;
    email: string;
    idEmail: string;
    comissao: number;
    comissaoAssinatura?: number;
    valorBaseComissaoAssinatura?: number;
    aceitarContrato?: boolean;
    corte: number;
    diasTrabalhados: string[];
    linkId: string;
    createdAt: Date;
}

const BarberSchema: Schema = new Schema({
    nome: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    idEmail: {
        type: String,
        required: true,
    },
    comissao: {
        type: Number,
        default: 0,
    },
    comissaoAssinatura: {
        type: Number,
        default: 0,
    },
    valorBaseComissaoAssinatura: {
        type: Number,
        default: 0,
    },
    aceitarContrato: {
        type: Boolean,
        default: false,
    },
    corte: {
        type: Number,
        default: 0,
    },
    diasTrabalhados: [{
        type: String,
    }],
    linkId: {
        type: String,
        required: true,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model<IBarber>("Barber", BarberSchema);