import { Request, Response } from "express";
import Cost from "../models/Cost";

const isValidDate = (date: unknown): boolean =>
    !Number.isNaN(new Date(date as string).getTime());

const getReferenciaRange = (
    dataReferencia?: unknown,
    mes?: unknown,
    ano?: unknown
) => {
    let referencia: Date;

    if (dataReferencia) {
        referencia = new Date(dataReferencia as string);
    } else if (mes && ano) {
        referencia = new Date(
            Number(ano),
            Number(mes) - 1,
            1
        );
    } else {
        referencia = new Date();
    }

    if (Number.isNaN(referencia.getTime())) {
        return null;
    }

    const inicio = new Date(
        referencia.getFullYear(),
        referencia.getMonth(),
        1
    );
    const fim = new Date(
        referencia.getFullYear(),
        referencia.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
    );

    return {
        inicio,
        fim,
        mesAnoReferencia: `${String(referencia.getMonth() + 1).padStart(2, "0")}/${referencia.getFullYear()}`,
    };
};

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
            dateInicial,
            dateFinal,
            tipo,
        } = req.body;

        if (
            !linkId ||
            !nome ||
            valor === undefined ||
            !tipo
        ) {
            res.status(400).json({
                error: "linkId, nome, valor e tipo sao obrigatorios",
            });

            return;
        }

        if (!["fixo", "variavel"].includes(tipo)) {
            res.status(400).json({
                error: "tipo deve ser fixo ou variavel",
            });

            return;
        }

        if (tipo === "variavel") {
            if (
                !dateInicial ||
                !dateFinal ||
                !isValidDate(dateInicial) ||
                !isValidDate(dateFinal)
            ) {
                res.status(400).json({
                    error: "dateInicial e dateFinal sao obrigatorios para custo variavel",
                });

                return;
            }

            if (new Date(dateInicial) > new Date(dateFinal)) {
                res.status(400).json({
                    error: "dateInicial nao pode ser maior que dateFinal",
                });

                return;
            }
        }

        const cost = new Cost({
            linkId,
            nome,
            valor,
            dateInicial: tipo === "variavel" ? dateInicial : undefined,
            dateFinal: tipo === "variavel" ? dateFinal : undefined,
            status: "pendente",
            idTransacao: [],
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

// Buscar todos custos da empresa no mes de referencia
const getCosts = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            linkId,
            dataReferencia,
            mes,
            ano,
        } = req.query;

        if (!linkId) {
            res.status(400).json({
                error: "linkId e obrigatorio",
            });

            return;
        }

        const referencia = getReferenciaRange(
            dataReferencia,
            mes,
            ano
        );

        if (!referencia) {
            res.status(400).json({
                error: "dataReferencia, mes ou ano invalidos",
            });

            return;
        }

        const costs = await Cost.find({
            linkId,
            $or: [
                { tipo: "fixo" },
                {
                    tipo: "variavel",
                    dateInicial: { $lte: referencia.fim },
                    dateFinal: { $gte: referencia.inicio },
                },
            ],
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
                error: "Custo nao encontrado",
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

// Atualizar status do custo para concluido
const updateCostStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            res.status(400).json({
                error: "status e obrigatorio",
            });

            return;
        }

        if (!["pendente", "concluido"].includes(status)) {
            res.status(400).json({
                error: "status deve ser pendente ou concluido",
            });

            return;
        }

        const cost = await Cost.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!cost) {
            res.status(404).json({
                error: "Custo nao encontrado",
            });

            return;
        }

        res.json({
            message: "Status do custo atualizado com sucesso",
            cost,
        });

    } catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar status do custo",
            details: (error as Error).message,
        });
    }
};

// Criar ou atualizar transacao mensal do custo
const updateCostTransaction = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            idTransacao,
            mesAnoReferencia,
            statusTransacao,
        } = req.body;

        if (!idTransacao || !mesAnoReferencia || !statusTransacao) {
            res.status(400).json({
                error: "idTransacao, mesAnoReferencia e statusTransacao sao obrigatorios",
            });

            return;
        }

        if (!["pago", "pendente"].includes(statusTransacao)) {
            res.status(400).json({
                error: "statusTransacao deve ser pago ou pendente",
            });

            return;
        }

        const cost = await Cost.findById(id);

        if (!cost) {
            res.status(404).json({
                error: "Custo nao encontrado",
            });

            return;
        }

        const transacoes = cost.idTransacao || [];
        const transacaoIndex = transacoes.findIndex(
            (transacao) =>
                transacao.mesAnoReferencia === mesAnoReferencia
        );

        if (transacaoIndex >= 0) {
            transacoes[transacaoIndex].id = idTransacao;
            transacoes[transacaoIndex].status = statusTransacao;
        } else {
            transacoes.push({
                id: idTransacao,
                mesAnoReferencia,
                status: statusTransacao,
            });
        }

        cost.idTransacao = transacoes;
        const updatedCost = await cost.save();

        res.json({
            message: "Transacao mensal atualizada com sucesso",
            cost: updatedCost,
        });

    } catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar transacao mensal",
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
                error: "Custo nao encontrado",
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
    updateCostStatus,
    updateCostTransaction,
    deleteCost,
};
