"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Stock_1 = __importDefault(require("../models/Stock"));
class StockController {
    // Listar produtos
    async getProducts(req, res) {
        try {
            const { idUser } = req.params;
            if (!idUser) {
                return res.status(400).send("Parâmetro idUser é obrigatório");
            }
            const stock = await Stock_1.default.find({ $or: [{ idUser }, { sharedWith: idUser }] });
            res.json(stock);
        }
        catch (error) {
            console.error("Erro ao buscar produtos:", error);
            res.status(500).send("Erro ao buscar produtos");
        }
    }
    // Cadastrar produto
    async createProduct(req, res) {
        try {
            const stock = new Stock_1.default(req.body);
            await stock.save();
            res.status(201).json(stock);
        }
        catch (error) {
            console.error("Erro ao cadastrar produto:", error);
            res.status(500).send("Erro ao cadastrar produto");
        }
    }
    // Atualizar produto
    async updateProduct(req, res) {
        try {
            const stock = await Stock_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!stock) {
                return res.status(404).send("Produto não encontrado");
            }
            res.json(stock);
        }
        catch (error) {
            console.error("Erro ao atualizar produto:", error);
            res.status(500).send("Erro ao atualizar produto");
        }
    }
    // Excluir produto
    async deleteProduct(req, res) {
        try {
            const stock = await Stock_1.default.findByIdAndDelete(req.params.id);
            if (!stock) {
                return res.status(404).send("Produto não encontrado");
            }
            res.status(204).send();
        }
        catch (error) {
            console.error("Erro ao excluir produto:", error);
            res.status(500).send("Erro ao excluir produto");
        }
    }
    // Compartilhar produto
    async shareProduct(req, res) {
        const { idUserShared } = req.body;
        try {
            if (!idUserShared) {
                return res.status(400).send("O campo idUserShared é obrigatório");
            }
            const stock = await Stock_1.default.findById(req.params.id);
            if (!stock) {
                return res.status(404).send("Produto não encontrado");
            }
            if (!stock.idUserShared.includes(idUserShared)) {
                stock.idUserShared.push(idUserShared);
                await stock.save();
            }
            res.status(200).json(stock);
        }
        catch (error) {
            console.error("Erro ao compartilhar produto:", error);
            res.status(500).send("Erro ao compartilhar produto");
        }
    }
}
exports.default = new StockController();
//# sourceMappingURL=stockController.js.map