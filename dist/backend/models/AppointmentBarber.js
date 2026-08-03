"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const AppointmentItemSchema = new mongoose_1.Schema({
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
}, {
    _id: false,
});
const AppointmentSubscriptionSchema = new mongoose_1.Schema({
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
}, {
    _id: false,
});
const AppointmentPaymentSchema = new mongoose_1.Schema({
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
}, {
    _id: false,
});
const AppointmentBarberSchema = new mongoose_1.Schema({
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
            (v) => v.length > 0,
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
}, {
    timestamps: true,
});
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
exports.default = mongoose_1.default.model("AppointmentBarber", AppointmentBarberSchema);
//# sourceMappingURL=AppointmentBarber.js.map