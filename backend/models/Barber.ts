import mongoose, { Schema, Document } from "mongoose";

export interface IBarber extends Document {
    nome: string;
    idEmail: string;
    comissao: number;
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
    idEmail: {
        type: String,
        required: true,
    },
    comissao: {
        type: Number,
        default: 0,
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