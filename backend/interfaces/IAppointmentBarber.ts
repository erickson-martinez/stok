//interface/IAppointmentBarber.ts

export interface IAppointmentItem {
    id: string;

    tipo: "servico" | "produto";

    nome: string;

    categoria?: string;

    quantidade: number;

    valorUnitario: number;

    valorTotal: number;
}

export interface IAppointmentSubscription {
    possui: boolean;

    assinaturaId?: string;

    planoId?: string;

    planoNome?: string;

    valorMensal?: number;

    atendimentoNumero?: number;

    codigoAtendimento?: number;

    valorSimbolico?: number;
}

export interface IAppointmentPayment {
    status:
    | "pendente"
    | "atendendo"
    | "finalizado"
    | "pago"
    | "cancelado"
    | "assinatura";

    formas: string[];

    desconto: number;

    subtotalServicos: number;

    subtotalProdutos: number;

    valorOriginal: number;

    valorCobrado: number;

    dataPagamento?: string | Date;

    usuarioPagamento?: string;

    valorRecebido?: number;

    troco?: number;
}

export interface IAppointmentBarber {
    _id?: string;

    clienteNome: string;

    clienteTelefone?: string;

    clienteEmail?: string;

    barbeiroId: string;

    dataAgendada: string | Date;

    horarios: string[];

    status:
    | "pendente"
    | "atendendo"
    | "finalizado"
    | "cancelado"
    | "pago";

    quantidadePessoas: number;

    nomesAcompanhantes?: string;

    descricaoServicos?: string;

    /**
     * IDs apenas para pesquisa e filtros.
     * O histórico fica salvo em "items".
     */
    servicosIds: string[];

    produtosIds: string[];

    /**
     * Snapshot do atendimento.
     * Nunca deve ser alterado depois do atendimento.
     */
    items: IAppointmentItem[];

    /**
     * Snapshot da assinatura utilizada.
     */
    assinatura?: IAppointmentSubscription;

    /**
     * Informações financeiras do atendimento.
     */
    pagamento: IAppointmentPayment;

    createdBy?: string;

    updatedBy?: string;

    estoqueMovimentado?: boolean;

    linkId: string;

    createdAt?: Date;

    updatedAt?: Date;
}
