import { Request, Response } from "express";
import Permission from "../models/Permission";
import User from "../models/User";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

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
            const { idEmail, email, permissions = [] } = req.body;

            // Validar idEmail
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

            // Verificar se já existe permissão para este usuário
            const existingPermission = await Permission.findOne({ idEmail: idEmail });

            if (existingPermission) {
                res.status(400).json({ error: `Permissão já existe para o usuário ${idEmail}` });
                return;
            }

            // Criar nova permissão
            const newPermission = new Permission({
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
        } catch (error: any) {
            console.error("Erro ao criar permissão:", error);
            res.status(500).json({ error: error.message || "Erro ao criar permissão" });
        }
    },

    // Obter permissões - com filtro opcional por userPhone
    async getPermissions(req: Request, res: Response): Promise<void> {
        try {
            const { idEmail, email } = req.query;

            // Se idEmail não foi fornecido, retorna todas as permissões
            if (!idEmail) {
                const permissions = await Permission.find({}).lean();

                // Descriptografar telefones na resposta
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

            // Se userPhone foi fornecido, busca específico

            let permissions = await Permission.findOne({ idEmail: idEmail }).lean();

            // Se não existir, criar com array vazio
            if (!permissions) {
                const newPermission = new Permission({
                    idEmail: idEmail,
                    email: email,
                    permissions: [],
                });

                const savedPermission = await newPermission.save();
                permissions = savedPermission.toObject() as any;
            }

            res.status(200).json({
                success: true,
                idEmail: idEmail,
                email: email,
                permissions: permissions?.permissions ?? [],
            });
        } catch (error: any) {
            console.error("Erro ao obter permissões:", error);
            res.status(500).json({ error: error.message || "Erro ao obter permissões" });
        }
    },

    // Atualizar permissões de um usuário (PATCH - atualização parcial)
    async updatePermissions(req: Request, res: Response): Promise<void> {
        try {
            const { idEmail, add } = req.query;
            const { permissions } = req.body;

            // Validar idEmail
            if (!idEmail) {
                res.status(400).json({ error: "idEmail é obrigatório" });
                return;
            }

            if (typeof idEmail !== "string" || idEmail.trim() === "") {
                res.status(400).json({ error: "idEmail deve ser uma string válida" });
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

            let permissionDoc = await Permission.findOne({ idEmail: idEmail });

            if (!permissionDoc) {
                const newPermission = new Permission({
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
                message: `Permissões de ${idEmail} atualizadas com sucesso`,
                idEmail: idEmail,
                permissions: permissionDoc.permissions,
            });
        } catch (error: any) {
            console.error("Erro ao atualizar permissões:", error);
            res.status(500).json({ error: error.message || "Erro ao atualizar permissões" });
        }
    },

    async updateidEmailPermissions(req: Request, res: Response): Promise<void> {
        try {
            const { idEmail } = req.params;
            const { idEmailPermissions, email } = req.body;

            // Validar idEmail
            if (!idEmail) {
                res.status(400).json({ error: "idEmail é obrigatório" });
                return;
            }

            if (typeof idEmail !== "string" || idEmail.trim() === "") {
                res.status(400).json({ error: "idEmail deve ser uma string válida" });
                return;
            }


            // Validar idEmailPermissions
            if (idEmailPermissions === undefined) {
                res.status(400).json({
                    error: "Campo 'idEmailPermissions' é obrigatório",
                });
                return;
            }

            let permissionDoc = await Permission.findOne({ idEmail: idEmail });

            if (!permissionDoc) {
                res.status(404).json({ error: `Permissões não encontradas para ${idEmail}` });
                return;
            }

            permissionDoc.idEmail = idEmailPermissions;
            if (email) {
                permissionDoc.email = email; // Atualiza o campo email também, se fornecido
            }
            permissionDoc.permissions = permissionDoc.permissions; // Mantém as permissões existentes

            permissionDoc.updatedAt = new Date();
            await permissionDoc.save();

            res.status(200).json({
                success: true,
                message: `Permissões de ${idEmail} atualizadas com sucesso`,
                idEmail: idEmailPermissions,
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
            const { idEmail } = req.params;

            // Validar idEmail
            if (!idEmail) {
                res.status(400).json({ error: "idEmail é obrigatório" });
                return;
            }

            if (idEmail === "admin@example.com") {
                res.status(400).json({ error: "Não pode deletar permissões do admin" });
                return;
            }

            const targetEmail = String(idEmail).trim();

            // Buscar todos usuários e descriptografar
            const users = await User.find({}).lean();
            const userMap = new Map<string, string>();

            users.forEach(user => {
                const plainPhone = decryptPhone(user.phone);
                userMap.set(plainPhone, user.phone); // plain → encrypted
            });

            const encryptedPhone = userMap.get(targetEmail);

            if (!encryptedPhone) {
                res.status(404).json({ error: `Usuário com email ${idEmail} não encontrado` });
                return;
            }

            const deletedPermission = await Permission.findOneAndDelete({ idEmail: targetEmail });

            if (!deletedPermission) {
                res.status(404).json({ error: `Permissões não encontradas para ${idEmail}` });
                return;
            }

            res.status(200).json({
                success: true,
                message: `Permissões de ${idEmail} deletadas com sucesso`,
                idEmail: targetEmail,
            });
        } catch (error: any) {
            console.error("Erro ao deletar permissões:", error);
            res.status(500).json({ error: error.message || "Erro ao deletar permissões" });
        }
    },
};

export default permissionController;
