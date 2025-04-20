// interfaces/expense.ts
import { Types } from 'mongoose';

export interface IValue {
    name: string;
    value: number | string;
    _id?: string | Types.ObjectId;
    paid?: boolean; // Campo para valores individuais
    notify?: boolean; // Campo para notificações
}

export interface ITransaction {
    _id?: string | Types.ObjectId;
    name: string;
    whenPay: Date;
    total: number;
    paid: boolean;
    isDebt?: boolean; // Identifica receitas vinculadas
    idOrigem?: string; // Referencia a receita original (em despesas)
    idReceita?: string; // Referencia a despesa original (em receitas)
    idDespesa?: string; // Referencia a despesa original (em receitas)
    idDebts?: string; // Identifica o cobrador (em receitas)
    notify?: boolean; // Para notificações
    totalPaid?: number; // Total pago
    values: IValue[];
}

export interface IExpense {
    idUser: string;
    idUserShared?: string;
    receitas: ITransaction[];
    despesas: ITransaction[];
    createAt: Date;
    updateAt: Date;
}

export interface ValueRequest {
    name: string;
    value: number | string;
    _id?: string | Types.ObjectId;
    paid?: boolean; // Adicionado para suportar status de pagamento
    notify?: boolean; // Adicionado para suportar notificações
}

export interface TransactionRequest {
    _id?: string | Types.ObjectId;
    name: string;
    whenPay: string;
    total: number;
    paid: boolean;
    idDebts?: string; // Para receitas vinculadas
    idOrigem?: string; // Para despesas vinculadas
    idReceita?: string; // Para despesas vinculadas
    idDespesa?: string; // Para receitas vinculadas
    isDebt?: boolean; // Para identificar receitas vinculadas
    totalPaid?: number; // Para rastrear total pago
    notify?: boolean; // Para notificações
    values?: ValueRequest[];
}

export interface UpdateReceitaDespesaRequest {
    idUser: string;
    idReceita: string;
    idDespesa: string;
}

export interface ExpenseRequest {
    idUser: string;
    idUserShared?: string;
    receitas?: TransactionRequest[];
    despesas?: TransactionRequest[];
}