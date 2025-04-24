import { Request, Response } from "express";
import Stock from "../models/Stock.ts";

class StockController {
    // Listar produtos
    async getProducts(req: Request, res: Response) {
        try {
            const { idUser } = req.params;
            if (!idUser) {
                return res.status(400).send("Parâmetro idUser é obrigatório");
            }
            const products = await Stock.find({ $or: [{ idUser }, { sharedWith: idUser }] });
            res.json(products);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            res.status(500).send("Erro ao buscar produtos");
        }
    }

    // Cadastrar produto
    async createProduct(req: Request, res: Response) {
        try {
            const product = new Stock(req.body);
            await product.save();
            res.status(201).json(product);
        } catch (error) {
            console.error("Erro ao cadastrar produto:", error);
            res.status(500).send("Erro ao cadastrar produto");
        }
    }

    // Atualizar produto
    async updateProduct(req: Request, res: Response) {
        try {
            const product = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!product) {
                return res.status(404).send("Produto não encontrado");
            }
            res.json(product);
        } catch (error) {
            console.error("Erro ao atualizar produto:", error);
            res.status(500).send("Erro ao atualizar produto");
        }
    }

    // Excluir produto
    async deleteProduct(req: Request, res: Response) {
        try {
            const product = await Stock.findByIdAndDelete(req.params.id);
            if (!product) {
                return res.status(404).send("Produto não encontrado");
            }
            res.status(204).send();
        } catch (error) {
            console.error("Erro ao excluir produto:", error);
            res.status(500).send("Erro ao excluir produto");
        }
    }

    // Compartilhar produto
    async shareProduct(req: Request, res: Response) {
        const { idUserShared } = req.body;
        try {
            if (!idUserShared) {
                return res.status(400).send("O campo idUserShared é obrigatório");
            }
            const product = await Stock.findById(req.params.id);
            if (!product) {
                return res.status(404).send("Produto não encontrado");
            }
            if (!product.idUserShared.includes(idUserShared)) {
                product.idUserShared.push(idUserShared);
                await product.save();
            }
            res.status(200).json(product);
        } catch (error) {
            console.error("Erro ao compartilhar produto:", error);
            res.status(500).send("Erro ao compartilhar produto");
        }
    }
}

export default new StockController();