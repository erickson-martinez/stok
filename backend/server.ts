import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Controllers
import UserController from "./controllers/userController";
import stockController from "./controllers/stockController";
import expenseController from "./controllers/expenseController";     // Sistema antigo
import transactionController from "./controllers/transactionController"; // Novo sistema independente
import activityController from "./controllers/activityController";
import marketController from "./controllers/marketController";
import shoppingListController from "./controllers/shoppingListController";
import productPriceController from "./controllers/productPriceController";
import bookController from "./controllers/bookControllers";
import scheduleController from "./controllers/scheduleController";

dotenv.config();

const app: Express = express();

// Configuração CORS - ajuste em produção!
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota básica de teste/saúde
app.get("/", (req, res) => {
    res.send(
        "API Casa - Servidor Online\n" +
        `Data atual: ${new Date().toISOString()}\n` +
        "Endpoints principais:\n" +
        "  /users\n" +
        "  /products\n" +
        "  /expenses          ← sistema antigo\n" +
        "  /transactions      ← novo sistema (flat & independente)\n"
    );
});

// Conexão com MongoDB
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
    throw new Error("MONGO_URI ou MONGODB_URI não definido nas variáveis de ambiente");
}

mongoose.connect(mongoUri)
    .then(() => console.log("✓ MongoDB conectado com sucesso"))
    .catch((err) => console.error("✗ Falha ao conectar no MongoDB:", err));

// ── Usuários ─────────────────────────────────────────────────────────
app.get("/users/:phone", UserController.getUser);
app.post("/users", UserController.createUser);
app.post("/users/auth", UserController.authenticateUser);
app.patch("/users/:phone", UserController.updateUser);

// ── Estoque / Produtos ───────────────────────────────────────────────
app.get("/products/:idUser", stockController.getProducts);
app.post("/products", stockController.createProduct);
app.put("/products/:id", stockController.updateProduct);
app.delete("/products/:id", stockController.deleteProduct);
app.post("/products/:id/share", stockController.shareProduct);

// ── Sistema Antigo: Expenses ─────────────────────────────────────────
app.get("/expenses/:idUser", expenseController.getExpenses);
app.get("/expensesShared/:idUserShared", expenseController.getExpensesShared);
app.post("/expenses", expenseController.createExpense);
app.patch("/expenses", expenseController.updateExpense);
app.patch("/expenses-item", expenseController.updateExpenseItem);
app.patch("/expenses/payment", expenseController.updatePaymentStatus);
app.patch("/expenses/update-receita-despesa", expenseController.updateReceitaDespesa);
app.delete("/expenses", expenseController.deleteExpense);
app.delete("/expenses-item", expenseController.deleteExpenseItem);

// ── Novo Sistema: Transactions (independente) ────────────────────────
app.post("/transactions/simple", transactionController.createSimple);
app.post("/transactions/controlled", transactionController.createControlled);
app.patch("/transactions/payment", transactionController.updatePaymentStatus);
app.get("/transactions", transactionController.listTransactions);
app.patch("/transactions/status", transactionController.markStatus);
app.post("/transactions/follow", transactionController.followUser);
app.delete("/transactions", transactionController.deleteTransaction);

// ── Outras funcionalidades ───────────────────────────────────────────
app.get("/activity/:phone", activityController.getActivities);
app.post("/activity", activityController.createOrUpdateActivity);
app.delete("/activity", activityController.deleteActivity);

app.get("/markets", marketController.getMarketsAll);
app.get("/markets/:name", marketController.getMarkets);
app.post("/markets", marketController.saveMarket);
app.patch("/markets/:id", marketController.updateMarket);
app.delete("/markets", marketController.deleteMarket);

// Shopping Lists
app.get("/shopping-lists/:idUser", shoppingListController.getShoppingLists);
app.get("/shopping-lists/shared/:idUser", shoppingListController.getSharedShoppingLists);
app.post("/shopping-lists", shoppingListController.createShoppingList);
app.post("/shopping-lists/:listId/share", shoppingListController.shareShoppingList);
app.put("/shopping-lists/:listId/products", shoppingListController.saveProduct);
app.delete("/shopping-lists/:listId/products", shoppingListController.deleteProduct);
app.put("/shopping-lists/:listId", shoppingListController.updateList);
app.put("/shopping-lists/:listId/complete", shoppingListController.completeList);
app.delete("/shopping-lists/:listId", shoppingListController.deleteList);

// Preços de produtos
app.post("/product-price", productPriceController.saveProductPrice);
app.get("/product-price/:productName/:days", productPriceController.getRecentProductPrices);
app.get("/product-price/:productName/:marketId", productPriceController.getMarketProductPrice);
app.post("/product-price/compare", productPriceController.comparePrices);

// Livros
app.get("/books/:idUser", bookController.getBooks);
app.get("/books/:id", bookController.getBookById);
app.post("/books/:idUser", bookController.createBook);
app.put("/books/:id", bookController.updateBook);
app.delete("/books/:id", bookController.deleteBook);
app.post("/books/:id/transfer", bookController.transferBook);

// Agendamentos
app.get("/schedules/:idUser", scheduleController.getSchedules);
app.post("/schedules", scheduleController.createSchedule);
app.put("/schedules/:id", scheduleController.updateSchedule);
app.delete("/schedules/:id", scheduleController.deleteSchedule);

// Iniciar servidor
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
    console.log(`Data/hora inicialização: ${new Date().toLocaleString()}`);
});