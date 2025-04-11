import { Request, Response } from 'express';
import Books, { IBooks } from '../models/Books';

class BookController {
    // Obter todos os livros de um usuário
    async getBooks(req: Request, res: Response): Promise<void> {
        try {
            const { idUser } = req.params;
            const userBooks = await Books.findOne({ idUser });
            if (!userBooks) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return;
            }

            // Ordenar os livros por nome (ordem alfabética, crescente)
            userBooks.books.sort((a, b) => a.name.localeCompare(b.name));

            res.status(200).json(userBooks);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Obter um livro específico por ID
    async getBookById(req: Request, res: Response): Promise<void> {
        try {
            const { idUser, id } = req.params;
            console.log(idUser)
            const userBooks = await Books.findOne({ idUser });
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
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Criar um novo livro
    async createBook(req: Request, res: Response): Promise<void> {
        try {
            const { idUser } = req.params;
            const newBook = req.body;

            let userBooks = await Books.findOne({ idUser });
            if (!userBooks) {
                userBooks = new Books({ idUser, books: [] });
            }

            userBooks.books.push(newBook);
            await userBooks.save();
            res.status(201).json(userBooks.books[userBooks.books.length - 1]);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Atualizar um livro existente
    async updateBook(req: Request, res: Response): Promise<void> {
        try {
            const { idUser, id } = req.params;
            const updatedBook = req.body;

            const userBooks = await Books.findOne({ idUser });
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
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Deletar um livro
    async deleteBook(req: Request, res: Response): Promise<void> {
        try {
            const { idUser, id } = req.params;

            const userBooks = await Books.findOne({ idUser });
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
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Transferir um livro (empréstimo, venda, doação)
    async transferBook(req: Request, res: Response): Promise<void> {
        try {
            const { idUser, id } = req.params;
            const { action, newidUser } = req.body;

            const userBooks = await Books.findOne({ idUser });
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
            } else if (action === 'sell' || action === 'donate') {
                book.isTransferred = true;
                userBooks.idUser = newidUser;
            }

            await userBooks.save();
            res.status(200).json(book);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default new BookController();