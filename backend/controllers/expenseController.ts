import { Request, Response } from 'express';
import Expense from '../models/Expense';
import User from "../models/User";
import crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv"; // Supondo que você tenha um arquivo de utilitários para criptografia

dotenv.config();
import { ExpenseRequest } from '../interfaces/expense';

// Carrega a ENCRYPTION_KEY do .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

// Verifica se a ENCRYPTION_KEY está definida
if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não está definida no arquivo .env");
}
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

const expenseController = {
    async getExpenses(req: Request, res: Response): Promise<void> {
        try {
            const { idUser } = req.params;
            if (!idUser) {
                res.status(400).json({ error: 'idUser é obrigatório' });
                return;
            }

            const expense = await Expense.findOne({ idUser });
            if (!expense) {
                res.status(200).json([]);
                return;
            }

            res.json(expense);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async getExpensesShared(req: Request, res: Response): Promise<void> {
        try {
            const { idUserShared } = req.params;
            if (!idUserShared) {
                res.status(400).json({ error: 'idUserShared é obrigatório' });
                return;
            }

            const expenses = await Expense.find({ idUserShared });

            if (!expenses || expenses.length === 0) {
                res.status(200).json([]);
                return;
            }

            res.json(expenses);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async createExpense(req: Request, res: Response): Promise<void> {
        try {
            const { idUser, idUserShared, receitas, despesas }: ExpenseRequest = req.body;

            if (!idUser) {
                res.status(400).json({ error: 'idUser é obrigatório' });
                return;
            }

            const userAll = await User.find({});
            const users = userAll.map((user) => {
                return {
                    phone: decryptPassword(user.phone),
                    _id: user._id
                }
            })

            const mongoose = require('mongoose'); // Certifique-se de importar o Mongoose

            let expense = await Expense.findOne({ idUser });

            if (!expense && (receitas || despesas)) {
                expense = new Expense({
                    idUser,
                    idUserShared: users.find((user) => user.phone == idUserShared)?._id as string | undefined,
                    receitas: [],
                    despesas: [],
                    createAt: new Date(),
                    updateAt: new Date()
                });
            }

            if (expense && receitas) {
                // Valida e adiciona receitas com _id gerado
                const validReceitas = receitas.filter(receita =>
                    receita.name &&
                    receita.whenPay &&
                    Number.isFinite(receita.total) &&
                    typeof receita.paid === 'boolean'
                );

                if (validReceitas.length !== receitas.length) {
                    console.warn("Algumas receitas foram ignoradas devido a dados inválidos.");
                }

                expense.receitas.push(...validReceitas.map(receita => ({
                    _id: new mongoose.Types.ObjectId(), // Gera um _id único
                    name: receita.name,
                    idDebts: receita.idDebts,
                    whenPay: new Date(receita.whenPay),
                    total: receita.total,
                    paid: receita.paid,
                    values: receita.values || []
                })));
            }

            if (expense && despesas) {
                // Valida e adiciona despesas com _id gerado
                const validDespesas = despesas.filter(despesa =>
                    despesa.name &&
                    despesa.whenPay &&
                    Number.isFinite(despesa.total) &&
                    typeof despesa.paid === 'boolean'
                );

                if (validDespesas.length !== despesas.length) {
                    console.warn("Algumas despesas foram ignoradas devido a dados inválidos.");
                }

                expense.despesas.push(...validDespesas.map(despesa => {
                    return ({
                        _id: new mongoose.Types.ObjectId(), // Gera um _id único
                        name: despesa.name,
                        idOrigem: despesa.idOrigem,
                        whenPay: new Date(despesa.whenPay),
                        isDebt: despesa.isDebt,
                        total: despesa.total,
                        paid: despesa.paid,
                        values: despesa.values || []
                    })
                }));
            }

            if (expense) {
                expense.updateAt = new Date();
                await expense.save();
            }

            res.status(201).json(expense);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateExpense(req: Request, res: Response): Promise<void> {
        try {
            const { idUser, idUserShared, receitas, despesas }: ExpenseRequest = req.body;

            if (!idUser) {
                res.status(400).json({ error: 'idUser é obrigatório' });
                return;
            }
            const userAll = await User.find({});
            const users = userAll.map((user) => {
                return {
                    phone: decryptPassword(user.phone),
                    _id: user._id
                }
            })

            const expense = await Expense.findOne({ idUser });
            if (!expense) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            if (idUserShared) {
                expense.idUserShared = users.find((user) => user.phone == idUserShared)?._id as string | undefined;
            }

            if (expense && receitas) {
                const newReceitas = receitas.map(receita => ({
                    name: receita.name,
                    whenPay: new Date(receita.whenPay),
                    total: receita.total,
                    paid: receita.paid,
                    values: receita.values || []
                }));
                expense.receitas.push(...newReceitas);
            }

            if (expense && despesas) {
                const newDespesas = despesas.map(despesa => ({
                    name: despesa.name,
                    whenPay: new Date(despesa.whenPay),
                    total: despesa.total,
                    paid: despesa.paid,
                    values: despesa.values || []
                }));
                expense.despesas.push(...newDespesas);
            }

            expense.updateAt = new Date();
            await expense.save();
            res.json(expense);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateExpenseItem(req: Request, res: Response): Promise<void> {
        try {
            const { idUser, idUserShared, receitas, despesas }: ExpenseRequest = req.body;

            if (!idUser) {
                res.status(400).json({ error: 'idUser é obrigatório' });
                return;
            }

            const userAll = await User.find({});
            const users = userAll.map((user) => ({
                phone: decryptPassword(user.phone),
                _id: user._id,
            }));

            const expense = await Expense.findOne({ idUser });
            if (!expense) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            if (idUserShared) {
                expense.idUserShared = users.find((user) => user.phone === idUserShared)?._id as string | undefined;
            }

            // Atualizar Receitas
            if (receitas) {
                for (const newReceita of receitas) {
                    const existingReceita = expense.receitas.find(item => (item._id ?? '').toString() === newReceita._id);
                    if (existingReceita) {
                        existingReceita.name = newReceita.name;
                        existingReceita.whenPay = new Date(newReceita.whenPay);
                        existingReceita.total = newReceita.total;
                        existingReceita.totalPaid = newReceita.totalPaid || existingReceita.totalPaid || 0;
                        existingReceita.paid = newReceita.paid;
                        existingReceita.isDebt = newReceita.isDebt || existingReceita.isDebt;
                        existingReceita.idDebts = newReceita.idDebts || existingReceita.idDebts;
                        existingReceita.values = (newReceita.values ?? []).map(val => ({
                            _id: new mongoose.Types.ObjectId(),
                            name: val.name,
                            value: val.value,
                            paid: val.paid || false,
                            notify: val.notify || false,
                        }));
                    }
                }
            }

            // Atualizar Despesas
            if (despesas) {
                for (const newDespesa of despesas) {
                    const existingDespesa = expense.despesas.find(item => (item._id ?? '').toString() === newDespesa._id);
                    if (existingDespesa) {
                        existingDespesa.name = newDespesa.name;
                        existingDespesa.whenPay = new Date(newDespesa.whenPay);
                        existingDespesa.total = newDespesa.total;
                        existingDespesa.totalPaid = newDespesa.totalPaid || existingDespesa.totalPaid || 0;
                        existingDespesa.paid = newDespesa.paid;
                        existingDespesa.isDebt = newDespesa.isDebt || existingDespesa.isDebt;
                        existingDespesa.idOrigem = newDespesa.idOrigem || existingDespesa.idOrigem;
                        existingDespesa.values = (newDespesa.values ?? []).map(val => ({
                            _id: val._id || new mongoose.Types.ObjectId(),
                            name: val.name,
                            value: val.value,
                            paid: false, // Devedor não pode marcar paid
                            notify: val.notify || false,
                        }));
                    }
                }
            }

            expense.updateAt = new Date();
            await expense.save();
            res.json(expense);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async updatePaymentStatus(req: Request, res: Response): Promise<void> {
        try {
            const {
                idUser,
                type,
                itemId,
                isPaid,
                valueId,
                idUserShared
            }: {
                idUser: string,
                type: 'receita' | 'despesa',
                itemId: string,
                isPaid: boolean,
                valueId?: string,
                idUserShared?: string
            } = req.body;

            if (!idUser || !itemId || typeof isPaid === 'undefined') {
                res.status(400).json({ error: 'idUser, itemId e isPaid são obrigatórios' });
                return;
            }

            // Verifica se há usuário compartilhado e decripta os telefones
            let users: { phone: string; _id: string }[] = [];
            if (idUserShared) {
                const userAll = await User.find({});
                users = userAll.map((user) => ({
                    phone: decryptPassword(user.phone),
                    _id: user._id as string
                }));
            }

            const expense = await Expense.findOne({ idUser });
            if (!expense) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            // Atualiza idUserShared se fornecido
            if (idUserShared) {
                expense.idUserShared = users.find((user) => user.phone === idUserShared)?._id as string | undefined;
            }

            const items = type === 'receita' ? expense.receitas : expense.despesas;
            const itemIndex = items.findIndex(i => (i._id ?? '').toString() === itemId);

            if (itemIndex === -1) {
                res.status(404).json({ error: 'Item não encontrado' });
                return;
            }

            // Atualização do status de pagamento
            if (valueId) {
                // Atualiza um valor específico dentro do item
                const valueIndex = items[itemIndex].values.findIndex((v: any) => v._id.toString() === valueId);
                if (valueIndex !== -1) {
                    items[itemIndex].values[valueIndex].paid = isPaid;

                    // Se for uma confirmação do cobrador em receita vinculada, atualiza o total pago
                    if (isPaid && type === 'receita' && (items[itemIndex] as any).isDebt) {
                        (items[itemIndex] as any).totalPaid += Number(items[itemIndex].values[valueIndex].value) || 0;
                    }
                }
            } else {
                // Atualiza o item inteiro
                items[itemIndex].paid = isPaid;
            }

            expense.updateAt = new Date();
            await expense.save();

            // Se for uma receita vinculada, atualiza a despesa correspondente
            if (type === 'receita' && (items[itemIndex] as any).isDebt && (items[itemIndex] as any).idOrigem) {
                await Expense.updateOne(
                    { "despesas._id": new mongoose.Types.ObjectId((items[itemIndex] as any).idOrigem) },
                    {
                        $set: {
                            "despesas.$.paid": isPaid,
                            "despesas.$.totalPaid": (items[itemIndex] as any).totalPaid,
                            updateAt: new Date()
                        }
                    }
                );
            }

            res.json(expense);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteExpense(req: Request, res: Response): Promise<void> {
        try {
            const { idUser, type, id } = req.query as {
                idUser?: string;
                type?: 'receitas' | 'despesas';
                id?: string;
            };


            if (!idUser) {
                res.status(400).json({ error: 'Em construção' });
                return;
            }
            if (!type || !id) {
                res.status(400).json({ error: 'type e id são obrigatórios' });
                return;
            }
            if (!['receitas', 'despesas'].includes(type)) {
                res.status(400).json({ error: 'Tipo inválido. Use "receitas" ou "despesas"' });
                return;
            }
            if (!mongoose.Types.ObjectId.isValid(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return;
            }

            const updateField = type === 'receitas' ? 'receitas' : 'despesas';
            const objectId = new mongoose.Types.ObjectId(id);

            // Verifica se o documento existe
            const expense = await Expense.findOne({ idUser });
            if (!expense) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            // Verifica se o item existe no array
            const itemExists = expense[updateField].some(item => item._id?.toString() === id);
            if (!itemExists) {
                res.status(404).json({ error: 'Item não encontrado' });
                return;
            }

            // Executa a operação $pull
            const result = await Expense.updateOne(
                { idUser },
                {
                    $pull: {
                        [updateField]: { _id: objectId }
                    },
                    $set: { updateAt: new Date() }
                },
                { runValidators: true }
            );


            if (result.modifiedCount === 0) {
                // Tenta uma abordagem alternativa
                const expenseUpdated = await Expense.findOneAndUpdate(
                    { idUser },
                    {
                        $pull: {
                            [updateField]: { _id: objectId }
                        },
                        $set: { updateAt: new Date() }
                    },
                    { new: true, runValidators: true }
                );

                if (!expenseUpdated) {
                    res.status(404).json({ error: 'Falha ao remover item' });
                    return;
                }

                // Verifica se o item ainda existe
                const stillExists = expenseUpdated[updateField].some(item => item._id?.toString() === id);
                if (stillExists) {
                    res.status(500).json({ error: 'Falha ao remover item' });
                    return;
                }
            }

            // Busca o documento atualizado
            const updatedExpense = await Expense.findOne({ idUser });
            if (!updatedExpense) {
                res.status(404).json({ error: 'Registro não encontrado após atualização' });
                return;
            }

            // Deleta o documento se ambos os arrays estiverem vazios
            if (updatedExpense.receitas.length === 0 && updatedExpense.despesas.length === 0) {
                await Expense.deleteOne({ idUser });
                res.json({ message: 'Registro completo deletado' });
                return;
            }

            res.json({ message: 'Item deletado com sucesso', expense: updatedExpense });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteExpenseItem(req: Request, res: Response): Promise<void> {
        try {
            const { idUser, type, id, valuesId } = req.query as {
                idUser?: string;
                type?: 'receitas' | 'despesas';
                id?: string;
                valuesId?: string;
            };

            // Validações básicas
            if (!idUser || !type || !id || !valuesId) {
                res.status(400).json({ error: 'Todos os parâmetros são obrigatórios' });
                return;
            }

            if (!['receitas', 'despesas'].includes(type)) {
                res.status(400).json({ error: 'Tipo inválido. Use "receitas" ou "despesas"' });
                return;
            }

            // Validação de ObjectId
            if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(valuesId)) {
                res.status(400).json({ error: 'IDs inválidos' });
                return;
            }

            const updateField = type === 'receitas' ? 'receitas' : 'despesas';
            const objectId = new mongoose.Types.ObjectId(id);
            const valueObjectId = new mongoose.Types.ObjectId(valuesId);

            // 1. Encontra o documento
            const expense = await Expense.findOne({ idUser });
            if (!expense) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            // 2. Encontra o item principal
            const mainItem = expense[updateField].find(
                (item) => item._id?.toString() === id
            );

            if (!mainItem) {
                res.status(404).json({ error: 'Item principal não encontrado' });
                return;
            }

            // 3. Verifica se o valor existe
            const valueItem = mainItem.values.find((v: any) => v._id == valuesId);

            if (!valueItem) {
                res.status(404).json({ error: 'Item interno não encontrado' });
                return;
            }

            // 4. Calcula o novo total
            const valueToSubtract = typeof valueItem.value === 'number' ? valueItem.value : 0;
            const newTotal = mainItem.total - valueToSubtract;

            // 5. Atualização no banco de dados
            const result = await Expense.updateOne(
                {
                    idUser,
                    [`${updateField}._id`]: objectId
                },
                {
                    $pull: {
                        [`${updateField}.$.values`]: { _id: valueObjectId }
                    },
                    $set: {
                        [`${updateField}.$.total`]: newTotal,
                        updateAt: new Date()
                    }
                },
                { runValidators: true }
            );

            if (result.modifiedCount === 0) {
                res.status(404).json({ error: 'Nenhum item foi modificado' });
                return;
            }

            // 6. Retorna a resposta
            res.json({
                success: true,
                message: 'Item deletado com sucesso',
                newTotal
            });
        } catch (error: any) {
            console.error('Erro ao deletar item:', error);
            res.status(500).json({
                error: 'Erro interno no servidor',
                details: error.message
            });
        }
    }
}

export default expenseController;