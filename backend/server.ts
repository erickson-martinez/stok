import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import UserController from "./controllers/userController.ts";
import ProductController from "./controllers/productController.ts";
import expenseController from "./controllers/expenseController";
import activityController from './controllers/activityController';

dotenv.config();
const app: Express = express();

app.use(cors({
    origin: "*", // Permite todas as origens
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// Rota raiz para teste
app.get("/", (req, res) => {
    res.send("API de Estoque Casa funcionando em http://192.168.1.67:3000! Use /users, /products ou /expenses para interagir.");
});

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
    throw new Error("MONGO_URI or MONGODB_URI is not defined in the environment variables");
}

mongoose.connect(mongoUri as string)
    .then(() => console.log("Conectado ao MongoDB"))
    .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));
// Rotas de usuários
app.get("/users/:phone", UserController.getUser);
app.post("/users", UserController.createUser);
app.post("/users/auth", UserController.authenticateUser);
app.patch("/users/:phone", UserController.updateUser);

// Rotas de produtos
app.get("/products", ProductController.getProducts);
app.post("/products", ProductController.createProduct);
app.put("/products/:id", ProductController.updateProduct);
app.delete("/products/:id", ProductController.deleteProduct);
app.post("/products/:id/share", ProductController.shareProduct);

// Rotas de despesas
app.get("/expenses/:phone", expenseController.getExpenses);
app.get("/expensesShared/:phoneShared", expenseController.getExpensesShared);
app.post("/expenses", expenseController.createExpense);
app.patch("/expenses", expenseController.updateExpense);
app.delete("/expenses", expenseController.deleteExpense);

// Rotas das atividades
app.get('/activity/:phone', activityController.getActivities);
app.post('/activity', activityController.createOrUpdateActivity);
app.delete('/activity', activityController.deleteActivity);

const PORT: number = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));