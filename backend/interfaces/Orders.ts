import { Document } from 'mongoose';

export interface OrderItem {
    id: number;
    qty: number;
}

export interface OrderAddress {
    address?: string;
    number?: string;
    neighborhood?: string;
}

export interface IOrder extends Document {
    id: number;
    burger: string;
    time: Date;
    name: string;
    phone: string;
    onclient: string;
    paymentMethod: string;
    delivery: boolean;
    deliveredBy?: string;
    pickupTime?: string;
    address?: OrderAddress;
    distancia?: number;
    items: OrderItem[];
    total: number;
    deliveryFee: number;
    status: 'Aguardando' | 'Em preparo' | 'Pronto' | 'Entregue' | 'Cancelado' | 'A caminho' | 'Aberto' | 'Fechamento';
    payment?: boolean;
    receivedTime?: Date;
    statusHistory?: {
        [status: string]: {
            start: Date;
            end: Date | null;
        };
    };
    createdAt?: Date;
    updatedAt?: Date;
}