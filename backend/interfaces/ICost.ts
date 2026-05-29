export interface ICost {
    _id?: string;
    linkId: string;
    nome: string;
    valor: number;
    tipo:
    | "fixo"
    | "variavel";
    createdAt?: Date;
    updatedAt?: Date;
}