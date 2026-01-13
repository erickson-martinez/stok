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

// Funções de criptografia (copiadas/reutilizadas do transactionController)
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

            const plainPhone = String(employeePhone).trim();
            const encryptedEmployeePhone = encryptPhone(plainPhone);

            // Verificar se o funcionário existe
            const user = await User.findOne({ phone: encryptedEmployeePhone }).lean();
            if (!user) {
                res.status(404).json({ error: 'Funcionário não encontrado' });
                return;
            }

            let targetCompanyId: mongoose.Types.ObjectId;

            if (companyId) {
                // Se informado, validar que existe
                const company = await Company.findById(companyId);
                if (!company) {
                    res.status(404).json({ error: 'Empresa informada não encontrada' });
                    return;
                }
                targetCompanyId = new mongoose.Types.ObjectId(companyId);
            } else {
                // Tentar encontrar vínculo RH automático (ajuste conforme seu model de vínculo)
                // Exemplo: supondo que exista um model RhLink com { userPhone: encrypted, companyId }
                const RhLink = mongoose.model('RhLink'); // ajuste o nome real do model
                const link = await RhLink.findOne({ userPhone: encryptedEmployeePhone });
                if (!link) {
                    res.status(403).json({ error: 'Funcionário não está vinculado a nenhuma empresa. Informe companyId manualmente.' });
                    return;
                }
                targetCompanyId = link.companyId;
            }

            let durationMinutes: number | undefined;
            let exitDate: Date | undefined;

            if (exitTime) {
                const entry = new Date(entryTime);
                exitDate = new Date(exitTime);
                if (exitDate <= entry) {
                    res.status(400).json({ error: 'A hora de saída deve ser posterior à entrada' });
                    return;
                }
                const diffMs = exitDate.getTime() - entry.getTime();
                durationMinutes = Math.round(diffMs / 60000); // minutos
            }

            const record = new WorkRecord({
                employeePhone: encryptedEmployeePhone,
                companyId: targetCompanyId,
                entryTime: new Date(entryTime),
                exitTime: exitDate,
                durationMinutes,
                notes: notes ? String(notes).trim() : undefined,
                status: 'pendente' as WorkRecordStatus,
            });

            await record.save();

            const responseRecord = {
                ...record.toObject(),
                employeePhone: plainPhone, // descriptografado para o frontend
            };

            res.status(201).json({
                message: 'Registro de ponto criado com sucesso (aguardando aprovação)',
                record: responseRecord,
            });
        } catch (error: any) {
            console.error('Erro ao criar registro de ponto:', error);
            res.status(500).json({ error: error.message || 'Erro interno ao registrar ponto' });
        }
    },

    // GET /work-records
    // Listar registros (idealmente usado pelo dono da empresa ou RH)
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
    // Aprovar ponto (geralmente dono da empresa ou RH)
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

            // Atualizar campos
            if (durationMinutes !== undefined && durationMinutes >= 0) {
                record.durationMinutes = durationMinutes;
            }
            if (notes) record.notes = (record.notes ? record.notes + ' | ' : '') + notes.trim();

            record.status = 'aprovado';
            record.approvedBy = encryptPhone(String(approverPhone).trim());
            record.updatedAt = new Date();

            await record.save();

            let generatedTransaction = null;

            // Opcional: gerar transação de receita para o funcionário (horas a receber)
            if (generateTransaction && record.durationMinutes) {
                const rate = hourlyRate ? Number(hourlyRate) : 25; // valor/hora padrão ou vindo do vínculo
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

    // DELETE /work-records/:id (opcional - cancelamento pelo funcionário ou admin)
    async delete(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { requesterPhone } = req.body;

            const record = await WorkRecord.findById(id);
            if (!record) {
                res.status(404).json({ error: 'Registro não encontrado' });
                return;
            }

            // Só permite cancelar se pendente ou pelo próprio funcionário/admin
            if (record.status !== 'pendente') {
                res.status(403).json({ error: 'Apenas registros pendentes podem ser cancelados' });
                return;
            }

            await WorkRecord.findByIdAndDelete(id);

            res.json({ message: 'Registro de ponto cancelado/excluído com sucesso' });
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao excluir registro' });
        }
    },
};

export default workRecordController;