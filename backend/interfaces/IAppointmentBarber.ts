export interface IAppointmentBarber {
    _id?: string;

    clienteNome: string;
    clienteTelefone: string;
    barbeiroId: string;
    servicosIds: string[];
    produtosIds: string[];
    dataAgendada: string;
    horarios: string[];
    status:
    | "pendente"
    | "atendendo"
    | "concluido"
    | "cancelado";
    quantidadePessoas: number;
    nomesAcompanhantes?: string;
    valorTotalPrevisto: number;
    linkId: string;
    createdAt?: Date;
    updatedAt?: Date;
}