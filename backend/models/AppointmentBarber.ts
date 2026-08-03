//model/AppointmentBarber.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IAppointmentItem {
    id: string;
    tipo: "servico" | "produto";
    nome: string;
    categoria?: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
}

export interface IAppointmentSubscription {
    possui: boolean;
    assinaturaId?: string;
    planoId?: string;
    planoNome?: string;
    valorMensal?: number;
    atendimentoNumero?: number;
    codigoAtendimento?: number;
    valorSimbolico?: number;
}

export interface IAppointmentPayment {
    status: "pendente" | "pago" | "assinatura" | "cancelado";
    formas: string[];
    desconto: number;
    subtotalServicos: number;
    subtotalProdutos: number;
    valorOriginal: number;
    valorCobrado: number;
    dataPagamento?: Date;
    usuarioPagamento?: string;
    valorRecebido?: number;
    troco?: number;
}

export interface IAppointmentBarber extends Document {
    clienteNome: string;
    clienteTelefone: string;

    barbeiroId: string;

    dataAgendada: Date;

    horarios: string[];

    status:
    | "pendente"
    | "atendendo"
    | "finalizado"
    | "cancelado"
    | "pago";

    quantidadePessoas: number;

    nomesAcompanhantes?: string;

    descricaoServicos?: string;

    servicosIds: string[];

    produtosIds: string[];

    items: IAppointmentItem[];

    assinatura?: IAppointmentSubscription;

    pagamento: IAppointmentPayment;

    createdBy?: string;

    updatedBy?: string;

    estoqueMovimentado: boolean;

    linkId: string;

    createdAt: Date;

    updatedAt: Date;
}

const AppointmentItemSchema = new Schema(
    {
        id: {
            type: String,
            required: true,
        },

        tipo: {
            type: String,
            enum: ["servico", "produto"],
            required: true,
        },

        nome: {
            type: String,
            required: true,
        },

        categoria: {
            type: String,
            default: "",
        },

        quantidade: {
            type: Number,
            default: 1,
        },

        valorUnitario: {
            type: Number,
            required: true,
        },

        valorTotal: {
            type: Number,
            required: true,
        },
    },
    {
        _id: false,
    }
);

const AppointmentSubscriptionSchema = new Schema(
    {
        possui: {
            type: Boolean,
            default: false,
        },

        assinaturaId: {
            type: String,
            default: null,
        },

        planoId: {
            type: String,
            default: null,
        },

        planoNome: {
            type: String,
            default: "",
        },

        valorMensal: {
            type: Number,
            default: 0,
        },

        atendimentoNumero: {
            type: Number,
            default: 0,
        },

        codigoAtendimento: {
            type: Number,
            default: 0,
        },

        valorSimbolico: {
            type: Number,
            default: 0,
        },
    },
    {
        _id: false,
    }
);

const AppointmentPaymentSchema = new Schema(
    {
        status: {
            type: String,
            enum: [
                "pendente",
                "pago",
                "assinatura",
                "cancelado",
            ],
            default: "pendente",
        },

        formas: {
            type: [String],
            default: [],
        },

        desconto: {
            type: Number,
            default: 0,
        },

        subtotalServicos: {
            type: Number,
            default: 0,
        },

        subtotalProdutos: {
            type: Number,
            default: 0,
        },

        valorOriginal: {
            type: Number,
            default: 0,
        },

        valorCobrado: {
            type: Number,
            default: 0,
        },

        dataPagamento: {
            type: Date,
        },

        usuarioPagamento: {
            type: String,
        },

        valorRecebido: {
            type: Number,
        },

        troco: {
            type: Number,
        },
    },
    {
        _id: false,
    }
);

const AppointmentBarberSchema = new Schema<IAppointmentBarber>(
    {
        clienteNome: {
            type: String,
            required: true,
            trim: true,
        },

        clienteTelefone: {
            type: String,
            required: true,
            index: true,
        },

        barbeiroId: {
            type: String,
            required: true,
            index: true,
        },

        dataAgendada: {
            type: Date,
            required: true,
            index: true,
        },

        horarios: {
            type: [String],
            required: true,
            validate: [
                (v: string[]) => v.length > 0,
                "Informe ao menos um horário.",
            ],
        },

        status: {
            type: String,
            enum: [
                "pendente",
                "atendendo",
                "finalizado",
                "cancelado",
                "pago",
            ],
            default: "pendente",
            index: true,
        },

        quantidadePessoas: {
            type: Number,
            default: 1,
            min: 1,
        },

        nomesAcompanhantes: {
            type: String,
            default: "",
        },

        descricaoServicos: {
            type: String,
            default: "",
        },

        servicosIds: {
            type: [String],
            default: [],
        },

        produtosIds: {
            type: [String],
            default: [],
        },

        items: {
            type: [AppointmentItemSchema],
            default: [],
        },

        assinatura: {
            type: AppointmentSubscriptionSchema,
            default: () => ({
                possui: false,
            }),
        },

        pagamento: {
            type: AppointmentPaymentSchema,
            default: () => ({
                status: "pendente",
                formas: [],
                desconto: 0,
                subtotalServicos: 0,
                subtotalProdutos: 0,
                valorOriginal: 0,
                valorCobrado: 0,
            }),
        },

        createdBy: {
            type: String,
            default: "",
        },

        updatedBy: {
            type: String,
            default: "",
        },

        estoqueMovimentado: {
            type: Boolean,
            default: false,
            index: true,
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

AppointmentBarberSchema.index({
    linkId: 1,
    dataAgendada: 1,
});

AppointmentBarberSchema.index({
    clienteTelefone: 1,
});

AppointmentBarberSchema.index({
    barbeiroId: 1,
});

AppointmentBarberSchema.index({
    clienteTelefone: 1,
    barbeiroId: 1,
    dataAgendada: 1,
    status: 1,
    linkId: 1,
});

AppointmentBarberSchema.index({
    "assinatura.assinaturaId": 1,
    linkId: 1,
});

export default mongoose.model<IAppointmentBarber>(
    "AppointmentBarber",
    AppointmentBarberSchema
);