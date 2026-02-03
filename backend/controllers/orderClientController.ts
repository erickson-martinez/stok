import { Request, Response } from 'express';
import { OrderClient } from '../models/OrderClient';

class OrderClientController {
    // Obter pedido do cliente por ID e telefone
    public async getClientOrder(req: Request, res: Response): Promise<void> {
        try {
            const { id, phone } = req.query;

            if (!id || !phone) {
                res.status(400).json({
                    success: false,
                    message: 'ID e telefone são obrigatórios'
                });
                return;   // ← adicionado
            }

            const order = await OrderClient.findOne({
                id: parseInt(id as string),
                phone: phone as string
            });

            if (!order) {
                res.status(404).json({
                    success: false,
                    message: 'Pedido não encontrado'
                });
                return;   // ← adicionado
            }

            res.status(200).json({
                success: true,
                data: order
            });
            return;       // ← opcional, mas deixa explícito
        } catch (error: any) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro interno no servidor'
            });
            return;
        }
    }

    // Obter todos os pedidos de um cliente
    public async getClientOrders(req: Request, res: Response): Promise<void> {
        try {
            const { phone } = req.query;

            if (!phone) {
                res.status(400).json({
                    success: false,
                    message: 'Telefone é obrigatório'
                });
                return;
            }

            const orders = await OrderClient.find({
                phone: phone as string
            }).sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                data: orders
            });
            return;
        } catch (error: any) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro interno no servidor'
            });
            return;
        }
    }

    // Atualizar status do pedido do cliente
    public async updateClientOrderStatus(req: Request, res: Response): Promise<void> {
        try {
            const { newStatus, statusHistory } = req.body;

            const order = await OrderClient.findOneAndUpdate(
                { id: req.params.id },
                {
                    status: newStatus,
                    statusHistory
                },
                { new: true }
            );

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
        } catch (error: any) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro interno no servidor'
            });
            return;
        }
    }

    // Atualizar pagamento do pedido do cliente
    public async updateClientOrderPayment(req: Request, res: Response): Promise<void> {
        try {
            const { payment } = req.body;
            const orderId = parseInt(req.params.id);

            const currentOrder = await OrderClient.findOne({ id: orderId });
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

            const order = await OrderClient.findOneAndUpdate(
                { id: orderId },
                {
                    payment,
                    ...(payment && { receivedTime: new Date() }),
                    statusHistory: cleanStatusHistory
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                data: order
            });
            return;
        } catch (error: any) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Erro interno no servidor'
            });
            return;
        }
    }

}

export default new OrderClientController();