import mongoose, { Schema, Document } from "mongoose";

export interface ICost extends Document {
    linkId: string;
    nome: string;
    valor: number;
    status: "pendente" | "pago";
    dateInicial?: Date;
    dateFinal?: Date;
    idTransacao?: idTransacao[];
    tipo: "fixo" | "variavel";
    createdAt: Date;
    updatedAt: Date;
}


interface idTransacao {
    id: string;
    mesAnoReferencia: string;
}

const CostSchema: Schema = new Schema(
    {
        linkId: {
            type: String,
            required: true,
            index: true,
        },

        nome: {
            type: String,
            required: true,
        },

        valor: {
            type: Number,
            required: true,
        },

        status: {
            type: String,
            enum: ["pendente", "pago"],
            default: "pendente",
            required: true,
        },

        dateInicial: {
            type: Date,
            required: false,
        },

        dateFinal: {
            type: Date,
            required: false,
        },

        idTransacao: {
            type: [
                {
                    id: { type: String, required: true },
                    mesAnoReferencia: { type: String, required: true },
                },
            ],
            default: [],
        },

        tipo: {
            type: String,
            enum: ["fixo", "variavel"],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ICost>(
    "Cost",
    CostSchema
);
