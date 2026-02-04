//controllers/configcontroller.ts
import { Request, Response } from 'express';
import { ConfigModel } from '../models/Config';
import { IConfig } from '../interfaces/config';
import { table } from 'console';

export class ConfigController {
    // Create or update config (upsert)
    static async createOrUpdateConfig(req: Request, res: Response): Promise<void> {
        try {
            const configData: Partial<IConfig> = req.body;

            // Use findOneAndUpdate with upsert to create or update the single config document
            const config = await ConfigModel.findOneAndUpdate(
                {}, // Empty filter to match the single config document
                configData,
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );

            res.status(200).json({
                message: 'Configuração salva com sucesso',
                data: config,
            });
        } catch (error) {
            res.status(500).json({
                message: 'Erro ao salvar configuração',
                error: (error as Error).message,
            });
        }
    }

    // Read config
    static async getConfig(_req: Request, res: Response): Promise<void> {
        try {
            const config = await ConfigModel.findOne();
            if (!config) {
                res.status(404).json({ message: 'Configuração não encontrada' });
                return;
            }
            res.status(200).json({
                message: 'Configuração recuperada com sucesso',
                data: config,
            });
        } catch (error) {
            res.status(500).json({
                message: 'Erro ao recuperar configuração',
                error: (error as Error).message,
            });
        }
    }

    static async getProduct(_req: Request, res: Response): Promise<void> {
        try {
            const config = await ConfigModel.findOne();
            if (!config) {
                res.status(404).json({ message: 'Configuração não encontrada' });
                return;
            }
            res.status(200).json({
                message: 'Configuração recuperada com sucesso',
                data: { burger: config.BURGER, product: config.DELIVERY_FEE, taxa: config.TAXA_POR_KM, long: config.longitude, lat: config.latitude, pay: config.PAYMENT_METHODS, logradouro: config.PREFIXOS_LOGRADOURO },
            });
        } catch (error) {
            res.status(500).json({
                message: 'Erro ao recuperar configuração',
                error: (error as Error).message,
            });
        }
    }
    static async getCaixa(_req: Request, res: Response): Promise<void> {
        try {
            const config = await ConfigModel.findOne();
            if (!config) {
                res.status(404).json({ message: 'Configuração não encontrada' });
                return;
            }
            res.status(200).json({
                message: 'Configuração recuperada com sucesso',
                data: { burger: config.BURGER, caixa: config.CAIXA, tables: config.TABLE_COUNT, pay: config.PAYMENT_METHODS, debit: config.DEBIT_CARD_FEE_RATE, credit: config.CREDIT_CARD_FEE_RATE, phone: config.phone },
            });
        } catch (error) {
            res.status(500).json({
                message: 'Erro ao recuperar configuração',
                error: (error as Error).message,
            });
        }
    }

    // Update specific fields
    static async updateConfig(req: Request, res: Response): Promise<void> {
        try {
            const updateData: Partial<IConfig> = req.body;

            const config = await ConfigModel.findOneAndUpdate(
                {},
                { $set: updateData },
                { new: true }
            );

            if (!config) {
                res.status(404).json({ message: 'Configuração não encontrada' });
                return;
            }

            res.status(200).json({
                message: 'Configuração atualizada com sucesso',
                data: config,
            });
        } catch (error) {
            res.status(500).json({
                message: 'Erro ao atualizar configuração',
                error: (error as Error).message,
            });
        }
    }
}