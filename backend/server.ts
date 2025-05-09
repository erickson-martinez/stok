import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import UserController from "./controllers/userController.ts";
import stockController from "./controllers/stockController.ts";
import expenseController from "./controllers/expenseController.ts";
import activityController from './controllers/activityController';
import marketController from './controllers/marketController';
import shoppingListController from './controllers/shoppingListController.ts';
import productPriceController from './controllers/productPriceController';
import bookController from "./controllers/bookControllers.ts";

dotenv.config();
const app: Express = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

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

app.get("/users/:phone", UserController.getUser);
app.post("/users", UserController.createUser);
app.post("/users/auth", UserController.authenticateUser);
app.patch("/users/:phone", UserController.updateUser);

app.get("/products/:idUser", stockController.getProducts);
app.post("/products", stockController.createProduct);
app.put("/products/:id", stockController.updateProduct);
app.delete("/products/:id", stockController.deleteProduct);
app.post("/products/:id/share", stockController.shareProduct);

app.get("/expenses/:idUser", expenseController.getExpenses);
app.get("/expensesShared/:idUserShared", expenseController.getExpensesShared);
app.post("/expenses", expenseController.createExpense);
app.patch("/expenses", expenseController.updateExpense);
app.patch("/expenses-item", expenseController.updateExpenseItem);
app.delete("/expenses", expenseController.deleteExpense);
app.delete("/expenses-item", expenseController.deleteExpenseItem);
app.patch("/expenses/payment", expenseController.updatePaymentStatus);
app.patch("/expenses/update-receita-despesa", expenseController.updateReceitaDespesa);

app.get("/activity/:phone", activityController.getActivities);
app.post("/activity", activityController.createOrUpdateActivity);
app.delete("/activity", activityController.deleteActivity);

app.get("/markets/:name", marketController.getMarkets);
app.get("/markets", marketController.getMarketsAll);
app.post("/markets", marketController.saveMarket);
app.delete("/markets", marketController.deleteMarket);
// Nova rota PATCH
app.patch("/markets/:id", marketController.updateMarket);

// Rotas de Shopping List (ajustadas e completadas)
app.get('/shopping-lists/:idUser', shoppingListController.getShoppingLists);
app.get('/shopping-lists/shared/:idUser', shoppingListController.getSharedShoppingLists); // Nova rota para listas compartilhadas
app.post('/shopping-lists', shoppingListController.createShoppingList);
app.post('/shopping-lists/:listId/share', shoppingListController.shareShoppingList); // Nova rota para compartilhar
app.put('/shopping-lists/:listId/products', shoppingListController.saveProduct); // Corrigido "incumbent"
app.delete('/shopping-lists/:listId/products', shoppingListController.deleteProduct);
app.put('/shopping-lists/:listId', shoppingListController.updateList);
app.put('/shopping-lists/:listId/complete', shoppingListController.completeList);
app.delete('/shopping-lists/:listId', shoppingListController.deleteList);

app.post("/product-price", productPriceController.saveProductPrice);
app.get("/product-price/:productName/:days", productPriceController.getRecentProductPrices);
app.get("/product-price/:productName/:marketId", productPriceController.getMarketProductPrice);
app.post("/product-price/compare", productPriceController.comparePrices);

app.get('/books/:idUser', bookController.getBooks);
app.get('/books/:id', bookController.getBookById);
app.post('/books/:idUser', bookController.createBook);
app.put('/books/:id', bookController.updateBook);
app.delete('/books/:id', bookController.deleteBook);
app.post('/books/:id/transfer', bookController.transferBook);

const PORT: number = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));