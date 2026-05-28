export interface IAppointmentBarber {
    _id?: string;

    clienteNome: string;
    clienteTelefone: string;
    barbeiroId: string;
    servicosIds: string[];
    descricaoServicos?: string;
    produtosIds: string[];
    dataAgendada: string;
    horarios: string[];
    status:
    | "pendente"
    | "atendendo"
    | "finalizado"
    | "cancelado"
    | "pago"
    ;
    quantidadePessoas: number;
    nomesAcompanhantes?: string;
    valorTotalPrevisto: number;
    tipoPagamento?: string[];
    linkId: string;
    createdAt?: Date;
    updatedAt?: Date;
}