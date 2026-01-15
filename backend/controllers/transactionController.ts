// src/controllers/transactionController.ts
import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import User from '../models/User';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não está definida no arquivo .env");
}

const encryptPhone = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY, "hex"),
        iv
    );
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
};

const decryptPassword = (encrypted: string): string => {
    const [iv, encryptedText] = encrypted.split(":");
    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY, "hex"),
        Buffer.from(iv, "hex")
    );
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};

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

            const targetPhone = String(ownerPhone).trim();

            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();
            const userExists = users.some(u => decryptPassword(u.phone) === targetPhone);

            users.forEach(user => {
                const plainPhone = decryptPassword(user.phone);
                userMap.set(plainPhone, user.phone);
            });

            const encryptedPhone = userMap.get(targetPhone);
            if (!userExists) {
                res.status(404).json({ error: 'Usuário proprietário não encontrado' });
                return;
            }

            const transaction = new Transaction({
                ownerPhone: encryptedPhone,
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
                ownerPhone: decryptPassword(transaction.ownerPhone),
                counterpartyPhone: transaction.counterpartyPhone ? decryptPassword(transaction.counterpartyPhone) : undefined,
                sharerPhone: transaction.sharerPhone ? decryptPassword(transaction.sharerPhone) : undefined,
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

            const targetPhone = String(ownerPhone).trim();
            const counterpartyPhoneStr = String(counterpartyPhone).trim();

            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();
            const userExists = users.some(u => decryptPassword(u.phone) === ownerPhone);

            users.forEach(user => {
                const plainPhone = decryptPassword(user.phone);
                userMap.set(plainPhone, user.phone);
            });

            const creditorExists = userMap.get(targetPhone);
            const debtorExists = userMap.get(counterpartyPhoneStr);

            if (!userExists || !creditorExists || !debtorExists) {
                res.status(404).json({ error: 'Um ou ambos os usuários não foram encontrados' });
                return;
            }

            const controlId = `ctrl-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
            const transactionDate = new Date(date);

            const mySide = new Transaction({
                ownerPhone: creditorExists,
                type: 'revenue',
                name: name.trim(),
                amount: Number(amount),
                date: transactionDate,
                isControlled: true,
                controlId,
                counterpartyPhone: debtorExists,
                status: 'nao_pago',
                paidAmount: 0,
                notes: notes ? String(notes).trim() : undefined,
            });

            const counterpartySide = new Transaction({
                ownerPhone: debtorExists,
                type: 'expense',
                name: name.trim(),
                amount: Number(amount),
                date: transactionDate,
                isControlled: true,
                controlId,
                counterpartyPhone: creditorExists,
                status: 'nao_pago',
                paidAmount: 0,
                notes: notes ? String(notes).trim() : undefined,
            });

            await Promise.all([mySide.save(), counterpartySide.save()]);

            const responseMySide = {
                ...mySide.toObject(),
                ownerPhone: decryptPassword(mySide.ownerPhone),
                counterpartyPhone: decryptPassword(mySide.counterpartyPhone || ''),
            };

            const responseCounterSide = {
                ...counterpartySide.toObject(),
                ownerPhone: decryptPassword(counterpartySide.ownerPhone),
                counterpartyPhone: decryptPassword(counterpartySide.counterpartyPhone || ''),
            };

            res.status(201).json({
                message: 'Cobrança criada com sucesso',
                controlId,
                mySide: responseMySide,
                counterpartySide: responseCounterSide,
            });
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

            const encryptedOwnerPhone = encryptPhone(ownerPhone);

            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                res.status(404).json({ error: 'Transação não encontrada' });
                return;
            }

            if (transaction.ownerPhone !== encryptedOwnerPhone) {
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
                ownerPhone: decryptPassword(transaction.ownerPhone),
                counterpartyPhone: transaction.counterpartyPhone ? decryptPassword(transaction.counterpartyPhone) : undefined,
                sharerPhone: transaction.sharerPhone ? decryptPassword(transaction.sharerPhone) : undefined,
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

            if (!transactionId || !ownerPhone) {
                res.status(400).json({ error: 'Campos obrigatórios: transactionId, ownerPhone' });
                return;
            }

            const targetPhone = String(ownerPhone).trim();
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            users.forEach(user => {
                const plainPhone = decryptPassword(user.phone);
                userMap.set(plainPhone, user.phone);
            });

            const encryptedPhone = userMap.get(targetPhone);

            if (!encryptedPhone) {
                res.status(404).json({ error: 'Nenhum usuário encontrado com este telefone' });
                return;
            }

            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                res.status(404).json({ error: 'Transação não encontrada' });
                return;
            }

            if (transaction.ownerPhone !== encryptedPhone) {
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
                ownerPhone: decryptPassword(transaction.ownerPhone),
                counterpartyPhone: transaction.counterpartyPhone ? decryptPassword(transaction.counterpartyPhone) : undefined,
                sharerPhone: transaction.sharerPhone ? decryptPassword(transaction.sharerPhone) : undefined,
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

            const targetPhone = String(phone).trim();
            const monthNum = parseInt(String(month)) - 1;
            const yearNum = parseInt(String(year));

            if (monthNum < 0 || monthNum > 11 || isNaN(yearNum)) {
                res.status(400).json({ error: 'month deve estar entre 1-12 e year deve ser válido' });
                return;
            }

            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            users.forEach(user => {
                const plainPhone = decryptPassword(user.phone);
                userMap.set(plainPhone, user.phone);
            });

            const encryptedPhone = userMap.get(targetPhone);

            if (!encryptedPhone) {
                res.status(404).json({ error: 'Nenhum usuário encontrado com este telefone' });
                return;
            }

            const startDate = new Date(yearNum, monthNum, 1);
            const endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59, 999);

            const query: any = {
                ownerPhone: encryptedPhone,
                date: { $gte: startDate, $lte: endDate }
            };

            if (status) query.status = status;

            let transactions = await Transaction.find(query)
                .sort({ date: -1 })
                .lean();

            if (includeShared) {
                const shared = await Transaction.find({
                    sharerPhone: encryptedPhone,
                    date: { $gte: startDate, $lte: endDate }
                })
                    .sort({ date: -1 })
                    .lean();

                transactions = [...transactions, ...shared];
            }

            const responseTransactions = transactions.map(tx => ({
                ...tx,
                ownerPhone: decryptPassword(tx.ownerPhone),
                counterpartyPhone: tx.counterpartyPhone ? decryptPassword(tx.counterpartyPhone) : undefined,
                sharerPhone: tx.sharerPhone ? decryptPassword(tx.sharerPhone) : undefined,
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
                ownerPhone: encryptedPhone,
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

            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            users.forEach(user => {
                userMap.set(decryptPassword(user.phone), user.phone);
            });

            if (!userMap.has(myPhone) || !userMap.has(targetPhone)) {
                res.status(404).json({ error: 'Um ou ambos os usuários não encontrados' });
                return;
            }

            const encryptedMy = userMap.get(myPhone)!;
            const encryptedTarget = userMap.get(targetPhone)!;

            const result = await Transaction.updateMany(
                { ownerPhone: encryptedTarget },
                { $set: { sharerPhone: encryptedMy, aggregate } }
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

    async deleteTransaction(req: Request, res: Response): Promise<void> {
        try {
            const { transactionId, ownerPhone } = req.body;

            if (!transactionId || !ownerPhone) {
                res.status(400).json({ error: 'transactionId e ownerPhone são obrigatórios' });
                return;
            }

            const targetPhone = String(ownerPhone).trim();
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            users.forEach(user => {
                const plainPhone = decryptPassword(user.phone);
                userMap.set(plainPhone, user.phone);
            });

            const encryptedOwner = userMap.get(targetPhone);

            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                res.status(404).json({ error: 'Transação não encontrada' });
                return;
            }

            if (transaction.ownerPhone !== encryptedOwner) {
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

            const targetPhone = String(ownerPhone).trim();
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();
            users.forEach(user => {
                const plain = decryptPassword(user.phone);
                userMap.set(plain, user.phone);
            });

            const encryptedPhone = userMap.get(targetPhone);
            if (!encryptedPhone) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return
            }

            const transaction = await Transaction.findOne({
                _id: transactionId,
                ownerPhone: encryptedPhone,
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
                addedBy: targetPhone,
            });

            transaction.updatedAt = new Date();
            await transaction.save();

            const response = {
                ...transaction.toObject(),
                ownerPhone: decryptPassword(transaction.ownerPhone),
                counterpartyPhone: transaction.counterpartyPhone ? decryptPassword(transaction.counterpartyPhone) : undefined,
                sharerPhone: transaction.sharerPhone ? decryptPassword(transaction.sharerPhone) : undefined,
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

            const targetPhone = String(ownerPhone).trim();
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();
            users.forEach(user => userMap.set(decryptPassword(user.phone), user.phone));

            const encryptedPhone = userMap.get(targetPhone);
            if (!encryptedPhone) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return
            }

            const transaction = await Transaction.findOne({
                _id: transactionId,
                ownerPhone: encryptedPhone,
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
                ownerPhone: decryptPassword(transaction.ownerPhone),
                counterpartyPhone: transaction.counterpartyPhone ? decryptPassword(transaction.counterpartyPhone) : undefined,
                sharerPhone: transaction.sharerPhone ? decryptPassword(transaction.sharerPhone) : undefined,
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