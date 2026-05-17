export interface IBarber {
    _id?: string;
    nome: string;
    telefone: string;
    comissao: number;
    corte: number;
    diasTrabalhados: string[];
    linkId: string;
    createdAt?: Date;
}