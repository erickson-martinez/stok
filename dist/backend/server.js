"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Controllers
const userController_1 = __importDefault(require("./controllers/userController"));
//import whatsappRouter from './routes/whatsappRouter';
const stockController_1 = __importDefault(require("./controllers/stockController")); // Sistema antigo
const transactionController_1 = __importDefault(require("./controllers/transactionController")); // Novo sistema independente
const activityController_1 = __importDefault(require("./controllers/activityController"));
const marketController_1 = __importDefault(require("./controllers/marketController"));
const shoppingListController_1 = __importDefault(require("./controllers/shoppingListController"));
const productPriceController_1 = __importDefault(require("./controllers/productPriceController"));
const bookControllers_1 = __importDefault(require("./controllers/bookControllers"));
const scheduleController_1 = __importDefault(require("./controllers/scheduleController"));
const companyController_1 = __importDefault(require("./controllers/companyController"));
const permissionController_1 = __importDefault(require("./controllers/permissionController"));
const rhController_1 = __importDefault(require("./controllers/rhController"));
const workRecordController_1 = __importDefault(require("./controllers/workRecordController"));
const osController_1 = __importDefault(require("./controllers/osController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Configuração CORS - ajuste em produção!
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rota básica de teste/saúde
app.get("/", (_req, res) => {
    res.send("API V1 - Servidor Online\n" +
        `Data atual: ${new Date().toISOString()}\n`);
});
// Conexão com MongoDB
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
    throw new Error("MONGO_URI ou MONGODB_URI não definido nas variáveis de ambiente");
}
mongoose_1.default.connect(mongoUri)
    .then(() => console.log("✓ MongoDB conectado com sucesso"))
    .catch((err) => console.error("✗ Falha ao conectar no MongoDB:", err));
// Rotas WhatsApp
//app.use('/whatsapp', whatsappRouter);
// ── Usuários ─────────────────────────────────────────────────────────
app.get("/user/:phone?", userController_1.default.getUser);
app.get("/users", userController_1.default.getUsers);
app.post("/users", userController_1.default.createUser);
app.post("/users/auth", userController_1.default.authenticateUser);
app.patch("/users/:phone", userController_1.default.updateUser);
// ── Estoque / Produtos ───────────────────────────────────────────────
app.get("/products/:idUser", stockController_1.default.getProducts);
app.post("/products", stockController_1.default.createProduct);
app.put("/products/:id", stockController_1.default.updateProduct);
app.delete("/products/:id", stockController_1.default.deleteProduct);
app.post("/products/:id/share", stockController_1.default.shareProduct);
// ── Novo Sistema: Transactions (independente) ────────────────────────
app.post("/transactions/simple", transactionController_1.default.createSimple);
app.post("/transactions/controlled", transactionController_1.default.createControlled);
app.patch("/transactions/payment", transactionController_1.default.updatePaymentStatus);
app.get("/transactions", transactionController_1.default.listTransactions);
app.patch("/transactions/status", transactionController_1.default.markStatus);
app.post("/transactions/follow", transactionController_1.default.followUser);
app.delete("/transactions", transactionController_1.default.deleteTransaction);
app.patch("/transactions/:transactionId/add-value", transactionController_1.default.addValue);
app.patch("/transactions/:transactionId/subtract-value", transactionController_1.default.subtractValue);
// Minhas OS
app.post("/os", osController_1.default.create);
app.get("/os/my", osController_1.default.getMyOrders);
app.patch("/os/:id/cancel", osController_1.default.cancel);
// Gestão da empresa
app.get("/os/company", osController_1.default.getCompanyOrders);
app.patch("/os/:id/resolve", osController_1.default.resolve);
app.patch("/os/:id/start", osController_1.default.start);
// ── Outras funcionalidades ───────────────────────────────────────────
app.get("/activity/:phone", activityController_1.default.getActivities);
app.post("/activity", activityController_1.default.createOrUpdateActivity);
app.delete("/activity", activityController_1.default.deleteActivity);
app.get("/markets", marketController_1.default.getMarketsAll);
app.get("/markets/:name", marketController_1.default.getMarkets);
app.post("/markets", marketController_1.default.saveMarket);
app.patch("/markets/:id", marketController_1.default.updateMarket);
app.delete("/markets", marketController_1.default.deleteMarket);
// Shopping Lists
app.get("/shopping-lists/:idUser", shoppingListController_1.default.getShoppingLists);
app.get("/shopping-lists/shared/:idUser", shoppingListController_1.default.getSharedShoppingLists);
app.post("/shopping-lists", shoppingListController_1.default.createShoppingList);
app.post("/shopping-lists/:listId/share", shoppingListController_1.default.shareShoppingList);
app.put("/shopping-lists/:listId/products", shoppingListController_1.default.saveProduct);
app.delete("/shopping-lists/:listId/products", shoppingListController_1.default.deleteProduct);
app.put("/shopping-lists/:listId", shoppingListController_1.default.updateList);
app.put("/shopping-lists/:listId/complete", shoppingListController_1.default.completeList);
app.delete("/shopping-lists/:listId", shoppingListController_1.default.deleteList);
// Preços de produtos
app.post("/product-price", productPriceController_1.default.saveProductPrice);
app.get("/product-price/:productName/:days", productPriceController_1.default.getRecentProductPrices);
app.get("/product-price/:productName/:marketId", productPriceController_1.default.getMarketProductPrice);
app.post("/product-price/compare", productPriceController_1.default.comparePrices);
// Livros
app.get("/books/:idUser", bookControllers_1.default.getBooks);
app.get("/books/:id", bookControllers_1.default.getBookById);
app.post("/books/:idUser", bookControllers_1.default.createBook);
app.put("/books/:id", bookControllers_1.default.updateBook);
app.delete("/books/:id", bookControllers_1.default.deleteBook);
app.post("/books/:id/transfer", bookControllers_1.default.transferBook);
// Agendamentos
app.get("/schedules/:idUser", scheduleController_1.default.getSchedules);
app.post("/schedules", scheduleController_1.default.createSchedule);
app.put("/schedules/:id", scheduleController_1.default.updateSchedule);
app.delete("/schedules/:id", scheduleController_1.default.deleteSchedule);
// Empresas
app.post("/companies", companyController_1.default.createCompany);
app.get("/companies/:phone?", companyController_1.default.getCompanies);
app.get("/companies/details/:id", companyController_1.default.getCompanyById);
app.put("/companies/:id", companyController_1.default.updateCompany);
app.patch("/companies/:id/status", companyController_1.default.updateStatus);
app.delete("/companies/:id", companyController_1.default.deleteCompany);
// Permissões (Configurações de Acesso)
app.post("/permissions", permissionController_1.default.createPermission);
app.get("/permissions", permissionController_1.default.getPermissions);
app.patch("/permissions", permissionController_1.default.updatePermissions);
app.delete("/permissions/:userPhone", permissionController_1.default.deletePermissions);
app.post('/work-records/clock-in', workRecordController_1.default.clockIn);
app.patch('/work-records/:id/clock-out', workRecordController_1.default.clockOut);
app.get("/work-records", workRecordController_1.default.list);
app.patch("/work-records/:id/approve", workRecordController_1.default.approve);
app.patch("/work-records/:id/reject", workRecordController_1.default.reject);
app.delete("/work-records/:id", workRecordController_1.default.delete); // opcional
app.post("/rh/link-user", rhController_1.default.linkUserToCompany);
app.get("/rh/:empresaId/employees", rhController_1.default.listEmployees);
app.get("/rh/company/:phone", rhController_1.default.listCompanyByEmployee);
app.delete("/rh/unlink/:linkId", rhController_1.default.unlinkUser);
app.patch("/rh/link/:linkId/status", rhController_1.default.updateLinkStatus);
app.get("/rh/user/companies", rhController_1.default.getUserCompanies);
// Iniciar servidor
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
    console.log(`Data/hora inicialização: ${new Date().toLocaleString()}`);
});
//# sourceMappingURL=server.js.map