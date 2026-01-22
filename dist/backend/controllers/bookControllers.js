"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Books_1 = __importDefault(require("../models/Books"));
class BookController {
    // Obter todos os livros de um usuário
    async getBooks(req, res) {
        try {
            const { idUser } = req.params;
            const userBooks = await Books_1.default.findOne({ idUser });
            if (!userBooks) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return;
            }
            // Ordenar os livros por nome (ordem alfabética, crescente)
            userBooks.books.sort((a, b) => a.name.localeCompare(b.name));
            res.status(200).json(userBooks);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Obter um livro específico por ID
    async getBookById(req, res) {
        try {
            const { idUser, id } = req.params;
            console.log(idUser);
            const userBooks = await Books_1.default.findOne({ idUser });
            if (!userBooks) {
                res.status(404).json({ idUser });
                return;
            }
            const book = userBooks.books.find(book => book && book._id && book._id.toString() === id);
            if (!book) {
                res.status(404).json({ error: 'Livro não encontrado' });
                return;
            }
            res.status(200).json(book);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Criar um novo livro
    async createBook(req, res) {
        try {
            const { idUser } = req.params;
            const newBook = req.body;
            let userBooks = await Books_1.default.findOne({ idUser });
            if (!userBooks) {
                userBooks = new Books_1.default({ idUser, books: [] });
            }
            userBooks.books.push(newBook);
            await userBooks.save();
            res.status(201).json(userBooks.books[userBooks.books.length - 1]);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Atualizar um livro existente
    async updateBook(req, res) {
        try {
            const { idUser, id } = req.params;
            const updatedBook = req.body;
            const userBooks = await Books_1.default.findOne({ idUser });
            if (!userBooks) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return;
            }
            const book = userBooks.books.find(book => book && book._id && book._id.toString() === id);
            if (!book) {
                res.status(404).json({ error: 'Livro não encontrado' });
                return;
            }
            Object.assign(book, updatedBook);
            await userBooks.save();
            res.status(200).json(book);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Deletar um livro
    async deleteBook(req, res) {
        try {
            const { idUser, id } = req.params;
            const userBooks = await Books_1.default.findOne({ idUser });
            if (!userBooks) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return;
            }
            const bookIndex = userBooks.books.findIndex(book => book?._id?.toString() === id);
            if (bookIndex === -1) {
                res.status(404).json({ error: 'Livro não encontrado' });
                return;
            }
            userBooks.books.splice(bookIndex, 1);
            await userBooks.save();
            res.status(204).json();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Transferir um livro (empréstimo, venda, doação)
    async transferBook(req, res) {
        try {
            const { idUser, id } = req.params;
            const { action, newidUser } = req.body;
            const userBooks = await Books_1.default.findOne({ idUser });
            if (!userBooks) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return;
            }
            const book = userBooks.books.find(book => book && book._id && book._id.toString() === id);
            if (!book) {
                res.status(404).json({ error: 'Livro não encontrado' });
                return;
            }
            if (action === 'loan') {
                book.isTransferred = true;
                userBooks.idUser = newidUser;
            }
            else if (action === 'sell' || action === 'donate') {
                book.isTransferred = true;
                userBooks.idUser = newidUser;
            }
            await userBooks.save();
            res.status(200).json(book);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.default = new BookController();
//# sourceMappingURL=bookControllers.js.map