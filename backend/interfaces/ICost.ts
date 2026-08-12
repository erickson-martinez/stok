export interface ICost {
    _id?: string;
    linkId: string;
    nome: string;
    valor: number;
    dateInicial?: Date;
    dateFinal?: Date;
    status: "pago" | "pendente";
    idTransacao: idTransacao[];
    tipo:
    | "fixo"
    | "variavel";
    createdAt?: Date;
    updatedAt?: Date;
}

interface idTransacao {
    id: string;
    mesAnoReferencia: string;
}