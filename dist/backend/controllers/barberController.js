"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Barber_1 = __importDefault(require("../models/Barber"));
const createBarber = async (req, res) => {
    try {
        const { nome, idEmail, comissao, corte, diasTrabalhados, linkId, } = req.body;
        if (!nome || !idEmail || !linkId) {
            res.status(400).json({
                error: "Nome, idEmail e linkId são obrigatórios",
            });
            return;
        }
        const barber = new Barber_1.default({
            nome,
            idEmail,
            comissao,
            corte,
            diasTrabalhados,
            linkId,
        });
        await barber.save();
        res.status(201).json(barber);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao criar barbeiro",
            details: error.message,
        });
    }
};
const getBarbers = async (req, res) => {
    try {
        const { linkId } = req.query;
        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });
            return;
        }
        const barbeiros = await Barber_1.default.find({
            linkId,
        }).sort({ createdAt: -1 });
        res.json(barbeiros);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar barbeiros",
            details: error.message,
        });
    }
};
const getBarberById = async (req, res) => {
    try {
        const { id } = req.params;
        const barber = await Barber_1.default.findById(id);
        if (!barber) {
            res.status(404).json({
                error: "Barbeiro não encontrado",
            });
            return;
        }
        res.json(barber);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar barbeiro",
            details: error.message,
        });
    }
};
const updateBarber = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBarbeiro = await Barber_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        if (!updatedBarbeiro) {
            res.status(404).json({
                error: "Barbeiro não encontrado",
            });
            return;
        }
        res.json({
            message: "Barbeiro atualizado com sucesso",
            barbeiro: updatedBarbeiro,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar barbeiro",
            details: error.message,
        });
    }
};
const deleteBarber = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBarbeiro = await Barber_1.default.findByIdAndDelete(id);
        if (!deletedBarbeiro) {
            res.status(404).json({
                error: "Barbeiro não encontrado",
            });
            return;
        }
        res.json({
            message: "Barbeiro removido com sucesso",
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao remover barbeiro",
            details: error.message,
        });
    }
};
exports.default = {
    createBarber,
    getBarbers,
    getBarberById,
    updateBarber,
    deleteBarber,
};
//# sourceMappingURL=barberController.js.map