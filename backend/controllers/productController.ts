import { Request, Response } from "express";
import Product from "../models/Product.ts";

class ProductController {
    // Listar produtos
    async getProducts(req: Request, res: Response) {
        try {
            const { ownerPhone } = req.query;
            if (!ownerPhone) {
                return res.status(400).send("Parâmetro ownerPhone é obrigatório");
            }
            const products = await Product.find({ $or: [{ ownerPhone }, { sharedWith: ownerPhone }] });
            res.json(products);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            res.status(500).send("Erro ao buscar produtos");
        }
    }

    // Cadastrar produto
    async createProduct(req: Request, res: Response) {
        try {
            const product = new Product(req.body);
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
            const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
            const product = await Product.findByIdAndDelete(req.params.id);
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
        const { sharedWithPhone } = req.body;
        try {
            if (!sharedWithPhone) {
                return res.status(400).send("O campo sharedWithPhone é obrigatório");
            }
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).send("Produto não encontrado");
            }
            if (!product.sharedWith.includes(sharedWithPhone)) {
                product.sharedWith.push(sharedWithPhone);
                await product.save();
            }
            res.status(200).json(product);
        } catch (error) {
            console.error("Erro ao compartilhar produto:", error);
            res.status(500).send("Erro ao compartilhar produto");
        }
    }
}

export default new ProductController();