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

                expense.despesas.push(...validDespesas.map(despesa => ({
                    _id: new mongoose.Types.ObjectId(), // Gera um _id único
                    name: despesa.name,
                    whenPay: new Date(despesa.whenPay),
                    total: despesa.total,
                    paid: despesa.paid,
                    values: despesa.values || []
                })));
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
            const users = userAll.map((user) => {
                return {
                    phone: decryptPassword(user.phone),
                    _id: user._id
                };
            });

            const expense = await Expense.findOne({ idUser });
            if (!expense) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            if (idUserShared) {
                expense.idUserShared = users.find((user) => user.phone == idUserShared)?._id as string | undefined;
            }

            // Atualizar Receitas
            if (expense && receitas) {
                const newReceitas = receitas.map(receita => ({
                    id: receita._id,
                    name: receita.name,
                    whenPay: new Date(receita.whenPay),
                    total: receita.total,
                    paid: receita.paid,
                    values: receita.values || []
                }));
                newReceitas.forEach(newReceita => {
                    const existingReceita = expense.receitas.find(item => item._id === newReceita.id);
                    if (existingReceita) {
                        Object.assign(existingReceita, newReceita);
                    }
                });
            }

            // Atualizar Despesas
            if (expense && despesas) {
                const newDespesas = despesas.map(despesa => ({
                    id: despesa._id,
                    name: despesa.name,
                    whenPay: new Date(despesa.whenPay),
                    total: despesa.total,
                    paid: despesa.paid,
                    values: despesa.values || []
                }));
                newDespesas.forEach(newDespesa => {
                    const existingDespesa = expense.despesas.find(item => item._id === newDespesa.id);
                    if (existingDespesa) {
                        Object.assign(existingDespesa, newDespesa);
                    }
                });
            }

            expense.updateAt = new Date();
            await expense.save();
            res.json(expense);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },


    async deleteExpense(req: Request, res: Response): Promise<void> {
        try {

            res.status(400).json({ error: 'Em construção' });


        } catch (error: any) {
            res.status(400).json({ error: 'Em construção' });

        }
    }
}

export default expenseController;