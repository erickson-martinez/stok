export interface ICompanyConfig {
    linkId: string;
    taxas: {
        pix: number;
        dinheiro: number;
        credito: number;
        debito: number;
    };
    metaLucro: number;
    imposto: number;
    createdAt?: Date;
    updatedAt?: Date;
}