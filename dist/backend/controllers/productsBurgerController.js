"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductBurgerController = void 0;
const ProductBurger_1 = require("../models/ProductBurger");
class ProductBurgerController {
    static async createProductBurger(req, res) {
        try {
            const productData = req.body;
            if (!productData.id) {
                const lastProduct = await ProductBurger_1.ProductBurgerModel.findOne().sort({ id: -1 });
                productData.id = lastProduct ? lastProduct.id + 1 : 1;
            }
            const product = new ProductBurger_1.ProductBurgerModel(productData);
            await product.save();
            res.status(201).json({
                message: 'Hambúrguer criado com sucesso',
                data: product,
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao criar hambúrguer',
                error: error.message,
            });
        }
    }
    static async getAllProductsBurger(_req, res) {
        try {
            const products = await ProductBurger_1.ProductBurgerModel.find();
            res.status(200).json({
                message: 'Hambúrgueres recuperados com sucesso',
                data: products,
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao recuperar hambúrgueres',
                error: error.message,
            });
        }
    }
    static async getProductBurgerById(req, res) {
        try {
            const product = await ProductBurger_1.ProductBurgerModel.findOne({ id: req.params.id });
            if (!product) {
                res.status(404).json({ message: 'Hambúrguer não encontrado' });
                return;
            }
            res.status(200).json({
                message: 'Hambúrguer recuperado com sucesso',
                data: product,
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao recuperar hambúrguer',
                error: error.message,
            });
        }
    }
    static async updateProductBurger(req, res) {
        try {
            const updateData = req.body;
            const product = await ProductBurger_1.ProductBurgerModel.findOneAndUpdate({ id: req.params.id }, updateData, { new: true });
            if (!product) {
                res.status(404).json({ message: 'Hambúrguer não encontrado' });
                return;
            }
            res.status(200).json({
                message: 'Hambúrguer atualizado com sucesso',
                data: product,
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao atualizar hambúrguer',
                error: error.message,
            });
        }
    }
    static async deleteProductBurger(req, res) {
        try {
            const product = await ProductBurger_1.ProductBurgerModel.findOneAndDelete({ id: req.params.id });
            if (!product) {
                res.status(404).json({ message: 'Hambúrguer não encontrado' });
                return;
            }
            res.status(200).json({
                message: 'Hambúrguer deletado com sucesso',
                data: product,
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao deletar hambúrguer',
                error: error.message,
            });
        }
    }
}
exports.ProductBurgerController = ProductBurgerController;
//# sourceMappingURL=productsBurgerController.js.map