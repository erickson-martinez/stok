import { Schema, model, Document, Types } from 'mongoose';

export type OSStatus =
    | 'aberto'
    | 'em_andamento'
    | 'pausado'
    | 'resolvido'
    | 'cancelado';

export interface IOrderService extends Document {
    openerPhone: string;              // telefone criptografado de quem abriu
    companyId: Types.ObjectId;        // empresa responsável / vinculada
    title: string;
    description: string;
    status: OSStatus;
    createdAt: Date;
    updatedAt: Date;

    // Campos preenchidos na resolução
    resolverPhone?: string;           // quem resolveu (criptografado)
    resolution?: string;              // descrição da solução
    resolvedAt?: Date;

    // Opcional – para rastreamento mais detalhado
    assignedTo?: string;              // telefone de técnico/responsável interno
    priority?: 'baixa' | 'média' | 'alta' | 'urgente';
    category?: string;                // ex: "TI", "Manutenção", "RH", etc.
}

const orderServiceSchema = new Schema<IOrderService>(
    {
        openerPhone: { type: String, required: true, index: true },
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        description: { type: String, required: true, trim: true, maxlength: 2000 },
        status: {
            type: String,
            enum: ['aberto', 'em_andamento', 'pausado', 'resolvido', 'cancelado'],
            default: 'aberto',
            index: true,
        },
        resolverPhone: { type: String },
        resolution: { type: String, trim: true, maxlength: 2000 },
        resolvedAt: { type: Date },
        assignedTo: { type: String },
        priority: { type: String, enum: ['baixa', 'média', 'alta', 'urgente'], default: 'média' },
        category: { type: String, trim: true },
    },
    { timestamps: true }
);

orderServiceSchema.index({ companyId: 1, status: 1 });
orderServiceSchema.index({ openerPhone: 1, createdAt: -1 });

export default model<IOrderService>('OrderService', orderServiceSchema);