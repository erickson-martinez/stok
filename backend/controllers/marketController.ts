import { Request, Response } from 'express';
import Market, { IMarket } from '../models/Market';

// Listar mercados por usuário
const marketController = {
    async getMarkets(req: Request, res: Response): Promise<void> {
        try {
            const { name } = req.params;
            const markets: IMarket[] = await Market.find({ name });
            res.status(200).json(markets);
        } catch (error: any) {
            res.status(500).json({ message: 'Erro ao listar mercados', error: error.message });
        }
    },

    async getMarketsAll(req: Request, res: Response): Promise<void> {
        try {
            const markets: IMarket[] = await Market.find();
            res.status(200).json(markets);
        } catch (error: any) {
            res.status(500).json({ message: 'Erro ao listar mercados', error: error.message });
        }
    },

    // Criar ou atualizar mercado
    async saveMarket(req: Request, res: Response): Promise<void> {
        try {
            const { _id, name, address, number, zip, latitude, longitude, status, phone } = req.body;

            if (_id) {
                // Atualizar mercado existente
                const market: IMarket | null = await Market.findOneAndUpdate(
                    { _id, phone },
                    { name, address, number, zip, latitude, longitude, status },
                    { new: true, runValidators: true }
                );
                if (!market) {
                    res.status(404).json({ message: 'Mercado não encontrado' });
                    return;
                }
                res.status(200).json(market);
            } else {
                // Criar novo mercado
                const market: IMarket = new Market({ name, address, number, zip, latitude, longitude, status, phone });
                await market.save();
                res.status(201).json(market);
            }
        } catch (error: any) {
            res.status(400).json({ message: 'Erro ao salvar mercado', error: error.message });
        }
    },

    // Deletar mercado
    async deleteMarket(req: Request, res: Response): Promise<void> {
        try {
            const { id, phone } = req.query;
            const market: IMarket | null = await Market.findOneAndDelete({ _id: id, phone });
            if (!market) {
                res.status(404).json({ message: 'Mercado não encontrado' });
                return;
            }
            res.status(200).json({ message: 'Mercado deletado com sucesso' });
        } catch (error: any) {
            res.status(500).json({ message: 'Erro ao deletar mercado', error: error.message });
        }
    }
}

export default marketController;
