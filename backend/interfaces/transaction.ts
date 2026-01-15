// src/interfaces/transaction.ts
import { Types } from 'mongoose';

export type TransactionType = 'revenue' | 'expense';

export type TransactionStatus = 'pago' | 'nao_pago' | 'parcial' | 'cancelado';

export interface ITransaction {
    _id?: Types.ObjectId;

    ownerPhone: string;                // Telefone criptografado do dono da transação
    type: TransactionType;
    name: string;
    amount: number;                    // Valor total atual (base + adições - remoções)
    date: Date;                        // Data de referência/vencimento
    isControlled: boolean;
    controlId?: string;
    counterpartyPhone?: string;
    status: TransactionStatus;
    paidAmount?: number;
    notes?: string;

    // Campos de compartilhamento / acompanhamento
    sharerPhone?: string;
    aggregate?: boolean;

    // Histórico estruturado de adições e subtrações
    additions?: Array<{
        description: string;             // ex: "Material hidráulico - tubos e conexões"
        amount: number;
        addedAt: Date;
        addedBy?: string;                // telefone de quem adicionou
        removed?: boolean;               // soft-delete
        removedAt?: Date;
        removedReason?: string;
    }>;

    createdAt?: Date;
    updatedAt?: Date;
}

export interface TransactionCreateDTO {
    ownerPhone: string;
    type: TransactionType;
    name: string;
    amount: number;
    date: string;                      // ISO ou formato aceitável
    status?: TransactionStatus;
    notes?: string;
}

export interface ControlledTransactionPair {
    mySide: ITransaction;
    counterpartySide: ITransaction;
}