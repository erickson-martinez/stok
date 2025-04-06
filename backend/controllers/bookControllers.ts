import { Request, Response } from 'express';
import Books from '../models/Book';

const BooksController = {
    // Obter todos os livros de um usuário
    async getBooksByUser(req: Request, res: Response): Promise<void> {
        try {
            const { phone } = req.params;

            if (!phone) {
                res.status(400).json({ error: 'Phone do usuário é obrigatório' });
                return;
            }

            const user = await Books.findOne({ phone });

            if (!user) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return;
            }

            user.books.sort((a, b) => a.name.localeCompare(b.name));

            res.json({
                phone: user.phone,
                books: user.books
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obter um livro específico por ID
    async getBookById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const user = await Books.findOne({ 'books._id': id });
            if (!user) {
                res.status(404).json({ error: 'Livro não encontrado' });
                return;
            }

            const book = user.books.find(book => book._id?.toString() === id);
            res.json(book);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // Adicionar um novo livro ao usuário
    async addBook(req: Request, res: Response): Promise<void> {
        try {
            const { phone } = req.params;
            const bookData = req.body;

            if (!phone) {
                res.status(400).json({ error: 'Phone do usuário é obrigatório' });
                return;
            }

            const user = await Books.findOneAndUpdate(
                { phone },
                { $push: { books: bookData } },
                { new: true, upsert: true }
            );

            res.status(201).json({
                phone: user.phone,
                book: user.books[user.books.length - 1] // Retorna o último livro adicionado
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // Atualizar um livro específico
    async updateBook(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params; // Changed from bookId to id to match route
            const updates = req.body;

            const user = await Books.findOneAndUpdate(
                { 'books._id': id },
                { $set: { 'books.$': updates } },
                { new: true }
            );

            if (!user) {
                res.status(404).json({ error: 'Usuário ou livro não encontrado' });
                return;
            }

            const updatedBook = user.books.find(book => book._id?.toString() === id);
            res.json(updatedBook);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // Remover um livro
    async removeBook(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params; // Changed from bookId to id to match route

            const user = await Books.findOneAndUpdate(
                { 'books._id': id },
                { $pull: { books: { _id: id } } },
                { new: true }
            );

            if (!user) {
                res.status(404).json({ error: 'Usuário ou livro não encontrado' });
                return;
            }

            res.json({ message: 'Livro removido com sucesso' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    },

    // Transferir um livro
    async transferBook(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const user = await Books.findOneAndUpdate(
                { 'books._id': id },
                { $set: { 'books.$.isTransferred': true } },
                { new: true }
            );

            if (!user) {
                res.status(404).json({ error: 'Livro não encontrado' });
                return;
            }

            const transferredBook = user.books.find(book => book._id?.toString() === id);
            res.json({ message: 'Livro transferido com sucesso', book: transferredBook });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};

export default BooksController;