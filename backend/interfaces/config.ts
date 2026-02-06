//interfaces/config.ts
import { Document } from 'mongoose';

export interface IConfig extends Document {
    PAYMENT_METHODS: string[];
    BURGER: string;
    CNPJ: string;
    STATUS: string;
    CAIXA: string[];
    CAIXA_OPEN_DAY: string;
    GARCOM: string[];
    DELIVERY: string[];
    phone: string;
    MANAGER_PHONE?: string;
    COORDENATOR_PHONE?: string[];
    DEBIT_CARD_FEE_RATE: number;
    CREDIT_CARD_FEE_RATE: number;
    TAXA_DELIVERY_FIXA: number;
    PERIOD: String[];
    TAXA_POR_KM: number;
    PREFIXOS_LOGRADOURO: string[];
    latitude: string;
    longitude: string;
    DELIVERY_FEE: number;
    TABLE_COUNT: number;
}