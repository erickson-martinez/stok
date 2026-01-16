// src/controllers/osController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import OrderService, { OSStatus } from '../models/OrderService';
import Company from '../models/Company';
import User from '../models/User';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY deve estar definida no .env e ter exatamente 64 caracteres hex (32 bytes)');
}

const encryptPhone = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text.trim(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};

const decryptPhone = (encrypted: string): string => {
    try {
        const [ivHex, encryptedText] = encrypted.split(':');
        if (!ivHex || !encryptedText) throw new Error('Formato inválido');
        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            Buffer.from(ENCRYPTION_KEY, 'hex'),
            Buffer.from(ivHex, 'hex')
        );
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.warn('Falha ao descriptografar telefone:', err);
        throw new Error('Telefone criptografado inválido ou chave incorreta');
    }
};

// Cache simples em memória (reinicia com o servidor) — ideal para poucos usuários
// Em produção: usar Redis ou similar
const phoneCache = new Map<string, string>(); // plain → encrypted

async function getEncryptedPhone(plainPhone: string): Promise<string | null> {
    const trimmed = plainPhone.trim();
    if (phoneCache.has(trimmed)) {
        return phoneCache.get(trimmed)!;
    }

    const user = await User.findOne({ $expr: { $eq: [{ $toLower: '$phonePlain' }, trimmed.toLowerCase()] } }).lean();
    // Alternativa (se você adicionar phonePlain no modelo User):
    // const user = await User.findOne({ phonePlain: trimmed.toLowerCase() }).lean();

    if (!user) return null;

    // Se o modelo User ainda não tem phonePlain, descriptografa para comparar
    try {
        if (decryptPhone(user.phone) === trimmed) {
            phoneCache.set(trimmed, user.phone);
            return user.phone;
        }
    } catch { }

    return null;
}

function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').trim(); // remove tudo que não é dígito
    // Opcional: adicionar DDD padrão do Brasil se necessário
}

