"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CompanyConfig_1 = __importDefault(require("../models/CompanyConfig"));
const getConfig = async (req, res) => {
    try {
        const { linkId } = req.params;
        const config = await CompanyConfig_1.default.findOne({
            linkId,
        });
        if (!config) {
            res.status(404).json({
                error: "Configuração não encontrada",
            });
            return;
        }
        res.json(config);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar configuração",
            details: error.message,
        });
    }
};
const upsertConfig = async (req, res) => {
    try {
        const { linkId } = req.params;
        const { taxas, metaLucro, imposto, } = req.body;
        const config = await CompanyConfig_1.default.findOneAndUpdate({
            linkId,
        }, {
            linkId,
            taxas,
            metaLucro,
            imposto,
        }, {
            upsert: true,
            new: true,
            runValidators: true,
        });
        res.json({
            message: "Configuração salva com sucesso",
            config,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao salvar configuração",
            details: error.message,
        });
    }
};
const deleteConfig = async (req, res) => {
    try {
        const { linkId } = req.params;
        const deletedConfig = await CompanyConfig_1.default.findOneAndDelete({
            linkId,
        });
        if (!deletedConfig) {
            res.status(404).json({
                error: "Configuração não encontrada",
            });
            return;
        }
        res.json({
            message: "Configuração removida com sucesso",
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao remover configuração",
            details: error.message,
        });
    }
};
exports.default = {
    getConfig,
    upsertConfig,
    deleteConfig,
};
//# sourceMappingURL=companyConfigController.js.map