"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigController = void 0;
const Config_1 = require("../models/Config");
class ConfigController {
    static async createConfig(req, res) {
        try {
            const configData = req.body;
            const config = await Config_1.ConfigModel.findOneAndUpdate({}, configData, { new: true, upsert: true, setDefaultsOnInsert: true });
            res.status(200).json({
                message: 'Configuração salva com sucesso',
                data: config,
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao salvar configuração',
                error: error.message,
            });
        }
    }
    static async getConfig(req, res) {
        try {
            const phone = req.params.phone;
            const config = await Config_1.ConfigModel.findOne({ phone });
            if (!config) {
                res.status(404).json({ message: 'Configuração não encontrada' });
                return;
            }
            res.status(200).json({
                message: 'Configuração recuperada com sucesso',
                data: config,
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao recuperar configuração',
                error: error.message,
            });
        }
    }
    static async getProduct(req, res) {
        try {
            const burger = req.params.burger;
            const config = await Config_1.ConfigModel.findOne({ BURGER: burger });
            if (!config) {
                res.status(404).json({ message: 'Configuração não encontrada para o Hamburgeueria especificada' });
                return;
            }
            res.status(200).json({
                message: 'Configuração recuperada com sucesso',
                data: { burger: config.BURGER, open: config.CAIXA_OPEN_DAY, period: config.PERIOD, product: config.DELIVERY_FEE, taxa: config.TAXA_POR_KM, long: config.longitude, lat: config.latitude, pay: config.PAYMENT_METHODS, logradouro: config.PREFIXOS_LOGRADOURO },
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao recuperar configuração',
                error: error.message,
            });
        }
    }
    static async getCaixa(req, res) {
        try {
            const phone = req.params.phone;
            const config = await Config_1.ConfigModel.findOne({ phone });
            if (!config) {
                const caixa = await Config_1.ConfigModel.findOne({ CAIXA: phone });
                if (!caixa) {
                    res.status(404).json({ message: 'Configuração não encontrada para o telefone ou caixa fornecido' });
                    return;
                }
                res.status(200).json({
                    data: { burger: caixa.BURGER, period: caixa.PERIOD, caixa: caixa.CAIXA, tables: caixa.TABLE_COUNT, pay: caixa.PAYMENT_METHODS, debit: caixa.DEBIT_CARD_FEE_RATE, credit: caixa.CREDIT_CARD_FEE_RATE, phone: caixa.phone },
                });
            }
            else {
                res.status(200).json({
                    data: { burger: config.BURGER, period: config.PERIOD, caixa: config.CAIXA, tables: config.TABLE_COUNT, pay: config.PAYMENT_METHODS, debit: config.DEBIT_CARD_FEE_RATE, credit: config.CREDIT_CARD_FEE_RATE, phone: config.phone },
                });
            }
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao recuperar configuração',
                error: error.message,
            });
        }
    }
    static async getGarcon(_req, res) {
        try {
            const config = await Config_1.ConfigModel.findOne();
            if (!config) {
                res.status(404).json({ message: 'Configuração não encontrada' });
                return;
            }
            res.status(200).json({
                message: 'Configuração recuperada com sucesso',
                data: { burger: config.BURGER, garcom: config.GARCOM, tables: config.TABLE_COUNT, pay: config.PAYMENT_METHODS, debit: config.DEBIT_CARD_FEE_RATE, credit: config.CREDIT_CARD_FEE_RATE, phone: config.phone },
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao recuperar configuração',
                error: error.message,
            });
        }
    }
    static async getDelivery(req, res) {
        try {
            const phone = req.params.phone;
            const config = await Config_1.ConfigModel.findOne();
            if (!config) {
                const delivery = await Config_1.ConfigModel.findOne({ DELIVERY: phone });
                if (!delivery) {
                    res.status(404).json({ message: 'Configuração não encontrada para o telefone de delivery fornecido' });
                    return;
                }
                res.status(200).json({
                    data: { burger: delivery.BURGER, taxa_delivery_fixa: delivery.TAXA_DELIVERY_FIXA, delivery: delivery.DELIVERY, pay: delivery.PAYMENT_METHODS, debit: delivery.DEBIT_CARD_FEE_RATE, credit: delivery.CREDIT_CARD_FEE_RATE, phone: delivery.phone },
                });
                return;
            }
            else {
                res.status(200).json({
                    message: 'Configuração recuperada com sucesso',
                    data: { burger: config.BURGER, taxa_delivery_fixa: config.TAXA_DELIVERY_FIXA, delivery: config.DELIVERY, pay: config.PAYMENT_METHODS, debit: config.DEBIT_CARD_FEE_RATE, credit: config.CREDIT_CARD_FEE_RATE, phone: config.phone },
                });
            }
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao recuperar configuração',
                error: error.message,
            });
        }
    }
    static async updateConfig(req, res) {
        try {
            const id = req.params.id;
            const updateData = req.body;
            const config = await Config_1.ConfigModel.findOneAndUpdate({ _id: id }, { $set: updateData }, { new: true });
            if (!config) {
                res.status(404).json({ message: 'Configuração não encontrada' });
                return;
            }
            res.status(200).json({
                message: 'Configuração atualizada com sucesso',
                data: config,
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao atualizar configuração',
                error: error.message,
            });
        }
    }
    static async updateCaixaOpenDay(req, res) {
        try {
            const phone = req.params.phone;
            const open = req.params.open;
            const config = await Config_1.ConfigModel.findOneAndUpdate({ phone: phone }, { $set: { CAIXA_OPEN_DAY: open } }, { new: true });
            if (!config) {
                const caixa = await Config_1.ConfigModel.findOneAndUpdate({ CAIXA: phone }, { $set: { CAIXA_OPEN_DAY: open } }, { new: true });
                if (!caixa) {
                    res.status(404).json({ message: 'Configuração não encontrada para o telefone ou caixa fornecido' });
                    return;
                }
                caixa.CAIXA_OPEN_DAY = open;
                await caixa.save();
                res.status(200).json({
                    data: { open: caixa.CAIXA_OPEN_DAY },
                });
            }
            else {
                res.status(200).json({
                    data: { open: config.CAIXA_OPEN_DAY },
                });
            }
        }
        catch (error) {
            res.status(500).json({
                message: 'Erro ao atualizar configuração',
                error: error.message,
            });
        }
    }
}
exports.ConfigController = ConfigController;
//# sourceMappingURL=configController.js.map