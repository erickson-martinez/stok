import { Request, Response } from "express";
import Cost from "../models/Cost";

// Criar custo
const createCost = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            linkId,
            nome,
            valor,
            tipo,
        } = req.body;

        if (
            !linkId ||
            !nome ||
            valor === undefined ||
            !tipo
        ) {
            res.status(400).json({
                error:
                    "linkId, nome, valor e tipo são obrigatórios",
            });

            return;
        }

        const cost = new Cost({
            linkId,
            nome,
            valor,
            tipo,
        });

        await cost.save();

        res.status(201).json(cost);

    } catch (error) {
        res.status(500).json({
            error: "Erro ao criar custo",
            details: (error as Error).message,
        });
    }
};

// Buscar todos custos da empresa
const getCosts = async (
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

        const costs = await Cost.find({
            linkId,
        }).sort({
            createdAt: -1,
        });

        res.json(costs);

    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar custos",
            details: (error as Error).message,
        });
    }
};

// Buscar custo por id
const getCostById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const cost = await Cost.findById(id);

        if (!cost) {
            res.status(404).json({
                error: "Custo não encontrado",
            });

            return;
        }

        res.json(cost);

    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar custo",
            details: (error as Error).message,
        });
    }
};

// Atualizar custo
const updateCost = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const updatedCost =
            await Cost.findByIdAndUpdate(
                id,
                req.body,
                {
                    new: true,
                }
            );

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

    } catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar custo",
            details: (error as Error).message,
        });
    }
};

// Excluir custo
const deleteCost = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const deletedCost =
            await Cost.findByIdAndDelete(id);

        if (!deletedCost) {
            res.status(404).json({
                error: "Custo não encontrado",
            });

            return;
        }

        res.json({
            message: "Custo removido com sucesso",
        });

    } catch (error) {
        res.status(500).json({
            error: "Erro ao remover custo",
            details: (error as Error).message,
        });
    }
};

export default {
    createCost,
    getCosts,
    getCostById,
    updateCost,
    deleteCost,
};