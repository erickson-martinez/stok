import { Request, Response } from "express";
import Stock from "../models/Stock";


class StockController {
    // Listar produtos
    async getProducts(req: Request, res: Response): Promise<void> {
        try {
            const { idUser } = req.params;
            if (!idUser) {
                res.status(400).send("Parâmetro idUser é obrigatório");
                return;
            }
            const stock = await Stock.find({ $or: [{ idUser }, { sharedWith: idUser }] });
            res.json(stock);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            res.status(500).send("Erro ao buscar produtos");
        }
    }

    // Cadastrar produto
    async createProduct(req: Request, res: Response): Promise<void> {
        try {
            const stock = new Stock(req.body);
            await stock.save();
            res.status(201).json(stock);
        } catch (error) {
            console.error("Erro ao cadastrar produto:", error);
            res.status(500).send("Erro ao cadastrar produto");
        }
    }

    // Atualizar produto
    async updateProduct(req: Request, res: Response): Promise<void> {
        try {
            const stock = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!stock) {
                res.status(404).send("Produto não encontrado");
                return;
            }
            res.json(stock);
        } catch (error) {
            console.error("Erro ao atualizar produto:", error);
            res.status(500).send("Erro ao atualizar produto");
        }
    }

    // Excluir produto
    async deleteProduct(req: Request, res: Response): Promise<void> {
        try {
            const stock = await Stock.findByIdAndDelete(req.params.id);
            if (!stock) {
                res.status(404).send("Produto não encontrado");
                return;
            }
            res.status(204).send();
        } catch (error) {
            console.error("Erro ao excluir produto:", error);
            res.status(500).send("Erro ao excluir produto");
        }
    }

    // Compartilhar produto
    async shareProduct(req: Request, res: Response): Promise<void> {
        const { idUserShared } = req.body;
        try {
            if (!idUserShared) {
                res.status(400).send("O campo idUserShared é obrigatório");
                return;
            }
            const stock = await Stock.findById(req.params.id);
            if (!stock) {
                res.status(404).send("Produto não encontrado");
                return;
            }
            if (!stock.idUserShared.includes(idUserShared)) {
                stock.idUserShared.push(idUserShared);
                await stock.save();
            }
            res.status(200).json(stock);
        } catch (error) {
            console.error("Erro ao compartilhar produto:", error);
            res.status(500).send("Erro ao compartilhar produto");
        }
    }
}

export default new StockController();