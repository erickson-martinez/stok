import { Request, Response } from "express";
import Commission from "../models/Commission";

// Criar comissão
const createCommission = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            email,
            valorComissao,
            data,
            status,
            linkId,
            barbeiroNome,
            paidAt,
        } = req.body;

        if (!email || valorComissao === undefined || !data || !linkId || !barbeiroNome) {
            res.status(400).json({
                error: "Email, valorComissao, data, linkId e barbeiroNome são obrigatórios",
            });
            return;
        }

        const commission = new Commission({
            email,
            valorComissao,
            data,
            status: status || "pendente",
            linkId,
            barbeiroNome,
            paidAt: paidAt ? new Date(paidAt) : undefined,
        });

        await commission.save();

        res.status(201).json(commission);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao criar comissão",
            details: (error as Error).message,
        });
    }
};

// Buscar comissões por linkId
const getCommissionsByLinkId = async (
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

        const commissions = await Commission.find({
            linkId,
        }).sort({ createdAt: -1 });

        res.json(commissions);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar comissões",
            details: (error as Error).message,
        });
    }
};

// Buscar comissão por ID
const getCommissionById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const commission = await Commission.findById(id);

        if (!commission) {
            res.status(404).json({
                error: "Comissão não encontrada",
            });
            return;
        }

        res.json(commission);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar comissão",
            details: (error as Error).message,
        });
    }
};

// Atualizar comissão
const updateCommission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            email,
            valorComissao,
            data,
            status,
            barbeiroNome,
            paidAt,
        } = req.body;

        const commission = await Commission.findByIdAndUpdate(
            id,
            {
                email,
                valorComissao,
                data,
                status,
                barbeiroNome,
                paidAt: paidAt ? new Date(paidAt) : undefined,
                updatedAt: new Date(),
            },
            { new: true }
        );

        if (!commission) {
            res.status(404).json({
                error: "Comissão não encontrada",
            });
            return;
        }

        res.json(commission);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar comissão",
            details: (error as Error).message,
        });
    }
};

// Deletar comissão
const deleteCommission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const commission = await Commission.findByIdAndDelete(id);

        if (!commission) {
            res.status(404).json({
                error: "Comissão não encontrada",
            });
            return;
        }

        res.json({ message: "Comissão deletada com sucesso" });
    } catch (error) {
        res.status(500).json({
            error: "Erro ao deletar comissão",
            details: (error as Error).message,
        });
    }
};

// Buscar comissões por status
const getCommissionsByStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { linkId, status } = req.query;

        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });
            return;
        }

        const query: any = { linkId };
        if (status) {
            query.status = status;
        }

        const commissions = await Commission.find(query).sort({ createdAt: -1 });

        res.json(commissions);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar comissões",
            details: (error as Error).message,
        });
    }
};

// Buscar comissões de um barbeiro específico
const getCommissionsByBarber = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { linkId, barbeiroNome } = req.query;

        if (!linkId || !barbeiroNome) {
            res.status(400).json({
                error: "linkId e barbeiroNome são obrigatórios",
            });
            return;
        }

        const commissions = await Commission.find({
            linkId,
            barbeiroNome,
        }).sort({ createdAt: -1 });

        res.json(commissions);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar comissões do barbeiro",
            details: (error as Error).message,
        });
    }
};

export {
    createCommission,
    getCommissionsByLinkId,
    getCommissionById,
    updateCommission,
    deleteCommission,
    getCommissionsByStatus,
    getCommissionsByBarber,
};