const osController = {
    // POST /os
    async create(req: Request, res: Response): Promise<void> {
        try {
            let { openerPhone, empresaId, title, description, priority, category } = req.body;

            if (!openerPhone || !empresaId || !title || !description) {
                res.status(400).json({ error: 'Campos obrigatórios: openerPhone, empresaId, title, description' });
                return
            }

            const targetPhone = String(openerPhone).trim();
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();
            users.forEach(user => userMap.set(decryptPhone(user.phone), user.phone));

            const encryptedPhone = userMap.get(targetPhone);
            if (!encryptedPhone) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return
            }
            if (!encryptedPhone) {
                res.status(404).json({ error: 'Usuário (solicitante) não encontrado' });
                return
            }

            if (!mongoose.isValidObjectId(empresaId)) {
                res.status(400).json({ error: 'empresaId inválido' });
                return
            }

            const company = await Company.findById(empresaId).lean();
            if (!company) {
                res.status(404).json({ error: 'Empresa não encontrada' });
                return
            }

            // Futuro: verificar se o usuário pode abrir OS nessa empresa
            // if (!await canUserOpenOSForCompany(encryptedOpener, empresaId)) { ... }

            const os = new OrderService({
                openerPhone: encryptedPhone,
                companyId: new mongoose.Types.ObjectId(empresaId),
                title: String(title).trim().slice(0, 120),
                description: String(description).trim().slice(0, 2000),
                priority: ['baixa', 'média', 'alta', 'urgente'].includes(priority) ? priority : 'média',
                category: category ? String(category).trim().slice(0, 80) : undefined,
                status: 'aberto' as OSStatus,
            });

            await os.save();

            res.status(201).json({
                message: 'Ordem de serviço criada',
                os: {
                    ...os.toObject(),
                    openerPhone, // retorna o plain para o frontend
                },
            });
        } catch (error: any) {
            console.error('Erro ao criar OS:', error);
            res.status(500).json({ error: 'Erro interno ao criar ordem de serviço' });
        }
    },

    // GET /os/my
    async getMyOrders(req: Request, res: Response): Promise<void> {
        try {
            const { phone } = req.query;
            if (!phone) {
                res.status(400).json({ error: 'Parâmetro phone obrigatório' });
                return
            }
            const targetPhone = String(phone).trim();
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();
            users.forEach(user => userMap.set(decryptPhone(user.phone), user.phone));

            const encryptedPhone = userMap.get(targetPhone);
            if (!encryptedPhone) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return
            }

            const chamados = await OrderService.find({ openerPhone: encryptedPhone })
                .sort({ createdAt: -1 })
                .populate('companyId', 'name fantasyName cnpj')
                .lean();

            const counters = chamados.reduce(
                (acc, os) => {
                    acc[os.status as OSStatus] = (acc[os.status as OSStatus] || 0) + 1;
                    acc.total += 1;
                    return acc;
                },
                { aberto: 0, em_andamento: 0, pausado: 0, resolvido: 0, cancelado: 0, total: 0 } as Record<OSStatus | 'total', number>
            );

            res.json({
                contadores: counters,
                chamados: chamados.map(os => ({
                    ...os,
                    openerPhone: decryptPhone(os.openerPhone),
                    resolverPhone: os.resolverPhone ? decryptPhone(os.resolverPhone) : undefined,
                })),
            });
        } catch (error: any) {
            console.error('Erro ao listar minhas OS:', error);
            res.status(500).json({ error: 'Erro ao listar suas ordens de serviço' });
        }
    },

    // GET /os/company
    async getCompanyOrders(req: Request, res: Response): Promise<void> {
        try {
            const { empresaId, phone } = req.query;
            if (!empresaId || !phone) {
                res.status(400).json({ error: 'Parâmetros obrigatórios: empresaId e phone' });
                return
            }



            if (!mongoose.isValidObjectId(empresaId)) {
                res.status(400).json({ error: 'empresaId inválido' });
                return
            }

            const targetPhone = String(phone).trim();
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();
            users.forEach(user => userMap.set(decryptPhone(user.phone), user.phone));

            const requesterEncrypted = userMap.get(targetPhone);
            if (!requesterEncrypted) {
                res.status(404).json({ error: 'Usuário solicitante não encontrado' });
                return
            }

            const company = await Company.findById(empresaId).lean();
            if (!company) {
                res.status(404).json({ error: 'Empresa não encontrada' });
                return
            }

            // Permissão: por enquanto apenas o dono — depois expandir para admins/gerentes/técnicos
            if (company.phone !== requesterEncrypted) {
                res.status(403).json({ error: 'Você não tem permissão para ver os chamados desta empresa' });
                return
            }

            const chamados = await OrderService.find({ companyId: empresaId })
                .sort({ createdAt: -1 })
                .populate('companyId', 'name fantasyName')
                .lean();

            const counters = chamados.reduce(
                (acc, os) => {
                    acc[os.status as OSStatus] = (acc[os.status as OSStatus] || 0) + 1;
                    acc.total += 1;
                    return acc;
                },
                { aberto: 0, em_andamento: 0, pausado: 0, resolvido: 0, cancelado: 0, total: 0 }
            );

            res.json({
                empresa: { id: company._id, nome: company.name },
                contadores: counters,
                chamados: chamados.map(os => ({
                    ...os,
                    openerPhone: decryptPhone(os.openerPhone),
                    resolverPhone: os.resolverPhone ? decryptPhone(os.resolverPhone) : undefined,
                })),
            });
        } catch (error: any) {
            console.error('Erro ao listar OS da empresa:', error);
            res.status(500).json({ error: 'Erro ao listar chamados da empresa' });
        }
    },

    // PATCH /os/:id/resolve
    async resolve(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { resolverPhone, resolution } = req.body;

            if (!resolverPhone || !resolution?.trim()) {
                res.status(400).json({ error: 'resolverPhone e resolution (não vazio) são obrigatórios' });
                return
            }

            if (!mongoose.isValidObjectId(id)) {
                res.status(400).json({ error: 'ID da OS inválido' });
                return
            }

            const os = await OrderService.findById(id);
            if (!os) {
                res.status(404).json({ error: 'Ordem de serviço não encontrada' });
                return
            }
            if (['resolvido', 'cancelado'].includes(os.status)) {
                res.status(400).json({ error: `Não é possível resolver uma OS já ${os.status}` });
                return
            }

            const plainResolver = normalizePhone(resolverPhone);
            const encryptedResolver = await getEncryptedPhone(plainResolver);
            if (!encryptedResolver) {
                res.status(404).json({ error: 'Usuário resolvedor não encontrado' });
                return
            }

            const company = await Company.findById(os.companyId).lean();
            if (!company || company.phone !== encryptedResolver) {
                // Futuro: permitir técnicos designados também
                res.status(403).json({ error: 'Apenas o proprietário pode resolver chamados neste momento' });
                return
            }

            os.status = 'resolvido';
            os.resolverPhone = encryptedResolver;
            os.resolution = resolution.trim().slice(0, 2000);
            os.resolvedAt = new Date();

            await os.save();

            res.json({
                message: 'Ordem de serviço resolvida',
                os: {
                    ...os.toObject(),
                    openerPhone: decryptPhone(os.openerPhone),
                    resolverPhone: plainResolver,
                },
            });
        } catch (error: any) {
            console.error('Erro ao resolver OS:', error);
            res.status(500).json({ error: 'Erro ao resolver ordem de serviço' });
        }
    },

    // PATCH /os/:id/cancel
    async cancel(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { phone } = req.body;

            if (!phone) {
                res.status(400).json({ error: 'phone é obrigatório' });
                return
            }
            if (!mongoose.isValidObjectId(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return
            }

            const os = await OrderService.findById(id);
            if (!os) {
                res.status(404).json({ error: 'OS não encontrada' });
                return
            }
            if (['resolvido', 'cancelado'].includes(os.status)) {
                res.status(400).json({ error: `Não é possível cancelar OS já ${os.status}` });
                return
            }

            const plainPhone = normalizePhone(phone as string);
            const encryptedPhone = await getEncryptedPhone(plainPhone);

            if (!encryptedPhone || encryptedPhone !== os.openerPhone) {
                res.status(403).json({ error: 'Apenas quem abriu o chamado pode cancelá-lo' });
                return
            }

            os.status = 'cancelado';
            await os.save();

            res.json({
                message: 'Ordem de serviço cancelada',
                os: { ...os.toObject(), openerPhone: plainPhone },
            });
        } catch (error: any) {
            console.error('Erro ao cancelar OS:', error);
            res.status(500).json({ error: 'Erro ao cancelar ordem de serviço' });
        }
    },

    // PATCH /os/:id/start
    async start(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { phone } = req.body;

            if (!phone) {
                res.status(400).json({ error: 'phone é obrigatório' });
                return
            }
            if (!mongoose.isValidObjectId(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return
            }
            const os = await OrderService.findById(id);
            if (!os) {
                res.status(404).json({ error: 'OS não encontrada' });
                return
            }
            if (os.status !== 'aberto') {
                res.status(400).json({ error: 'Apenas ordens abertas podem ser iniciadas' });
                return
            }

            // Futuro: verificar se o usuário tem permissão (dono ou técnico atribuído)

            os.status = 'em_andamento';
            await os.save();

            res.json({
                message: 'Ordem de serviço iniciada',
                os: os.toObject(),
            });
        } catch (error: any) {
            console.error('Erro ao iniciar OS:', error);
            res.status(500).json({ error: 'Erro ao iniciar ordem de serviço' });
        }
    },
};

export default osController;