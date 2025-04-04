import { Request, Response } from 'express';
import ProductPrice from '../models/ProductPrice';
import Market from '../models/Market';
import { console } from 'inspector';

const productPriceController = {
    // Salvar ou atualizar preço de produto (sem histórico)
    async saveProductPrice(req: Request, res: Response): Promise<void> {
        try {
            const { productName, marketId, price, type, phone } = req.body;

            // Verificar se o mercado existe
            const market = await Market.findById(marketId);
            if (!market) {
                res.status(404).json({ message: 'Mercado não encontrado' });
                return;
            }

            const productPrice = await ProductPrice.findOneAndUpdate(
                { productName: productName.toLowerCase(), marketId },
                {
                    currentPrice: price,
                    type,
                    lastUpdated: new Date(),
                    updatedBy: phone
                },
                { upsert: true, new: true, runValidators: true }
            ).populate('marketId', 'name');

            res.status(200).json(productPrice);
        } catch (error: any) {
            res.status(400).json({ message: 'Erro ao salvar preço do produto', error: error.message });
        }
    },

    // Obter preços atuais de um produto em vários mercados
    async getProductPrices(req: Request, res: Response): Promise<void> {
        try {
            const { productName } = req.params;
            const prices = await ProductPrice.find({
                productName: productName.toLowerCase()
            }).populate('marketId', 'name address')
                .sort({ currentPrice: 1 });

            res.status(200).json(prices);
        } catch (error: any) {
            res.status(500).json({ message: 'Erro ao obter preços do produto', error: error.message });
        }
    },

    // Comparar preços entre mercados para vários produtos
    async comparePrices(req: Request, res: Response): Promise<void> {
        try {
            const { products } = req.body;
            if (!products || !Array.isArray(products) || products.length === 0) {
                res.status(400).json({ message: 'Lista de produtos inválida' });
                return;
            }

            const prices = await ProductPrice.find({
                productName: { $in: products.map(p => p.toLowerCase()) }
            }).populate('marketId', 'name');

            // Organizar por produto
            const result: Record<string, Array<{
                market: any;
                price: number;
                type: string;
                lastUpdated: Date;
            }>> = {};

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

            // Ordenar por preço (mais barato primeiro)
            for (const product in result) {
                result[product].sort((a, b) => a.price - b.price);
            }

            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ message: 'Erro ao comparar preços', error: error.message });
        }
    },
    // Obter preços recentes de um produto (último dia)
    async getRecentProductPrices(req: Request, res: Response): Promise<void> {
        try {
            const { productName, days = 1 } = req.params;

            const dateLimit = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

            // Criar uma regex para buscar variações do nome do produto
            const productRegex = new RegExp(productName.toLowerCase()
                .replace("arroz", "(arroz|roz|arro)")
                .replace("macar", "(macar|macarão)")
                .replace("caf", "(caf|café)"), "i");

            const prices = await ProductPrice.find({
                productName: { $regex: productRegex },
                lastUpdated: { $gte: dateLimit }
            }).populate('marketId', 'name')
                .sort({ lastUpdated: -1 }); // Mais recentes primeiro

            res.status(200).json(prices);
        } catch (error: any) {
            res.status(500).json({ message: 'Erro ao obter preços do produto', error: error.message });
        }
    },

    // Obter preço atual de um produto em um mercado específico
    async getMarketProductPrice(req: Request, res: Response): Promise<void> {
        try {
            const { productName, marketId } = req.params;

            const price = await ProductPrice.findOne({
                productName: productName.toLowerCase(),
                marketId
            }).populate('marketId', 'name');

            if (!price) {
                res.status(404).json({ message: 'Preço não encontrado para este produto e mercado' });
                return;
            }

            res.status(200).json(price);
        } catch (error: any) {
            res.status(500).json({ message: 'Erro ao obter preço do produto', error: error.message });
        }
    }
};

export default productPriceController;