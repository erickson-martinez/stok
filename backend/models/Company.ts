import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
    name: string;
    cnpj?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    status: 'ativo' | 'inativo'; // Status da empresa
    owner: mongoose.Schema.Types.ObjectId; // Referência ao usuário proprietário
    createdAt: Date;
    updatedAt: Date;
}

const CompanySchema: Schema = new Schema({
    name: { type: String, required: true },
    cnpj: { type: String, unique: true, sparse: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    status: { type: String, enum: ['ativo', 'inativo'], default: 'ativo' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICompany>("Company", CompanySchema);
