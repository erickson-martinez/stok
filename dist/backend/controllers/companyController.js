"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Company_1 = __importDefault(require("../models/Company"));
const Permission_1 = __importDefault(require("../models/Permission"));
class CompanyController {
    async createCompany(req, res) {
        try {
            const { name, cnpj, email, address, city, linkId, state, zipCode, status, idEmail } = req.body;
            if (!name) {
                res.status(400).json({ error: "Nome da empresa é obrigatório" });
                return;
            }
            if (!idEmail) {
                res.status(400).json({ error: "ID do e-mail é obrigatório" });
                return;
            }
            if (cnpj) {
                const existingCompany = await Company_1.default.findOne({ cnpj });
                if (existingCompany) {
                    res.status(400).json({ error: "CNPJ já cadastrado" });
                    return;
                }
            }
            const newCompany = new Company_1.default({
                name,
                cnpj,
                linkId,
                email,
                address,
                city,
                state,
                zipCode,
                status: status || 'ativo',
                idEmail,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await newCompany.save();
            try {
                if (idEmail) {
                    const existingPermission = await Permission_1.default.findOne({ userEmail: idEmail });
                    if (!existingPermission) {
                        const defaultPermissions = ["rh", "aprovarHoras", "chamados"];
                        await Permission_1.default.create({
                            userEmail: idEmail,
                            permissions: defaultPermissions,
                        });
                    }
                }
            }
            catch (permError) {
                console.error("Aviso: Erro ao criar permissões automáticas:", permError);
            }
            res.status(201).json({
                success: true,
                message: "Empresa criada com sucesso",
                company: newCompany,
            });
        }
        catch (error) {
            console.error("Erro ao criar empresa:", error);
            res.status(500).json({ error: "Erro ao criar empresa" });
        }
    }
    async getCompanies(req, res) {
        try {
            const { idEmail } = req.params;
            const companies = await Company_1.default.find({ idEmail: idEmail });
            res.status(200).json({
                success: true,
                companies,
            });
        }
        catch (error) {
            console.error("Erro ao buscar empresas:", error);
            res.status(500).json({ error: "Erro ao buscar empresas" });
        }
    }
    async getCompanyById(req, res) {
        try {
            const { id } = req.params;
            const company = await Company_1.default.findById(id);
            if (!company) {
                res.status(404).json({ error: "Empresa não encontrada" });
                return;
            }
            res.status(200).json({
                success: true,
                company,
            });
        }
        catch (error) {
            console.error("Erro ao buscar empresa:", error);
            res.status(500).json({ error: "Erro ao buscar empresa" });
        }
    }
    async updateCompany(req, res) {
        try {
            const { id, status } = req.params;
            const { name, cnpj, idEmail, email, address, linkId, city, state, zipCode } = req.body;
            if (cnpj) {
                const existingCompany = await Company_1.default.findOne({ cnpj, _id: { $ne: id } });
                if (existingCompany) {
                    res.status(400).json({ error: "CNPJ já cadastrado para outra empresa" });
                    return;
                }
            }
            const updatedCompany = await Company_1.default.findByIdAndUpdate(id, {
                name,
                cnpj,
                idEmail,
                linkId,
                email,
                address,
                city,
                state,
                zipCode,
                status,
                updatedAt: new Date(),
            }, { new: true });
            if (!updatedCompany) {
                res.status(404).json({ error: "Empresa não encontrada" });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Empresa atualizada com sucesso",
                company: updatedCompany,
            });
        }
        catch (error) {
            console.error("Erro ao atualizar empresa:", error);
            res.status(500).json({ error: "Erro ao atualizar empresa" });
        }
    }
    async deleteCompany(req, res) {
        try {
            const { id } = req.params;
            const deletedCompany = await Company_1.default.findByIdAndDelete(id);
            if (!deletedCompany) {
                res.status(404).json({ error: "Empresa não encontrada" });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Empresa deletada com sucesso",
            });
        }
        catch (error) {
            console.error("Erro ao deletar empresa:", error);
            res.status(500).json({ error: "Erro ao deletar empresa" });
        }
    }
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status || !['ativo', 'inativo'].includes(status)) {
                res.status(400).json({ error: "Status deve ser 'ativo' ou 'inativo'" });
                return;
            }
            const updatedCompany = await Company_1.default.findByIdAndUpdate(id, {
                status,
                updatedAt: new Date(),
            }, { new: true });
            if (!updatedCompany) {
                res.status(404).json({ error: "Empresa não encontrada" });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Status da empresa atualizado com sucesso",
                company: updatedCompany,
            });
        }
        catch (error) {
            console.error("Erro ao atualizar status da empresa:", error);
            res.status(500).json({ error: "Erro ao atualizar status da empresa" });
        }
    }
}
exports.default = new CompanyController();
//# sourceMappingURL=companyController.js.map