"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BarberProduct_1 = __importDefault(require("../models/BarberProduct"));
const createProduct = async (req, res) => {
    try {
        const { nome, categoria, custo, comissao, margemLucro, precoVenda, estoque, linkId, } = req.body;
        if (!nome ||
            custo === undefined ||
            margemLucro === undefined ||
            precoVenda === undefined ||
            estoque === undefined ||
            !linkId) {
            res.status(400).json({
                error: "nome, custo, margemLucro, precoVenda, estoque e linkId são obrigatórios",
            });
            return;
        }
        const product = new BarberProduct_1.default({
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
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao criar produto",
            details: error.message,
        });
    }
};
const getProducts = async (req, res) => {
    try {
        const { linkId } = req.query;
        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });
            return;
        }
        const products = await BarberProduct_1.default.find({
            linkId,
        }).sort({
            createdAt: -1,
        });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar produtos",
            details: error.message,
        });
    }
};
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await BarberProduct_1.default.findById(id);
        if (!product) {
            res.status(404).json({
                error: "Produto não encontrado",
            });
            return;
        }
        res.json(product);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar produto",
            details: error.message,
        });
    }
};
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProduct = await BarberProduct_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
        });
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
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar produto",
            details: error.message,
        });
    }
};
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { estoque } = req.body;
        if (estoque === undefined) {
            res.status(400).json({
                error: "Estoque é obrigatório",
            });
            return;
        }
        const updatedProduct = await BarberProduct_1.default.findByIdAndUpdate(id, {
            estoque,
        }, {
            new: true,
        });
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
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar estoque",
            details: error.message,
        });
    }
};
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await BarberProduct_1.default.findByIdAndDelete(id);
        if (!deletedProduct) {
            res.status(404).json({
                error: "Produto não encontrado",
            });
            return;
        }
        res.json({
            message: "Produto removido com sucesso",
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao remover produto",
            details: error.message,
        });
    }
};
exports.default = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    updateStock,
    deleteProduct,
};
//# sourceMappingURL=barberProductController.js.map