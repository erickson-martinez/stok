"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BarberService_1 = __importDefault(require("../models/BarberService"));
const createService = async (req, res) => {
    try {
        const { nome, categoria, valor, linkId, } = req.body;
        if (!nome ||
            valor === undefined ||
            !linkId) {
            res.status(400).json({
                error: "nome, valor e linkId são obrigatórios",
            });
            return;
        }
        const service = new BarberService_1.default({
            nome,
            categoria,
            valor,
            linkId,
        });
        await service.save();
        res.status(201).json(service);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao criar serviço",
            details: error.message,
        });
    }
};
const getServices = async (req, res) => {
    try {
        const { linkId } = req.query;
        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });
            return;
        }
        const services = await BarberService_1.default.find({
            linkId,
        }).sort({
            createdAt: -1,
        });
        res.json(services);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar serviços",
            details: error.message,
        });
    }
};
const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await BarberService_1.default.findById(id);
        if (!service) {
            res.status(404).json({
                error: "Serviço não encontrado",
            });
            return;
        }
        res.json(service);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar serviço",
            details: error.message,
        });
    }
};
const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedService = await BarberService_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        if (!updatedService) {
            res.status(404).json({
                error: "Serviço não encontrado",
            });
            return;
        }
        res.json({
            message: "Serviço atualizado com sucesso",
            service: updatedService,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar serviço",
            details: error.message,
        });
    }
};
const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedService = await BarberService_1.default.findByIdAndDelete(id);
        if (!deletedService) {
            res.status(404).json({
                error: "Serviço não encontrado",
            });
            return;
        }
        res.json({
            message: "Serviço removido com sucesso",
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao remover serviço",
            details: error.message,
        });
    }
};
exports.default = {
    createService,
    getServices,
    getServiceById,
    updateService,
    deleteService,
};
//# sourceMappingURL=barberServiceController.js.map