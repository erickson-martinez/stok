import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    password: string; // Senha criptografada
    phone: string;
    idEmail: string;
    email: string;
}

const UserSchema: Schema = new Schema({
    name: { type: String },
    password: { type: String },
    phone: { type: String, unique: true },
    idEmail: { type: String, required: true, unique: true },
    email: { type: String, unique: true },
});

export default mongoose.model<IUser>("User", UserSchema);