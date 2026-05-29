import mongoose, { Schema, Document } from "mongoose";

export interface ICost extends Document {
    linkId: string;
    nome: string;
    valor: number;
    tipo: "fixo" | "variavel";
    createdAt: Date;
    updatedAt: Date;
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