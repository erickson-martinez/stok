// src/controllers/transactionController.ts

import { Request, Response } from 'express';
import Transaction from '../models/Transaction';

const VALID_STATUS = [
    'pendente',
    'pago',
    'nao_pago',
    'parcial',
    'cancelado',
];

const transactionController = {

    // ==========================================================
    // CRIAR TRANSAÇÃO SIMPLES
    // ==========================================================
    async createSimple(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const {
                idEmail,
                type,
                name,
                amount,
                date,
                status,
                notes,
            } = req.body;

            if (
                !idEmail ||
                !type ||
                !name ||
                amount == null ||
                !date
            ) {
                res.status(400).json({
                    error: 'Campos obrigatórios: idEmail, type, name, amount, date'
                });

                return;
            }

            if (
                !['revenue', 'expense'].includes(type)
            ) {
                res.status(400).json({
                    error: 'type deve ser revenue ou expense'
                });

                return;
            }

            if (Number(amount) <= 0) {
                res.status(400).json({
                    error: 'amount deve ser maior que zero'
                });

                return;
            }

            const transaction = await Transaction.create({
                idEmail,

                type,

                name: String(name).trim(),

                amount: Number(amount),

                paidAmount: 0,

                date: new Date(date),

                isControlled: false,

                status: status || 'nao_pago',

                notes: notes?.trim(),

                paymentRequest: {
                    requested: false,
                    approved: false,
                    rejected: false,
                }
            });

            res.status(201).json({
                message: 'Transação criada com sucesso',
                transaction,
            });

        } catch (error: any) {

            console.error(error);

            res.status(500).json({
                error: error.message || 'Erro interno'
            });

        }
    },

    // ==========================================================
    // CRIAR TRANSAÇÃO COMPARTILHADA
    // ==========================================================
    async createControlled(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const {
                idEmail,
                targetEmail,
                targetPhone,
                type,
                name,
                amount,
                date,
                notes,
            } = req.body;

            if (
                !idEmail ||
                (!targetEmail && !targetPhone) ||
                !type ||
                !name ||
                amount == null ||
                !date
            ) {
                res.status(400).json({
                    error: 'Campos obrigatórios: idEmail, targetEmail, targetPhone, type, name, amount, date'
                });

                return;
            }

            if (
                !['revenue', 'expense'].includes(type)
            ) {
                res.status(400).json({
                    error: 'type deve ser revenue ou expense'
                });

                return;
            }

            if (Number(amount) <= 0) {
                res.status(400).json({
                    error: 'amount deve ser maior que zero'
                });

                return;
            }

            const transaction = await Transaction.create({

                idEmail,

                targetEmail: targetEmail
                    .trim()
                ,
                targetPhone: targetPhone.trim(),
                type,
                name: name.trim(),
                amount: Number(amount),
                paidAmount: 0,
                date: new Date(date),
                isControlled: true,
                status: 'nao_pago',
                notes: notes?.trim(),
                paymentRequest: {
                    requested: false,
                    approved: false,
                    rejected: false,
                },
            });

            res.status(201).json({
                message: 'Transação compartilhada criada com sucesso',
                transaction,
            });

        } catch (error: any) {

            console.error(error);

            res.status(500).json({
                error: error.message || 'Erro interno'
            });

        }
    },
    // ==========================================================
    // LISTAR TRANSAÇÕES
    // ==========================================================
    async listTransactions(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const {
                idEmail,
                sharedEmail,
                targetEmail,
                targetPhone,
                sharedPhone,
                status,
                month,
                year,
            } = req.query;

            if (!idEmail) {
                res.status(400).json({
                    error: 'idEmail é obrigatório'
                });

                return;
            }


            if (!month || !year) {
                res.status(400).json({
                    error: 'month e year são obrigatórios'
                });

                return;
            }

            const monthNum = Number(month) - 1;
            const yearNum = Number(year);

            if (
                isNaN(monthNum) ||
                isNaN(yearNum) ||
                monthNum < 0 ||
                monthNum > 11
            ) {
                res.status(400).json({
                    error: 'month ou year inválidos'
                });

                return;
            }

            const startDate = new Date(
                yearNum,
                monthNum,
                1,
                0,
                0,
                0,
                0
            );

            const endDate = new Date(
                yearNum,
                monthNum + 1,
                0,
                23,
                59,
                59,
                999
            );

            const query: any = {
                date: {
                    $gte: startDate,
                    $lte: endDate,
                },

                $or: [
                    {
                        idEmail,
                    },
                    {
                        sharedEmail: String(sharedEmail)
                            .trim()
                        ,
                    },
                    {
                        targetEmail: String(targetEmail)
                            .trim()
                        ,
                    },
                    {
                        sharedPhone: String(sharedPhone)
                            .trim(),
                    },
                    {
                        targetPhone: String(targetPhone)
                            .trim(),
                    }
                ],
            };

            if (status) {
                query.status = status;
            }

            const transactions = await Transaction.find(query)
                .sort({ date: -1 })
                .lean();

            const responseTransactions = transactions.map(tx => ({
                ...tx,

                role:
                    tx.idEmail === idEmail
                        ? 'owner'
                        : 'participant',

                canEdit:
                    tx.idEmail === idEmail,

                canDelete:
                    tx.idEmail === idEmail,

                canApprovePayment:
                    tx.idEmail === idEmail,

                canRequestPayment:
                    tx.targetEmail === String(sharedEmail) ||
                    tx.targetPhone === String(sharedPhone),
            }));

            // ==================================================
            // RESUMO FINANCEIRO
            // ==================================================

            const totalRevenue = transactions
                .filter(tx => tx.type === 'revenue')
                .reduce(
                    (sum, tx) =>
                        sum + (tx.amount || 0),
                    0
                );

            const totalExpense = transactions
                .filter(tx => tx.type === 'expense')
                .reduce(
                    (sum, tx) =>
                        sum + (tx.amount || 0),
                    0
                );

            const paidRevenue = transactions
                .filter(
                    tx =>
                        tx.type === 'revenue' &&
                        tx.status === 'pago'
                )
                .reduce(
                    (sum, tx) =>
                        sum + (tx.amount || 0),
                    0
                );

            const paidExpense = transactions
                .filter(
                    tx =>
                        tx.type === 'expense' &&
                        tx.status === 'pago'
                )
                .reduce(
                    (sum, tx) =>
                        sum + (tx.amount || 0),
                    0
                );

            const monthlyBalance =
                paidRevenue - paidExpense;

            // ==================================================
            // SALDO ACUMULADO
            // ==================================================

            const previousTransactions =
                await Transaction.find({
                    idEmail,
                    date: {
                        $lt: startDate,
                    },
                    status: 'pago',
                }).lean();

            const previousRevenue =
                previousTransactions
                    .filter(
                        tx => tx.type === 'revenue'
                    )
                    .reduce(
                        (sum, tx) =>
                            sum + tx.amount,
                        0
                    );

            const previousExpense =
                previousTransactions
                    .filter(
                        tx => tx.type === 'expense'
                    )
                    .reduce(
                        (sum, tx) =>
                            sum + tx.amount,
                        0
                    );

            const accumulatedBalance =
                (
                    previousRevenue -
                    previousExpense
                ) +
                monthlyBalance;

            res.json({

                period: {
                    month: Number(month),
                    year: Number(year),
                    startDate,
                    endDate,
                },

                summary: {
                    totalRevenue,
                    totalExpense,

                    paidRevenue,
                    paidExpense,

                    monthlyBalance,

                    accumulatedBalance,
                },

                count: responseTransactions.length,

                transactions:
                    responseTransactions,
            });

        } catch (error: any) {

            console.error(
                'Erro ao listar transações:',
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    'Erro interno'
            });

        }
    },
    // ==========================================================
    // ATUALIZAR TRANSAÇÃO
    // ==========================================================
    async updateTransaction(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const { transactionId } = req.params;

            const {
                idEmail,
                name,
                amount,
                date,
                status,
                notes,
            } = req.body;

            const transaction =
                await Transaction.findOne({
                    _id: transactionId,
                    idEmail,
                });

            if (!transaction) {
                res.status(404).json({
                    error: 'Transação não encontrada'
                });

                return;
            }

            if (transaction.status === 'pago') {
                res.status(400).json({
                    error: 'Não é permitido editar transação paga'
                });

                return;
            }

            if (name !== undefined) {
                transaction.name = name.trim();
            }

            if (amount !== undefined) {

                const value = Number(amount);

                if (value <= 0) {
                    res.status(400).json({
                        error: 'amount inválido'
                    });

                    return;
                }

                transaction.amount = value;
            }

            if (date !== undefined) {
                transaction.date = new Date(date);
            }

            if (
                status &&
                VALID_STATUS.includes(status)
            ) {
                transaction.status = status;
            }

            if (notes !== undefined) {
                transaction.notes = notes?.trim();
            }

            await transaction.save();

            res.json({
                message: 'Transação atualizada',
                transaction,
            });

        } catch (error: any) {

            res.status(500).json({
                error: error.message,
            });

        }
    },

    // ==========================================================
    // REMOVER TRANSAÇÃO
    // ==========================================================
    async deleteTransaction(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const {
                transactionId,
                idEmail,
            } = req.body;

            const transaction =
                await Transaction.findOne({
                    _id: transactionId,
                    idEmail,
                });

            if (!transaction) {

                res.status(404).json({
                    error: 'Transação não encontrada'
                });

                return;
            }

            await transaction.deleteOne();

            res.json({
                message: 'Transação removida'
            });

        } catch (error: any) {

            res.status(500).json({
                error: error.message
            });

        }
    },

    // ==========================================================
    // ALTERAR STATUS
    // ==========================================================
    async markStatus(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const {
                transactionId,
                idEmail,
                status,
            } = req.body;

            if (!VALID_STATUS.includes(status)) {
                res.status(400).json({
                    error: 'Status inválido'
                });
                return;
            }

            const transaction =
                await Transaction.findOne({
                    _id: transactionId,
                    idEmail,
                });

            if (!transaction) {
                res.status(404).json({
                    error: 'Transação não encontrada'
                });
                return;
            }

            transaction.status = status;

            if (status === 'pago') {
                transaction.paidAmount =
                    transaction.amount;
            }

            if (
                status === 'nao_pago' ||
                status === 'pendente'
            ) {
                transaction.paidAmount = 0;
            }

            await transaction.save();

            res.json({
                message: 'Status atualizado',
                transaction,
            });

        } catch (error: any) {

            res.status(500).json({
                error: error.message
            });

        }
    },

    // ==========================================================
    // PAGAMENTO PARCIAL
    // ==========================================================
    async updatePaymentStatus(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const {
                transactionId,
                idEmail,
                paidAmount,
            } = req.body;

            if (Number(paidAmount) < 0) {
                res.status(400).json({
                    error: 'paidAmount inválido'
                });
                return;
            }

            const transaction =
                await Transaction.findOne({
                    _id: transactionId,
                    idEmail,
                });

            if (!transaction) {
                res.status(404).json({
                    error: 'Transação não encontrada'
                });
                return;
            }

            transaction.paidAmount =
                Number(paidAmount);

            if (
                transaction.paidAmount >=
                transaction.amount
            ) {

                transaction.paidAmount =
                    transaction.amount;

                transaction.status = 'pago';

            } else if (
                transaction.paidAmount > 0
            ) {

                transaction.status = 'parcial';

            } else {

                transaction.status = 'nao_pago';

            }

            await transaction.save();

            res.json({
                message: 'Pagamento atualizado',
                transaction,
            });

        } catch (error: any) {

            res.status(500).json({
                error: error.message
            });

        }
    },

    // ==========================================================
    // SOLICITAR PAGAMENTO
    // ==========================================================
    async requestPayment(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const {
                transactionId,
                targetPhone,
                targetEmail,
                idEmail,
                message,
            } = req.body;

            const transaction =
                await Transaction.findById(
                    transactionId
                );

            if (!transaction) {
                res.status(404).json({
                    error: 'Transação não encontrada'
                });
                return;
            }

            if (
                transaction.targetEmail !==
                targetEmail &&
                transaction.targetPhone !==
                targetPhone && transaction.idEmail !== idEmail) {
                res.status(403).json({
                    error: 'Sem permissão'
                });
                return;
            }

            if (
                transaction.paymentRequest?.requested
            ) {
                res.status(400).json({
                    error:
                        'Já existe uma solicitação pendente'
                });
                return;
            }
            let quemFesRequest
            if (idEmail && !targetEmail && !targetPhone) {
                quemFesRequest = idEmail;
            } else if (targetPhone && !targetEmail && !idEmail) {
                quemFesRequest = targetPhone;
            } else if (targetEmail && !targetPhone && !idEmail) {
                quemFesRequest = targetEmail;
            }

            transaction.paymentRequest = {
                requested: true,
                requestedAt: new Date(),
                requestedBy: quemFesRequest,
                message,
                approved: false,
                rejected: false,
            };

            await transaction.save();

            res.json({
                message:
                    'Solicitação enviada'
            });

        } catch (error: any) {

            res.status(500).json({
                error: error.message
            });

        }
    },

    // ==========================================================
    // APROVAR PAGAMENTO
    // ==========================================================
    async approvePayment(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const {
                transactionId,
                idEmail,
                targetPhone,
                targetEmail,
            } = req.body;

            const transaction =
                await Transaction.findOne({
                    _id: transactionId
                });


            if (!transaction) {
                res.status(404).json({
                    error: 'Transação não encontrada'
                });
                return;
            }

            let quemFesRequest
            if (idEmail && !targetEmail && !targetPhone) {
                quemFesRequest = idEmail;
            } else if (targetPhone && !targetEmail && !idEmail) {
                quemFesRequest = targetPhone;
            } else if (targetEmail && !targetPhone && !idEmail) {
                quemFesRequest = targetEmail;
            }


            if (transaction.type === 'revenue') {
                if (transaction.idEmail === quemFesRequest) {
                    transaction.status = 'pago';
                } else if (
                    (transaction.targetEmail === quemFesRequest && !targetPhone) ||
                    (transaction.targetPhone === quemFesRequest && !targetEmail)) {
                    transaction.status = 'pago';
                } else {
                    res.status(403).json({
                        error: 'Sem permissão'
                    });
                    return;
                }
            }
            transaction.paidAmount =
                transaction.amount;

            transaction.paymentRequest = {
                ...(transaction.paymentRequest || {}),

                approved: true,

                approvedAt: new Date(),

                approvedBy: quemFesRequest,

                rejected: false,

                requested: false,
            };

            await transaction.save();

            res.json({
                message:
                    'Pagamento aprovado'
            });

        } catch (error: any) {

            res.status(500).json({
                error: error.message
            });

        }
    },

    // ==========================================================
    // REJEITAR PAGAMENTO
    // ==========================================================
    async rejectPayment(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const {
                transactionId,
                idEmail,
                reason,
            } = req.body;

            const transaction =
                await Transaction.findOne({
                    _id: transactionId,
                    idEmail,
                });

            if (!transaction) {

                res.status(404).json({
                    error: 'Transação não encontrada'
                });

                return;
            }

            transaction.paymentRequest = {
                ...(transaction.paymentRequest || {}),

                rejected: true,

                rejectedAt: new Date(),

                rejectedReason: reason,

                approved: false,

                requested: false,
            };

            await transaction.save();

            res.json({
                message:
                    'Solicitação rejeitada'
            });

        } catch (error: any) {

            res.status(500).json({
                error: error.message
            });

        }
    },

    //Compartilhar transação
    async followTransaction(
        req: Request,
        res: Response
    ): Promise<void> {
        const { sharedEmail, sharedPhone, idEmail, aggregate } = req.body;

        if (!idEmail && !aggregate) {
            res.status(400).json({
                error: 'Campos obrigatórios: idEmail, aggregate'
            });
            return;
        }
        if (!sharedEmail && !sharedPhone) {
            res.status(400).json({
                error: 'É obrigatório informar pelo menos um: sharedEmail ou sharedPhone'
            });
            return;
        }

        try {
            const transactionsToTarget = await Transaction.find({ idEmail: idEmail });

            if (transactionsToTarget.length === 0) {
                res.status(404).json({
                    error: 'Transações não encontradas'
                });
                return;
            }
            await Transaction.updateMany(
                { idEmail: idEmail },
                { $set: { sharedEmail: sharedEmail, sharedPhone: sharedPhone, aggregate: aggregate } }
            );
            res.json({
                message: 'Transações atualizadas com sucesso'
            });
        } catch (error: any) {

            res.status(500).json({
                error: error.message
            });
        }
    },

    // ==========================================================
    // ADICIONAR VALOR
    // ==========================================================
    async addValue(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const { transactionId } = req.params;

            const {
                idEmail,
                additionalAmount,
                description,
            } = req.body;

            if (
                Number(additionalAmount) <= 0
            ) {
                res.status(400).json({
                    error:
                        'additionalAmount inválido'
                });

                return;
            }

            const transaction =
                await Transaction.findOne({
                    _id: transactionId,
                    idEmail,
                });

            if (!transaction) {
                res.status(404).json({
                    error: 'Transação não encontrada'
                });

                return;
            }

            transaction.amount +=
                Number(additionalAmount);

            transaction.additions ??= [];

            transaction.additions.push({
                description,
                amount: Number(additionalAmount),
                addedAt: new Date(),
                addedBy: idEmail,
            });

            await transaction.save();

            res.json({
                message: 'Valor adicionado',
                transaction,
            });

        } catch (error: any) {

            res.status(500).json({
                error: error.message
            });

        }
    },

    // ==========================================================
    // SUBTRAIR VALOR
    // ==========================================================
    async subtractValue(
        req: Request,
        res: Response
    ): Promise<void> {

        try {

            const { transactionId } =
                req.params;

            const {
                idEmail,
                description,
            } = req.body;

            const transaction =
                await Transaction.findOne({
                    _id: transactionId,
                    idEmail,
                });

            if (!transaction) {
                res.status(404).json({
                    error: 'Transação não encontrada'
                });

                return;
            }

            const addition =
                transaction.additions?.find(
                    item =>
                        item.description ===
                        description &&
                        !item.removed
                );

            if (!addition) {

                res.status(400).json({
                    error: 'Adição não encontrada'
                });

                return;
            }

            addition.removed = true;
            addition.removedAt = new Date();
            addition.removedReason =
                'Removido pelo usuário';

            transaction.amount -=
                addition.amount;

            await transaction.save();

            res.json({
                message: 'Valor removido',
                transaction,
            });

        } catch (error: any) {

            res.status(500).json({
                error: error.message
            });

        }
    },
};

export default transactionController;