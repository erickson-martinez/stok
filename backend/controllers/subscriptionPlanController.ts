//controllers/subscriptionPlanController.ts

import { Request, Response } from "express";
import SubscriptionPlan from "../models/SubscriptionPlan";

const createPlan = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const {
            nome,
            descricao,
            valorMensal,
            servicosIds,
            limiteMensal,
            linkId
        } = req.body;

        if (
            !nome ||
            valorMensal === undefined ||
            !servicosIds ||
            !servicosIds.length ||
            !linkId
        ) {

            res.status(400).json({
                error: "nome, valorMensal, servicosIds e linkId são obrigatórios"
            });

            return;
        }

        const ultimo = await SubscriptionPlan
            .findOne({ linkId })
            .sort({ codigo: -1 });

        const codigo = ultimo ? ultimo.codigo + 1 : 1;

        const plano = await SubscriptionPlan.create({

            codigo,

            nome,

            descricao,

            valorMensal,

            servicosIds,

            limiteMensal,

            linkId
        });

        res.status(201).json(plano);

    } catch (error) {

        res.status(500).json({
            error: "Erro ao criar plano",
            details: (error as Error).message
        });

    }

};

const getPlans = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const { linkId } = req.query;

        const planos = await SubscriptionPlan
            .find({ linkId })
            .sort({ codigo: 1 });

        res.json(planos);

    } catch (error) {

        res.status(500).json({
            error: "Erro ao buscar planos",
            details: (error as Error).message
        });

    }

};

const getPlan = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const plano = await SubscriptionPlan.findById(req.params.id);

        if (!plano) {

            res.status(404).json({
                error: "Plano não encontrado"
            });

            return;
        }

        res.json(plano);

    } catch (error) {

        res.status(500).json({
            error: "Erro ao buscar plano",
            details: (error as Error).message
        });

    }

};

const updatePlan = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const plano = await SubscriptionPlan.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true
            }
        );

        if (!plano) {

            res.status(404).json({
                error: "Plano não encontrado"
            });

            return;
        }

        res.json(plano);

    } catch (error) {

        res.status(500).json({
            error: "Erro ao atualizar plano",
            details: (error as Error).message
        });

    }

};

const deletePlan = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        await SubscriptionPlan.findByIdAndDelete(req.params.id);

        res.json({
            message: "Plano removido com sucesso"
        });

    } catch (error) {

        res.status(500).json({
            error: "Erro ao remover plano",
            details: (error as Error).message
        });

    }

};

export default {

    createPlan,

    getPlans,

    getPlan,

    updatePlan,

    deletePlan

};