//models/SubscriptionClient.ts

import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriptionClient extends Document {

    codigo: number;

    nome: string;

    telefone: string;

    email: string;

    idEmail?: string;

    planoId: string;

    ativo: boolean;

    dataInicio: Date;

    dataFim?: Date;

    observacao?: string;

    linkId: string;

    createdAt: Date;

    updatedAt: Date;
}

const SubscriptionClientSchema = new Schema(
    {

        codigo: {
            type: Number,
            required: true,
            unique: true,
            index: true
        },

        nome: {
            type: String,
            required: true,
            trim: true
        },

        telefone: {
            type: String,
            required: true,
            index: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        idEmail: {
            type: String,
            default: null,
            index: true
        },

        planoId: {
            type: String,
            required: true,
            index: true
        },

        ativo: {
            type: Boolean,
            default: true
        },

        dataInicio: {
            type: Date,
            default: Date.now
        },

        dataFim: {
            type: Date,
            default: null
        },

        observacao: {
            type: String,
            default: ""
        },

        linkId: {
            type: String,
            required: true,
            index: true
        }

    },
    {
        timestamps: true
    }
);

export default mongoose.model<ISubscriptionClient>(
    "SubscriptionClient",
    SubscriptionClientSchema
);