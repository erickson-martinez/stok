import { Request, Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";
import Company from "../models/Company";
import User from "../models/User";
import Permission from "../models/Permission";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

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

class CompanyController {
    // Criar nova empresa
    async createCompany(req: Request, res: Response): Promise<void> {
        try {
            const { name, cnpj, email, address, city, linkId, state, zipCode, status, idEmail } = req.body;

            // Validação básica
            if (!name) {
                res.status(400).json({ error: "Nome da empresa é obrigatório" });
                return;
            }

            if (!idEmail) {
                res.status(400).json({ error: "ID do e-mail é obrigatório" });
                return;
            }

            // Verificar se CNPJ já existe (se fornecido)
            if (cnpj) {
                const existingCompany = await Company.findOne({ cnpj });
                if (existingCompany) {
                    res.status(400).json({ error: "CNPJ já cadastrado" });
                    return;
                }
            }

            const newCompany = new Company({
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

            // Criar permissões automáticas para o owner
            try {
                if (idEmail) {

                    // Verificar se já existe permissão
                    const existingPermission = await Permission.findOne({ userEmail: idEmail });

                    if (!existingPermission) {
                        const defaultPermissions = ["rh", "aprovarHoras", "chamados"];
                        await Permission.create({
                            userEmail: idEmail,
                            permissions: defaultPermissions,
                        });
                    }
                }
            } catch (permError: any) {
                console.error("Aviso: Erro ao criar permissões automáticas:", permError);
                // Não bloqueia a criação da empresa se houver erro na permissão
            }

            res.status(201).json({
                success: true,
                message: "Empresa criada com sucesso",
                company: newCompany,
            });
        } catch (error) {
            console.error("Erro ao criar empresa:", error);
            res.status(500).json({ error: "Erro ao criar empresa" });
        }
    }

    // Listar todas as empresas de um usuário
    async getCompanies(req: Request, res: Response): Promise<void> {
        try {
            const { idEmail } = req.params;
            const companies = await Company.find({ idEmail: idEmail });
            res.status(200).json({
                success: true,
                companies,
            });
        } catch (error) {
            console.error("Erro ao buscar empresas:", error);
            res.status(500).json({ error: "Erro ao buscar empresas" });
        }
    }

    // Obter uma empresa específica
    async getCompanyById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const company = await Company.findById(id)

            if (!company) {
                res.status(404).json({ error: "Empresa não encontrada" });
                return;
            }

            res.status(200).json({
                success: true,
                company,
            });
        } catch (error) {
            console.error("Erro ao buscar empresa:", error);
            res.status(500).json({ error: "Erro ao buscar empresa" });
        }
    }

    // Atualizar empresa
    async updateCompany(req: Request, res: Response): Promise<void> {
        try {
            const { id, status } = req.params;
            const { name, cnpj, idEmail, email, address, linkId, city, state, zipCode } = req.body;

            // Verificar se CNPJ já existe em outra empresa
            if (cnpj) {
                const existingCompany = await Company.findOne({ cnpj, _id: { $ne: id } });
                if (existingCompany) {
                    res.status(400).json({ error: "CNPJ já cadastrado para outra empresa" });
                    return;
                }
            }

            const updatedCompany = await Company.findByIdAndUpdate(
                id,
                {
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
                },
                { new: true }
            );

            if (!updatedCompany) {
                res.status(404).json({ error: "Empresa não encontrada" });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Empresa atualizada com sucesso",
                company: updatedCompany,
            });
        } catch (error) {
            console.error("Erro ao atualizar empresa:", error);
            res.status(500).json({ error: "Erro ao atualizar empresa" });
        }
    }

    // Deletar empresa
    async deleteCompany(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const deletedCompany = await Company.findByIdAndDelete(id);

            if (!deletedCompany) {
                res.status(404).json({ error: "Empresa não encontrada" });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Empresa deletada com sucesso",
            });
        } catch (error) {
            console.error("Erro ao deletar empresa:", error);
            res.status(500).json({ error: "Erro ao deletar empresa" });
        }
    }

    // Atualizar apenas o status da empresa
    async updateStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Validar status
            if (!status || !['ativo', 'inativo'].includes(status)) {
                res.status(400).json({ error: "Status deve ser 'ativo' ou 'inativo'" });
                return;
            }

            const updatedCompany = await Company.findByIdAndUpdate(
                id,
                {
                    status,
                    updatedAt: new Date(),
                },
                { new: true }
            );

            if (!updatedCompany) {
                res.status(404).json({ error: "Empresa não encontrada" });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Status da empresa atualizado com sucesso",
                company: updatedCompany,
            });
        } catch (error) {
            console.error("Erro ao atualizar status da empresa:", error);
            res.status(500).json({ error: "Erro ao atualizar status da empresa" });
        }
    }
}

export default new CompanyController();
