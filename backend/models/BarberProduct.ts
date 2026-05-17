import mongoose, { Schema, Document } from "mongoose";

export interface IBarberProduct extends Document {
    nome: string;
    categoria: string;
    custo: number;
    comissao: number;
    margemLucro: number;
    precoVenda: number;
    estoque: number;
    linkId: string;
    createdAt: Date;
    updatedAt: Date;
}

const BarberProductSchema: Schema = new Schema(
    {
        nome: {
            type: String,
            required: true,
        },

        categoria: {
            type: String,
            default: "Geral",
        },

        custo: {
            type: Number,
            required: true,
        },

        comissao: {
            type: Number,
            default: 0,
        },

        margemLucro: {
            type: Number,
            required: true,
        },

        precoVenda: {
            type: Number,
            required: true,
        },

        estoque: {
            type: Number,
            required: true,
            default: 0,
        },

        linkId: {
            type: String,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IBarberProduct>(
    "BarberProduct",
    BarberProductSchema
);