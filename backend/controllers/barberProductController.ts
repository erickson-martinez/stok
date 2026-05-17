import { Request, Response } from "express";
import BarberProduct from "../models/BarberProduct";

// Criar produto
const createProduct = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            nome,
            categoria,
            custo,
            comissao,
            margemLucro,
            precoVenda,
            estoque,
            linkId,
        } = req.body;

        if (
            !nome ||
            custo === undefined ||
            margemLucro === undefined ||
            precoVenda === undefined ||
            estoque === undefined ||
            !linkId
        ) {
            res.status(400).json({
                error:
                    "nome, custo, margemLucro, precoVenda, estoque e linkId são obrigatórios",
            });
            return;
        }

        const product = new BarberProduct({
            nome,
            categoria,
            custo,
            comissao,
            margemLucro,
            precoVenda,
            estoque,
            linkId,
        });

        await product.save();

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao criar produto",
            details: (error as Error).message,
        });
    }
};

// Buscar produtos
const getProducts = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { linkId } = req.query;

        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });
            return;
        }

        const products = await BarberProduct.find({
            linkId,
        }).sort({
            createdAt: -1,
        });

        res.json(products);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar produtos",
            details: (error as Error).message,
        });
    }
};

// Buscar produto por ID
const getProductById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const product = await BarberProduct.findById(id);

        if (!product) {
            res.status(404).json({
                error: "Produto não encontrado",
            });
            return;
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({
            error: "Erro ao buscar produto",
            details: (error as Error).message,
        });
    }
};

// Atualizar produto
const updateProduct = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const updatedProduct = await BarberProduct.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
            }
        );

        if (!updatedProduct) {
            res.status(404).json({
                error: "Produto não encontrado",
            });
            return;
        }

        res.json({
            message: "Produto atualizado com sucesso",
            product: updatedProduct,
        });
    } catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar produto",
            details: (error as Error).message,
        });
    }
};

// Atualizar estoque
const updateStock = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const { estoque } = req.body;

        if (estoque === undefined) {
            res.status(400).json({
                error: "Estoque é obrigatório",
            });
            return;
        }

        const updatedProduct = await BarberProduct.findByIdAndUpdate(
            id,
            {
                estoque,
            },
            {
                new: true,
            }
        );

        if (!updatedProduct) {
            res.status(404).json({
                error: "Produto não encontrado",
            });
            return;
        }

        res.json({
            message: "Estoque atualizado com sucesso",
            product: updatedProduct,
        });
    } catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar estoque",
            details: (error as Error).message,
        });
    }
};

// Remover produto
const deleteProduct = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const deletedProduct = await BarberProduct.findByIdAndDelete(id);

        if (!deletedProduct) {
            res.status(404).json({
                error: "Produto não encontrado",
            });
            return;
        }

        res.json({
            message: "Produto removido com sucesso",
        });
    } catch (error) {
        res.status(500).json({
            error: "Erro ao remover produto",
            details: (error as Error).message,
        });
    }
};

export default {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    updateStock,
    deleteProduct,
};