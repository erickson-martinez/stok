// interfaces/expense.ts
export interface IValue {
    name: string;
    value: number | string;
}

export interface ITransaction {
    _id?: string | import('mongoose').Types.ObjectId;
    name: string;
    whenPay: Date;
    total: number;
    paid: boolean;
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
}

export interface TransactionRequest {
    _id?: string | import('mongoose').Types.ObjectId;
    name: string;
    whenPay: string;
    total: number;
    paid: boolean;
    values?: ValueRequest[];
}

export interface ExpenseRequest {
    idUser: string;
    idUserShared?: string;
    receitas?: TransactionRequest[];
    despesas?: TransactionRequest[];
}