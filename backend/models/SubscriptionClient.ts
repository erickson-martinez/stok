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

    pagamento: {
        status: "pendente" | "pago" | "cancelado";
        formas: string[];
        valorOriginal: number;
        valorCobrado: number;
        valorRecebido?: number;
        troco?: number;
        dataPagamento?: Date;
        usuarioPagamento?: string;
    };

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

        pagamento: {
            status: {
                type: String,
                enum: ["pendente", "pago", "cancelado"],
                default: "pendente"
            },

            formas: {
                type: [String],
                default: []
            },

            valorOriginal: {
                type: Number,
                default: 0
            },

            valorCobrado: {
                type: Number,
                default: 0
            },

            valorRecebido: {
                type: Number
            },

            troco: {
                type: Number
            },

            dataPagamento: {
                type: Date
            },

            usuarioPagamento: {
                type: String
            }
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
