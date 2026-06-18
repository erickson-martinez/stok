// src/interfaces/transaction.ts

import { Types } from 'mongoose';

export type TransactionType =
    | 'revenue'
    | 'expense'
    | 'investment';

export type TransactionStatus =
    | 'pendente'
    | 'pago'
    | 'nao_pago'
    | 'parcial'
    | 'cancelado';

export interface ITransactionAddition {
    description: string;

    amount: number;

    addedAt: Date;

    /**
     * UID Firebase de quem adicionou
     */
    addedBy?: string;

    removed?: boolean;

    removedAt?: Date;

    removedReason?: string;
}

export interface IPaymentRequest {
    /**
     * Existe uma solicitação pendente?
     */
    requested: boolean;

    /**
     * Quando foi solicitada
     */
    requestedAt?: Date;

    /**
     * Email de quem solicitou
     */
    requestedBy?: string;

    /**
     * Mensagem opcional
     * Ex.: "Pix enviado"
     */
    message?: string;

    /**
     * Aprovado pelo proprietário
     */
    approved?: boolean;

    approvedAt?: Date;

    /**
     * UID do proprietário que aprovou
     */
    approvedBy?: string;

    /**
     * Rejeitado pelo proprietário
     */
    rejected?: boolean;

    rejectedAt?: Date;

    rejectedReason?: string;
}

export interface ITransaction {
    _id?: Types.ObjectId;

    /**
     * UID Firebase do proprietário da transação
     */
    idEmail: string;

    /**
     * Email ou telefone do usuário relacionado
     * (quem deve ou quem receberá)
     */
    sharedEmail?: string;

    targetEmail?: string;

    sharedPhone?: string;

    targetPhone?: string;

    type: TransactionType;

    name: string;

    /**
     * Valor total atual
     */
    amount: number;

    /**
     * Valor pago
     */
    paidAmount?: number;

    date: Date;

    /**
     * Indica se é compartilhada
     */
    isControlled: boolean;

    status: TransactionStatus;

    notes?: string;

    /**
     * Exibir em consolidações
     */
    aggregate?: boolean;

    additions?: ITransactionAddition[];

    /**
     * Fluxo de confirmação de pagamento
     */

    investment?: {
        percentage: number;
        renderDay: number;
        type: 'CDI' | 'CDB';
    };

    paymentRequest?: IPaymentRequest;

    createdAt?: Date;

    updatedAt?: Date;
}

export interface TransactionCreateDTO {
    idEmail: string;

    type: TransactionType;

    name: string;

    amount: number;

    date: string;

    status?: TransactionStatus;

    notes?: string;

    sharedEmailOrPhone?: string;

    targetEmailOrPhone?: string;
}

export interface TransactionUpdateDTO {
    transactionId: string;

    idEmail: string;

    name?: string;

    amount?: number;

    date?: string;

    status?: TransactionStatus;

    notes?: string;
}

export interface PaymentRequestDTO {
    transactionId: string;

    email: string;

    message?: string;
}

export interface ApprovePaymentDTO {
    transactionId: string;

    idEmail: string;
}

export interface RejectPaymentDTO {
    transactionId: string;

    idEmail: string;

    reason: string;
}