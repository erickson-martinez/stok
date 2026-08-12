"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const AppointmentBarber_1 = __importDefault(require("../models/AppointmentBarber"));
const Barber_1 = __importDefault(require("../models/Barber"));
const BarberService_1 = __importDefault(require("../models/BarberService"));
const BarberProduct_1 = __importDefault(require("../models/BarberProduct"));
const SubscriptionClient_1 = __importDefault(require("../models/SubscriptionClient"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const WEEKDAY_DISCOUNT_DAYS = [1, 2, 3, 4];
const WEEKDAY_DISCOUNT_VALUE = 5;
class HttpError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
function getRequestUserIdentifier(req) {
    const bodyUser = typeof req.body?.updatedBy === "string" &&
        req.body.updatedBy.trim().length > 0
        ? req.body.updatedBy.trim()
        : undefined;
    if (bodyUser) {
        return bodyUser;
    }
    const { user } = req;
    if (typeof user?.id === "string" && user.id.trim()) {
        return user.id.trim();
    }
    if (typeof user?._id === "string" && user._id.trim()) {
        return user._id.trim();
    }
    if (typeof user?.email === "string" && user.email.trim()) {
        return user.email.trim();
    }
    return "";
}
function parseIdList(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .filter((item) => typeof item === "string" &&
        item.trim().length > 0)
        .map((item) => item.trim());
}
function parseProductSelections(produtos, produtosIdsFallback) {
    if (Array.isArray(produtos)) {
        return produtos
            .map((item) => {
            if (!item || typeof item !== "object") {
                return null;
            }
            const { produtoId, quantidade: quantidadeBruta, } = item;
            if (typeof produtoId !== "string" ||
                produtoId.trim().length === 0) {
                return null;
            }
            const quantidade = typeof quantidadeBruta === "number"
                ? quantidadeBruta
                : Number(quantidadeBruta);
            if (!Number.isFinite(quantidade) ||
                quantidade <= 0) {
                return null;
            }
            return {
                produtoId: produtoId.trim(),
                quantidade: Math.floor(quantidade),
            };
        })
            .filter((item) => item !== null);
    }
    return parseIdList(produtosIdsFallback).map((produtoId) => ({
        produtoId,
        quantidade: 1,
    }));
}
function getMonthBoundaries(date) {
    const inicioMes = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const fimMes = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { inicioMes, fimMes };
}
async function validateBarber(barbeiroId, linkId, session) {
    const barber = await Barber_1.default.findOne({
        _id: barbeiroId,
        linkId,
    })
        .select("_id nome")
        .lean()
        .session(session);
    if (!barber) {
        throw new HttpError(404, "Barbeiro não encontrado");
    }
    return {
        id: barber._id.toString(),
        nome: barber.nome,
    };
}
async function fetchServices(servicosIds, linkId, session) {
    const uniqueServiceIds = Array.from(new Set(servicosIds));
    if (!uniqueServiceIds.length) {
        return new Map();
    }
    const services = await BarberService_1.default.find({
        _id: { $in: uniqueServiceIds },
        linkId,
    })
        .select("_id nome categoria valor")
        .session(session)
        .lean();
    if (services.length !== uniqueServiceIds.length) {
        throw new HttpError(404, "Um ou mais serviços não foram encontrados");
    }
    return toServiceMap(services);
}
async function fetchProducts(productSelections, linkId, session) {
    const uniqueProductIds = Array.from(new Set(productSelections.map((item) => item.produtoId)));
    if (!uniqueProductIds.length) {
        return new Map();
    }
    const products = await BarberProduct_1.default.find({
        _id: { $in: uniqueProductIds },
        linkId,
    })
        .select("_id nome categoria precoVenda estoque")
        .session(session)
        .lean();
    if (products.length !== uniqueProductIds.length) {
        throw new HttpError(404, "Um ou mais produtos não foram encontrados");
    }
    const map = new Map();
    products.forEach((product) => {
        map.set(product._id.toString(), product);
    });
    return map;
}
function validateProductStock(productSelections, productMap) {
    productSelections.forEach((selection) => {
        const product = productMap.get(selection.produtoId);
        if (!product) {
            return;
        }
        if (product.estoque <= 0) {
            throw new HttpError(400, `Produto ${product.nome} sem estoque.`);
        }
        if (selection.quantidade > product.estoque) {
            throw new HttpError(400, `Estoque insuficiente para o produto ${product.nome}.`);
        }
    });
}
function toServiceMap(services) {
    const map = new Map();
    services.forEach((service) => {
        map.set(service._id.toString(), service);
    });
    return map;
}
function createItemsSnapshot(servicosIds, produtos, serviceMap, productMap) {
    const items = [];
    servicosIds.forEach((serviceId) => {
        const service = serviceMap.get(serviceId);
        if (!service) {
            return;
        }
        items.push({
            id: service._id.toString(),
            tipo: "servico",
            nome: service.nome,
            categoria: service.categoria,
            quantidade: 1,
            valorUnitario: service.valor,
            valorTotal: service.valor,
        });
    });
    produtos.forEach((selection) => {
        const product = productMap.get(selection.produtoId);
        if (!product) {
            return;
        }
        items.push({
            id: product._id.toString(),
            tipo: "produto",
            nome: product.nome,
            categoria: product.categoria,
            quantidade: selection.quantidade,
            valorUnitario: product.precoVenda,
            valorTotal: selection.quantidade * product.precoVenda,
        });
    });
    return items;
}
async function validateSubscription(clienteTelefone, linkId, dataAgendada, session) {
    const subscriptionClient = await SubscriptionClient_1.default.findOne({
        telefone: clienteTelefone,
        ativo: true,
        linkId,
    })
        .select("_id planoId")
        .session(session)
        .lean();
    if (!subscriptionClient) {
        return { possui: false };
    }
    const plan = await SubscriptionPlan_1.default.findOne({
        _id: subscriptionClient.planoId,
        linkId,
    })
        .select("_id nome valorMensal limiteMensal")
        .session(session)
        .lean();
    if (!plan) {
        return { possui: false };
    }
    const { inicioMes, fimMes } = getMonthBoundaries(dataAgendada);
    const totalAtendimentosAssinaturaMes = await AppointmentBarber_1.default.countDocuments({
        clienteTelefone,
        linkId,
        status: { $ne: "cancelado" },
        "assinatura.possui": true,
        "assinatura.assinaturaId": subscriptionClient._id.toString(),
        dataAgendada: {
            $gte: inicioMes,
            $lte: fimMes,
        },
    }).session(session);
    const limiteMensal = typeof plan.limiteMensal === "number"
        ? plan.limiteMensal
        : null;
    const podeUsarAssinatura = limiteMensal === null
        ? true
        : totalAtendimentosAssinaturaMes < limiteMensal;
    if (!podeUsarAssinatura) {
        return { possui: false };
    }
    return {
        possui: true,
        assinaturaId: subscriptionClient._id.toString(),
        planoId: plan._id.toString(),
        planoNome: plan.nome,
        valorMensal: plan.valorMensal,
        atendimentoNumero: totalAtendimentosAssinaturaMes + 1,
        codigoAtendimento: totalAtendimentosAssinaturaMes + 1,
        valorSimbolico: 0,
    };
}
async function validateScheduleConflict(barbeiroId, linkId, dataAgendada, horarios, session, ignoreAppointmentId) {
    const inicioDia = new Date(dataAgendada);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataAgendada);
    fimDia.setHours(23, 59, 59, 999);
    const conflictFilter = {
        barbeiroId,
        linkId,
        status: { $ne: "cancelado" },
        dataAgendada: {
            $gte: inicioDia,
            $lte: fimDia,
        },
        horarios: { $in: horarios },
    };
    if (ignoreAppointmentId) {
        conflictFilter._id = { $ne: ignoreAppointmentId };
    }
    const conflict = await AppointmentBarber_1.default.findOne(conflictFilter)
        .select("_id")
        .session(session);
    if (conflict) {
        throw new HttpError(409, "Horário indisponível.");
    }
}
async function validatePendingDuplicate(clienteTelefone, clienteEmail, barbeiroId, linkId, dataAgendada, horarios, session) {
    const contactFilters = [];
    if (clienteTelefone) {
        contactFilters.push({ clienteTelefone });
    }
    if (clienteEmail) {
        contactFilters.push({ clienteEmail });
    }
    if (!contactFilters.length) {
        return;
    }
    const inicioDia = new Date(dataAgendada);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataAgendada);
    fimDia.setHours(23, 59, 59, 999);
    const duplicate = await AppointmentBarber_1.default.findOne({
        $or: contactFilters,
        barbeiroId,
        linkId,
        status: "pendente",
        dataAgendada: {
            $gte: inicioDia,
            $lte: fimDia,
        },
        horarios: { $in: horarios },
    })
        .select("_id")
        .session(session);
    if (duplicate) {
        throw new HttpError(409, "Já existe um agendamento pendente idêntico para este cliente.");
    }
}
async function moveStockForAppointment(appointment, direction, session) {
    const productItems = appointment.items.filter((item) => item.tipo === "produto");
    for (const item of productItems) {
        if (direction === "out") {
            const result = await BarberProduct_1.default.updateOne({
                _id: item.id,
                linkId: appointment.linkId,
                estoque: { $gte: item.quantidade },
            }, {
                $inc: {
                    estoque: -item.quantidade,
                },
            }, { session });
            if (result.modifiedCount === 0) {
                throw new HttpError(400, `Estoque insuficiente para o produto ${item.nome}.`);
            }
            continue;
        }
        await BarberProduct_1.default.updateOne({
            _id: item.id,
            linkId: appointment.linkId,
        }, {
            $inc: {
                estoque: item.quantidade,
            },
        }, { session });
    }
}
function resolvePaymentFields(body, userId, finalStatus) {
    const update = {};
    update["pagamento.status"] = finalStatus;
    if (finalStatus === "cancelado") {
        return update;
    }
    if (Array.isArray(body.formas)) {
        const formas = body.formas.filter((item) => typeof item === "string" && item.trim().length > 0);
        if (formas.length) {
            update["pagamento.formas"] = formas.map((item) => item.trim());
        }
    }
    if (typeof body.valorRecebido === "number" &&
        Number.isFinite(body.valorRecebido)) {
        update["pagamento.valorRecebido"] = body.valorRecebido;
    }
    if (typeof body.troco === "number" && Number.isFinite(body.troco)) {
        update["pagamento.troco"] = body.troco;
    }
    update["pagamento.dataPagamento"] = new Date();
    if (userId) {
        update["pagamento.usuarioPagamento"] = userId;
    }
    else if (typeof body.usuarioPagamento === "string" &&
        body.usuarioPagamento.trim().length > 0) {
        update["pagamento.usuarioPagamento"] =
            body.usuarioPagamento.trim();
    }
    if (finalStatus === "assinatura") {
        update["pagamento.formas"] = ["assinatura"];
    }
    return update;
}
function calculateTotals(items) {
    let subtotalServicos = 0;
    let subtotalProdutos = 0;
    items.forEach((item) => {
        if (item.tipo === "servico") {
            subtotalServicos += item.valorTotal;
            return;
        }
        subtotalProdutos += item.valorTotal;
    });
    return {
        subtotalServicos,
        subtotalProdutos,
        valorOriginal: subtotalServicos + subtotalProdutos,
    };
}
function calculateWeekdayDiscount(dataAgendada, subtotalServicos) {
    const dayOfWeek = dataAgendada.getDay();
    if (!WEEKDAY_DISCOUNT_DAYS.includes(dayOfWeek) ||
        subtotalServicos <= 0) {
        return 0;
    }
    return Math.min(WEEKDAY_DISCOUNT_VALUE, subtotalServicos);
}
const createAppointment = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        const { clienteNome, clienteTelefone, clienteEmail, barbeiroId, dataAgendada, horarios, linkId, quantidadePessoas, nomesAcompanhantes, descricaoServicos, } = req.body;
        const servicosIds = parseIdList(req.body.servicosIds);
        const produtos = parseProductSelections(req.body.produtos, req.body.produtosIds);
        if (typeof clienteNome !== "string" ||
            clienteNome.trim().length === 0) {
            res.status(400).json({
                error: "clienteNome é obrigatório",
            });
            return;
        }
        if (clienteTelefone !== undefined &&
            typeof clienteTelefone !== "string") {
            res.status(400).json({
                error: "clienteTelefone invalido",
            });
            return;
        }
        if (clienteEmail !== undefined &&
            typeof clienteEmail !== "string") {
            res.status(400).json({
                error: "clienteEmail invalido",
            });
            return;
        }
        if (typeof barbeiroId !== "string" ||
            barbeiroId.trim().length === 0) {
            res.status(400).json({
                error: "barbeiroId é obrigatório",
            });
            return;
        }
        if (!dataAgendada) {
            res.status(400).json({
                error: "dataAgendada é obrigatório",
            });
            return;
        }
        if (!Array.isArray(horarios) ||
            horarios.length === 0 ||
            !horarios.every((item) => typeof item === "string" &&
                item.trim().length > 0)) {
            res.status(400).json({
                error: "horarios é obrigatório",
            });
            return;
        }
        if (typeof linkId !== "string" ||
            linkId.trim().length === 0) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });
            return;
        }
        const parsedDate = new Date(dataAgendada);
        if (Number.isNaN(parsedDate.getTime())) {
            res.status(400).json({
                error: "dataAgendada inválida",
            });
            return;
        }
        const clienteTelefoneFormatado = typeof clienteTelefone === "string"
            ? clienteTelefone.trim()
            : "";
        const clienteEmailFormatado = typeof clienteEmail === "string"
            ? clienteEmail.trim().toLowerCase()
            : "";
        const barbeiroIdFormatado = barbeiroId.trim();
        const linkIdFormatado = linkId.trim();
        const horariosFormatados = horarios.map((item) => item.trim());
        const produtosIds = produtos.map((item) => item.produtoId);
        const userId = getRequestUserIdentifier(req);
        session.startTransaction();
        const barber = await validateBarber(barbeiroIdFormatado, linkIdFormatado, session);
        await validateScheduleConflict(barbeiroIdFormatado, linkIdFormatado, parsedDate, horariosFormatados, session);
        await validatePendingDuplicate(clienteTelefoneFormatado, clienteEmailFormatado, barbeiroIdFormatado, linkIdFormatado, parsedDate, horariosFormatados, session);
        const serviceMap = await fetchServices(servicosIds, linkIdFormatado, session);
        const productMap = await fetchProducts(produtos, linkIdFormatado, session);
        validateProductStock(produtos, productMap);
        const items = createItemsSnapshot(servicosIds, produtos, serviceMap, productMap);
        const { subtotalServicos, subtotalProdutos, valorOriginal, } = calculateTotals(items);
        const assinatura = clienteTelefoneFormatado
            ? await validateSubscription(clienteTelefoneFormatado, linkIdFormatado, parsedDate, session)
            : { possui: false };
        const descontoDiaSemana = calculateWeekdayDiscount(parsedDate, subtotalServicos);
        const pagamento = assinatura.possui
            ? {
                status: "assinatura",
                formas: ["assinatura"],
                desconto: subtotalServicos,
                subtotalServicos,
                subtotalProdutos,
                valorOriginal,
                valorCobrado: subtotalProdutos,
            }
            : {
                status: "pendente",
                formas: [],
                desconto: descontoDiaSemana,
                subtotalServicos,
                subtotalProdutos,
                valorOriginal,
                valorCobrado: valorOriginal - descontoDiaSemana,
            };
        const appointment = new AppointmentBarber_1.default({
            clienteNome: clienteNome.trim(),
            clienteTelefone: clienteTelefoneFormatado,
            clienteEmail: clienteEmailFormatado,
            barbeiroId: barbeiroIdFormatado,
            dataAgendada: parsedDate,
            horarios: horariosFormatados,
            status: "pendente",
            quantidadePessoas: typeof quantidadePessoas === "number" &&
                quantidadePessoas > 0
                ? quantidadePessoas
                : 1,
            nomesAcompanhantes: typeof nomesAcompanhantes === "string"
                ? nomesAcompanhantes
                : "",
            descricaoServicos: typeof descricaoServicos === "string"
                ? descricaoServicos
                : "",
            servicosIds,
            produtosIds,
            items,
            assinatura,
            assinaturaAplicada: assinatura.possui,
            pagamento,
            createdBy: userId,
            updatedBy: userId,
            updatedAt: new Date(),
            estoqueMovimentado: false,
            linkId: linkIdFormatado,
        });
        await appointment.save({ session });
        await session.commitTransaction();
        const appointmentObj = appointment.toObject();
        const servicosDetalhes = items
            .filter((item) => item.tipo === "servico")
            .map((item) => ({
            id: item.id,
            nome: item.nome,
            categoria: item.categoria,
        }));
        const produtosDetalhes = items
            .filter((item) => item.tipo === "produto")
            .map((item) => ({
            id: item.id,
            nome: item.nome,
            categoria: item.categoria,
            quantidade: item.quantidade,
        }));
        res.status(201).json({
            ...appointmentObj,
            barbeiro: {
                id: barber.id,
                nome: barber.nome,
            },
            servicos: servicosDetalhes,
            produtos: produtosDetalhes,
        });
    }
    catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        if (error instanceof HttpError) {
            res.status(error.statusCode).json({
                error: error.message,
            });
            return;
        }
        res.status(500).json({
            error: "Erro ao criar agendamento",
            details: error.message,
        });
    }
    finally {
        session.endSession();
    }
};
const getAppointments = async (req, res) => {
    try {
        const { linkId } = req.query;
        if (!linkId) {
            res.status(400).json({
                error: "linkId é obrigatório",
            });
            return;
        }
        const appointments = await AppointmentBarber_1.default.find({
            linkId,
        }).sort({
            dataAgendada: 1,
        });
        res.json(appointments);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar agendamentos",
            details: error.message,
        });
    }
};
const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await AppointmentBarber_1.default.findById(id);
        if (!appointment) {
            res.status(404).json({
                error: "Agendamento não encontrado",
            });
            return;
        }
        res.json(appointment);
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao buscar agendamento",
            details: error.message,
        });
    }
};
const updateAppointment = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        const { id } = req.params;
        const userId = getRequestUserIdentifier(req);
        const blockedFields = [
            "items",
            "pagamento",
            "assinatura",
            "assinaturaAplicada",
            "servicosIds",
            "produtosIds",
            "valorOriginal",
            "valorCobrado",
            "subtotalProdutos",
            "subtotalServicos",
        ];
        const attemptedBlockedFields = blockedFields.filter((field) => field in req.body);
        if (attemptedBlockedFields.length > 0) {
            res.status(400).json({
                error: "Não é permitido alterar campos históricos do agendamento.",
            });
            return;
        }
        const updateData = {};
        if ("clienteNome" in req.body) {
            if (typeof req.body.clienteNome !== "string" ||
                req.body.clienteNome.trim().length === 0) {
                res.status(400).json({
                    error: "clienteNome inválido",
                });
                return;
            }
            updateData.clienteNome = req.body.clienteNome.trim();
        }
        if ("clienteTelefone" in req.body) {
            if (req.body.clienteTelefone !== undefined &&
                typeof req.body.clienteTelefone !== "string") {
                res.status(400).json({
                    error: "clienteTelefone inválido",
                });
                return;
            }
            updateData.clienteTelefone =
                typeof req.body.clienteTelefone === "string"
                    ? req.body.clienteTelefone.trim()
                    : "";
        }
        if ("clienteEmail" in req.body) {
            if (req.body.clienteEmail !== undefined &&
                typeof req.body.clienteEmail !== "string") {
                res.status(400).json({
                    error: "clienteEmail invalido",
                });
                return;
            }
            updateData.clienteEmail =
                typeof req.body.clienteEmail === "string"
                    ? req.body.clienteEmail.trim().toLowerCase()
                    : "";
        }
        if ("dataAgendada" in req.body) {
            const parsedDate = new Date(req.body.dataAgendada);
            if (Number.isNaN(parsedDate.getTime())) {
                res.status(400).json({
                    error: "dataAgendada inválida",
                });
                return;
            }
            updateData.dataAgendada = parsedDate;
        }
        if ("horarios" in req.body) {
            if (!Array.isArray(req.body.horarios) ||
                req.body.horarios.length === 0 ||
                !req.body.horarios.every((item) => typeof item === "string" &&
                    item.trim().length > 0)) {
                res.status(400).json({
                    error: "horarios inválido",
                });
                return;
            }
            updateData.horarios = req.body.horarios.map((item) => item.trim());
        }
        if ("quantidadePessoas" in req.body) {
            if (typeof req.body.quantidadePessoas !== "number" ||
                req.body.quantidadePessoas <= 0) {
                res.status(400).json({
                    error: "quantidadePessoas inválido",
                });
                return;
            }
            updateData.quantidadePessoas =
                req.body.quantidadePessoas;
        }
        if ("nomesAcompanhantes" in req.body) {
            if (typeof req.body.nomesAcompanhantes !== "string") {
                res.status(400).json({
                    error: "nomesAcompanhantes inválido",
                });
                return;
            }
            updateData.nomesAcompanhantes =
                req.body.nomesAcompanhantes;
        }
        if ("descricaoServicos" in req.body) {
            if (typeof req.body.descricaoServicos !== "string") {
                res.status(400).json({
                    error: "descricaoServicos inválido",
                });
                return;
            }
            updateData.descricaoServicos =
                req.body.descricaoServicos;
        }
        if ("status" in req.body) {
            const allowedStatuses = [
                "pendente",
                "atendendo",
                "finalizado",
                "cancelado",
                "pago",
            ];
            if (typeof req.body.status !== "string" ||
                !allowedStatuses.includes(req.body.status)) {
                res.status(400).json({
                    error: "status inválido",
                });
                return;
            }
            updateData.status = req.body.status;
        }
        if (Object.keys(updateData).length === 0) {
            res.status(400).json({
                error: "Nenhum campo permitido para atualização foi informado",
            });
            return;
        }
        session.startTransaction();
        const currentAppointment = await AppointmentBarber_1.default.findById(id).session(session);
        if (!currentAppointment) {
            await session.abortTransaction();
            res.status(404).json({
                error: "Agendamento não encontrado",
            });
            return;
        }
        if (updateData.dataAgendada || updateData.horarios) {
            const targetDate = updateData.dataAgendada ??
                currentAppointment.dataAgendada;
            const targetHorarios = updateData.horarios ?? currentAppointment.horarios;
            await validateScheduleConflict(currentAppointment.barbeiroId, currentAppointment.linkId, targetDate, targetHorarios, session, currentAppointment.id);
        }
        if (updateData.status) {
            const allowedTransitions = {
                pendente: ["atendendo", "cancelado"],
                atendendo: ["finalizado", "cancelado"],
                finalizado: ["pago"],
                pago: [],
                cancelado: [],
            };
            const currentStatus = currentAppointment.status;
            const nextStatus = updateData.status;
            if (!allowedTransitions[currentStatus].includes(nextStatus)) {
                await session.abortTransaction();
                res.status(400).json({
                    error: `Transição de status inválida: ${currentStatus} -> ${nextStatus}`,
                });
                return;
            }
            if ((nextStatus === "finalizado" ||
                nextStatus === "pago") &&
                !currentAppointment.estoqueMovimentado) {
                await moveStockForAppointment({
                    items: currentAppointment.items,
                    linkId: currentAppointment.linkId,
                }, "out", session);
                updateData.estoqueMovimentado = true;
            }
            if (nextStatus === "cancelado" &&
                currentAppointment.estoqueMovimentado) {
                await moveStockForAppointment({
                    items: currentAppointment.items,
                    linkId: currentAppointment.linkId,
                }, "in", session);
                updateData.estoqueMovimentado = false;
                updateData["pagamento.status"] = "cancelado";
            }
        }
        updateData.updatedAt = new Date();
        if (userId) {
            updateData.updatedBy = userId;
        }
        const updatedAppointment = await AppointmentBarber_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            session,
        });
        if (!updatedAppointment) {
            await session.abortTransaction();
            res.status(404).json({
                error: "Agendamento não encontrado",
            });
            return;
        }
        await session.commitTransaction();
        res.json({
            message: "Agendamento atualizado com sucesso",
            appointment: updatedAppointment,
        });
    }
    catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        res.status(500).json({
            error: "Erro ao atualizar agendamento",
            details: error.message,
        });
    }
    finally {
        session.endSession();
    }
};
const updateStatus = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        const { id } = req.params;
        const userId = getRequestUserIdentifier(req);
        const { status, descricaoServicos, } = req.body;
        if (typeof status !== "string" ||
            status.trim().length === 0) {
            res.status(400).json({
                error: "Status é obrigatório",
            });
            return;
        }
        const statusNormalizado = status.trim().toLowerCase();
        const requestedStatus = statusNormalizado === "assinatura"
            ? "pago"
            : statusNormalizado;
        if (![
            "pendente",
            "atendendo",
            "finalizado",
            "cancelado",
            "pago",
        ].includes(requestedStatus)) {
            res.status(400).json({
                error: "Status inválido",
            });
            return;
        }
        session.startTransaction();
        const appointment = await AppointmentBarber_1.default.findById(id).session(session);
        if (!appointment) {
            await session.abortTransaction();
            res.status(404).json({
                error: "Agendamento não encontrado",
            });
            return;
        }
        const allowedTransitions = {
            pendente: ["atendendo", "cancelado"],
            atendendo: ["finalizado", "cancelado"],
            finalizado: ["pago"],
            pago: [],
            cancelado: [],
        };
        const currentStatus = appointment.status;
        const nextStatus = requestedStatus;
        if (!allowedTransitions[currentStatus].includes(nextStatus)) {
            await session.abortTransaction();
            res.status(400).json({
                error: `Transição de status inválida: ${currentStatus} -> ${nextStatus}`,
            });
            return;
        }
        let updateData = {
            status: nextStatus,
            updatedAt: new Date(),
        };
        if (userId) {
            updateData.updatedBy = userId;
        }
        if (nextStatus === "finalizado") {
            const descricaoValida = typeof descricaoServicos === "string" &&
                descricaoServicos.trim().length > 0;
            if (!descricaoValida) {
                res.status(400).json({
                    error: "Informe informações sobre os serviços realizados para finalizar o agendamento.",
                });
                return;
            }
            updateData.descricaoServicos =
                descricaoServicos.trim();
            if (!appointment.estoqueMovimentado) {
                await moveStockForAppointment({
                    items: appointment.items,
                    linkId: appointment.linkId,
                }, "out", session);
                updateData.estoqueMovimentado = true;
            }
        }
        if (nextStatus === "pago") {
            if (!appointment.estoqueMovimentado) {
                await moveStockForAppointment({
                    items: appointment.items,
                    linkId: appointment.linkId,
                }, "out", session);
                updateData.estoqueMovimentado = true;
            }
            const paymentStatus = statusNormalizado === "assinatura"
                ? "assinatura"
                : "pago";
            updateData = {
                ...updateData,
                ...resolvePaymentFields(req.body, userId, paymentStatus),
            };
        }
        if (nextStatus === "cancelado") {
            if (appointment.estoqueMovimentado) {
                await moveStockForAppointment({
                    items: appointment.items,
                    linkId: appointment.linkId,
                }, "in", session);
                updateData.estoqueMovimentado = false;
            }
            updateData = {
                ...updateData,
                ...resolvePaymentFields(req.body, userId, "cancelado"),
            };
        }
        console.log("UPDATE:", updateData);
        const updatedAppointment = await AppointmentBarber_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            session,
        });
        if (!updatedAppointment) {
            await session.abortTransaction();
            res.status(404).json({
                error: "Agendamento não encontrado",
            });
            return;
        }
        await session.commitTransaction();
        res.json({
            message: "Status atualizado com sucesso",
            appointment: updatedAppointment,
        });
    }
    catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        if (error instanceof HttpError) {
            res.status(error.statusCode).json({
                error: error.message,
            });
            return;
        }
        console.error(error);
        res.status(500).json({
            error: "Erro ao atualizar status",
            details: error.message,
        });
    }
    finally {
        session.endSession();
    }
};
const cancelAppointment = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        const { id } = req.params;
        const userId = getRequestUserIdentifier(req);
        session.startTransaction();
        const appointment = await AppointmentBarber_1.default.findById(id).session(session);
        if (!appointment) {
            await session.abortTransaction();
            res.status(404).json({
                error: "Agendamento não encontrado",
            });
            return;
        }
        const updateData = {
            status: "cancelado",
            "pagamento.status": "cancelado",
            updatedAt: new Date(),
        };
        if (userId) {
            updateData.updatedBy = userId;
        }
        if (appointment.estoqueMovimentado) {
            await moveStockForAppointment({
                items: appointment.items,
                linkId: appointment.linkId,
            }, "in", session);
            updateData.estoqueMovimentado = false;
        }
        const updatedAppointment = await AppointmentBarber_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            session,
        });
        if (!updatedAppointment) {
            await session.abortTransaction();
            res.status(404).json({
                error: "Agendamento não encontrado",
            });
            return;
        }
        await session.commitTransaction();
        res.json({
            message: "Agendamento cancelado com sucesso",
            appointment: updatedAppointment,
        });
    }
    catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        if (error instanceof HttpError) {
            res.status(error.statusCode).json({
                error: error.message,
            });
            return;
        }
        res.status(500).json({
            error: "Erro ao cancelar agendamento",
            details: error.message,
        });
    }
    finally {
        session.endSession();
    }
};
const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAppointment = await AppointmentBarber_1.default.findByIdAndDelete(id);
        if (!deletedAppointment) {
            res.status(404).json({
                error: "Agendamento não encontrado",
            });
            return;
        }
        res.json({
            message: "Agendamento removido com sucesso",
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao remover agendamento",
            details: error.message,
        });
    }
};
exports.default = {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    updateStatus,
    cancelAppointment,
    deleteAppointment,
};
//# sourceMappingURL=appointmentBarberController.js.map