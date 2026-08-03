"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Orders_1 = require("../models/Orders");
const OrderClient_1 = require("../models/OrderClient");
const inspector_1 = require("inspector");
class OrdersController {
    static handleError(res, error) {
        inspector_1.console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro interno no servidor'
        });
    }
    static handleNotFound(res, message = 'Pedido não encontrado') {
        res.status(404).json({
            success: false,
            message
        });
    }
    static sanitizeStatusHistory(statusHistory) {
        if (!statusHistory)
            return {};
        try {
            return JSON.parse(JSON.stringify(statusHistory));
        }
        catch (error) {
            inspector_1.console.error('Error sanitizing status history:', error);
            return {};
        }
    }
    static sanitizeOrderData(data) {
        if (!data)
            return null;
        try {
            const sanitized = data.toObject ? data.toObject() : { ...data };
            delete sanitized._id;
            delete sanitized.__v;
            return sanitized;
        }
        catch (error) {
            inspector_1.console.error('Error sanitizing order data:', error);
            return null;
        }
    }
    static validateId(id) {
        const num = parseInt(id, 10);
        return isNaN(num) ? null : num;
    }
    async createOrder(req, res) {
        try {
            const lastOrder = await Orders_1.Order.findOne().sort({ id: -1 });
            const newId = lastOrder ? lastOrder.id + 1 : Date.now();
            const orderData = {
                id: newId,
                ...req.body,
                statusHistory: {
                    [req.body.status || 'Aguardando']: {
                        start: new Date(),
                        end: null
                    }
                }
            };
            const order = await new Orders_1.Order(orderData).save();
            if (req.body.onclient === "true") {
                await new OrderClient_1.OrderClient(orderData).save();
            }
            res.status(201).json({
                success: true,
                data: OrdersController.sanitizeOrderData(order)
            });
        }
        catch (error) {
            OrdersController.handleError(res, error);
        }
    }
    async getAllOrders(req, res) {
        const burger = req.params.burger || null;
        try {
            const agora = new Date();
            const inicioDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
            const fimDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, 3, 0, 0, 0);
            const orders = await Orders_1.Order.find({
                burger: burger,
                createdAt: {
                    $gte: inicioDoDia,
                    $lt: fimDoDia
                }
            }).sort({ createdAt: -1 });
            res.status(200).json({
                success: true,
                data: orders.map(order => OrdersController.sanitizeOrderData(order))
            });
        }
        catch (error) {
            OrdersController.handleError(res, error);
        }
    }
    async getOrderById(req, res) {
        try {
            const id = OrdersController.validateId(req.params.id);
            if (id === null) {
                return OrdersController.handleNotFound(res, 'ID do pedido inválido');
            }
            const order = await Orders_1.Order.findOne({ id });
            if (!order) {
                return OrdersController.handleNotFound(res);
            }
            res.status(200).json({
                success: true,
                data: OrdersController.sanitizeOrderData(order)
            });
        }
        catch (error) {
            OrdersController.handleError(res, error);
        }
    }
    async getOrderByPhone(req, res) {
        try {
            const excessao = "Entregue";
            const phone = req.params.phone || null;
            const status = req.query.status || null;
            if (phone === null) {
                return OrdersController.handleNotFound(res, 'Telefone inválido');
            }
            if (status !== excessao) {
                const order = await Orders_1.Order.find({ phone });
                if (!order || order.length === 0) {
                    return OrdersController.handleNotFound(res);
                }
                res.status(200).json({
                    success: true,
                    data: order.filter(o => {
                        if (o.status !== "Entregue")
                            return OrdersController.sanitizeOrderData(o);
                    })
                });
            }
        }
        catch (error) {
            OrdersController.handleError(res, error);
        }
    }
    async updateOrder(req, res) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                return OrdersController.handleNotFound(res);
            }
            const order = await Orders_1.Order.findOneAndUpdate({ id }, req.body, { new: true });
            if (!order) {
                return OrdersController.handleNotFound(res);
            }
            if (order.onclient === "true") {
                await OrderClient_1.OrderClient.findOneAndUpdate({ id }, req.body);
            }
            res.status(200).json({
                success: true,
                data: OrdersController.sanitizeOrderData(order)
            });
        }
        catch (error) {
            OrdersController.handleError(res, error);
        }
    }
    async updateOrderStatus(req, res) {
        try {
            const id = Number(req.params.id);
            const nameDeliverer = req.params?.name || req.params?.username || 'Entregador desconhecido';
            if (isNaN(id)) {
                return OrdersController.handleNotFound(res);
            }
            const { newStatus, currentStatus } = req.body;
            const currentOrder = await Orders_1.Order.findOne({ id });
            if (!currentOrder) {
                return OrdersController.handleNotFound(res);
            }
            const updateData = {
                status: newStatus,
            };
            const cleanStatusHistory = OrdersController.sanitizeStatusHistory(currentOrder.statusHistory);
            if (cleanStatusHistory[currentStatus] && !cleanStatusHistory[currentStatus].end) {
                cleanStatusHistory[currentStatus].end = new Date();
            }
            cleanStatusHistory[newStatus] = {
                start: new Date(),
                end: newStatus === 'Entregue' ? new Date() : null
            };
            updateData.statusHistory = cleanStatusHistory;
            const order = await Orders_1.Order.findOneAndUpdate({ id }, { ...updateData, deliveredBy: newStatus === "Entregue" && currentStatus === 'A caminho' ? nameDeliverer : null }, { new: true });
            if (order?.onclient === "true") {
                await OrderClient_1.OrderClient.findOneAndUpdate({ id }, {
                    status: newStatus,
                    statusHistory: cleanStatusHistory,
                    deliveredBy: newStatus === "Entregue" && currentStatus === 'A caminho' ? nameDeliverer : null
                });
            }
            res.status(200).json({
                success: true,
                data: OrdersController.sanitizeOrderData(order)
            });
        }
        catch (error) {
            OrdersController.handleError(res, error);
        }
    }
    async updateOrderPayment(req, res) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                return OrdersController.handleNotFound(res);
            }
            const { payment } = req.body;
            const currentOrder = await Orders_1.Order.findOne({ id });
            if (!currentOrder) {
                return OrdersController.handleNotFound(res);
            }
            const cleanStatusHistory = OrdersController.sanitizeStatusHistory(currentOrder.statusHistory);
            if (payment) {
                cleanStatusHistory['Recebido'] = {
                    start: new Date(),
                    end: null
                };
            }
            const updateData = {
                payment,
                ...(payment && { receivedTime: new Date() }),
                statusHistory: cleanStatusHistory
            };
            const order = await Orders_1.Order.findOneAndUpdate({ id }, updateData, { new: true });
            if (order?.onclient === "true") {
                await OrderClient_1.OrderClient.findOneAndUpdate({ id }, updateData);
            }
            res.status(200).json({
                success: true,
                data: OrdersController.sanitizeOrderData(order)
            });
        }
        catch (error) {
            OrdersController.handleError(res, error);
        }
    }
    async getMyDeliveryOrders(req, res) {
        try {
            const burger = req.params.burger || null;
            const deliveredBy = req.params?.name || req.params?.username || null;
            if (req.params.id) {
                delete req.params.id;
            }
            if (!burger) {
                res.status(400).json({
                    success: false,
                    message: 'Burger é obrigatório'
                });
            }
            const todayStart = new Date();
            todayStart.setHours(18, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(3, 0, 0, 0);
            const orders = await Orders_1.Order.find({
                burger: burger,
                delivery: true,
                deliveredBy,
                createdAt: {
                    $gte: todayStart
                }
            });
            res.status(200).json({
                success: true,
                data: orders
            });
        }
        catch (error) {
            inspector_1.console.error('Erro em getDeliveryOrders:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar entregas'
            });
        }
    }
    async getDeliveryOrders(req, res) {
        try {
            const burger = req.params.burger || null;
            const status = req.params.status;
            if (req.params.id) {
                delete req.params.id;
            }
            if (!burger) {
                res.status(400).json({
                    success: false,
                    message: 'Burger é obrigatório'
                });
            }
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(3, 0, 0, 0);
            if (!status) {
                const orders = await Orders_1.Order.find({
                    burger: burger,
                    delivery: true,
                    status: status,
                    createdAt: {
                        $gte: todayStart
                    }
                });
                res.status(200).json({
                    success: true,
                    data: orders
                });
            }
            else {
                const orders = await Orders_1.Order.find({
                    burger: burger,
                    delivery: true,
                    createdAt: {
                        $gte: todayStart
                    }
                });
                res.status(200).json({
                    success: true,
                    data: orders
                });
            }
        }
        catch (error) {
            inspector_1.console.error('Erro em getDeliveryOrders:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar entregas'
            });
        }
    }
    async deleteOrder(req, res) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                return OrdersController.handleNotFound(res);
            }
            const order = await Orders_1.Order.findOneAndDelete({ id });
            if (!order) {
                return OrdersController.handleNotFound(res);
            }
            if (order.onclient === "true") {
                await OrderClient_1.OrderClient.findOneAndDelete({ id });
            }
            res.status(200).json({
                success: true,
                message: 'Pedido deletado com sucesso'
            });
        }
        catch (error) {
            OrdersController.handleError(res, error);
        }
    }
}
exports.default = new OrdersController();
//# sourceMappingURL=ordersController.js.map