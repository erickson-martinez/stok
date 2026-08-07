//models/SubscriptionPlan.ts

import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriptionPlan extends Document {
    codigo: number;

    nome: string;

    descricao?: string;

    valorMensal: number;

    servicosIds: string[];

    limiteMensal?: number | null;

    ativo: boolean;

    linkId: string;

    createdAt: Date;

    updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema(
    {
        codigo: {
            type: Number,
            required: true
        },

        nome: {
            type: String,
            required: true,
            trim: true
        },

        descricao: {
            type: String,
            default: ""
        },

        valorMensal: {
            type: Number,
            required: true,
            min: 0
        },

        servicosIds: [
            {
                type: String,
                required: true
            }
        ],

        limiteMensal: {
            type: Number,
            default: null
        },

        ativo: {
            type: Boolean,
            default: true
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

SubscriptionPlanSchema.index(
    { linkId: 1, codigo: 1 },
    { unique: true }
);

export default mongoose.model<ISubscriptionPlan>(
    "SubscriptionPlan",
    SubscriptionPlanSchema
);