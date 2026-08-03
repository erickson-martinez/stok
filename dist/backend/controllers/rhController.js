"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const Company_1 = __importDefault(require("../models/Company"));
const Employee_1 = __importDefault(require("../models/Employee"));
const User_1 = __importDefault(require("../models/User"));
const Permission_1 = __importDefault(require("../models/Permission"));
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef";
const decryptPhone = (encrypted) => {
    const [iv, encryptedText] = encrypted.split(":");
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), Buffer.from(iv, "hex"));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
class RhController {
    async linkUserToCompany(req, res) {
        try {
            const { idEmail, empresaId, role } = req.body;
            if (!idEmail || !empresaId) {
                res.status(400).json({ error: "idEmail e empresaId são obrigatórios" });
                return;
            }
            const company = await Company_1.default.findById(empresaId);
            if (!company) {
                res.status(404).json({ error: "Empresa não encontrada" });
                return;
            }
            const existingLink = await Employee_1.default.findOne({
                idEmail: idEmail,
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
            const newLink = await Employee_1.default.create({
                idEmail: idEmail,
                companyName: company.name,
                linkId: company.linkId,
                company: empresaId,
                role: role || "funcionario",
                status: "ativo",
                admittedAt: new Date(),
            });
            try {
                await Permission_1.default.findOneAndUpdate({ idEmail: idEmail }, { $addToSet: { permissions: "rh" } }, { upsert: true, new: true });
            }
            catch (permErr) {
                console.warn("Não foi possível atualizar permissões:", permErr);
            }
            res.status(201).json({
                success: true,
                message: "Usuário vinculado à empresa com sucesso",
                link: newLink,
            });
        }
        catch (error) {
            console.error("Erro ao vincular usuário à empresa:", error);
            res.status(500).json({ error: "Erro interno ao vincular usuário" });
        }
    }
    async listEmployees(req, res) {
        const { empresaId } = req.params;
        if (!empresaId) {
            res.status(400).json({ error: "ID da empresa é obrigatório" });
            return;
        }
        try {
            const employees = await Employee_1.default.find({ company: empresaId });
            const listEmployeesPromises = employees.map(async (emp) => {
                const user = await User_1.default.findOne({ idEmail: emp.idEmail }).lean();
                if (!user) {
                    return null;
                }
                return {
                    name: decryptPhone(user.name),
                    empId: emp._id.toString(),
                    companyName: emp.companyName,
                    role: emp.role,
                    status: emp.status,
                    userEmail: emp.idEmail,
                };
            });
            const listEmployees = (await Promise.all(listEmployeesPromises)).filter((item) => item !== null);
            res.status(200).json({
                success: true,
                listEmployees
            });
        }
        catch (error) {
            console.error("Erro ao listar funcionários da empresa:", error);
            res.status(500).json({ error: "Erro ao listar funcionários" });
        }
    }
    async listCompanyByEmployee(req, res) {
        try {
            const { idEmail } = req.params;
            if (!idEmail) {
                res.status(400).json({ error: "ID do usuário é obrigatório" });
                return;
            }
            const employees = await Employee_1.default.find({ idEmail: idEmail })
                .lean();
            res.status(200).json({
                success: true,
                employees
            });
        }
        catch (error) {
            console.error("Erro ao listar funcionários da empresa:", error);
            res.status(500).json({ error: "Erro ao listar funcionários" });
        }
    }
    async unlinkUser(req, res) {
        try {
            const { linkId } = req.params;
            const deleted = await Employee_1.default.findByIdAndDelete(linkId);
            if (!deleted) {
                res.status(404).json({ error: "Vínculo não encontrado" });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Usuário desvinculado da empresa com sucesso",
            });
        }
        catch (error) {
            console.error("Erro ao desvincular usuário:", error);
            res.status(500).json({ error: "Erro ao desvincular" });
        }
    }
    async updateLinkStatus(req, res) {
        try {
            const { linkId } = req.params;
            const { status } = req.body;
            if (!status || !["ativo", "inativo", "pendente"].includes(status)) {
                res.status(400).json({ error: "Status deve ser 'ativo', 'inativo' ou 'pendente'" });
                return;
            }
            const updated = await Employee_1.default.findByIdAndUpdate(linkId, {
                status,
                updatedAt: new Date()
            }, { new: true });
            if (!updated) {
                res.status(404).json({ error: "Vínculo não encontrado" });
                return;
            }
            res.status(200).json({
                success: true,
                message: `Status atualizado para ${status}`,
                link: updated,
            });
        }
        catch (error) {
            console.error("Erro ao atualizar status do vínculo:", error);
            res.status(500).json({ error: "Erro interno" });
        }
    }
    async getUserCompanies(req, res) {
        try {
            const { phone } = req.query;
            if (!phone) {
                res.status(400).json({ error: "Parâmetro phone é obrigatório" });
                return;
            }
            const targetPhone = String(phone).trim();
            const users = await User_1.default.find({}).lean();
            const userMap = new Map();
            let encryptedPhone;
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
            const links = await Employee_1.default.find({ idEmail: encryptedPhone })
                .populate("company", "name cnpj status owner")
                .lean();
            res.status(200).json({
                success: true,
                companies: links,
            });
        }
        catch (error) {
            console.error("Erro ao listar empresas do usuário:", error);
            res.status(500).json({ error: "Erro ao listar empresas" });
        }
    }
}
exports.default = new RhController();
//# sourceMappingURL=rhController.js.map