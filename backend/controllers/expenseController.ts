import { Request, Response } from 'express';
import Expense from '../models/Expense';

interface TransactionRequest {
    _id: string;
    name: string;
    value: number;
    date: string;
    appellant?: {
        initial?: Date;
        finily?: Date;
    };
}

interface ExpenseRequest {
    phone: string;
    phoneShared?: string;
    receita?: TransactionRequest[];
    despesa?: TransactionRequest[];
}

const expenseController = {
    async getExpenses(req: Request, res: Response): Promise<void> {
        try {
            const { phone } = req.query as { phone?: string };
            if (!phone) {
                res.status(400).json({ error: 'Phone é obrigatório' });
                return;
            }

            const expense = await Expense.findOne({ phone });
            if (!expense) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            res.json(expense);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async createExpense(req: Request, res: Response): Promise<void> {
        try {
            const { phone, phoneShared, receita, despesa }: ExpenseRequest = req.body;

            if (!phone) {
                res.status(400).json({ error: 'Phone é obrigatório' });
                return;
            }

            let expense = await Expense.findOne({ phone });

            if (!expense) {
                expense = new Expense({
                    phone,
                    phoneShared,
                    receita: receita || [],
                    despesa: despesa || []
                });
            } else {
                if (receita) expense.receita.push(...receita.map(r => ({ ...r, date: new Date(r.date) })));
                if (despesa) expense.despesa.push(...despesa.map(d => ({ ...d, date: new Date(d.date) })));
                expense.updateAt = new Date();
            }

            await expense.save();
            res.status(201).json(expense);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateExpense(req: Request, res: Response): Promise<void> {
        try {
            const { phone, receita, despesa }: ExpenseRequest = req.body;

            if (!phone) {
                res.status(400).json({ error: 'Phone é obrigatório' });
                return;
            }

            const expense = await Expense.findOne({ phone });
            if (!expense) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            if (receita) expense.receita.push(...receita.map(r => ({ ...r, date: new Date(r.date) })));
            if (despesa) expense.despesa.push(...despesa.map(d => ({ ...d, date: new Date(d.date) })));
            expense.updateAt = new Date();

            await expense.save();
            res.json(expense);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    async deleteExpense(req: Request, res: Response): Promise<void> {
        try {
            const { phone, type, id } = req.query as {
                phone?: string;
                type?: 'receita' | 'despesa';
                id?: string
            };

            if (!phone) {
                res.status(400).json({ error: 'Phone é obrigatório' });
                return;
            }

            const expense = await Expense.findOne({ phone });
            if (!expense) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            if (type && id) {
                if (type === 'receita') {
                    expense.receita = expense.receita.filter(r => r._id.toString() !== id);
                } else if (type === 'despesa') {
                    expense.despesa = expense.despesa.filter(d => d._id.toString() !== id);
                }

                if (expense.receita.length === 0 && expense.despesa.length === 0) {
                    await Expense.deleteOne({ phone });
                    res.json({ message: 'Registro completo deletado' });
                    return;
                }

                expense.updateAt = new Date();
                await expense.save();
                res.json(expense);
                return;
            }

            await Expense.deleteOne({ phone });
            res.json({ message: 'Registro deletado' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};

export default expenseController;