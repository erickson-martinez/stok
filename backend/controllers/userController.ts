
import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import crypto from "crypto";

import dotenv from "dotenv";

// Carrega as variáveis de ambiente
dotenv.config();

// Carrega a ENCRYPTION_KEY do .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

// Verifica se a ENCRYPTION_KEY está definida
if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não está definida no arquivo .env");
}

// Funções de criptografia
const encryptPassword = (password: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
};

const decryptPassword = (encrypted: string): string => {
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

// Regex para validação da senha
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{15,}$/;

// Função para validar a senha com mensagens específicas
const validatePassword = (password: string): { isValid: boolean; error?: string } => {
    if (password.length < 15) {
        return { isValid: false, error: "A senha deve ter no mínimo 15 caracteres" };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: "A senha deve conter pelo menos 1 letra maiúscula" };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: "A senha deve conter pelo menos 1 letra minúscula" };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: "A senha deve conter pelo menos 1 número" };
    }
    if (!/[!@#$%^&*]/.test(password)) {
        return { isValid: false, error: "A senha deve conter pelo menos 1 caractere especial (!@#$%^&*)" };
    }
    if (!passwordRegex.test(password)) {
        return {
            isValid: false,
            error: "A senha contém caracteres inválidos. Use apenas letras, números e !@#$%^&*",
        };
    }
    return { isValid: true };
};

// Criar um novo usuário
const createUser = async (req: Request, res: Response) => {
    try {
        const { name, pass, phone } = req.body;

        if (!name || !pass || !phone) {
            return res.status(400).json({ error: "Nome, senha e telefone são obrigatórios" });
        }

        const passwordValidation = validatePassword(pass);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ error: passwordValidation.error });
        }

        const encryptedPassword = encryptPassword(pass);
        const encryptedPhone = encryptPassword(phone);
        const user = new User({
            name,
            password: encryptedPassword,
            phone: encryptedPhone,
        });

        await user.save();
        res.status(201).json({ message: "Usuário criado com sucesso", user: { name, phone } });
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar usuário", details: (error as Error).message });
    }
};

// Atualizar usuário
const updateUser = async (req: Request, res: Response) => {
    try {
        const { phone } = req.params; // Identifica o usuário pelo telefone
        const { name, pass } = req.body;

        // Verifica se há algo para atualizar
        if (!name && !pass) {
            return res.status(400).json({ error: "Forneça pelo menos um campo para atualizar (nome ou senha)" });
        }

        // Busca o usuário pelo telefone
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // Atualiza o nome, se fornecido
        if (name) {
            user.name = name;
        }

        // Atualiza a senha, se fornecida, com validação e criptografia
        if (pass) {
            const passwordValidation = validatePassword(pass);
            if (!passwordValidation.isValid) {
                return res.status(400).json({ error: passwordValidation.error });
            }
            user.password = encryptPassword(pass);
        }

        // Salva as alterações
        await user.save();
        res.json({ message: "Usuário atualizado com sucesso", user: { name: user.name, phone: user.phone } });
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar usuário", details: (error as Error).message });
    }
};

// Buscar usuário por telefone
const getUser = async (req: Request, res: Response) => {
    try {
        const { phone } = req.params;
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        res.json({ name: user.name, phone: user.phone });
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar usuário", details: (error as Error).message });
    }
};

// Autenticar usuário
const authenticateUser = async (req: Request, res: Response) => {
    try {
        const { phone, pass } = req.body;

        if (!phone || !pass) {
            return res.status(400).json({ error: "Telefone e senha são obrigatórios" });
        }

        const userAll = await User.find({});
        const users = userAll.map((user) => {
            return {
                name: user.name,
                phone: decryptPassword(user.phone),
                password: user.password
            }
        })

        const findPhone = users.find((user) => user.phone == phone);

        if (!userAll || !findPhone || !users) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        if (decryptPassword(findPhone.password) !== pass) {
            return res.status(401).json({ error: "Senha incorreta" });
        }

        res.json({ message: "Autenticação bem-sucedida", user: { name: findPhone.name, phone: findPhone.phone } });
    } catch (error) {
        res.status(500).json({ error: "Erro ao autenticar", details: (error as Error).message });
    }
};

export default { createUser, getUser, authenticateUser, updateUser };