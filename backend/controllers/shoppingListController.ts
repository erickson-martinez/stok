import { Request, Response } from 'express';
import ShoppingList, { IShoppingList, IProduct } from '../models/ShoppingList';
import Market from '../models/Market';
import ProductPrice from '../models/ProductPrice';
import mongoose from 'mongoose';

interface ISaveProductRequest {
    phone: string;
    product: IProduct;
}

interface IDeleteProductRequest {
    phone: string;
    productId: string;
}

interface IUpdateListRequest {
    phone: string;
    marketId?: string;
    name?: string;
}

interface ICompleteListRequest {
    phone: string;
    completed: boolean;
}

const shoppingController = {
    // Listar listas de compras por usuário
    async getShoppingLists(req: Request<{ phone: string }>, res: Response): Promise<void> {
        try {
            const { phone } = req.params;
            const lists: IShoppingList[] = await ShoppingList.find({ phone });
            res.status(200).json(lists);
        } catch (error: unknown) {
            const err = error as Error;
            res.status(500).json({
                message: 'Erro ao listar listas de compras',
                error: err.message
            });
        }
    },

    // Criar nova lista de compras
    async createShoppingList(req: Request<{}, {}, { marketId?: string; phone: string }>, res: Response): Promise<void> {
        try {
            const { marketId, phone } = req.body;
            let name: string;

            if (marketId) {
                const market = await Market.findById(marketId);
                if (!market) {
                    res.status(404).json({ message: 'Mercado não encontrado' });
                    return;
                }
                name = market.name;
            } else {
                name = new Date().toLocaleDateString('pt-BR');
            }

            const shoppingList: IShoppingList = new ShoppingList({
                name,
                marketId: marketId ? new mongoose.Types.ObjectId(marketId) : null,
                phone,
                products: [],
                completed: false
            });

            await shoppingList.save();
            res.status(201).json(shoppingList);
        } catch (error: unknown) {
            const err = error as Error;
            res.status(400).json({
                message: 'Erro ao criar lista de compras',
                error: err.message
            });
        }
    },

    // Adicionar ou atualizar produto em uma lista
    async saveProduct(
        req: Request<{ listId: string }, {}, ISaveProductRequest>,
        res: Response
    ): Promise<void> {
        try {
            const { listId } = req.params;
            const { phone, product } = req.body;

            if (!product?.name) {
                res.status(400).json({ message: 'Nome do produto é obrigatório' });
                return;
            }

            const shoppingList = await ShoppingList.findOne({ _id: listId, phone });
            if (!shoppingList) {
                res.status(404).json({ message: 'Lista não encontrada' });
                return;
            }

            if (shoppingList.completed) {
                res.status(400).json({ message: 'Lista concluída, não pode ser editada' });
                return;
            }

            if (product._id) {
                // Atualizar produto existente
                const productIndex = shoppingList.products.findIndex(p =>
                    p._id?.toString() === (product._id?.toString() ?? '')
                );
                if (productIndex === -1) {
                    res.status(404).json({ message: 'Produto não encontrado na lista' });
                    return;
                }
                shoppingList.products[productIndex] = product;
            } else {
                // Adicionar novo produto
                const newProduct: IProduct = {
                    ...product,
                    _id: new mongoose.Types.ObjectId().toString()
                };
                shoppingList.products.push(newProduct);
            }

            const updatedList = await shoppingList.save();

            // Sincronizar com ProductPrice
            if (shoppingList.marketId && product.name && product.value) {
                await ProductPrice.findOneAndUpdate(
                    {
                        productName: product.name.toLowerCase(),
                        marketId: shoppingList.marketId
                    },
                    {
                        currentPrice: product.value,
                        type: product.type,
                        lastUpdated: new Date(),
                        updatedBy: phone
                    },
                    { upsert: true, new: true }
                );
            }

            res.status(200).json(updatedList);
        } catch (error: unknown) {
            const err = error as Error;
            res.status(400).json({
                message: 'Erro ao salvar produto',
                error: err.message
            });
        }
    },

    // Deletar produto de uma lista
    async deleteProduct(
        req: Request<{ listId: string }, {}, IDeleteProductRequest>,
        res: Response
    ): Promise<void> {
        try {
            const { listId } = req.params;
            const { phone, productId } = req.body;

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                res.status(400).json({ message: 'ID do produto inválido' });
                return;
            }

            const shoppingList = await ShoppingList.findOne({ _id: listId, phone });
            if (!shoppingList) {
                res.status(404).json({ message: 'Lista não encontrada' });
                return;
            }

            if (shoppingList.completed) {
                res.status(400).json({ message: 'Lista concluída, não pode ser editada' });
                return;
            }

            const productIndex = shoppingList.products.findIndex(p =>
                (p._id?.toString() ?? '') === productId
            );
            if (productIndex === -1) {
                res.status(404).json({ message: 'Produto não encontrado na lista' });
                return;
            }

            shoppingList.products.splice(productIndex, 1);
            const updatedList = await shoppingList.save();

            res.status(200).json({
                message: 'Produto deletado com sucesso',
                updatedList
            });
        } catch (error: unknown) {
            const err = error as Error;
            res.status(500).json({
                message: 'Erro ao deletar produto',
                error: err.message
            });
        }
    },

    async updateList(req: Request<{ listId: string }, {}, IUpdateListRequest>, res: Response): Promise<void> {
        const { listId } = req.params;
        const { phone, marketId, name } = req.body;

        // Validação básica dos parâmetros
        if (!mongoose.Types.ObjectId.isValid(listId)) {
            res.status(400).json({ message: 'ID da lista inválido' });
            return;
        }

        try {
            // Verifica se a lista existe e pertence ao usuário
            const shoppingList = await ShoppingList.findOne({ _id: listId, phone });
            if (!shoppingList) {
                res.status(404).json({ message: 'Lista não encontrada ou não pertence ao usuário' });
                return;
            }

            // Verifica se a lista está concluída
            if (shoppingList.completed) {
                res.status(403).json({ message: 'Lista concluída não pode ser editada' });
                return;
            }

            // Atualiza o mercado se marketId foi fornecido
            if (marketId) {
                if (!mongoose.Types.ObjectId.isValid(marketId)) {
                    res.status(400).json({ message: 'ID do mercado inválido' });
                    return;
                }

                const market = await Market.findById(marketId);
                if (!market || market.status !== 'active') {
                    res.status(404).json({ message: 'Mercado não encontrado ou inativo' });
                    return;
                }

                shoppingList.marketId = new mongoose.Types.ObjectId(marketId);
                shoppingList.name = name || market.name;
            } else {
                // Remove a associação com mercado se não foi fornecido
                shoppingList.marketId = null;
                shoppingList.name = name || `Lista ${new Date().toLocaleDateString('pt-BR')}`;
            }

            // Salva as alterações
            const updatedList = await shoppingList.save();

            res.status(200).json({
                message: 'Lista atualizada com sucesso',
                data: updatedList
            });

        } catch (error: unknown) {
            console.error('Erro ao atualizar lista:', error);

            if (error instanceof mongoose.Error.ValidationError) {
                res.status(400).json({
                    message: 'Erro de validação',
                    error: error.message
                });
            } else {
                res.status(500).json({
                    message: 'Erro interno ao atualizar lista',
                    error: error instanceof Error ? error.message : 'Erro desconhecido'
                });
            }
        }
    },

    // Concluir uma lista
    async completeList(req: Request<{ listId: string }, {}, ICompleteListRequest>, res: Response): Promise<void> {
        try {
            const { listId } = req.params;
            const { phone, completed } = req.body;

            const shoppingList = await ShoppingList.findOne({ _id: listId, phone });
            if (!shoppingList) {
                res.status(404).json({ message: 'Lista não encontrada' });
                return;
            }

            shoppingList.completed = completed;
            const updatedList = await shoppingList.save();
            res.status(200).json(updatedList);
        } catch (error: unknown) {
            const err = error as Error;
            res.status(400).json({
                message: 'Erro ao concluir lista',
                error: err.message
            });
        }
    },

    // Deletar uma lista
    async deleteList(req: Request<{ listId: string }, {}, { phone: string }>, res: Response): Promise<void> {
        try {
            const { listId } = req.params;
            const { phone } = req.body;

            const shoppingList = await ShoppingList.findOneAndDelete({ _id: listId, phone });
            if (!shoppingList) {
                res.status(404).json({ message: 'Lista não encontrada' });
                return;
            }

            res.status(200).json({ message: 'Lista deletada com sucesso' });
        } catch (error: unknown) {
            const err = error as Error;
            res.status(500).json({
                message: 'Erro ao deletar lista',
                error: err.message
            });
        }
    }
}

export default shoppingController;