"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const Company_1 = __importDefault(require("../models/Company"));
const User_1 = __importDefault(require("../models/User"));
const Permission_1 = __importDefault(require("../models/Permission"));
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const decryptPhone = (encrypted) => {
    const [iv, encryptedText] = encrypted.split(":");
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), Buffer.from(iv, "hex"));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
class CompanyController {
    // Criar nova empresa
    async createCompany(req, res) {
        try {
            const { name, cnpj, phone, email, address, city, state, zipCode, status, owner } = req.body;
            // Validação básica
            if (!name) {
                res.status(400).json({ error: "Nome da empresa é obrigatório" });
                return;
            }
            if (!owner) {
                res.status(400).json({ error: "Telefone do proprietário é obrigatório" });
                return;
            }
            // Buscar todos usuários e descriptografar para encontrar o proprietário
            const targetPhone = String(owner).trim();
            const users = await User_1.default.find({}).lean();
            const userMap = new Map();
            const userExists = users.some(u => decryptPhone(u.phone) === targetPhone);
            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone); // plain → encrypted
            });
            const encryptedPhone = userMap.get(targetPhone);
            console.log("Telefone proprietário (criptografado):", encryptedPhone);
            // Se o proprietário não existe, criar um novo usuário
            if (!userExists) {
                try {
                    const defaultPassword = "Teste@9898@9898";
                    const hashedPassword = await bcrypt_1.default.hash(defaultPassword, 10);
                    const newUser = new User_1.default({
                        name: "Proprietário",
                        phone: encryptedPhone,
                        password: hashedPassword,
                    });
                    const savedUser = await newUser.save();
                    savedUser._id.toString();
                    console.log(`Novo usuário criado automaticamente: ${targetPhone}`);
                }
                catch (userCreateError) {
                    console.error("Erro ao criar usuário proprietário:", userCreateError);
                    res.status(500).json({ error: "Erro ao criar usuário proprietário" });
                    return;
                }
            }
            // Verificar se CNPJ já existe (se fornecido)
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
                phone,
                email,
                address,
                city,
                state,
                zipCode,
                status: status || 'ativo',
                owner: encryptedPhone,
            });
            await newCompany.save();
            // Criar permissões automáticas para o owner
            try {
                if (encryptedPhone) {
                    // Verificar se já existe permissão
                    const existingPermission = await Permission_1.default.findOne({ userPhone: encryptedPhone });
                    if (!existingPermission) {
                        const defaultPermissions = ["rh", "aprovarHoras", "chamados"];
                        await Permission_1.default.create({
                            userPhone: encryptedPhone,
                            permissions: defaultPermissions,
                        });
                    }
                }
            }
            catch (permError) {
                console.error("Aviso: Erro ao criar permissões automáticas:", permError);
                // Não bloqueia a criação da empresa se houver erro na permissão
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
    // Listar todas as empresas de um usuário
    async getCompanies(req, res) {
        try {
            const phone = req.params.phone || req.query.phone;
            const targetPhone = String(phone).trim();
            const users = await User_1.default.find({}).lean();
            const userMap = new Map();
            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone); // plain → encrypted
            });
            const encryptedPhone = userMap.get(targetPhone);
            const companies = await Company_1.default.find({ owner: encryptedPhone });
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
    // Obter uma empresa específica
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
    // Atualizar empresa
    async updateCompany(req, res) {
        try {
            const { id, status } = req.params;
            const { name, cnpj, phone, email, address, city, state, zipCode } = req.body;
            // Verificar se CNPJ já existe em outra empresa
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
                phone,
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
    // Deletar empresa
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
    // Atualizar apenas o status da empresa
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            // Validar status
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