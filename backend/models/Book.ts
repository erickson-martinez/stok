import mongoose, { Schema, Document } from 'mongoose';

// Interface para os livros
interface IBook {
    _id?: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    year: number;
    author: string;
    category?: string;
    condition: 'Novo' | 'Usado';
    status: 'Novo' | 'Boa' | 'Péssima';
    intent: 'Emprestar' | 'Vender' | 'Doar';
    read: boolean;
    pages: number;
    isTransferred: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Interface principal do usuário com livros
export interface IBooks extends Document {
    phone: string;
    books: IBook[];
    createdAt: Date;
    updatedAt: Date;
}

// Schema para os livros (subdocumento)
const BookSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    year: { type: Number, required: true },
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
const BooksSchema: Schema = new Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (v: string) => /^\d+$/.test(v),
            message: 'Phone deve conter apenas números'
        }
    },
    books: [BookSchema] // Array de subdocumentos Book
}, {
    timestamps: true // Adiciona createdAt e updatedAt para o usuário
});

// Adicionando índice para busca mais rápida
BooksSchema.index({ phone: 1 });
BooksSchema.index({ 'books.name': 'text', 'books.author': 'text' }); // Índice de texto para busca

export default mongoose.model<IBooks>('Books', BooksSchema);