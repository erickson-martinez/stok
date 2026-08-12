"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Cost_1 = __importDefault(require("../models/Cost"));
const isValidDate = (date) => !Number.isNaN(new Date(date).getTime());
const getReferenciaRange = (dataReferencia, mes, ano) => {
    let referencia;
    if (dataReferencia) {
        referencia = new Date(dataReferencia);
    }
    else if (mes && ano) {
        referencia = new Date(Number(ano), Number(mes) - 1, 1);
    }
    else {
        referencia = new Date();
    }
    if (Number.isNaN(referencia.getTime())) {
        return null;
    }
    const inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
    const fim = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
        inicio,
        fim,
        mesAnoReferencia: `${String(referencia.getMonth() + 1).padStart(2, "0")}/${referencia.getFullYear()}`,
    };
};
const createCost = async (req, res) => {
    try {
        const { linkId, nome, valor, dateInicial, dateFinal, tipo, } = req.body;
        if (!linkId ||
            !nome ||
            valor === undefined ||
            !tipo) {
            res.status(400).json({
                error: "linkId, nome, valor e tipo sao obrigatorios",
            });
            return;
        }
        if (!["fixo", "variavel"].includes(tipo)) {
            res.status(400).json({
                error: "tipo deve ser fixo ou variavel",
            });
            return;
        }
        if (tipo === "variavel") {
            if (!dateInicial ||
                !dateFinal ||
                !isValidDate(dateInicial) ||
                !isValidDate(dateFinal)) {
                res.status(400).json({
                    error: "dateInicial e dateFinal sao obrigatorios para custo variavel",
                });
                return;
            }
            if (new Date(dateInicial) > new Date(dateFinal)) {
                res.status(400).json({
                    error: "dateInicial nao pode ser maior que dateFinal",
                });
                return;
            }
        }
        const cost = new Cost_1.default({
            linkId,
            nome,
            valor,
            dateInicial: tipo === "variavel" ? dateInicial : undefined,
            dateFinal: tipo === "variavel" ? dateFinal : undefined,
            status: "pendente",
            idTransacao: [],
            tipo,
        });
        await cost.save();
        res.status(201).json(cost);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao criar custo",
            details: error.message,
        });
    }
};
const getCosts = async (req, res) => {
    try {
        const { linkId, dataReferencia, mes, ano, } = req.query;
        if (!linkId) {
            res.status(400).json({
                error: "linkId e obrigatorio",
            });
            return;
        }
        const referencia = getReferenciaRange(dataReferencia, mes, ano);
        if (!referencia) {
            res.status(400).json({
                error: "dataReferencia, mes ou ano invalidos",
            });
            return;
        }
        const costs = await Cost_1.default.find({
            linkId,
            $or: [
                { tipo: "fixo" },
                {
                    tipo: "variavel",
                    dateInicial: { $lte: referencia.fim },
                    dateFinal: { $gte: referencia.inicio },
                },
            ],
        }).sort({
            createdAt: -1,
        });
        res.json(costs);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar custos",
            details: error.message,
        });
    }
};
const getCostById = async (req, res) => {
    try {
        const { id } = req.params;
        const cost = await Cost_1.default.findById(id);
        if (!cost) {
            res.status(404).json({
                error: "Custo nao encontrado",
            });
            return;
        }
        res.json(cost);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar custo",
            details: error.message,
        });
    }
};
const updateCost = async (req, res) => {
    try {
        const { id } = req.params;
        const { idTransacao, mesAnoReferencia, status, ...costData } = req.body;
        if (status && !["pendente", "pago"].includes(status)) {
            res.status(400).json({
                error: "status deve ser pendente ou pago",
            });
            return;
        }
        if ((idTransacao && !mesAnoReferencia) ||
            (!idTransacao && mesAnoReferencia)) {
            res.status(400).json({
                error: "idTransacao e mesAnoReferencia devem ser enviados juntos",
            });
            return;
        }
        const cost = await Cost_1.default.findById(id);
        if (!cost) {
            res.status(404).json({
                error: "Custo nao encontrado",
            });
            return;
        }
        Object.assign(cost, costData);
        if (status) {
            cost.status = status;
        }
        if (idTransacao && mesAnoReferencia) {
            const transacoes = cost.idTransacao || [];
            const transacaoIndex = transacoes.findIndex((transacao) => transacao.mesAnoReferencia === mesAnoReferencia);
            if (transacaoIndex >= 0) {
                transacoes[transacaoIndex].id = idTransacao;
            }
            else {
                transacoes.push({
                    id: idTransacao,
                    mesAnoReferencia,
                });
            }
            cost.idTransacao = transacoes;
        }
        const updatedCost = await cost.save();
        res.json({
            message: "Custo atualizado com sucesso",
            cost: updatedCost,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar custo",
            details: error.message,
        });
    }
};
const deleteCost = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCost = await Cost_1.default.findByIdAndDelete(id);
        if (!deletedCost) {
            res.status(404).json({
                error: "Custo nao encontrado",
            });
            return;
        }
        res.json({
            message: "Custo removido com sucesso",
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao remover custo",
            details: error.message,
        });
    }
};
exports.default = {
    createCost,
    getCosts,
    getCostById,
    updateCost,
    deleteCost,
};
//# sourceMappingURL=costController.js.map