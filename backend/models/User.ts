// backend/models/User.ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Campo opcional
    role: {
        type: Number,
        enum: [0, 1], // 0 = admin, 1 = user
        default: 1,   // Todos os novos usuários serão "user"
        required: true
    }
});

export default mongoose.model("User", userSchema);