import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEmployee extends Document {
    userPhone: string;           // telefone criptografado (FK → User.phone)
    company: Types.ObjectId;     // referência à empresa
    role?: string;               // "admin", "rh", "funcionario", "gerente", etc.
    status: "ativo" | "inativo" | "pendente";
    admittedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
    {
        userPhone: {
            type: String,
            required: true,
            index: true,
        },
        company: {
            type: Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },
        role: {
            type: String,
            enum: ["admin", "rh", "gerente", "funcionario", "outros"],
            default: "funcionario",
        },
        status: {
            type: String,
            enum: ["ativo", "inativo", "pendente"],
            default: "pendente",
        },
        admittedAt: {
            type: Date,
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

// Índice composto para evitar duplicatas (mesmo usuário na mesma empresa)
EmployeeSchema.index({ userPhone: 1, company: 1 }, { unique: true });

export default mongoose.model<IEmployee>("Employee", EmployeeSchema);