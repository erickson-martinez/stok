"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Schema para os livros (subdocumento)
const BookSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String },
    year: { type: Number, required: true },
    phone: { type: String },
    author: { type: String, required: true },
    category: { type: String },
    condition: { type: String, enum: ['Novo', 'Usado'], required: true },
    status: { type: String, enum: ['Novo', 'Boa', 'Péssima'], required: true },
    intent: { type: String, enum: ['Emprestar', 'Vender', 'Doar'], required: true },
    read: { type: Boolean, default: false },
    pages: { type: Number, required: true },
    isTransferred: { type: Boolean, default: false }
}, {
    timestamps: true // Adiciona createdAt e updatedAt para cada livro
});
// Schema principal do usuário
const BooksSchema = new mongoose_1.Schema({
    idUser: {
        type: String,
        required: true,
        unique: true, // Isso já cria o índice
    },
    books: [BookSchema] // Array de subdocumentos Book
}, {
    timestamps: true // Adiciona createdAt e updatedAt para o usuário
});
// Mantém o índice de texto para busca
BooksSchema.index({ 'books.name': 'text', 'books.author': 'text' });
// Removido: BooksSchema.index({ phone: 1 }); // Já é criado por unique: true
exports.default = mongoose_1.default.model('Books', BooksSchema);
//# sourceMappingURL=Books.js.map