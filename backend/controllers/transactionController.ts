// src/controllers/transactionController.ts
import { Request, Response } from 'express';
import Transaction from '../models/Transaction';

const transactionController = {
    async createSimple(req: Request, res: Response): Promise<void> {
        try {
            const {
                ownerPhone,
                type,
                name,
                amount,
                date,
                status,
                notes,
            } = req.body;

            if (!ownerPhone || !type || !name || amount == null || !date) {
                res.status(400).json({ error: 'Campos obrigatórios: ownerPhone, type, name, amount, date' });
                return;
            }

            if (!['revenue', 'expense'].includes(type)) {
                res.status(400).json({ error: 'type deve ser "revenue" ou "expense"' });
                return;
            }

            if (Number(amount) <= 0) {
                res.status(400).json({ error: 'O valor (amount) deve ser maior que zero' });
                return;
            }

            const transaction = new Transaction({
                ownerPhone: ownerPhone,
                type,
                name: name.trim(),
                amount: Number(amount),
                date: new Date(date),
                isControlled: false,
                status: status || 'nao_pago',
                paidAmount: 0,
                notes: notes ? String(notes).trim() : undefined,
            });

            await transaction.save();

            const responseTransaction = {
                ...transaction.toObject(),
                ownerPhone: ownerPhone,
                counterpartyPhone: transaction.counterpartyPhone || undefined,
                sharerPhone: transaction.sharerPhone || undefined,
            };

            res.status(201).json({
                message: 'Transação simples criada com sucesso',
                transaction: responseTransaction,
            });
        } catch (error: any) {
            console.error('Erro ao criar transação simples:', error);
            res.status(500).json({ error: error.message || 'Erro interno no servidor' });
        }
    },

    async createControlled(req: Request, res: Response): Promise<void> {
        try {
            const {
                ownerPhone,
                counterpartyPhone,
                name,
                amount,
                date,
                notes,
                type
            } = req.body;
            if (!ownerPhone || !counterpartyPhone || !name || amount == null || !date) {
                res.status(400).json({
                    error: 'Campos obrigatórios: ownerPhone, counterpartyPhone, name, amount, date'
                });
                return;
            }

            if (ownerPhone === counterpartyPhone) {
                res.status(400).json({ error: 'Não é permitido criar cobrança para o mesmo usuário' });
                return;
            }

            if (Number(amount) <= 0) {
                res.status(400).json({ error: 'O valor deve ser maior que zero' });
                return;
            }

            const controlId = `ctrl-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
            const transactionDate = new Date(date);

            if (type === 'revenue') {
                const mySide = new Transaction({
                    ownerPhone: ownerPhone,
                    type: 'revenue',
                    name: name.trim(),
                    amount: Number(amount),
                    date: transactionDate,
                    isControlled: true,
                    controlId,
                    counterpartyPhone: counterpartyPhone,
                    status: 'nao_pago',
                    paidAmount: 0,
                    notes: notes ? String(notes).trim() : undefined,
                });

                const counterpartySide = new Transaction({
                    ownerPhone: counterpartyPhone,
                    type: 'expense',
                    name: name.trim(),
                    amount: Number(amount),
                    date: transactionDate,
                    isControlled: true,
                    controlId,
                    counterpartyPhone: ownerPhone,
                    status: 'nao_pago',
                    paidAmount: 0,
                    notes: notes ? String(notes).trim() : undefined,
                });

                await Promise.all([mySide.save(), counterpartySide.save()]);
                const responseMySide = {
                    ...mySide.toObject(),
                    ownerPhone: ownerPhone,
                    counterpartyPhone: counterpartyPhone,
                };

                const responseCounterSide = {
                    ...counterpartySide.toObject(),
                    ownerPhone: counterpartySide.ownerPhone,
                    counterpartyPhone: counterpartySide.counterpartyPhone || '',
                };

                res.status(201).json({
                    message: 'Cobrança criada com sucesso',
                    controlId,
                    mySide: responseMySide,
                    counterpartySide: responseCounterSide,
                });
            } else {
                const mySide = new Transaction({
                    ownerPhone: ownerPhone,
                    type: 'expense',
                    name: name.trim(),
                    amount: Number(amount),
                    date: transactionDate,
                    isControlled: true,
                    controlId,
                    counterpartyPhone: counterpartyPhone,
                    status: 'nao_pago',
                    paidAmount: 0,
                    notes: notes ? String(notes).trim() : undefined,
                });

                const counterpartySide = new Transaction({
                    ownerPhone: counterpartyPhone,
                    type: 'revenue',
                    name: name.trim(),
                    amount: Number(amount),
                    date: transactionDate,
                    isControlled: true,
                    controlId,
                    counterpartyPhone: ownerPhone,
                    status: 'nao_pago',
                    paidAmount: 0,
                    notes: notes ? String(notes).trim() : undefined,
                });

                await Promise.all([mySide.save(), counterpartySide.save()]);
                const responseMySide = {
                    ...mySide.toObject(),
                    ownerPhone: mySide.ownerPhone,
                    counterpartyPhone: mySide.counterpartyPhone || '',
                };

                const responseCounterSide = {
                    ...counterpartySide.toObject(),
                    ownerPhone: counterpartySide.ownerPhone,
                    counterpartyPhone: counterpartySide.counterpartyPhone || '',
                };
                res.status(201).json({
                    message: 'Cobrança criada com sucesso',
                    controlId,
                    mySide: responseMySide,
                    counterpartySide: responseCounterSide,
                });
            }




        } catch (error: any) {
            console.error('Erro ao criar transação controlada:', error);
            res.status(500).json({ error: error.message || 'Erro interno no servidor' });
        }
    },

    async updatePaymentStatus(req: Request, res: Response): Promise<void> {
        try {
            const { transactionId, ownerPhone, status, paidAmount } = req.body;

            if (!transactionId || !ownerPhone || !status) {
                res.status(400).json({ error: 'Campos obrigatórios: transactionId, ownerPhone, status' });
                return;
            }

            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                res.status(404).json({ error: 'Transação não encontrada' });
                return;
            }

            if (transaction.ownerPhone !== ownerPhone) {
                res.status(403).json({ error: 'Você não tem permissão para alterar esta transação' });
                return;
            }

            transaction.status = status;

            if (paidAmount !== undefined) {
                transaction.paidAmount = Math.max(0, Number(paidAmount));

                if (transaction.paidAmount >= transaction.amount) {
                    transaction.status = 'pago';
                    transaction.paidAmount = transaction.amount;
                } else if (transaction.paidAmount > 0) {
                    transaction.status = 'parcial';
                } else {
                    transaction.status = 'nao_pago';
                }
            }

            transaction.updatedAt = new Date();
            await transaction.save();

            if (transaction.isControlled && transaction.controlId) {
                const oppositeType = transaction.type === 'revenue' ? 'expense' : 'revenue';

                await Transaction.updateOne(
                    { controlId: transaction.controlId, type: oppositeType },
                    {
                        status: transaction.status,
                        paidAmount: transaction.paidAmount,
                        updatedAt: new Date(),
                    }
                );
            }

            const response = {
                ...transaction.toObject(),
                ownerPhone: transaction.ownerPhone,
                counterpartyPhone: transaction.counterpartyPhone || undefined,
                sharerPhone: transaction.sharerPhone || undefined,
            };

            res.json({
                message: 'Status atualizado com sucesso',
                transaction: response,
            });
        } catch (error: any) {
            console.error('Erro ao atualizar status:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async markStatus(req: Request, res: Response): Promise<void> {
        try {
            const { transactionId, ownerPhone, status } = req.body;

            if (!transactionId || !ownerPhone || !status) {
                res.status(400).json({ error: 'Campos obrigatórios: transactionId, ownerPhone, status' });
                return;
            }

            // Validar status
            const validStatuses = ['pendente', 'pago', 'nao_pago', 'parcial', 'cancelado'];
            if (!validStatuses.includes(status)) {
                res.status(400).json({
                    error: `Status inválido: "${status}". Valores permitidos: ${validStatuses.join(', ')}`
                });
                return;
            }

            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                res.status(404).json({ error: 'Transação não encontrada' });
                return;
            }

            if (transaction.ownerPhone !== ownerPhone) {
                res.status(403).json({ error: 'Você não tem permissão para alterar esta transação' });
                return;
            }

            transaction.status = status;
            transaction.paidAmount = transaction.amount;
            transaction.updatedAt = new Date();
            await transaction.save();

            if (transaction.isControlled && transaction.controlId) {
                const oppositeType = transaction.type === 'revenue' ? 'expense' : 'revenue';

                await Transaction.updateOne(
                    { controlId: transaction.controlId, type: oppositeType },
                    {
                        status: status,
                        paidAmount: transaction.amount,
                        updatedAt: new Date(),
                    }
                );
            }

            const response = {
                ...transaction.toObject(),
                ownerPhone: transaction.ownerPhone,
                counterpartyPhone: transaction.counterpartyPhone || undefined,
                sharerPhone: transaction.sharerPhone || undefined,
            };

            res.json({
                message: `Transação marcada como ${status} com sucesso`,
                transaction: response,
            });
        } catch (error: any) {
            console.error('Erro ao marcar como pago:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async listTransactions(req: Request, res: Response): Promise<void> {
        try {
            const { phone, includeShared, status, month, year } = req.query;

            if (!phone) {
                res.status(400).json({ error: 'Parâmetro phone é obrigatório' });
                return;
            }

            if (!month || !year) {
                res.status(400).json({ error: 'Parâmetros month e year são obrigatórios' });
                return;
            }

            const monthNum = parseInt(String(month)) - 1;
            const yearNum = parseInt(String(year));

            if (monthNum < 0 || monthNum > 11 || isNaN(yearNum)) {
                res.status(400).json({ error: 'month deve estar entre 1-12 e year deve ser válido' });
                return;
            }

            const startDate = new Date(yearNum, monthNum, 1);
            const endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59, 999);

            const query: any = {
                ownerPhone: phone,
                date: { $gte: startDate, $lte: endDate }
            };

            if (status) query.status = status;

            let transactions = await Transaction.find(query)
                .sort({ date: -1 })
                .lean();

            if (includeShared) {
                const shared = await Transaction.find({
                    sharerPhone: phone,
                    date: { $gte: startDate, $lte: endDate }
                })
                    .sort({ date: -1 })
                    .lean();

                transactions = [...transactions, ...shared];
            }

            const responseTransactions = transactions.map(tx => ({
                ...tx,
                ownerPhone: tx.ownerPhone,
                counterpartyPhone: tx.counterpartyPhone || undefined,
                sharerPhone: tx.sharerPhone || undefined,
            }));

            const totalRevenue = transactions
                .filter(tx => tx.type === 'revenue')
                .reduce((sum, tx) => sum + (tx.amount || 0), 0);

            const totalExpense = transactions
                .filter(tx => tx.type === 'expense')
                .reduce((sum, tx) => sum + (tx.amount || 0), 0);

            const paidRevenue = transactions
                .filter(tx => tx.type === 'revenue' && tx.status === 'pago')
                .reduce((sum, tx) => sum + (tx.amount || 0), 0);

            const paidExpense = transactions
                .filter(tx => tx.type === 'expense' && tx.status === 'pago')
                .reduce((sum, tx) => sum + (tx.amount || 0), 0);

            const monthlyBalance = paidRevenue - paidExpense;

            const accumulatedQuery = {
                ownerPhone: phone,
                date: { $lt: startDate }
            };

            const previousTransactions = await Transaction.find(accumulatedQuery).lean();

            const previousPaidRevenue = previousTransactions
                .filter(tx => tx.type === 'revenue' && tx.status === 'pago')
                .reduce((sum, tx) => sum + (tx.amount || 0), 0);

            const previousPaidExpense = previousTransactions
                .filter(tx => tx.type === 'expense' && tx.status === 'pago')
                .reduce((sum, tx) => sum + (tx.amount || 0), 0);

            const accumulatedBalance = (previousPaidRevenue - previousPaidExpense) + monthlyBalance;

            res.json({
                period: {
                    month: parseInt(String(month)),
                    year: yearNum,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                },
                summary: {
                    totalRevenue,
                    totalExpense,
                    monthlyBalance,
                    accumulatedBalance
                },
                count: responseTransactions.length,
                transactions: responseTransactions,
            });
        } catch (error: any) {
            console.error('Erro ao listar transações:', error);
            res.status(500).json({ error: error.message || 'Erro ao listar transações' });
        }
    },

    async followUser(req: Request, res: Response): Promise<void> {
        try {
            const { myPhone, targetPhone, aggregate } = req.body;

            if (!myPhone || !targetPhone) {
                res.status(400).json({ error: 'myPhone e targetPhone são obrigatórios' });
                return;
            }

            if (myPhone === targetPhone) {
                res.status(400).json({ error: 'Não é possível seguir a si mesmo' });
                return;
            }

            const result = await Transaction.updateMany(
                { ownerPhone: myPhone },
                { $set: { sharerPhone: targetPhone, aggregate } }
            );

            res.json({
                message: `Agora você acompanha as transações de ${targetPhone}`,
                modifiedCount: result.modifiedCount,
            });
        } catch (error: any) {
            console.error('Erro ao seguir usuário:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async updateTransaction(req: Request, res: Response): Promise<void> {
        try {
            const { transactionId } = req.params;
            const {
                ownerPhone,
                name,
                amount,
                date,
                status,
                notes,           // opcional
            } = req.body;

            if (!transactionId || !ownerPhone) {
                res.status(400).json({ error: 'transactionId e ownerPhone são obrigatórios' });
                return;
            }

            const transaction = await Transaction.findOne({
                _id: transactionId,
                ownerPhone: ownerPhone,
            });

            if (!transaction) {
                res.status(404).json({ error: 'Transação não encontrada ou não pertence a este usuário' });
                return;
            }

            // ── Bloqueia edição em transações já pagas (regra comum no seu sistema) ──
            if (transaction.status === 'pago') {
                res.status(400).json({ error: 'Não é permitido editar transação já marcada como paga' });
                return;
            }

            // ── Validações de campos enviados ──────────────────────────────────────
            const updates: Partial<typeof transaction> = {};

            if (name !== undefined) {
                if (typeof name !== 'string' || name.trim() === '') {
                    res.status(400).json({ error: 'name deve ser uma string não vazia' });
                    return;
                }
                updates.name = name.trim();
            }

            if (amount !== undefined) {
                const newAmount = Number(amount);
                if (isNaN(newAmount) || newAmount <= 0) {
                    res.status(400).json({ error: 'amount deve ser um número maior que zero' });
                    return;
                }
                updates.amount = newAmount;
                // Se tinha paidAmount maior que o novo amount → ajusta
                if ((transaction.paidAmount ?? 0) > newAmount) {
                    updates.paidAmount = newAmount;
                    updates.status = 'pago';
                }
            }

            if (date !== undefined) {
                const newDate = new Date(date);
                if (isNaN(newDate.getTime())) {
                    res.status(400).json({ error: 'Formato de data inválido' });
                    return;
                }

                const today = new Date();
                const transMonth = newDate.getMonth();
                const transYear = newDate.getFullYear();
                const currMonth = today.getMonth();
                const currYear = today.getFullYear();

                // Regra conservadora: só permite editar para mês atual ou futuro
                if (transYear < currYear || (transYear === currYear && transMonth < currMonth)) {
                    res.status(400).json({ error: 'Não é permitido alterar para datas em meses anteriores' });
                    return;
                }

                updates.date = newDate;
            }

            if (status !== undefined) {
                const validStatuses = ['pendente', 'pago', 'nao_pago', 'parcial', 'cancelado'];
                if (!validStatuses.includes(status)) {
                    res.status(400).json({
                        error: `Status inválido. Valores permitidos: ${validStatuses.join(', ')}`
                    });
                    return;
                }

                updates.status = status;

                // Consistência com paidAmount
                if (status === 'pago') {
                    updates.paidAmount = transaction.amount;
                } else if (status === 'nao_pago') {
                    updates.paidAmount = 0;
                }
                // 'parcial' deixa paidAmount como está (ou pode exigir paidAmount no body)
            }

            if (notes !== undefined) {
                updates.notes = String(notes).trim() || undefined;
            }

            // ── Se nada foi enviado para atualizar ──
            if (Object.keys(updates).length === 0) {
                res.status(400).json({ error: 'Nenhum campo válido foi enviado para atualização' });
                return;
            }

            // Aplica as atualizações
            Object.assign(transaction, updates);
            transaction.updatedAt = new Date();
            await transaction.save();

            // ── Se for transação controlada → propaga alterações relevantes ───────
            if (transaction.isControlled && transaction.controlId) {
                const oppositeType = transaction.type === 'revenue' ? 'expense' : 'revenue';

                const oppositeUpdates: any = {
                    updatedAt: new Date(),
                };

                if (updates.name) oppositeUpdates.name = updates.name;
                if (updates.date) oppositeUpdates.date = updates.date;
                if (updates.amount) oppositeUpdates.amount = updates.amount;
                if (updates.status) oppositeUpdates.status = updates.status;
                if (updates.paidAmount !== undefined) {
                    oppositeUpdates.paidAmount = updates.paidAmount;
                }

                if (Object.keys(oppositeUpdates).length > 1) { // tem algo além de updatedAt
                    await Transaction.updateOne(
                        { controlId: transaction.controlId, type: oppositeType },
                        { $set: oppositeUpdates }
                    );
                }
            }

            const response = {
                ...transaction.toObject(),
                ownerPhone: transaction.ownerPhone,
                counterpartyPhone: transaction.counterpartyPhone || undefined,
                sharerPhone: transaction.sharerPhone || undefined,
            };

            res.json({
                message: 'Transação atualizada com sucesso',
                transaction: response,
            });
        } catch (error: any) {
            console.error('Erro ao atualizar transação:', error);
            res.status(500).json({ error: error.message || 'Erro interno no servidor' });
        }
    },

    async deleteTransaction(req: Request, res: Response): Promise<void> {
        try {
            const { transactionId, ownerPhone } = req.body;

            if (!transactionId || !ownerPhone) {
                res.status(400).json({ error: 'transactionId e ownerPhone são obrigatórios' });
                return;
            }

            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                res.status(404).json({ error: 'Transação não encontrada' });
                return;
            }

            if (transaction.ownerPhone !== ownerPhone) {
                res.status(403).json({ error: 'Não autorizado' });
                return;
            }

            if (transaction.isControlled && transaction.controlId) {
                await Transaction.deleteMany({ controlId: transaction.controlId });
                res.json({ message: 'Transação controlada e sua contraparte foram removidas' });
            } else {
                await Transaction.findByIdAndDelete(transactionId);
                res.json({ message: 'Transação removida com sucesso' });
            }
        } catch (error: any) {
            console.error('Erro ao deletar transação:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ────────────────────────────────────────────────────────────────
    // ADICIONAR VALOR EXTRA (registra no array additions)
    // ────────────────────────────────────────────────────────────────
    async addValue(req: Request, res: Response): Promise<void> {
        try {
            const { transactionId } = req.params;
            const { ownerPhone, additionalAmount, description } = req.body;

            if (!ownerPhone || additionalAmount == null || Number(additionalAmount) <= 0) {
                res.status(400).json({ error: 'ownerPhone e additionalAmount (positivo) são obrigatórios' });
                return
            }
            if (!description?.trim()) {
                res.status(400).json({ error: 'description é obrigatória para identificar a adição' });
                return
            }

            const transaction = await Transaction.findOne({
                _id: transactionId,
                ownerPhone: ownerPhone,
            });

            if (!transaction) {
                res.status(404).json({ error: 'Transação não encontrada ou não pertence ao usuário' });
                return
            }

            if (transaction.status === 'pago') {
                res.status(400).json({ error: 'Não é possível adicionar valor em transação já paga' });
                return
            }

            // Validação de mês
            const today = new Date();
            const transMonth = transaction.date.getMonth();
            const transYear = transaction.date.getFullYear();
            const currMonth = today.getMonth();
            const currYear = today.getFullYear();

            if (transYear < currYear || (transYear === currYear && transMonth < currMonth)) {
                res.status(400).json({ error: 'Não é permitido adicionar valores em meses anteriores' });
                return
            }

            const added = Number(additionalAmount);
            transaction.amount += added;

            transaction.additions = transaction.additions || [];
            transaction.additions.push({
                description: description.trim(),
                amount: added,
                addedAt: new Date(),
                addedBy: ownerPhone,
            });

            transaction.updatedAt = new Date();
            await transaction.save();

            const response = {
                ...transaction.toObject(),
                ownerPhone: transaction.ownerPhone,
                counterpartyPhone: transaction.counterpartyPhone || undefined,
                sharerPhone: transaction.sharerPhone || undefined,
            };

            res.json({
                message: 'Valor adicionado com sucesso',
                transaction: response,
            });
        } catch (error: any) {
            console.error('Erro ao adicionar valor:', error);
            res.status(500).json({ error: error.message || 'Erro interno no servidor' });
        }
    },

    // ────────────────────────────────────────────────────────────────
    // SUBTRAIR / REMOVER VALOR (só se a description existir no array additions)
    // ────────────────────────────────────────────────────────────────
    async subtractValue(req: Request, res: Response): Promise<void> {
        try {
            const { transactionId } = req.params;
            const { ownerPhone, description } = req.body;

            if (!ownerPhone || !description?.trim()) {
                res.status(400).json({ error: 'ownerPhone e description são obrigatórios' });
                return
            }

            const transaction = await Transaction.findOne({
                _id: transactionId,
                ownerPhone: ownerPhone,
            });

            if (!transaction) {
                res.status(404).json({ error: 'Transação não encontrada ou não pertence ao usuário' });
                return
            }

            if (transaction.status === 'pago') {
                res.status(400).json({ error: 'Não é possível subtrair de transação já paga' });
                return
            }

            // Validação de mês
            const today = new Date();
            const transMonth = transaction.date.getMonth();
            const transYear = transaction.date.getFullYear();
            const currMonth = today.getMonth();
            const currYear = today.getFullYear();

            if (transYear < currYear || (transYear === currYear && transMonth < currMonth)) {
                res.status(400).json({ error: 'Não é permitido subtrair valores em meses anteriores' });
                return
            }

            transaction.additions = transaction.additions || [];
            const index = transaction.additions.findIndex(item =>
                !item.removed && item.description.trim().toLowerCase() === description.trim().toLowerCase()
            );

            if (index === -1) {
                res.status(400).json({
                    error: `Não encontrado adição ativa com a descrição "${description}". Subtração não permitida.`
                });
                return
            }

            const removedAmount = transaction.additions[index].amount;
            transaction.amount -= removedAmount;

            // Soft-delete do item
            transaction.additions[index].removed = true;
            transaction.additions[index].removedAt = new Date();
            transaction.additions[index].removedReason = 'Removido pelo usuário';

            // Registro no notes (opcional, para log legível)
            const entry = `${new Date().toLocaleString('pt-BR')}: -R$ ${removedAmount.toFixed(2)} (removido: ${description})`;
            transaction.notes = transaction.notes ? `${transaction.notes}\n${entry}` : entry;

            transaction.updatedAt = new Date();
            await transaction.save();

            const response = {
                ...transaction.toObject(),
                ownerPhone: transaction.ownerPhone,
                counterpartyPhone: transaction.counterpartyPhone || undefined,
                sharerPhone: transaction.sharerPhone || undefined,
            };

            res.json({
                message: `Adição "${description}" removida com sucesso`,
                removedAmount,
                transaction: response,
            });
        } catch (error: any) {
            console.error('Erro ao subtrair valor:', error);
            res.status(500).json({ error: error.message || 'Erro interno no servidor' });
        }
    },
};

export default transactionController;