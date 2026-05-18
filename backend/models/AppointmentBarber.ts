import mongoose, { Schema, Document } from "mongoose";

export interface IAppointmentBarber extends Document {
    clienteNome: string;

    clienteTelefone: string;

    barbeiroId: string;

    servicosIds: string[];

    produtosIds: string[];

    dataAgendada: Date;

    horarios: string[];

    status:
    | "pendente"
    | "atendendo"
    | "concluido"
    | "cancelado";

    quantidadePessoas: number;

    nomesAcompanhantes?: string;

    valorTotalPrevisto: number;

    linkId: string;

    createdAt: Date;

    updatedAt: Date;
}

const AppointmentBarberSchema: Schema = new Schema(
    {
        clienteNome: {
            type: String,
            required: true,
        },

        clienteTelefone: {
            type: String,
            required: [true, "O telefone é obrigatório"],
        },

        barbeiroId: {
            type: String,
            default: null,
        },

        servicosIds: [
            {
                type: String,
            },
        ],

        produtosIds: [
            {
                type: String,
            },
        ],

        dataAgendada: {
            type: Date,
            required: [true, "A data é obrigatória"],
        },

        horarios: {
            type: [String],

            required: [
                true,
                "Pelo menos um horário é obrigatório",
            ],

            validate: [
                (val: string[]) => val.length > 0,
                "Adicione no mínimo um horário",
            ],
        },

        status: {
            type: String,

            enum: [
                "pendente",
                "atendendo",
                "concluido",
                "cancelado",
            ],

            default: "pendente",
        },

        quantidadePessoas: {
            type: Number,
            default: 1,
        },

        nomesAcompanhantes: {
            type: String,
            default: "",
        },

        valorTotalPrevisto: {
            type: Number,
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

export default mongoose.model<IAppointmentBarber>(
    "AppointmentBarber",
    AppointmentBarberSchema
);