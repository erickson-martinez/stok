//interface/ISubscriptionClient.ts

export interface ISubscriptionClient {

    _id?: string;

    codigo: number;

    nome: string;

    telefone: string;

    email: string;

    idEmail?: string;

    planoId: string;

    ativo: boolean;

    dataInicio: Date;

    dataFim?: Date;

    observacao?: string;

    linkId: string;

    createdAt?: Date;

    updatedAt?: Date;
}