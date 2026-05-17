import { Request, Response } from "express";
import BarberService from "../models/BarberService";

// Criar serviço
const createService = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            nome,
            categoria,
            valor,
            linkId,
        } = req.body;

        if (
            !nome ||
            valor === undefined ||
            !linkId
        ) {
            res.status(400).json({
                error:
                    "nome, valor e linkId são obrigatórios",
            });
            return;
        }

        const service = new BarberService({
            nome,
            categoria,
            valor,
            linkId,
        });

        await service.save();

        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao criar serviço",
            details: (error as Error).message,
        });
    }
};

// Buscar serviços
const getServices = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { linkId } = req.query;

        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });
            return;
        }

        const services = await BarberService.find({
            linkId,
        }).sort({
            createdAt: -1,
        });

        res.json(services);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar serviços",
            details: (error as Error).message,
        });
    }
};

// Buscar serviço por ID
const getServiceById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const service = await BarberService.findById(id);

        if (!service) {
            res.status(404).json({
                error: "Serviço não encontrado",
            });
            return;
        }

        res.json(service);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar serviço",
            details: (error as Error).message,
        });
    }
};

// Atualizar serviço
const updateService = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const updatedService =
            await BarberService.findByIdAndUpdate(
                id,
                req.body,
                {
                    new: true,
                }
            );

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
    } catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar serviço",
            details: (error as Error).message,
        });
    }
};

// Remover serviço
const deleteService = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const deletedService =
            await BarberService.findByIdAndDelete(id);

        if (!deletedService) {
            res.status(404).json({
                error: "Serviço não encontrado",
            });
            return;
        }

        res.json({
            message: "Serviço removido com sucesso",
        });
    } catch (error) {
        res.status(500).json({
            error: "Erro ao remover serviço",
            details: (error as Error).message,
        });
    }
};

export default {
    createService,
    getServices,
    getServiceById,
    updateService,
    deleteService,
};