// backend/models/Stock.ts
import mongoose from "mongoose";

const stockchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    brand: { type: String, required: true },
    unitType: { type: String, required: true },
    unitQuantity: { type: String, required: true },
    idealQuantity: { type: Number, required: true },
    idUser: { type: String, required: true }, // Vincula ao usuário
    idUserShared: [{ type: String }], // Lista de telefones com quem o produto é compartilhado
});

export default mongoose.model("Product", stockchema);