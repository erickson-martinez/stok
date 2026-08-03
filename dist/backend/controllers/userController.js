"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;
if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY não está definida no arquivo .env");
}
const encryptPassword = (password) => {
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
};
const decryptPassword = (encrypted) => {
    if (!encrypted) {
        return "";
    }
    const [iv, encryptedText] = encrypted.split(":");
    if (!iv || !encryptedText) {
        return encrypted;
    }
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), Buffer.from(iv, "hex"));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{15,}$/;
const validatePassword = (password) => {
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
const createUser = async (req, res) => {
    try {
        const { name, pass, idEmail, email } = req.body;
        if (!name || !pass || !idEmail || !email) {
            res.status(400).json({ error: "Nome, senha, telefone, ID do email e email são obrigatórios" });
            return;
        }
        const passwordValidation = validatePassword(pass);
        if (!passwordValidation.isValid) {
            res.status(400).json({ error: passwordValidation.error });
            return;
        }
        const user = new User_1.default({
            name: encryptPassword(name),
            password: encryptPassword(pass),
            idEmail: idEmail,
            email: email,
        });
        await user.save();
        res.status(201).json({ user });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao criar usuário", details: error.message });
    }
};
const updateUser = async (req, res) => {
    try {
        const { idEmail } = req.params;
        const { name, pass } = req.body;
        if (!name && !pass) {
            res.status(400).json({ error: "Forneça pelo menos um campo para atualizar (nome ou senha)" });
            return;
        }
        if (!idEmail || !pass) {
            res.status(400).json({ error: "Telefone e senha são obrigatórios" });
            return;
        }
        const user = await User_1.default.findOne({ idEmail: idEmail });
        if (!user) {
            res.status(404).json({ error: "Usuário não encontrado" });
            return;
        }
        if (name) {
            user.name = encryptPassword(name);
            await User_1.default.findByIdAndUpdate(user._id, { name: user.name });
        }
        if (pass) {
            const passwordValidation = validatePassword(pass);
            if (!passwordValidation.isValid) {
                res.status(400).json({ error: passwordValidation.error });
                return;
            }
            user.password = encryptPassword(pass);
            await User_1.default.findByIdAndUpdate(user._id, { password: user.password });
        }
        res.json({ message: "Usuário atualizado com sucesso", user: { name: user.name, phone: user.phone } });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao atualizar usuário", details: error.message });
    }
};
const updateIdEmail = async (req, res) => {
    try {
        const { idEmail } = req.params;
        const { newIdEmail, email } = req.body;
        if (!idEmail || !newIdEmail) {
            res.status(400).json({
                error: "Informe idEmail e newIdEmail"
            });
            return;
        }
        const user = await User_1.default.findOne({ idEmail: idEmail });
        if (!user) {
            res.status(404).json({
                error: "Usuário não encontrado"
            });
            return;
        }
        user.idEmail = newIdEmail;
        user.email = email;
        await user.save();
        res.status(200).json({
            message: "idEmail atualizado com sucesso",
            user: {
                name: user.name,
                idEmail: user.idEmail
            }
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Erro ao atualizar idEmail",
            details: error.message
        });
    }
};
const getUser = async (req, res) => {
    try {
        const { idEmail, name, email } = req.query;
        let users;
        if (idEmail && name === undefined && email === undefined) {
            users = await User_1.default.find({ idEmail: idEmail });
            if (!users || users.length === 0) {
                res.status(404).json({ error: "Usuário não encontrado" });
                return;
            }
        }
        else if (name && typeof name === "string" && idEmail == undefined && email == undefined) {
            const allUsers = await User_1.default.find();
            users = allUsers.filter(user => decryptPassword(user.name)
                .toLowerCase()
                .includes(name.toLowerCase()));
            if (!users || users.length === 0) {
                res.status(404).json({ error: "Usuário não encontrado" });
                return;
            }
        }
        else if (email && idEmail == undefined && name == undefined) {
            users = await User_1.default.find({ email: email });
            if (!users || users.length === 0) {
                res.status(404).json({ error: "Usuário não encontrado" });
                return;
            }
        }
        else {
            res.status(400).json({ error: "Forneça um parâmetro de consulta válido (idEmail, name ou email)" });
            return;
        }
        const decryptedUser = { name: decryptPassword(users[0].name), phone: decryptPassword(users[0].phone), _id: users[0]._id, email: users[0].email, idEmail: users[0].idEmail };
        res.json(decryptedUser);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao buscar usuário", details: error.message });
    }
};
const getUsers = async (_req, res) => {
    try {
        const users = await User_1.default.find({});
        const decryptedUsers = users.map((user) => ({
            name: decryptPassword(user.name),
            phone: decryptPassword(user.phone),
            senha: decryptPassword(user.password),
            email: user.email,
            idEmail: user.idEmail,
            _id: user._id
        }));
        res.json(decryptedUsers);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao buscar usuários", details: error.message });
    }
};
const authenticateUser = async (req, res) => {
    try {
        const { phone, pass } = req.body;
        if (!phone || !pass) {
            res.status(400).json({ error: "Telefone e senha são obrigatórios" });
            return;
        }
        const userAll = await User_1.default.find({});
        const users = userAll.map((user) => {
            return {
                name: decryptPassword(user.name),
                phone: decryptPassword(user.phone),
                password: decryptPassword(user.password),
                email: user.email,
                idEmail: user.idEmail,
                _id: user._id
            };
        });
        const user = users.find((user) => user.phone === phone && user.password === pass);
        if (!user) {
            res.status(404).json({ error: "Usuário não encontrado" });
            return;
        }
        if (user?.idEmail === undefined || user?.idEmail === null || user?.idEmail === "") {
            await User_1.default.findByIdAndUpdate(user._id, {
                idEmail: user.phone
            });
        }
        res.status(200).json({ name: user.name, phone: user.phone, _id: user._id, email: user.email, idEmail: user.idEmail });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao autenticar", details: error.message });
    }
};
exports.default = { createUser, getUser, getUsers, authenticateUser, updateUser, updateIdEmail };
//# sourceMappingURL=userController.js.map