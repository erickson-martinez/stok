export interface ICommission {
    _id?: string;
    email: string;
    valorComissao: number;
    data: string;
    status: "pendente" | "pago" | "cancelado";
    linkId: string;
    barbeiroNome: string;
    paidAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
