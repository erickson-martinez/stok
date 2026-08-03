"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Permission_1 = __importDefault(require("../models/Permission"));
const User_1 = __importDefault(require("../models/User"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não está definida no arquivo .env");
}
const decryptPhone = (encrypted) => {
    const [iv, encryptedText] = encrypted.split(":");
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), Buffer.from(iv, "hex"));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
const permissionController = {
    async createPermission(req, res) {
        try {
            const { idEmail, email, permissions = [] } = req.body;
            if (!idEmail) {
                res.status(400).json({ error: "idEmail é obrigatório" });
                return;
            }
            if (typeof idEmail !== "string" || idEmail.trim() === "") {
                res.status(400).json({ error: "idEmail deve ser uma string válida" });
                return;
            }
            if (!email) {
                res.status(400).json({ error: "email é obrigatório" });
                return;
            }
            if (!Array.isArray(permissions)) {
                res.status(400).json({ error: "permissions deve ser um array" });
                return;
            }
            if (!permissions.every(p => typeof p === "string")) {
                res.status(400).json({ error: "Todos os elementos de permissions devem ser strings" });
                return;
            }
            const existingPermission = await Permission_1.default.findOne({ idEmail: idEmail });
            if (existingPermission) {
                res.status(400).json({ error: `Permissão já existe para o usuário ${idEmail}` });
                return;
            }
            const newPermission = new Permission_1.default({
                idEmail: idEmail,
                email: email,
                permissions: permissions,
            });
            await newPermission.save();
            res.status(201).json({
                success: true,
                message: `Permissão criada com sucesso para ${idEmail}`,
                idEmail: idEmail,
                email: email,
                permissions: newPermission.permissions,
            });
        }
        catch (error) {
            console.error("Erro ao criar permissão:", error);
            res.status(500).json({ error: error.message || "Erro ao criar permissão" });
        }
    },
    async getPermissions(req, res) {
        try {
            const { idEmail, email } = req.query;
            if (!idEmail) {
                const permissions = await Permission_1.default.find({}).lean();
                const response = permissions.map(perm => ({
                    idEmail: perm.idEmail,
                    email: perm.email,
                    permissions: perm.permissions,
                    createdAt: perm.createdAt,
                    updatedAt: perm.updatedAt,
                }));
                res.status(200).json({
                    success: true,
                    count: response.length,
                    permissions: response,
                });
                return;
            }
            let permissions = await Permission_1.default.findOne({ idEmail: idEmail }).lean();
            if (!permissions) {
                const newPermission = new Permission_1.default({
                    idEmail: idEmail,
                    email: email,
                    permissions: [],
                });
                const savedPermission = await newPermission.save();
                permissions = savedPermission.toObject();
            }
            res.status(200).json({
                success: true,
                idEmail: idEmail,
                email: email,
                permissions: permissions?.permissions ?? [],
            });
        }
        catch (error) {
            console.error("Erro ao obter permissões:", error);
            res.status(500).json({ error: error.message || "Erro ao obter permissões" });
        }
    },
    async updatePermissions(req, res) {
        try {
            const { idEmail, add } = req.query;
            const { permissions } = req.body;
            if (!idEmail) {
                res.status(400).json({ error: "idEmail é obrigatório" });
                return;
            }
            if (typeof idEmail !== "string" || idEmail.trim() === "") {
                res.status(400).json({ error: "idEmail deve ser uma string válida" });
                return;
            }
            if (permissions === undefined) {
                res.status(400).json({
                    error: "Campo 'permissions' é obrigatório",
                });
                return;
            }
            if (!Array.isArray(permissions)) {
                res.status(400).json({ error: "permissions deve ser um array" });
                return;
            }
            if (!permissions.every(p => typeof p === "string")) {
                res.status(400).json({ error: "Todos os elementos de permissions devem ser strings" });
                return;
            }
            let permissionDoc = await Permission_1.default.findOne({ idEmail: idEmail });
            if (!permissionDoc) {
                const newPermission = new Permission_1.default({
                    idEmail: idEmail,
                    permissions: permissions,
                });
                await newPermission.save();
                res.status(201).json({
                    success: true,
                    message: `Permissão criada com sucesso para ${idEmail}`,
                    idEmail: idEmail,
                    permissions: newPermission.permissions,
                });
                return;
            }
            const uniquePermissions = Array.from(new Set(permissions));
            if (add === "true") {
                uniquePermissions.forEach(perm => {
                    if (!permissionDoc.permissions.includes(perm)) {
                        permissionDoc.permissions.push(perm);
                    }
                });
            }
            else {
                permissionDoc.permissions = permissionDoc.permissions.filter(perm => !uniquePermissions.includes(perm));
            }
            permissionDoc.updatedAt = new Date();
            await permissionDoc.save();
            res.status(200).json({
                success: true,
                message: `Permissões de ${idEmail} atualizadas com sucesso`,
                idEmail: idEmail,
                permissions: permissionDoc.permissions,
            });
        }
        catch (error) {
            console.error("Erro ao atualizar permissões:", error);
            res.status(500).json({ error: error.message || "Erro ao atualizar permissões" });
        }
    },
    async updateidEmailPermissions(req, res) {
        try {
            const { idEmail } = req.params;
            const { idEmailPermissions, email } = req.body;
            if (!idEmail) {
                res.status(400).json({ error: "idEmail é obrigatório" });
                return;
            }
            if (typeof idEmail !== "string" || idEmail.trim() === "") {
                res.status(400).json({ error: "idEmail deve ser uma string válida" });
                return;
            }
            if (idEmailPermissions === undefined) {
                res.status(400).json({
                    error: "Campo 'idEmailPermissions' é obrigatório",
                });
                return;
            }
            let permissionDoc = await Permission_1.default.findOne({ idEmail: idEmail });
            if (!permissionDoc) {
                res.status(404).json({ error: `Permissões não encontradas para ${idEmail}` });
                return;
            }
            permissionDoc.idEmail = idEmailPermissions;
            if (email) {
                permissionDoc.email = email;
            }
            permissionDoc.permissions = permissionDoc.permissions;
            permissionDoc.updatedAt = new Date();
            await permissionDoc.save();
            res.status(200).json({
                success: true,
                message: `Permissões de ${idEmail} atualizadas com sucesso`,
                idEmail: idEmailPermissions,
                permissions: permissionDoc.permissions,
            });
        }
        catch (error) {
            console.error("Erro ao atualizar permissões:", error);
            res.status(500).json({ error: error.message || "Erro ao atualizar permissões" });
        }
    },
    async deletePermissions(req, res) {
        try {
            const { idEmail } = req.params;
            if (!idEmail) {
                res.status(400).json({ error: "idEmail é obrigatório" });
                return;
            }
            if (idEmail === "admin@example.com") {
                res.status(400).json({ error: "Não pode deletar permissões do admin" });
                return;
            }
            const targetEmail = String(idEmail).trim();
            const users = await User_1.default.find({}).lean();
            const userMap = new Map();
            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone);
            });
            const encryptedPhone = userMap.get(targetEmail);
            if (!encryptedPhone) {
                res.status(404).json({ error: `Usuário com email ${idEmail} não encontrado` });
                return;
            }
            const deletedPermission = await Permission_1.default.findOneAndDelete({ idEmail: targetEmail });
            if (!deletedPermission) {
                res.status(404).json({ error: `Permissões não encontradas para ${idEmail}` });
                return;
            }
            res.status(200).json({
                success: true,
                message: `Permissões de ${idEmail} deletadas com sucesso`,
                idEmail: targetEmail,
            });
        }
        catch (error) {
            console.error("Erro ao deletar permissões:", error);
            res.status(500).json({ error: error.message || "Erro ao deletar permissões" });
        }
    },
};
exports.default = permissionController;
//# sourceMappingURL=permissionController.js.map