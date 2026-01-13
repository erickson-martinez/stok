import { Schema, model, Document, Types } from 'mongoose';

export type WorkRecordStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';

export interface IWorkRecord extends Document {
    employeePhone: string;          // funcionário que registrou
    companyId: Types.ObjectId;      // empresa vinculada (referência ao model Company)
    entryTime: Date;                // data + hora de entrada
    exitTime?: Date;                // data + hora de saída (opcional)
    durationMinutes?: number;       // calculado ou informado
    notes?: string;
    status: WorkRecordStatus;
    approvedBy?: string;            // phone de quem aprovou (opcional)
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const workRecordSchema = new Schema<IWorkRecord>(
    {
        employeePhone: { type: String, required: true, index: true },
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
        entryTime: { type: Date, required: true },
        exitTime: { type: Date },
        durationMinutes: { type: Number, min: 0 },
        notes: { type: String, trim: true },
        status: {
            type: String,
            enum: ['pendente', 'aprovado', 'rejeitado', 'cancelado'],
            default: 'pendente',
        },
        approvedBy: { type: String },
        rejectionReason: { type: String },
    },
    { timestamps: true }
);

workRecordSchema.index({ employeePhone: 1, entryTime: -1 });
workRecordSchema.index({ companyId: 1, status: 1 });

export default model<IWorkRecord>('WorkRecord', workRecordSchema);