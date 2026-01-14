import { Request, Response } from "express";
import Permission, { IPermission } from "../models/Permission";
import User from "../models/User";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não está definida no arquivo .env");
}

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

const permissionController = {
    // Criar permissão para um usuário
    async createPermission(req: Request, res: Response): Promise<void> {
        try {
            const { userPhone, permissions = [] } = req.body;

            // Validar userPhone
            if (!userPhone) {
                res.status(400).json({ error: "userPhone é obrigatório" });
                return;
            }

            if (typeof userPhone !== "string" || userPhone.trim() === "") {
                res.status(400).json({ error: "userPhone deve ser uma string válida" });
                return;
            }

            const targetPhone = String(userPhone).trim();

            // Validar permissions é um array
            if (!Array.isArray(permissions)) {
                res.status(400).json({ error: "permissions deve ser um array" });
                return;
            }

            // Validar que todos os elementos do array são strings
            if (!permissions.every(p => typeof p === "string")) {
                res.status(400).json({ error: "Todos os elementos de permissions devem ser strings" });
                return;
            }

            // Buscar todos usuários e descriptografar
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone); // plain → encrypted
            });

            const encryptedPhone = userMap.get(targetPhone);

            if (!encryptedPhone) {
                res.status(404).json({ error: `Usuário com telefone ${userPhone} não encontrado` });
                return;
            }

            // Verificar se já existe permissão para este usuário
            const existingPermission = await Permission.findOne({ userPhone: encryptedPhone });

            if (existingPermission) {
                res.status(400).json({ error: `Permissão já existe para o usuário ${userPhone}` });
                return;
            }

            // Criar nova permissão
            const newPermission = new Permission({
                userPhone: encryptedPhone,
                permissions: permissions,
            });

            await newPermission.save();

            res.status(201).json({
                success: true,
                message: `Permissão criada com sucesso para ${userPhone}`,
                userPhone: targetPhone,
                permissions: newPermission.permissions,
            });
        } catch (error: any) {
            console.error("Erro ao criar permissão:", error);
            res.status(500).json({ error: error.message || "Erro ao criar permissão" });
        }
    },

    // Obter permissões - com filtro opcional por userPhone
    async getPermissions(req: Request, res: Response): Promise<void> {
        try {
            const { userPhone } = req.query;

            // Se userPhone não foi fornecido, retorna todas as permissões
            if (!userPhone) {
                const permissions = await Permission.find({}).lean();

                // Descriptografar telefones na resposta
                const response = permissions.map(perm => ({
                    userPhone: decryptPhone(perm.userPhone),
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

            // Se userPhone foi fornecido, busca específico
            const targetPhone = String(userPhone).trim();

            // Buscar todos usuários e descriptografar
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone); // plain → encrypted
            });

            const encryptedPhone = userMap.get(targetPhone);

            if (!encryptedPhone) {
                res.status(404).json({ error: `Usuário com telefone ${userPhone} não encontrado` });
                return;
            }

            let permissions = await Permission.findOne({ userPhone: encryptedPhone });

            // Se não existir, criar com array vazio
            if (!permissions) {
                permissions = new Permission({
                    userPhone: encryptedPhone,
                    permissions: [],
                });

                await permissions.save();
            }

            res.status(200).json({
                success: true,
                userPhone: targetPhone,
                permissions: permissions.permissions,
            });
        } catch (error: any) {
            console.error("Erro ao obter permissões:", error);
            res.status(500).json({ error: error.message || "Erro ao obter permissões" });
        }
    },

    // Atualizar permissões de um usuário (PATCH - atualização parcial)
    async updatePermissions(req: Request, res: Response): Promise<void> {
        try {
            const { phone, add } = req.query;
            const { permissions } = req.body;

            // Validar userPhone
            if (!phone) {
                res.status(400).json({ error: "userPhone é obrigatório" });
                return;
            }

            if (typeof phone !== "string" || phone.trim() === "") {
                res.status(400).json({ error: "userPhone deve ser uma string válida" });
                return;
            }


            // Validar permissions
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

            const targetPhone = String(phone).trim();

            // Buscar todos usuários e descriptografar
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone);
            });

            const encryptedPhone = userMap.get(targetPhone);

            if (!encryptedPhone) {
                res.status(404).json({ error: `Usuário com telefone ${phone} não encontrado` });
                return;
            }

            let permissionDoc = await Permission.findOne({ userPhone: encryptedPhone });

            if (!permissionDoc) {
                res.status(404).json({ error: `Permissões não encontradas para ${phone}` });
                return;
            }

            // Remover permissões duplicadas mantendo a ordem
            const uniquePermissions = Array.from(new Set(permissions));

            if (add === "true") {
                // Adicionar novas permissões (sem duplicar)
                uniquePermissions.forEach(perm => {
                    if (!permissionDoc!.permissions.includes(perm)) {
                        permissionDoc!.permissions.push(perm);
                    }
                });
            } else {
                // Remover as permissões que estão na lista uniquePermissions
                permissionDoc!.permissions = permissionDoc!.permissions.filter(perm =>
                    !uniquePermissions.includes(perm)
                );
            }

            permissionDoc.updatedAt = new Date();

            await permissionDoc.save();

            res.status(200).json({
                success: true,
                message: `Permissões de ${phone} atualizadas com sucesso`,
                userPhone: targetPhone,
                permissions: permissionDoc.permissions,
            });
        } catch (error: any) {
            console.error("Erro ao atualizar permissões:", error);
            res.status(500).json({ error: error.message || "Erro ao atualizar permissões" });
        }
    },

    // Deletar permissões de um usuário
    async deletePermissions(req: Request, res: Response): Promise<void> {
        try {
            const { userPhone } = req.params;

            // Validar userPhone
            if (!userPhone) {
                res.status(400).json({ error: "userPhone é obrigatório" });
                return;
            }

            if (userPhone === "67984726820") {
                res.status(400).json({ error: "Não pode deletar permissões do admin" });
                return;
            }

            const targetPhone = String(userPhone).trim();

            // Buscar todos usuários e descriptografar
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone); // plain → encrypted
            });

            const encryptedPhone = userMap.get(targetPhone);

            if (!encryptedPhone) {
                res.status(404).json({ error: `Usuário com telefone ${userPhone} não encontrado` });
                return;
            }

            const deletedPermission = await Permission.findOneAndDelete({ userPhone: encryptedPhone });

            if (!deletedPermission) {
                res.status(404).json({ error: `Permissões não encontradas para ${userPhone}` });
                return;
            }

            res.status(200).json({
                success: true,
                message: `Permissões de ${userPhone} deletadas com sucesso`,
                userPhone: targetPhone,
            });
        } catch (error: any) {
            console.error("Erro ao deletar permissões:", error);
            res.status(500).json({ error: error.message || "Erro ao deletar permissões" });
        }
    },
};

export default permissionController;
