"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const createPlan = async (req, res) => {
    try {
        const { nome, descricao, valorMensal, servicosIds, limiteMensal, linkId } = req.body;
        if (!nome ||
            valorMensal === undefined ||
            !servicosIds ||
            !servicosIds.length ||
            !linkId) {
            res.status(400).json({
                error: "nome, valorMensal, servicosIds e linkId são obrigatórios"
            });
            return;
        }
        const ultimo = await SubscriptionPlan_1.default
            .findOne({ linkId })
            .sort({ codigo: -1 });
        const codigo = ultimo ? ultimo.codigo + 1 : 1;
        const plano = await SubscriptionPlan_1.default.create({
            codigo,
            nome,
            descricao,
            valorMensal,
            servicosIds,
            limiteMensal,
            linkId
        });
        res.status(201).json(plano);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao criar plano",
            details: error.message
        });
    }
};
const getPlans = async (req, res) => {
    try {
        const { linkId } = req.query;
        const planos = await SubscriptionPlan_1.default
            .find({ linkId })
            .sort({ codigo: 1 });
        res.json(planos);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar planos",
            details: error.message
        });
    }
};
const getPlan = async (req, res) => {
    try {
        const plano = await SubscriptionPlan_1.default.findById(req.params.id);
        if (!plano) {
            res.status(404).json({
                error: "Plano não encontrado"
            });
            return;
        }
        res.json(plano);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar plano",
            details: error.message
        });
    }
};
const updatePlan = async (req, res) => {
    try {
        const plano = await SubscriptionPlan_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        if (!plano) {
            res.status(404).json({
                error: "Plano não encontrado"
            });
            return;
        }
        res.json(plano);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar plano",
            details: error.message
        });
    }
};
const deletePlan = async (req, res) => {
    try {
        await SubscriptionPlan_1.default.findByIdAndDelete(req.params.id);
        res.json({
            message: "Plano removido com sucesso"
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao remover plano",
            details: error.message
        });
    }
};
exports.default = {
    createPlan,
    getPlans,
    getPlan,
    updatePlan,
    deletePlan
};
//# sourceMappingURL=subscriptionPlanController.js.map