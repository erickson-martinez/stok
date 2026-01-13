import { Request, Response } from "express";
import crypto from "crypto";
import Company from "../models/Company";
import Employee from "../models/Employee"; // ← assumindo que você criou o modelo como sugerido
import User from "../models/User";
import Permission from "../models/Permission";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef";

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

class RhController {
    // POST /rh/link-user
    async linkUserToCompany(req: Request, res: Response): Promise<void> {
        try {
            const { userPhone: plainUserPhone, empresaId } = req.body;

            if (!plainUserPhone || !empresaId) {
                res.status(400).json({ error: "userPhone e empresaId são obrigatórios" });
                return;
            }

            const targetPhone = String(plainUserPhone).trim();

            const users = await User.find({}).lean();
            const userMap = new Map<string, string>(); // plain → encrypted


            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone);
            });

            const encryptedPhone = userMap.get(targetPhone);

            if (!encryptedPhone) {
                res.status(404).json({
                    error: "Usuário não encontrado com este número de telefone"
                });
                return;
            }

            // ── Verifica se a empresa existe ────────────────────────────────
            const company = await Company.findById(empresaId);
            if (!company) {
                res.status(404).json({ error: "Empresa não encontrada" });
                return;
            }

            // ── Verifica vínculo existente ──────────────────────────────────
            const existingLink = await Employee.findOne({
                userPhone: encryptedPhone,
                company: empresaId,
                companyName: company.name,

            });

            if (existingLink) {
                if (existingLink.status === "ativo") {
                    res.status(409).json({
                        error: "Usuário já está vinculado a esta empresa"
                    });
                    return;
                }

                // Reativa o vínculo
                existingLink.status = "ativo";
                existingLink.updatedAt = new Date();
                await existingLink.save();

                res.status(200).json({
                    success: true,
                    message: "Vínculo reativado com sucesso",
                    link: existingLink,
                });
                return;
            }

            // ── Cria novo vínculo ───────────────────────────────────────────
            const newLink = await Employee.create({
                userPhone: encryptedPhone,
                companyName: company.name,
                company: empresaId,
                role: "funcionario",           // ou vem do body se quiser
                status: "ativo",               // ou "pendente" se preferir aprovação
                admittedAt: new Date(),
            });

            // Opcional: adicionar permissão básica (se quiser)
            try {
                await Permission.findOneAndUpdate(
                    { userPhone: encryptedPhone },
                    { $addToSet: { permissions: "rh" } }, // exemplo
                    { upsert: true, new: true }
                );
            } catch (permErr) {
                console.warn("Não foi possível atualizar permissões:", permErr);
                // não trava a operação
            }

            res.status(201).json({
                success: true,
                message: "Usuário vinculado à empresa com sucesso",
                link: newLink,
            });
        } catch (error) {
            console.error("Erro ao vincular usuário à empresa:", error);
            res.status(500).json({ error: "Erro interno ao vincular usuário" });
        }
    }

    // GET /rh/company/:empresaId/employees
    async listEmployees(req: Request, res: Response): Promise<void> {

        const { empresaId } = req.params;
        if (!empresaId) {
            res.status(400).json({ error: "ID da empresa é obrigatório" });
            return;
        }
        try {
            const employees = await Employee.find({ company: empresaId })
            const listEmployeesPromises = employees.map(async (emp: any) => {
                const user = await User.findOne({ phone: emp.userPhone }).lean();
                if (!user) {
                    res.status(400).json({ error: "ID da empresa é obrigatório" });
                    return;
                }
                return {
                    name: decryptPhone(user.name),
                    empId: emp._id.toString(),
                    companyName: emp.companyName,
                    role: emp.role,
                    status: emp.status,
                    userPhone: decryptPhone(emp.userPhone),
                };
            });

            const listEmployees = await Promise.all(listEmployeesPromises);

            res.status(200).json({
                success: true,
                listEmployees
            });
        } catch (error) {
            console.error("Erro ao listar funcionários da empresa:", error);
            res.status(500).json({ error: "Erro ao listar funcionários" });
        }
    }

    async listCompanyByEmployee(req: Request, res: Response): Promise<void> {
        try {
            const { phone } = req.params;

            if (!phone) {
                res.status(400).json({ error: "Telefone do usuário é obrigatório" });
                return;
            }

            const targetPhone = String(phone).trim();

            const users = await User.find({}).lean();
            const userMap = new Map<string, string>(); // plain → encrypted


            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone);
            });

            const encryptedPhone = userMap.get(targetPhone);

            const employees = await Employee.find({ userPhone: encryptedPhone })
                .lean();


            res.status(200).json({
                success: true,
                employees
            });
        } catch (error) {
            console.error("Erro ao listar funcionários da empresa:", error);
            res.status(500).json({ error: "Erro ao listar funcionários" });
        }
    }

    // DELETE /rh/link/:linkId
    async unlinkUser(req: Request, res: Response): Promise<void> {
        try {
            const { linkId } = req.params;

            const deleted = await Employee.findByIdAndDelete(linkId);

            if (!deleted) {
                res.status(404).json({ error: "Vínculo não encontrado" });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Usuário desvinculado da empresa com sucesso",
            });
        } catch (error) {
            console.error("Erro ao desvincular usuário:", error);
            res.status(500).json({ error: "Erro ao desvincular" });
        }
    }

    // PATCH /rh/link/:linkId/status
    async updateLinkStatus(req: Request, res: Response): Promise<void> {
        try {
            const { linkId } = req.params;
            const { status } = req.body;

            if (!status || !["ativo", "inativo", "pendente"].includes(status)) {
                res.status(400).json({ error: "Status deve ser 'ativo', 'inativo' ou 'pendente'" });
                return;
            }

            const updated = await Employee.findByIdAndUpdate(
                linkId,
                {
                    status,
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (!updated) {
                res.status(404).json({ error: "Vínculo não encontrado" });
                return;
            }

            res.status(200).json({
                success: true,
                message: `Status atualizado para ${status}`,
                link: updated,
            });
        } catch (error) {
            console.error("Erro ao atualizar status do vínculo:", error);
            res.status(500).json({ error: "Erro interno" });
        }
    }

    // GET /rh/user/companies  (empresas que o usuário está vinculado)
    async getUserCompanies(req: Request, res: Response): Promise<void> {
        try {
            const { phone } = req.query;
            if (!phone) {
                res.status(400).json({ error: "Parâmetro phone é obrigatório" });
                return;
            }

            const targetPhone = String(phone).trim();

            // ── Mesmo padrão de busca ───────────────────────────────────────
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            let encryptedPhone: string | undefined;

            users.forEach(user => {
                const plain = decryptPhone(user.phone);
                userMap.set(plain, user.phone);

                if (plain === targetPhone) {
                    encryptedPhone = user.phone;
                }
            });

            if (!encryptedPhone) {
                res.status(404).json({ error: "Usuário não encontrado" });
                return;
            }

            // Busca vínculos
            const links = await Employee.find({ userPhone: encryptedPhone })
                .populate("company", "name cnpj status owner")
                .lean();

            res.status(200).json({
                success: true,
                companies: links,
            });
        } catch (error) {
            console.error("Erro ao listar empresas do usuário:", error);
            res.status(500).json({ error: "Erro ao listar empresas" });
        }
    }
}

export default new RhController();