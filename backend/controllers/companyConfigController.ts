import { Request, Response } from "express";
import CompanyConfig from "../models/CompanyConfig";

// Buscar configuração
const getConfig = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { linkId } = req.params;

        const config =
            await CompanyConfig.findOne({
                linkId,
            });

        if (!config) {
            res.status(404).json({
                error:
                    "Configuração não encontrada",
            });

            return;
        }

        res.json(config);

    } catch (error) {
        res.status(500).json({
            error:
                "Erro ao buscar configuração",
            details: (error as Error).message,
        });
    }
};

// Criar ou atualizar configuração (UPSERT)
const upsertConfig = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { linkId } = req.params;

        const {
            taxas,
            metaLucro,
            imposto,
        } = req.body;

        const config =
            await CompanyConfig.findOneAndUpdate(
                {
                    linkId,
                },
                {
                    linkId,
                    taxas,
                    metaLucro,
                    imposto,
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                }
            );

        res.json({
            message:
                "Configuração salva com sucesso",
            config,
        });

    } catch (error) {
        res.status(500).json({
            error:
                "Erro ao salvar configuração",
            details: (error as Error).message,
        });
    }
};

// Remover configuração
const deleteConfig = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { linkId } = req.params;

        const deletedConfig =
            await CompanyConfig.findOneAndDelete({
                linkId,
            });

        if (!deletedConfig) {
            res.status(404).json({
                error:
                    "Configuração não encontrada",
            });

            return;
        }

        res.json({
            message:
                "Configuração removida com sucesso",
        });

    } catch (error) {
        res.status(500).json({
            error:
                "Erro ao remover configuração",
            details: (error as Error).message,
        });
    }
};

export default {
    getConfig,
    upsertConfig,
    deleteConfig,
};