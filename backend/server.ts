// backend/server.ts
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.ts";
import Product from "./models/Product.ts";

dotenv.config();
const app = express();

app.use(cors({
    origin: "*", // Permite todas as origens
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// Rota raiz para teste
app.get("/", (req, res) => {
    res.send("API de Estoque Casa funcionando em http://192.168.1.67:3000! Use /users ou /products para interagir.");
});

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in the environment variables");
}

mongoose.connect(mongoUri)
    .then(() => console.log("Conectado ao MongoDB"))
    .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

// Verificar ou buscar usuário
app.get("/users/:phone", async (req, res) => {
    try {
        const user = await User.findOne({ phone: req.params.phone });
        if (user) {
            return res.json(user);
        }
        res.status(404).send("Usuário não encontrado");
    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        res.status(500).send("Erro ao buscar usuário");
    }
});

// Cadastrar usuário
app.post("/users", async (req, res) => {
    const { name, phone, password } = req.body;
    try {
        const user = new User({ name, phone, password });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        if (error instanceof mongoose.Error && (error as any).code === 11000) {
            return res.status(400).send("Este telefone já está cadastrado");
        }
        console.error("Erro ao cadastrar usuário:", error);
        res.status(500).send("Erro ao cadastrar usuário");
    }
});

// CRUD de produtos
app.get("/products", async (req, res) => {
    try {
        const { ownerPhone } = req.query;
        if (!ownerPhone) {
            return res.status(400).send("Parâmetro ownerPhone é obrigatório");
        }
        const products = await Product.find({ $or: [{ ownerPhone }, { sharedWith: ownerPhone }] });
        res.json(products);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        res.status(500).send("Erro ao buscar produtos");
    }
});

app.post("/products", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error("Erro ao cadastrar produto:", error);
        res.status(500).send("Erro ao cadastrar produto");
    }
});

app.put("/products/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) {
            return res.status(404).send("Produto não encontrado");
        }
        res.json(product);
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        res.status(500).send("Erro ao atualizar produto");
    }
});

app.delete("/products/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).send("Produto não encontrado");
        }
        res.status(204).send();
    } catch (error) {
        console.error("Erro ao excluir produto:", error);
        res.status(500).send("Erro ao excluir produto");
    }
});

// Compartilhar produto
app.post("/products/:id/share", async (req, res) => {
    const { sharedWithPhone } = req.body;
    try {
        if (!sharedWithPhone) {
            return res.status(400).send("O campo sharedWithPhone é obrigatório");
        }
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send("Produto não encontrado");
        }
        if (!product.sharedWith.includes(sharedWithPhone)) {
            product.sharedWith.push(sharedWithPhone);
            await product.save();
        }
        res.status(200).json(product);
    } catch (error) {
        console.error("Erro ao compartilhar produto:", error);
        res.status(500).send("Erro ao compartilhar produto");
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));