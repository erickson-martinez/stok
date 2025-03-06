// backend/models/Products.ts
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    brand: { type: String, required: true },
    unitType: { type: String, required: true },
    unitQuantity: { type: String, required: true },
    idealQuantity: { type: Number, required: true },
    ownerPhone: { type: String, required: true }, // Vincula ao usuário
    sharedWith: [{ type: String }], // Lista de telefones com quem o produto é compartilhado
});

export default mongoose.model("Product", productSchema);