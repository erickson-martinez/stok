import { Request, Response } from "express";
import Barbeiro from "../models/Barber";

// Criar barbeiro
const createBarber = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            nome,
            telefone,
            comissao,
            corte,
            diasTrabalhados,
            linkId,
        } = req.body;

        if (!nome || !telefone || !linkId) {
            res.status(400).json({
                error: "Nome, telefone e linkId são obrigatórios",
            });
            return;
        }

        const barber = new Barbeiro({
            nome,
            telefone,
            comissao,
            corte,
            diasTrabalhados,
            linkId,
        });

        await barber.save();

        res.status(201).json(barber);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao criar barbeiro",
            details: (error as Error).message,
        });
    }
};

// Buscar barbeiros por empresa
const getBarbers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { linkId } = req.query;

        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });
            return;
        }

        const barbeiros = await Barbeiro.find({
            linkId,
        }).sort({ createdAt: -1 });

        res.json(barbeiros);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar barbeiros",
            details: (error as Error).message,
        });
    }
};

// Buscar barbeiro por ID
const getBarberById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const barber = await Barbeiro.findById(id);

        if (!barber) {
            res.status(404).json({
                error: "Barbeiro não encontrado",
            });
            return;
        }

        res.json(barber);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar barbeiro",
            details: (error as Error).message,
        });
    }
};

// Atualizar barbeiro
const updateBarber = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const updatedBarbeiro = await Barbeiro.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
            }
        );

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
    } catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar barbeiro",
            details: (error as Error).message,
        });
    }
};

// Deletar barbeiro
const deleteBarber = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const deletedBarbeiro = await Barbeiro.findByIdAndDelete(id);

        if (!deletedBarbeiro) {
            res.status(404).json({
                error: "Barbeiro não encontrado",
            });
            return;
        }

        res.json({
            message: "Barbeiro removido com sucesso",
        });
    } catch (error) {
        res.status(500).json({
            error: "Erro ao remover barbeiro",
            details: (error as Error).message,
        });
    }
};

export default {
    createBarber,
    getBarbers,
    getBarberById,
    updateBarber,
    deleteBarber,
};