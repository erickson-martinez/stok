export interface IBarberService {
    _id?: string;

    nome: string;

    categoria:
    | "cabelo"
    | "barba"
    | "cabelo_e_barba"
    | "outro";

    valor: number;

    linkId: string;

    createdAt?: Date;
}