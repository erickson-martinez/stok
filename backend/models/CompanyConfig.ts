import mongoose, { Schema, Document } from "mongoose";

export interface ICompanyConfig extends Document {
    linkId: string;

    taxas: {
        pix: number;
        dinheiro: number;
        credito: number;
        debito: number;
    };

    metaLucro: number;

    imposto: number;

    createdAt: Date;

    updatedAt: Date;
}

const CompanyConfigSchema: Schema = new Schema(
    {
        linkId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        taxas: {
            pix: {
                type: Number,
                default: 0,
            },

            dinheiro: {
                type: Number,
                default: 0,
            },

            credito: {
                type: Number,
                default: 0,
            },

            debito: {
                type: Number,
                default: 0,
            },
        },

        metaLucro: {
            type: Number,
            default: 0,
        },

        imposto: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ICompanyConfig>(
    "CompanyConfig",
    CompanyConfigSchema
);