export interface IBarberProduct {
    _id?: string
    nome: string
    categoria: string
    custo: number
    comissao: number
    margemLucro: number
    precoVenda: number
    estoque: number
    linkId: string
    createdAt?: Date
    updatedAt?: Date
}