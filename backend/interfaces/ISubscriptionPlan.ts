//interfaces/ISubscriptionPlan.ts

export interface ISubscriptionPlan {
    _id?: string;

    codigo: number;

    nome: string;

    descricao?: string;

    valorMensal: number;

    servicosIds: string[];

    limiteMensal?: number | null;

    ativo: boolean;

    linkId: string;

    createdAt?: Date;

    updatedAt?: Date;
}