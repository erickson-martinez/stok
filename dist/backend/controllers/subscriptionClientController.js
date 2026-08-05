"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SubscriptionClient_1 = __importDefault(require("../models/SubscriptionClient"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const User_1 = __importDefault(require("../models/User"));
const createSubscriptionClient = async (req, res) => {
    try {
        const { nome, telefone, email, planoId, observacao, pagamento, linkId } = req.body;
        if (!nome ||
            !telefone ||
            !email ||
            !planoId ||
            !linkId) {
            res.status(400).json({
                error: "nome, telefone, email, planoId e linkId são obrigatórios"
            });
            return;
        }
        const pagamentoStatus = pagamento?.status ?? "pendente";
        if (!["pendente", "pago", "cancelado"].includes(pagamentoStatus)) {
            res.status(400).json({
                error: "Status de pagamento invÃ¡lido"
            });
            return;
        }
        const plano = await SubscriptionPlan_1.default.findById(planoId);
        if (!plano) {
            res.status(404).json({
                error: "Plano não encontrado"
            });
            return;
        }
        const assinaturaExistente = await SubscriptionClient_1.default.findOne({
            telefone,
            ativo: true,
            linkId
        });
        if (assinaturaExistente) {
            res.status(409).json({
                error: "Este cliente já possui uma assinatura ativa."
            });
            return;
        }
        const ultimo = await SubscriptionClient_1.default
            .findOne({ linkId })
            .sort({ codigo: -1 });
        const codigo = ultimo ? ultimo.codigo + 1 : 1;
        let idEmail = null;
        const usuario = await User_1.default.findOne({
            email: email.toLowerCase()
        });
        if (usuario) {
            idEmail = usuario.idEmail;
        }
        const assinatura = await SubscriptionClient_1.default.create({
            codigo,
            nome,
            telefone,
            email: email.toLowerCase(),
            idEmail,
            planoId,
            ativo: true,
            pagamento: {
                status: pagamentoStatus,
                formas: Array.isArray(pagamento?.formas)
                    ? pagamento.formas
                    : [],
                valorOriginal: plano.valorMensal,
                valorCobrado: typeof pagamento?.valorCobrado === "number"
                    ? pagamento.valorCobrado
                    : plano.valorMensal,
                valorRecebido: typeof pagamento?.valorRecebido === "number"
                    ? pagamento.valorRecebido
                    : undefined,
                troco: typeof pagamento?.troco === "number"
                    ? pagamento.troco
                    : undefined,
                dataPagamento: pagamento?.status === "pago"
                    ? new Date()
                    : undefined,
                usuarioPagamento: pagamento?.usuarioPagamento
            },
            observacao,
            dataInicio: new Date(),
            linkId
        });
        res.status(201).json(assinatura);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao criar assinatura",
            details: error.message
        });
    }
};
const getSubscriptionClients = async (req, res) => {
    try {
        const { linkId } = req.query;
        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório"
            });
            return;
        }
        const clientes = await SubscriptionClient_1.default
            .find({ linkId })
            .sort({ codigo: 1 });
        res.json(clientes);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar assinantes",
            details: error.message
        });
    }
};
const getSubscriptionClientById = async (req, res) => {
    try {
        const cliente = await SubscriptionClient_1.default.findById(req.params.id);
        if (!cliente) {
            res.status(404).json({
                error: "Assinante não encontrado"
            });
            return;
        }
        res.json(cliente);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar assinante",
            details: error.message
        });
    }
};
const updateSubscriptionClient = async (req, res) => {
    try {
        const cliente = await SubscriptionClient_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        if (!cliente) {
            res.status(404).json({
                error: "Assinante não encontrado"
            });
            return;
        }
        res.json({
            message: "Assinante atualizado com sucesso",
            cliente
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar assinante",
            details: error.message
        });
    }
};
const cancelSubscription = async (req, res) => {
    try {
        const assinaturaAtual = await SubscriptionClient_1.default.findById(req.params.id);
        if (!assinaturaAtual) {
            res.status(404).json({
                error: "Assinante nÃ£o encontrado"
            });
            return;
        }
        const updateData = {
            ativo: false,
            dataFim: new Date()
        };
        if (assinaturaAtual.pagamento?.status === "pendente") {
            updateData["pagamento.status"] = "cancelado";
        }
        const cliente = await SubscriptionClient_1.default.findByIdAndUpdate(req.params.id, updateData, {
            new: true
        });
        if (!cliente) {
            res.status(404).json({
                error: "Assinante não encontrado"
            });
            return;
        }
        res.json({
            message: "Assinatura cancelada com sucesso",
            cliente
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao cancelar assinatura",
            details: error.message
        });
    }
};
const deleteSubscriptionClient = async (req, res) => {
    try {
        const cliente = await SubscriptionClient_1.default.findByIdAndDelete(req.params.id);
        if (!cliente) {
            res.status(404).json({
                error: "Assinante não encontrado"
            });
            return;
        }
        res.json({
            message: "Assinante removido com sucesso"
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao remover assinante",
            details: error.message
        });
    }
};
exports.default = {
    createSubscriptionClient,
    getSubscriptionClients,
    getSubscriptionClientById,
    updateSubscriptionClient,
    cancelSubscription,
    deleteSubscriptionClient
};
//# sourceMappingURL=subscriptionClientController.js.map