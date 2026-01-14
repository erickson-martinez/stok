// src/controllers/workRecordController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import WorkRecord, { WorkRecordStatus } from '../models/WorkRecord';
import Company from '../models/Company';           // assumindo que existe
import User from '../models/User';
import Transaction from '../models/Transaction';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não está definida no arquivo .env");
}

// Funções de criptografia (consistentes com transactionController)
const encryptPhone = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY, "hex"),
        iv
    );
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
};

const decryptPhone = (encrypted: string): string => {
    const [iv, encryptedText] = encrypted.split(":");
    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(ENCRYPTION_KEY, "hex"),
        Buffer.from(iv, "hex")
    );
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};

const workRecordController = {
    // POST /work-records
    // Funcionário registra seu ponto (entrada e opcionalmente saída)
    async create(req: Request, res: Response): Promise<void> {
        try {
            const { employeePhone, entryTime, exitTime, notes, companyId } = req.body;

            if (!employeePhone || !entryTime) {
                res.status(400).json({ error: 'Campos obrigatórios: employeePhone, entryTime' });
                return;
            }
            const targetPhone = String(employeePhone).trim();

            // Buscar todos usuários e mapear telefones descriptografados
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone); // plain → encrypted
            });

            const encryptedPhone = userMap.get(targetPhone);
            if (!encryptedPhone) {
                res.status(404).json({ error: 'Funcionário não encontrado' });
                return;
            }

            let targetCompanyId: mongoose.Types.ObjectId;

            if (companyId) {
                const company = await Company.findById(companyId);
                if (!company) {
                    res.status(404).json({ error: 'Empresa informada não encontrada' });
                    return;
                }
                targetCompanyId = new mongoose.Types.ObjectId(companyId);
            } else {
                // Tentar encontrar vínculo RH automático
                // Ajuste o nome do model conforme seu projeto (RhLink, EmployeeLink, etc.)
                const RhLink = mongoose.model('RhLink'); // ← ALTERE PARA O NOME REAL DO MODEL
                const link = await RhLink.findOne({ userPhone: encryptedPhone });
                if (!link || !link.companyId) {
                    res.status(403).json({ error: 'Funcionário não está vinculado a nenhuma empresa. Informe companyId manualmente.' });
                    return;
                }
                targetCompanyId = link.companyId;
            }

            // ── Tratamento de datas: forçar UTC (sem offset de Brasília) ───────
            let entryDate: Date;
            let exitDate: Date | undefined;

            try {
                // Se já tiver 'Z' ou offset, mantém; senão força UTC adicionando 'Z'
                const entryStr = String(entryTime).trim();
                entryDate = new Date(entryStr.endsWith('Z') || entryStr.includes('+') || entryStr.includes('-') ? entryStr : entryStr + 'Z');

                if (exitTime) {
                    const exitStr = String(exitTime).trim();
                    exitDate = new Date(exitStr.endsWith('Z') || exitStr.includes('+') || exitStr.includes('-') ? exitStr : exitStr + 'Z');
                }
            } catch {
                res.status(400).json({ error: 'Formato de data inválido. Use ISO 8601 (ex: 2025-01-13T14:30:00 ou 2025-01-13T14:30:00Z)' });
                return;
            }

            if (exitDate && exitDate <= entryDate) {
                res.status(400).json({ error: 'A hora de saída deve ser posterior à entrada' });
                return;
            }

            const diffMs = exitDate ? exitDate.getTime() - entryDate.getTime() : 0;
            const durationMinutes = exitDate ? Math.round(diffMs / 60000) : undefined;

            const record = new WorkRecord({
                employeePhone: encryptedPhone,
                companyId: targetCompanyId,
                entryTime: entryDate,
                exitTime: exitDate,
                durationMinutes,
                notes: notes ? String(notes).trim() : undefined,
                status: 'pendente' as WorkRecordStatus,
            });

            await record.save();

            const responseRecord = {
                ...record.toObject(),
                employeePhone: targetPhone, // retorna o telefone plano (como veio na requisição)
            };

            res.status(201).json({
                message: 'Registro de ponto criado com sucesso (aguardando aprovação) – horários tratados como UTC',
                record: responseRecord,
            });
        } catch (error: any) {
            console.error('Erro ao criar registro de ponto:', error);
            res.status(500).json({ error: error.message || 'Erro interno ao registrar ponto' });
        }
    },
    async clockIn(req: Request, res: Response): Promise<void> {
        try {
            const { employeePhone, entryTime, notes, companyId } = req.body;

            if (!employeePhone || !entryTime) {
                res.status(400).json({ error: 'Campos obrigatórios: employeePhone, entryTime' });
                return;
            }

            const targetPhone = String(employeePhone).trim();

            // (Reaproveite a lógica de busca e descriptografia do telefone)
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();
            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone);
            });

            const encryptedPhone = userMap.get(targetPhone);
            if (!encryptedPhone) {
                res.status(404).json({ error: 'Funcionário não encontrado' });
                return;
            }

            // Determinar companyId (igual ao seu código atual)
            let targetCompanyId: mongoose.Types.ObjectId;
            if (companyId) {
                const company = await Company.findById(companyId);
                if (!company) {
                    res.status(404).json({ error: 'Empresa não encontrada' });
                    return;
                }
                targetCompanyId = new mongoose.Types.ObjectId(companyId);
            } else {
                const RhLink = mongoose.model('RhLink'); // ajuste o nome real
                const link = await RhLink.findOne({ userPhone: encryptedPhone });
                if (!link || !link.companyId) {
                    res.status(403).json({ error: 'Funcionário sem vínculo. Informe companyId.' });
                    return;
                }
                targetCompanyId = link.companyId;
            }

            // Tratamento de data (UTC)
            let entryDate: Date;
            try {
                const entryStr = String(entryTime).trim();
                entryDate = new Date(
                    entryStr.endsWith('Z') || entryStr.includes('+') || entryStr.includes('-')
                        ? entryStr
                        : entryStr + 'Z'
                );
            } catch {
                res.status(400).json({ error: 'Formato de entryTime inválido. Use ISO 8601.' });
                return;
            }

            // Verificar se o funcionário já tem um ponto aberto (opcional, mas recomendado)
            const openRecord = await WorkRecord.findOne({
                employeePhone: encryptedPhone,
                companyId: targetCompanyId,
                exitTime: { $exists: false }, // ou status: 'em andamento'
            });

            if (openRecord) {
                res.status(409).json({
                    error: 'Já existe um expediente aberto para este funcionário. Finalize-o primeiro.',
                    openRecordId: openRecord._id
                });
                return;
            }

            const record = new WorkRecord({
                employeePhone: encryptedPhone,
                companyId: targetCompanyId,
                entryTime: entryDate,
                exitTime: undefined,
                durationMinutes: undefined,
                notes: notes ? String(notes).trim() : undefined,
                status: 'pendente', // ou 'pendente'
            });

            await record.save();

            const response = {
                ...record.toObject(),
                employeePhone: targetPhone, // devolve plano
            };

            res.status(201).json({
                message: 'Expediente iniciado com sucesso (clock-in)',
                record: response,
            });
        } catch (error: any) {
            console.error('Erro no clock-in:', error);
            res.status(500).json({ error: error.message || 'Erro interno' });
        }
    },
    async clockOut(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params; // :id do registro
            const { exitTime, notes } = req.body;

            if (!exitTime) {
                res.status(400).json({ error: 'Campo obrigatório: exitTime' });
                return;
            }

            const record = await WorkRecord.findById(id);
            if (!record) {
                res.status(404).json({ error: 'Registro de ponto não encontrado' });
                return;
            }

            if (record.exitTime) {
                res.status(400).json({ error: 'Este expediente já foi finalizado' });
                return;
            }

            // Tratamento de data (UTC)
            let exitDate: Date;
            try {
                const exitStr = String(exitTime).trim();
                exitDate = new Date(
                    exitStr.endsWith('Z') || exitStr.includes('+') || exitStr.includes('-')
                        ? exitStr
                        : exitStr + 'Z'
                );
            } catch {
                res.status(400).json({ error: 'Formato de exitTime inválido. Use ISO 8601.' });
                return;
            }

            if (exitDate <= record.entryTime) {
                res.status(400).json({ error: 'Hora de saída deve ser posterior à entrada' });
                return;
            }

            const diffMs = exitDate.getTime() - record.entryTime.getTime();
            const durationMinutes = Math.round(diffMs / 60000);

            // Atualizar
            record.exitTime = exitDate;
            record.durationMinutes = durationMinutes;
            record.status = 'pendente'; // ou 'concluído', dependendo da regra de aprovação
            if (notes) record.notes = (record.notes ? record.notes + ' | ' : '') + String(notes).trim();

            await record.save();

            const response = {
                ...record.toObject(),
                // Se quiser, pode buscar o telefone plano novamente e devolver
            };

            res.status(200).json({
                message: 'Expediente finalizado com sucesso (clock-out)',
                record: response,
            });
        } catch (error: any) {
            console.error('Erro no clock-out:', error);
            res.status(500).json({ error: error.message || 'Erro interno' });
        }
    },

    // GET /work-records
    async list(req: Request, res: Response): Promise<void> {
        try {
            const { companyId, employeePhone, status, month, year } = req.query;

            // Validação obrigatória
            if (!companyId) {
                res.status(400).json({ error: 'Parâmetro companyId é obrigatório para listar registros' });
                return;
            }

            const targetPhone = String(employeePhone).trim();
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone); // plain → encrypted
            });

            const encryptedPhone = userMap.get(targetPhone);
            // Construção da query
            const query: any = {
                companyId: new mongoose.Types.ObjectId(companyId as string),
            };

            // Filtro por telefone do funcionário (agora sem criptografia)
            if (encryptedPhone) {

                if (encryptedPhone.length >= 10) { // validação mínima (ex: 11 dígitos com DDD)
                    query.employeePhone = encryptedPhone;
                } else {
                    res.status(400).json({ error: 'Telefone inválido (use pelo menos 10 dígitos)' });
                    return;
                }
            }

            // Filtro por status
            if (status) {
                const validStatuses = ['pendente', 'aprovado', 'rejeitado', 'cancelado'];
                if (!validStatuses.includes(status as string)) {
                    res.status(400).json({ error: `Status inválido. Valores permitidos: ${validStatuses.join(', ')}` });
                    return;
                }
                query.status = status;
            }

            // Filtro por mês e ano
            if (month && year) {
                const m = parseInt(month as string, 10);
                const y = parseInt(year as string, 10);

                if (isNaN(m) || isNaN(y) || m < 1 || m > 12) {
                    res.status(400).json({ error: 'Mês deve estar entre 1 e 12' });
                    return;
                }
                if (y < 2000 || y > 2100) { // faixa razoável para evitar bugs
                    res.status(400).json({ error: 'Ano inválido' });
                    return;
                }

                // Ajuste: mês vem de 1 a 12, mas Date usa 0 a 11
                const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
                const end = new Date(y, m, 0, 23, 59, 59, 999); // último dia do mês

                query.entryTime = { $gte: start, $lte: end };
            }

            // Busca no banco
            const records = await WorkRecord.find(query)
                .sort({ entryTime: -1 }) // mais recentes primeiro
                .populate('companyId', 'name fantasyName cnpj')
                .lean(); // mais rápido, sem documentos mongoose

            records.map(record => {
                const userRecord = users.find(user => {
                    if (user.phone === record.employeePhone) {
                        return {
                            name: decryptPhone(user.name),
                            phone: decryptPhone(user.phone)
                        }
                    }
                });

                record.employeePhone = `${userRecord?.phone}`;
                record.employeeName = `${userRecord?.name}`;
            });
            // Resposta
            res.json({
                count: records.length,
                records,
            });
        } catch (error: any) {
            console.error('Erro ao listar registros de ponto:', error);
            res.status(500).json({ error: 'Erro interno ao listar registros' });
        }
    },

    // PATCH /work-records/:id/approve
    async approve(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { approverPhone, durationMinutes, notes, generateTransaction = false, hourlyRate } = req.body;

            if (!approverPhone) {
                res.status(400).json({ error: 'approverPhone é obrigatório' });
                return;
            }

            const record = await WorkRecord.findById(id);
            if (!record) {
                res.status(404).json({ error: 'Registro de ponto não encontrado' });
                return;
            }

            if (record.status !== 'pendente') {
                res.status(400).json({ error: `Registro já está ${record.status}` });
                return;
            }

            if (durationMinutes !== undefined && durationMinutes >= 0) {
                record.durationMinutes = durationMinutes;
            }
            if (notes) {
                record.notes = (record.notes ? record.notes + ' | ' : '') + String(notes).trim();
            }

            record.status = 'aprovado';
            record.approvedBy = encryptPhone(String(approverPhone).trim());
            record.updatedAt = new Date();

            await record.save();

            let generatedTransaction = null;

            if (generateTransaction && record.durationMinutes) {
                const rate = hourlyRate ? Number(hourlyRate) : 25; // valor padrão R$/hora
                const amount = (record.durationMinutes / 60) * rate;

                const transaction = new Transaction({
                    ownerPhone: record.employeePhone,
                    type: 'revenue',
                    name: `Horas trabalhadas - ${new Date(record.entryTime).toLocaleDateString('pt-BR')}`,
                    amount: Number(amount.toFixed(2)),
                    date: record.entryTime,
                    status: 'nao_pago',
                    notes: `Aprovado por ${decryptPhone(record.approvedBy || '')} • ${record.durationMinutes} min`,
                    isControlled: false,
                });

                await transaction.save();

                generatedTransaction = {
                    ...transaction.toObject(),
                    ownerPhone: decryptPhone(transaction.ownerPhone),
                };
            }

            const response = {
                ...record.toObject(),
                employeePhone: decryptPhone(record.employeePhone),
                approvedBy: decryptPhone(record.approvedBy || ''),
            };

            res.json({
                message: 'Ponto aprovado com sucesso',
                record: response,
                generatedTransaction,
            });
        } catch (error: any) {
            console.error('Erro ao aprovar ponto:', error);
            res.status(500).json({ error: error.message || 'Erro ao aprovar registro' });
        }
    },

    // PATCH /work-records/:id/reject
    async reject(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { approverPhone, rejectionReason } = req.body;

            if (!approverPhone || !rejectionReason) {
                res.status(400).json({ error: 'approverPhone e rejectionReason são obrigatórios' });
                return;
            }

            const record = await WorkRecord.findById(id);
            if (!record) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            if (record.status !== 'pendente') {
                res.status(400).json({ error: `Registro já está ${record.status}` });
                return;
            }

            record.status = 'rejeitado';
            record.approvedBy = encryptPhone(String(approverPhone).trim());
            record.rejectionReason = String(rejectionReason).trim();
            record.updatedAt = new Date();

            await record.save();

            const response = {
                ...record.toObject(),
                employeePhone: decryptPhone(record.employeePhone),
                approvedBy: decryptPhone(record.approvedBy || ''),
            };

            res.json({
                message: 'Ponto rejeitado',
                record: response,
            });
        } catch (error: any) {
            console.error('Erro ao rejeitar ponto:', error);
            res.status(500).json({ error: 'Erro ao rejeitar registro' });
        }
    },

    // DELETE /work-records/:id
    async delete(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { requesterPhone } = req.body;

            if (!requesterPhone) {
                res.status(400).json({ error: 'requesterPhone é obrigatório' });
                return;
            }

            const record = await WorkRecord.findById(id);
            if (!record) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            if (record.status !== 'pendente') {
                res.status(403).json({ error: 'Apenas registros pendentes podem ser excluídos' });
                return;
            }

            // Opcional: verificar se requester é o próprio funcionário ou admin da empresa
            // ...

            await WorkRecord.findByIdAndDelete(id);

            res.json({ message: 'Registro de ponto excluído com sucesso' });
        } catch (error: any) {
            console.error('Erro ao excluir registro de ponto:', error);
            res.status(500).json({ error: 'Erro ao excluir registro' });
        }
    },
};

export default workRecordController;