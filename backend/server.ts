import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Controllers
import UserController from "./controllers/userController";
import costController from "./controllers/costController";
import companyConfigController from "./controllers/companyConfigController";
//import whatsappRouter from './routes/whatsappRouter';
import stockController from "./controllers/stockController";   // Sistema antigo
import transactionController from "./controllers/transactionController"; // Novo sistema independente
import activityController from "./controllers/activityController";
import storeController from "./controllers/storeController";
import shoppingListController from "./controllers/shoppingListController";
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
import barberController from "./controllers/barberController";
import barberProductController from "./controllers/barberProductController";
import barberServiceController from "./controllers/barberServiceController";
import appointmentBarberController from "./controllers/appointmentBarberController";
import comparisonController from "./controllers/comparisonController";
import priceRecordController from "./controllers/priceRecordController";
import shoppingItemController from "./controllers/shoppingItemController";
import priceSearchController from "./controllers/priceSearchController";

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
app.get("/api/v1", (_req, res) => {
    res.send(
        "API V1.1.3.0 - Servidor Online\n" +
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

// ── Costs ───────────────────────────────────────────────
app.post("/api/v1/costs", costController.createCost);
app.get("/api/v1/costs", costController.getCosts);
app.get("/api/v1/costs/:id", costController.getCostById);
app.put("/api/v1/costs/:id", costController.updateCost);
app.delete("/api/v1/costs/:id", costController.deleteCost);

// Rotas de configuração
app.post('/api/v1/config', ConfigController.createConfig);
app.get('/api/v1/config/:phone', ConfigController.getConfig);
app.get('/api/v1/config/product/:burger', ConfigController.getProduct);
app.get('/api/v1/config/caixa/:phone', ConfigController.getCaixa);
app.get('/api/v1/config/delivery/:phone', ConfigController.getDelivery);
app.patch('/api/v1/config', ConfigController.updateConfig);
app.patch('/api/v1/config/caixa-open/:phone/:open', ConfigController.updateCaixaOpenDay);

// Rotas de produtos
app.post('/api/v1/products/burgers', ProductBurgerController.createProductBurger);
app.get('/api/v1/products/burgers', ProductBurgerController.getAllProductsBurger);
app.get('/api/v1/products/burgers/:id', ProductBurgerController.getProductBurgerById);
app.put('/api/v1/products/burgers/:id', ProductBurgerController.updateProductBurger);
app.delete('/api/v1/products/burgers/:id', ProductBurgerController.deleteProductBurger);

// Rotas de barbeiros
app.post("/api/v1/barbers", barberController.createBarber);
app.get("/api/v1/barbers", barberController.getBarbers);
app.get("/api/v1/barbers/:id", barberController.getBarberById);
app.put("/api/v1/barbers/:id", barberController.updateBarber);
app.delete("/api/v1/barbers/:id", barberController.deleteBarber);

// ── Barber Products ───────────────────────────────────────
app.post("/api/v1/barber-products", barberProductController.createProduct);
app.get("/api/v1/barber-products", barberProductController.getProducts);
app.get("/api/v1/barber-products/:id", barberProductController.getProductById);
app.put("/api/v1/barber-products/:id", barberProductController.updateProduct);
app.patch("/api/v1/barber-products/:id/stock", barberProductController.updateStock);
app.delete("/api/v1/barber-products/:id", barberProductController.deleteProduct);

// ── Appointment Barber ──────────────────────────────────
app.post("/api/v1/appointment-barbers", appointmentBarberController.createAppointment);
app.get("/api/v1/appointment-barbers", appointmentBarberController.getAppointments);
app.get("/api/v1/appointment-barbers/:id", appointmentBarberController.getAppointmentById);
app.put("/api/v1/appointment-barbers/:id", appointmentBarberController.updateAppointment);
app.patch("/api/v1/appointment-barbers/:id/status", appointmentBarberController.updateStatus);
app.patch("/api/v1/appointment-barbers/:id/cancel", appointmentBarberController.cancelAppointment);
app.delete("/api/v1/appointment-barbers/:id", appointmentBarberController.deleteAppointment);

// ── Barber Services ──────────────────────────────────────
app.post("/api/v1/barber-services", barberServiceController.createService);
app.get("/api/v1/barber-services", barberServiceController.getServices);
app.get("/api/v1/barber-services/:id", barberServiceController.getServiceById);
app.put("/api/v1/barber-services/:id", barberServiceController.updateService);
app.delete("/api/v1/barber-services/:id", barberServiceController.deleteService);

// Rotas de pedidos
app.post('/api/v1/orders', OrdersController.createOrder);
app.get('/api/v1/orders/:burger', OrdersController.getAllOrders);
app.get('/api/v1/orders/delivery/:burger/:status?', OrdersController.getDeliveryOrders);
app.get('/api/v1/orders/my-delivery/:burger/:name', OrdersController.getMyDeliveryOrders);
app.get('/api/v1/orders/:id', OrdersController.getOrderById);
app.get('/api/v1/orders/phone/:phone', OrdersController.getOrderByPhone);
app.put('/api/v1/orders/:id', OrdersController.updateOrder);
app.patch('/api/v1/orders/:id/status/:name?', OrdersController.updateOrderStatus);
app.patch('/api/v1/orders/:id/payment', OrdersController.updateOrderPayment);
app.delete('/api/v1/orders/:id', OrdersController.deleteOrder);

// ── Company Config ──────────────────────────────────────
app.get("/api/v1/company-config/:linkId", companyConfigController.getConfig);
app.put("/api/v1/company-config/:linkId", companyConfigController.upsertConfig);
app.delete("/api/v1/company-config/:linkId", companyConfigController.deleteConfig);

// Rotas de pedidos do cliente
app.get('/api/v1/client', OrderClientController.getClientOrder);
app.get('/api/v1/client/all', OrderClientController.getClientOrders);
app.patch('/api/v1/order-client/:id/payment', OrderClientController.updateClientOrderPayment);
app.patch('/api/v1/order-client/:id/status', OrderClientController.updateClientOrderStatus);

// ── Users ───────────────────────────────────────────────
app.get("/api/v1/user", UserController.getUser);
app.get("/api/v1/users", UserController.getUsers);
app.post("/api/v1/users", UserController.createUser);
app.post("/api/v1/users/auth", UserController.authenticateUser);
app.patch("/api/v1/user/:idEmail", UserController.updateIdEmail);
app.patch("/api/v1/users/:idEmail", UserController.updateUser);

// ── Products (Legacy) ──────────────────────────────────
app.get("/api/v1/products/:idUser", stockController.getProducts);
app.post("/api/v1/products", stockController.createProduct);
app.put("/api/v1/products/:id", stockController.updateProduct);
app.delete("/api/v1/products/:id", stockController.deleteProduct);
app.post("/api/v1/products/:id/share", stockController.shareProduct);

// ── Transactions ───────────────────────────────────────
app.post("/api/v1/transactions/simple", transactionController.createSimple);
app.post("/api/v1/transactions/controlled", transactionController.createControlled);
app.get("/api/v1/transactions", transactionController.listTransactions);
app.put("/api/v1/transactions/:transactionId", transactionController.updateTransaction);
app.delete("/api/v1/transactions", transactionController.deleteTransaction);
app.patch("/api/v1/transactions/status", transactionController.markStatus);
app.patch("/api/v1/transactions/payment", transactionController.updatePaymentStatus);
app.patch("/api/v1/transactions/request-payment", transactionController.requestPayment);
app.patch("/api/v1/transactions/approve-payment", transactionController.approvePayment);
app.patch("/api/v1/transactions/reject-payment", transactionController.rejectPayment);
app.patch("/api/v1/transactions/follow", transactionController.followTransaction);
app.patch("/api/v1/transactions/:transactionId/add-value", transactionController.addValue);
app.patch("/api/v1/transactions/:transactionId/subtract-value", transactionController.subtractValue);
app.patch("/api/v1/transactions/:idEmail?", transactionController.updateTransactionIdEmail);

// ── OS ─────────────────────────────────────────────────
app.post("/api/v1/os", osController.create);
app.get("/api/v1/os/my", osController.getMyOrders);
app.patch("/api/v1/os/:id/cancel", osController.cancel);
app.get("/api/v1/os/company", osController.getCompanyOrders);
app.patch("/api/v1/os/:id/resolve", osController.resolve);
app.patch("/api/v1/os/:id/start", osController.start);

// ── Activities ─────────────────────────────────────────
app.get("/api/v1/activity/:phone", activityController.getActivities);
app.post("/api/v1/activity", activityController.createOrUpdateActivity);
app.delete("/api/v1/activity", activityController.deleteActivity);

// ── Stores ─────────────────────────────────────────────
app.get("/api/v1/stores", storeController.getStores);
app.post("/api/v1/stores", storeController.createStore);
app.patch("/api/v1/stores/:id", storeController.updateStore);
app.delete("/api/v1/stores/:id", storeController.deleteStore);

// Shopping Lists
app.get("/api/v1/shopping-lists", shoppingListController.getShoppingLists);
app.post("/api/v1/shopping-lists", shoppingListController.createShoppingList);
app.patch("/api/v1/shopping-lists/:id", shoppingListController.updateShoppingList);
app.delete("/api/v1/shopping-lists/:id", shoppingListController.deleteShoppingList);

// Shopping Items
app.get("/api/v1/shopping-items", shoppingItemController.getShoppingItems);
app.post("/api/v1/shopping-items", shoppingItemController.createShoppingItem);
app.patch("/api/v1/shopping-items/:id", shoppingItemController.updateShoppingItem);
app.delete("/api/v1/shopping-items/:id", shoppingItemController.deleteShoppingItem);

// Price Records
app.get("/api/v1/price-records", priceRecordController.getPriceRecords);
app.delete("/api/v1/price-records/:id", priceRecordController.deletePriceRecord);

// Price Search
app.get("/api/v1/price-search", priceSearchController.search);

// ── Comparisons ────────────────────────────────────────
app.post("/api/v1/comparisons/shopping-list", comparisonController.compareShoppingList);
app.post("/api/v1/comparisons/product", comparisonController.compareProduct);
app.get("/api/v1/comparisons/best-store", comparisonController.getBestStore);

// ── Books ──────────────────────────────────────────────
app.get("/api/v1/books/:idUser", bookController.getBooks);
app.get("/api/v1/books/:id", bookController.getBookById);
app.post("/api/v1/books/:idUser", bookController.createBook);
app.put("/api/v1/books/:id", bookController.updateBook);
app.delete("/api/v1/books/:id", bookController.deleteBook);
app.post("/api/v1/books/:id/transfer", bookController.transferBook);

// ── Schedules ──────────────────────────────────────────
app.get("/api/v1/schedules/:idUser", scheduleController.getSchedules);
app.post("/api/v1/schedules", scheduleController.createSchedule);
app.put("/api/v1/schedules/:id", scheduleController.updateSchedule);
app.delete("/api/v1/schedules/:id", scheduleController.deleteSchedule);

// ── Companies ──────────────────────────────────────────
app.post("/api/v1/companies", companyController.createCompany);
app.get("/api/v1/companies/:idEmail?", companyController.getCompanies);
app.get("/api/v1/companies/details/:id", companyController.getCompanyById);
app.put("/api/v1/companies/:id", companyController.updateCompany);
app.patch("/api/v1/companies/:id/status", companyController.updateStatus);
app.delete("/api/v1/companies/:id", companyController.deleteCompany);

// ── Permissions ────────────────────────────────────────
app.post("/api/v1/permissions", permissionController.createPermission);
app.get("/api/v1/permissions/:idEmail?", permissionController.getPermissions);
app.patch("/api/v1/permissions", permissionController.updatePermissions);
app.patch("/api/v1/permissions/:idEmail", permissionController.updateidEmailPermissions);
app.delete("/api/v1/permissions/:idEmail", permissionController.deletePermissions);

// ── Work Records ───────────────────────────────────────
app.post("/api/v1/work-records/clock-in", workRecordController.clockIn);
app.patch("/api/v1/work-records/:id/clock-out", workRecordController.clockOut);
app.get("/api/v1/work-records", workRecordController.list);
app.patch("/api/v1/work-records/:id/approve", workRecordController.approve);
app.patch("/api/v1/work-records/:id/reject", workRecordController.reject);
app.delete("/api/v1/work-records/:id", workRecordController.delete);

// ── RH ─────────────────────────────────────────────────
app.post("/api/v1/rh/link-user", rhController.linkUserToCompany);
app.get("/api/v1/rh/:empresaId/employees", rhController.listEmployees);
app.get("/api/v1/rh/company/:idEmail", rhController.listCompanyByEmployee);
app.delete("/api/v1/rh/unlink/:linkId", rhController.unlinkUser);
app.patch("/api/v1/rh/link/:linkId/status", rhController.updateLinkStatus);
app.get("/api/v1/rh/user/companies", rhController.getUserCompanies);


// Iniciar servidor
const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
    console.log(`Data/hora inicialização: ${new Date().toLocaleString()}`);
});