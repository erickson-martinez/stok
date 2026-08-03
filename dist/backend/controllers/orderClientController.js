"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OrderClient_1 = require("../models/OrderClient");
class OrderClientController {
    async getClientOrder(req, res) {
        try {
            const { id, phone } = req.query;
            if (!id || !phone) {
                res.status(400).json({
                    success: false,
                    message: 'ID e telefone são obrigatórios'
                });
                return;
            }
            const order = await OrderClient_1.OrderClient.findOne({
                id: parseInt(id),
                phone: phone
            });
            if (!order) {
                res.status(404).json({
                    success: false,
                    message: 'Pedido não encontrado'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: order
            });
            return;
        }
        catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro interno no servidor'
            });
            return;
        }
    }
    async getClientOrders(req, res) {
        try {
            const { phone } = req.query;
            if (!phone) {
                res.status(400).json({
                    success: false,
                    message: 'Telefone é obrigatório'
                });
                return;
            }
            const orders = await OrderClient_1.OrderClient.find({
                phone: phone
            }).sort({ createdAt: -1 });
            res.status(200).json({
                success: true,
                data: orders
            });
            return;
        }
        catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro interno no servidor'
            });
            return;
        }
    }
    async updateClientOrderStatus(req, res) {
        try {
            const { newStatus, statusHistory } = req.body;
            const order = await OrderClient_1.OrderClient.findOneAndUpdate({ id: req.params.id }, {
                status: newStatus,
                statusHistory
            }, { new: true });
            if (!order) {
                res.status(404).json({
                    success: false,
                    message: 'Pedido não encontrado'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: order
            });
            return;
        }
        catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro interno no servidor'
            });
            return;
        }
    }
    async updateClientOrderPayment(req, res) {
        try {
            const { payment } = req.body;
            const orderId = parseInt(req.params.id);
            const currentOrder = await OrderClient_1.OrderClient.findOne({ id: orderId });
            if (!currentOrder) {
                res.status(404).json({
                    success: false,
                    message: 'Pedido não encontrado'
                });
                return;
            }
            const cleanStatusHistory = JSON.parse(JSON.stringify(currentOrder.statusHistory));
            if (payment) {
                cleanStatusHistory['Recebido'] = {
                    start: new Date(),
                    end: null
                };
            }
            const order = await OrderClient_1.OrderClient.findOneAndUpdate({ id: orderId }, {
                payment,
                ...(payment && { receivedTime: new Date() }),
                statusHistory: cleanStatusHistory
            }, { new: true });
            res.status(200).json({
                success: true,
                data: order
            });
            return;
        }
        catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro interno no servidor'
            });
            return;
        }
    }
}
exports.default = new OrderClientController();
//# sourceMappingURL=orderClientController.js.map