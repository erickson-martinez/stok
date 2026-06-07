import mongoose, { Schema, Document } from "mongoose";

export interface IPermission extends Document {
    idEmail: string; // Email criptografado do usuário
    permissions: string[]; // Array de permissões ativas
    createdAt: Date;
    email: string; // Email descriptografado do usuário
    updatedAt: Date;
}

const PermissionSchema: Schema = new Schema({
    idEmail: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    permissions: { type: [String], default: [] }, // Array de strings com nomes das permissões
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPermission>("Permission", PermissionSchema);
