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

    // GET /work-records
    async list(req: Request, res: Response): Promise<void> {
        try {
            const { companyId, employeePhone, status, month, year, includeDecrypted = 'true' } = req.query;

            if (!companyId) {
                res.status(400).json({ error: 'Parâmetro companyId é obrigatório para listar registros' });
                return;
            }

            const query: any = {
                companyId: new mongoose.Types.ObjectId(companyId as string),
            };

            if (employeePhone) {
                const plain = String(employeePhone).trim();
                query.employeePhone = encryptPhone(plain);
            }

            if (status) {
                if (!['pendente', 'aprovado', 'rejeitado', 'cancelado'].includes(status as string)) {
                    res.status(400).json({ error: 'Status inválido' });
                    return;
                }
                query.status = status;
            }

            if (month && year) {
                const m = parseInt(month as string) - 1;
                const y = parseInt(year as string);
                if (isNaN(m) || isNaN(y) || m < 0 || m > 11) {
                    res.status(400).json({ error: 'Mês ou ano inválido' });
                    return;
                }
                const start = new Date(y, m, 1);
                const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
                query.entryTime = { $gte: start, $lte: end };
            }

            const records = await WorkRecord.find(query)
                .sort({ entryTime: -1 })
                .populate('companyId', 'name fantasyName cnpj')
                .lean();

            const decryptedRecords = records.map(record => ({
                ...record,
                employeePhone: includeDecrypted === 'true' ? decryptPhone(record.employeePhone) : '[encrypted]',
            }));

            res.json({
                count: decryptedRecords.length,
                records: decryptedRecords,
            });
        } catch (error: any) {
            console.error('Erro ao listar registros de ponto:', error);
            res.status(500).json({ error: 'Erro ao listar registros' });
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