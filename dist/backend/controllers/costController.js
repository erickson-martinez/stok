"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Cost_1 = __importDefault(require("../models/Cost"));
const createCost = async (req, res) => {
    try {
        const { linkId, nome, valor, tipo, } = req.body;
        if (!linkId ||
            !nome ||
            valor === undefined ||
            !tipo) {
            res.status(400).json({
                error: "linkId, nome, valor e tipo são obrigatórios",
            });
            return;
        }
        const cost = new Cost_1.default({
            linkId,
            nome,
            valor,
            tipo,
        });
        await cost.save();
        res.status(201).json(cost);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao criar custo",
            details: error.message,
        });
    }
};
const getCosts = async (req, res) => {
    try {
        const { linkId } = req.query;
        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });
            return;
        }
        const costs = await Cost_1.default.find({
            linkId,
        }).sort({
            createdAt: -1,
        });
        res.json(costs);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar custos",
            details: error.message,
        });
    }
};
const getCostById = async (req, res) => {
    try {
        const { id } = req.params;
        const cost = await Cost_1.default.findById(id);
        if (!cost) {
            res.status(404).json({
                error: "Custo não encontrado",
            });
            return;
        }
        res.json(cost);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar custo",
            details: error.message,
        });
    }
};
const updateCost = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCost = await Cost_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        if (!updatedCost) {
            res.status(404).json({
                error: "Custo não encontrado",
            });
            return;
        }
        res.json({
            message: "Custo atualizado com sucesso",
            cost: updatedCost,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar custo",
            details: error.message,
        });
    }
};
const deleteCost = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCost = await Cost_1.default.findByIdAndDelete(id);
        if (!deletedCost) {
            res.status(404).json({
                error: "Custo não encontrado",
            });
            return;
        }
        res.json({
            message: "Custo removido com sucesso",
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao remover custo",
            details: error.message,
        });
    }
};
exports.default = {
    createCost,
    getCosts,
    getCostById,
    updateCost,
    deleteCost,
};
//# sourceMappingURL=costController.js.map