"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ProductPrice_1 = __importDefault(require("../models/ProductPrice"));
const Store_1 = __importDefault(require("../models/Store"));
const productPriceController = {
    async saveProductPrice(req, res) {
        try {
            const { productName, marketId, price, type, phone } = req.body;
            const market = await Store_1.default.findById(marketId);
            if (!market) {
                res.status(404).json({ message: 'Mercado não encontrado' });
                return;
            }
            const productPrice = await ProductPrice_1.default.findOneAndUpdate({ productName: productName, marketId }, {
                currentPrice: price,
                type,
                lastUpdated: new Date(),
                updatedBy: phone
            }, { upsert: true, new: true, runValidators: true }).populate('marketId', 'name');
            res.status(200).json(productPrice);
        }
        catch (error) {
            res.status(400).json({ message: 'Erro ao salvar preço do produto', error: error.message });
        }
    },
    async getProductPrices(req, res) {
        try {
            const productName = decodeURIComponent(req.params.productName);
            const normalizedProductName = productName
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
            const prices = await ProductPrice_1.default.find({
                productName: { $regex: `^${normalizedProductName}$`, $options: 'i' }
            })
                .populate('marketId', 'name address')
                .sort({ currentPrice: 1 });
            if (prices.length === 0) {
                res.status(404).json({ message: `Nenhum preço encontrado para o produto ${productName}` });
                return;
            }
            res.status(200).json(prices);
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao obter preços do produto', error: error.message });
        }
    },
    async comparePrices(req, res) {
        try {
            const { products } = req.body;
            if (!products || !Array.isArray(products) || products.length === 0) {
                res.status(400).json({ message: 'Lista de produtos inválida' });
                return;
            }
            const prices = await ProductPrice_1.default.find({
                productName: { $in: products.map(p => p) }
            }).populate('marketId', 'name');
            const result = {};
            prices.forEach(price => {
                const productKey = price.productName;
                if (!result[productKey]) {
                    result[productKey] = [];
                }
                result[productKey].push({
                    market: price.marketId,
                    price: price.currentPrice,
                    type: price.type,
                    lastUpdated: price.lastUpdated
                });
            });
            for (const product in result) {
                result[product].sort((a, b) => a.price - b.price);
            }
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao comparar preços', error: error.message });
        }
    },
    async getRecentProductPrices(req, res) {
        try {
            const { productName, days = 1 } = req.params;
            const dateLimit = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
            const productRegex = new RegExp(productName
                .replace("arroz", "(arroz|roz|arro)")
                .replace("macar", "(macar|macarão)")
                .replace("caf", "(caf|café)"), "i");
            const prices = await ProductPrice_1.default.find({
                productName: { $regex: productRegex },
                lastUpdated: { $gte: dateLimit }
            }).populate('marketId', 'name')
                .sort({ lastUpdated: -1 });
            res.status(200).json(prices);
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao obter preços do produto', error: error.message });
        }
    },
    async getMarketProductPrice(req, res) {
        try {
            const { productName, marketId } = req.params;
            const price = await ProductPrice_1.default.findOne({
                productName: productName,
                marketId
            }).populate('marketId', 'name');
            if (!price) {
                res.status(404).json({ message: 'Preço não encontrado para este produto e mercado' });
                return;
            }
            res.status(200).json(price);
        }
        catch (error) {
            res.status(500).json({ message: 'Erro ao obter preço do produto', error: error.message });
        }
    }
};
exports.default = productPriceController;
//# sourceMappingURL=productPriceController.js.map