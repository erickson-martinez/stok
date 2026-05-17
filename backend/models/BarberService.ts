import mongoose, { Schema, Document } from "mongoose";

export interface IBarberService extends Document {
    nome: string;

    categoria: string;

    valor: number;

    linkId: string;

    createdAt: Date;
}

const BarberServiceSchema: Schema = new Schema({
    nome: {
        type: String,
        required: true,
    },

    categoria: {
        type: String,
        default: "cabelo",
    },

    valor: {
        type: Number,
        required: true,
    },

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

export default mongoose.model<IBarberService>(
    "BarberService",
    BarberServiceSchema
);