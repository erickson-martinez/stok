"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Market_1 = __importDefault(require("../models/Market"));
// Listar mercados por usuário
const marketController = {
    async getMarkets(req, res) {
        try {
            const { name } = req.params;
            const markets = await Market_1.default.find({ name });
            res.status(200).json(markets);
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao listar mercados', error: error.message });
        }
    },
    async getMarketsAll(_req, res) {
        try {
            const markets = await Market_1.default.find();
            res.status(200).json(markets);
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao listar mercados', error: error.message });
        }
    },
    // Criar ou atualizar mercado (mantido como está)
    async saveMarket(req, res) {
        try {
            const { _id, name, address, number, zip, latitude, longitude, status, phone } = req.body;
            if (_id) {
                const market = await Market_1.default.findOneAndUpdate({ _id, phone }, { name, address, number, zip, latitude, longitude, status }, { new: true, runValidators: true });
                if (!market) {
                    res.status(404).json({ message: 'Mercado não encontrado' });
                    return;
                }
                res.status(200).json(market);
            }
            else {
                const market = new Market_1.default({ name, address, number, zip, latitude, longitude, status, phone });
                await market.save();
                res.status(201).json(market);
            }
        }
        catch (error) {
            res.status(400).json({ message: 'Erro ao salvar mercado', error: error.message });
        }
    },
    // Deletar mercado
    async deleteMarket(req, res) {
        try {
            const { id, phone } = req.query;
            const market = await Market_1.default.findOneAndDelete({ _id: id, phone });
            if (!market) {
                res.status(404).json({ message: 'Mercado não encontrado' });
                return;
            }
            res.status(200).json({ message: 'Mercado deletado com sucesso' });
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao deletar mercado', error: error.message });
        }
    },
    // Nova função para atualização parcial com PATCH
    async updateMarket(req, res) {
        try {
            const { id } = req.params; // ID do mercado vem da URL
            const { ...updates } = req.body; // Separa o phone dos campos a atualizar
            // Verifica se o mercado existe e pertence ao usuário
            const market = await Market_1.default.findOne({ _id: id });
            if (!market) {
                res.status(404).json({ message: 'Mercado não encontrado ou não pertence ao usuário' });
                return;
            }
            // Atualiza apenas os campos fornecidos no corpo da requisição
            const updatedMarket = await Market_1.default.findOneAndUpdate({ _id: id }, { $set: updates }, // Usa $set para atualizar apenas os campos enviados
            { new: true, runValidators: true } // Retorna o documento atualizado e valida os dados
            );
            if (!updatedMarket) {
                res.status(500).json({ message: 'Erro ao atualizar mercado' });
                return;
            }
            res.status(200).json(updatedMarket);
        }
        catch (error) {
            res.status(400).json({ message: 'Erro ao atualizar mercado', error: error.message });
        }
    }
};
exports.default = marketController;
//# sourceMappingURL=marketController.js.map