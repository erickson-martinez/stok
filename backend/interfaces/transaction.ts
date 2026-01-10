import { Types } from 'mongoose';

export type TransactionType = 'revenue' | 'expense';

export type TransactionStatus = 'pago' | 'nao_pago' | 'parcial' | 'cancelado';

export interface ITransaction {
    _id?: Types.ObjectId;
    ownerPhone: string;                // Quem é o dono real da transação
    type: TransactionType;
    name: string;
    amount: number;
    date: Date;                        // data de vencimento/recebimento esperado
    isControlled: boolean;
    controlId?: string;                // mesmo valor nas duas pontas da transação controlada
    counterpartyPhone?: string;        // telefone da outra ponta (se controlada)
    status: TransactionStatus;
    paidAmount?: number;               // para pagamentos parciais
    notes?: string;

    // Campos de compartilhamento / "seguindo"
    sharerPhone?: string;              // quem está acompanhando essa transação
    aggregate?: boolean;               // true = deve aparecer no agregado do usuário que segue

    createdAt?: Date;
    updatedAt?: Date;
}

export interface TransactionCreateDTO {
    ownerPhone: string;
    type: TransactionType;
    name: string;
    amount: number;
    date: string;                      // ISO ou formato aceitável
    isControlled?: boolean;
    counterpartyPhone?: string;
    status?: TransactionStatus;
    notes?: string;
}

export interface ControlledTransactionPair {
    mySide: ITransaction;
    counterpartySide: ITransaction;
}