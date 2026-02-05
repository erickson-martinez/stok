import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Controllers
import UserController from "./controllers/userController";
//import whatsappRouter from './routes/whatsappRouter';
import stockController from "./controllers/stockController";   // Sistema antigo
import transactionController from "./controllers/transactionController"; // Novo sistema independente
import activityController from "./controllers/activityController";
import marketController from "./controllers/marketController";
import shoppingListController from "./controllers/shoppingListController";
import productPriceController from "./controllers/productPriceController";
import bookController from "./controllers/bookControllers";
import scheduleController from "./controllers/scheduleController";
import companyController from "./controllers/companyController";
import permissionController from "./controllers/permissionController";
import rhController from "./controllers/rhController";
import workRecordController from "./controllers/workRecordController";
import osController from "./controllers/osController";
import { ConfigController } from "./controllers/configController";
import { ProductBurgerController } from "./controllers/productsBurgerController";
import OrdersController from './controllers/ordersController';
import OrderClientController from './controllers/orderClientController';


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
app.get("/", (_req, res) => {
    res.send(
        "API V1 - Servidor Online\n" +
        `Data atual: ${new Date().toISOString()}\n`
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


// Rotas WhatsApp
//app.use('/whatsapp', whatsappRouter);

// ── Usuários ─────────────────────────────────────────────────────────
app.get("/user/:phone?", UserController.getUser);
app.get("/users", UserController.getUsers);
app.post("/users", UserController.createUser);
app.post("/users/auth", UserController.authenticateUser);
app.patch("/users/:phone", UserController.updateUser);

// ── Estoque / Produtos ───────────────────────────────────────────────
app.get("/products/:idUser", stockController.getProducts);
app.post("/products", stockController.createProduct);
app.put("/products/:id", stockController.updateProduct);
app.delete("/products/:id", stockController.deleteProduct);
app.post("/products/:id/share", stockController.shareProduct);

// ── Novo Sistema: Transactions (independente) ────────────────────────
app.post("/transactions/simple", transactionController.createSimple);
app.post("/transactions/controlled", transactionController.createControlled);
app.put("/transactions/:transactionId", transactionController.updateTransaction);
app.patch("/transactions/payment", transactionController.updatePaymentStatus);
app.get("/transactions", transactionController.listTransactions);
app.patch("/transactions/status", transactionController.markStatus);
app.post("/transactions/follow", transactionController.followUser);
app.delete("/transactions", transactionController.deleteTransaction);
app.patch("/transactions/:transactionId/add-value", transactionController.addValue);
app.patch("/transactions/:transactionId/subtract-value", transactionController.subtractValue);

// Minhas OS
app.post("/os", osController.create);
app.get("/os/my", osController.getMyOrders);
app.patch("/os/:id/cancel", osController.cancel);

// Gestão da empresa
app.get("/os/company", osController.getCompanyOrders);
app.patch("/os/:id/resolve", osController.resolve);
app.patch("/os/:id/start", osController.start);

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

// Empresas
app.post("/companies", companyController.createCompany);
app.get("/companies/:phone?", companyController.getCompanies);
app.get("/companies/details/:id", companyController.getCompanyById);
app.put("/companies/:id", companyController.updateCompany);
app.patch("/companies/:id/status", companyController.updateStatus);
app.delete("/companies/:id", companyController.deleteCompany);

// Permissões (Configurações de Acesso)
app.post("/permissions", permissionController.createPermission);
app.get("/permissions", permissionController.getPermissions);
app.patch("/permissions", permissionController.updatePermissions);
app.delete("/permissions/:userPhone", permissionController.deletePermissions);

app.post('/work-records/clock-in', workRecordController.clockIn);
app.patch('/work-records/:id/clock-out', workRecordController.clockOut);
app.get("/work-records", workRecordController.list);
app.patch("/work-records/:id/approve", workRecordController.approve);
app.patch("/work-records/:id/reject", workRecordController.reject);
app.delete("/work-records/:id", workRecordController.delete); // opcional

app.post("/rh/link-user", rhController.linkUserToCompany);
app.get("/rh/:empresaId/employees", rhController.listEmployees);
app.get("/rh/company/:phone", rhController.listCompanyByEmployee);
app.delete("/rh/unlink/:linkId", rhController.unlinkUser);
app.patch("/rh/link/:linkId/status", rhController.updateLinkStatus);
app.get("/rh/user/companies", rhController.getUserCompanies);

// Rotas de configuração
app.post('/api/config', ConfigController.createOrUpdateConfig);
app.get('/api/config', ConfigController.getConfig);
app.get('/api/config/product', ConfigController.getProduct);
app.get('/api/config/caixa', ConfigController.getCaixa);
app.get('/api/config/delivery', ConfigController.getDelivery);
app.patch('/api/config', ConfigController.updateConfig);

// Rotas de produtos
app.post('/api/products/burgers', ProductBurgerController.createProductBurger);
app.get('/api/products/burgers', ProductBurgerController.getAllProductsBurger);
app.get('/api/products/burgers/:id', ProductBurgerController.getProductBurgerById);
app.put('/api/products/burgers/:id', ProductBurgerController.updateProductBurger);
app.delete('/api/products/burgers/:id', ProductBurgerController.deleteProductBurger);

// Rotas de pedidos
app.post('/api/orders', OrdersController.createOrder);
app.get('/api/orders/:burger', OrdersController.getAllOrders);
app.get('/api/orders/delivery/:burger/:status?', OrdersController.getDeliveryOrders);
app.get('/api/orders/my-delivery/:burger/:name', OrdersController.getMyDeliveryOrders);
app.get('/api/orders/:id', OrdersController.getOrderById);
app.get('/api/orders/phone/:phone', OrdersController.getOrderByPhone);
app.put('/api/orders/:id', OrdersController.updateOrder);
app.patch('/api/orders/:id/status/:name?', OrdersController.updateOrderStatus);
app.patch('/api/orders/:id/payment', OrdersController.updateOrderPayment);
app.delete('/api/orders/:id', OrdersController.deleteOrder);


// Rotas de pedidos do cliente
app.get('/api/client', OrderClientController.getClientOrder);
app.get('/api/client/all', OrderClientController.getClientOrders);
app.patch('/api/order-client/:id/payment', OrderClientController.updateClientOrderPayment);
app.patch('/api/order-client/:id/status', OrderClientController.updateClientOrderStatus);


// Iniciar servidor
const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
    console.log(`Data/hora inicialização: ${new Date().toLocaleString()}`);
});