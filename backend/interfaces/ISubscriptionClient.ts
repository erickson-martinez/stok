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

    pagamento: {
        status: "pendente" | "pago" | "cancelado";
        formas: string[];
        valorOriginal: number;
        valorCobrado: number;
        valorRecebido?: number;
        troco?: number;
        dataPagamento?: Date;
        usuarioPagamento?: string;
    };

    dataInicio: Date;

    dataFim?: Date;

    observacao?: string;

    linkId: string;

    createdAt?: Date;

    updatedAt?: Date;
}
