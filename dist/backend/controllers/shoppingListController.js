"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShoppingList_1 = __importDefault(require("../models/ShoppingList"));
const Market_1 = __importDefault(require("../models/Market"));
const ProductPrice_1 = __importDefault(require("../models/ProductPrice"));
const mongoose_1 = __importDefault(require("mongoose"));
const shoppingController = {
    // Listar listas de compras por usuário (proprietário)
    async getShoppingLists(req, res) {
        try {
            const { idUser } = req.params;
            const lists = await ShoppingList_1.default.find({ idUser });
            res.status(200).json(lists);
        }
        catch (error) {
            const err = error;
            res.status(500).json({ message: 'Erro ao listar listas de compras', error: err.message });
        }
    },
    // Listar listas compartilhadas com o usuário
    async getSharedShoppingLists(req, res) {
        try {
            const { idUser } = req.params;
            if (!idUser) {
                res.status(400).json({ message: 'Telefone é obrigatório' });
                return;
            }
            const lists = await ShoppingList_1.default.find({ idUserShared: idUser });
            if (!lists || lists.length === 0) {
                res.status(200).json([]);
                return;
            }
            res.status(200).json(lists);
        }
        catch (error) {
            const err = error;
            res.status(500).json({ message: 'Erro ao listar listas compartilhadas', error: err.message });
        }
    },
    // Criar nova lista de compras
    async createShoppingList(req, res) {
        try {
            const { marketId, idUser } = req.body;
            let name;
            if (marketId) {
                const market = await Market_1.default.findById(marketId);
                if (!market) {
                    res.status(404).json({ message: 'Mercado não encontrado' });
                    return;
                }
                name = market.name;
            }
            else {
                name = new Date().toLocaleDateString('pt-BR');
            }
            const shoppingList = new ShoppingList_1.default({
                name,
                marketId: marketId ? new mongoose_1.default.Types.ObjectId(marketId) : null,
                idUser,
                products: [],
                completed: false
            });
            await shoppingList.save();
            res.status(201).json(shoppingList);
        }
        catch (error) {
            const err = error;
            res.status(400).json({ message: 'Erro ao criar lista de compras', error: err.message });
        }
    },
    // Compartilhar uma lista específica
    async shareShoppingList(req, res) {
        try {
            const { listId } = req.params;
            const { owneridUser, sharedWithidUser } = req.body;
            if (!owneridUser || !sharedWithidUser) {
                res.status(400).json({ message: 'Telefones do proprietário e destinatário são obrigatórios' });
                return;
            }
            const shoppingList = await ShoppingList_1.default.findOne({ _id: listId, idUser: owneridUser });
            if (!shoppingList) {
                res.status(404).json({ message: 'Lista não encontrada ou não pertence ao usuário' });
                return;
            }
            shoppingList.idUserShared = sharedWithidUser;
            shoppingList.updatedAt = new Date();
            await shoppingList.save();
            res.status(200).json({ message: 'Lista compartilhada com sucesso', data: shoppingList });
        }
        catch (error) {
            const err = error;
            res.status(500).json({ message: 'Erro ao compartilhar lista', error: err.message });
        }
    },
    async saveProduct(req, res) {
        try {
            const { listId } = req.params;
            const { idUser, product } = req.body;
            if (!product?.name) {
                res.status(400).json({ message: 'Nome do produto é obrigatório' });
                return;
            }
            // Busca a lista verificando se o usuário é o proprietário OU está na lista de compartilhados
            const shoppingList = await ShoppingList_1.default.findOne({
                _id: listId,
                $or: [
                    { idUser: idUser }, // Usuário é o proprietário
                    { idUserShared: idUser } // Usuário é um compartilhado
                ]
            });
            if (!shoppingList) {
                res.status(404).json({ message: 'Lista não encontrada ou acesso negado' });
                return;
            }
            if (shoppingList.completed) {
                res.status(400).json({ message: 'Lista concluída, não pode ser editada' });
                return;
            }
            if (product._id) {
                const productIndex = shoppingList.products.findIndex(p => p._id?.toString() === product._id?.toString());
                if (productIndex === -1) {
                    res.status(404).json({ message: 'Produto não encontrado na lista' });
                    return;
                }
                shoppingList.products[productIndex] = product;
            }
            else {
                const newProduct = { ...product, _id: new mongoose_1.default.Types.ObjectId().toString() };
                shoppingList.products.push(newProduct);
            }
            const updatedList = await shoppingList.save();
            if (shoppingList.marketId && product.name && product.value) {
                await ProductPrice_1.default.findOneAndUpdate({ productName: product.name, marketId: shoppingList.marketId }, { currentPrice: product.value, brand: product.brand, type: product.type, lastUpdated: new Date(), updatedBy: idUser }, { upsert: true, new: true });
            }
            res.status(200).json(updatedList);
        }
        catch (error) {
            const err = error;
            res.status(400).json({ message: 'Erro ao salvar produto', error: err.message });
        }
    },
    // Deletar produto de uma lista
    async deleteProduct(req, res) {
        try {
            const { listId } = req.params;
            const { idUser, productId } = req.body;
            if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
                res.status(400).json({ message: 'ID do produto inválido' });
                return;
            }
            const shoppingList = await ShoppingList_1.default.findOne({ _id: listId, idUser });
            if (!shoppingList) {
                res.status(404).json({ message: 'Lista não encontrada' });
                return;
            }
            if (shoppingList.completed) {
                res.status(400).json({ message: 'Lista concluída, não pode ser editada' });
                return;
            }
            const productIndex = shoppingList.products.findIndex(p => p._id?.toString() === productId);
            if (productIndex === -1) {
                res.status(404).json({ message: 'Produto não encontrado na lista' });
                return;
            }
            shoppingList.products.splice(productIndex, 1);
            const updatedList = await shoppingList.save();
            res.status(200).json({ message: 'Produto deletado com sucesso', updatedList });
        }
        catch (error) {
            const err = error;
            res.status(500).json({ message: 'Erro ao deletar produto', error: err.message });
        }
    },
    // Atualizar uma lista
    async updateList(req, res) {
        const { listId } = req.params;
        const { idUser, marketId, name } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(listId)) {
            res.status(400).json({ message: 'ID da lista inválido' });
            return;
        }
        try {
            const shoppingList = await ShoppingList_1.default.findOne({ _id: listId, idUser });
            if (!shoppingList) {
                res.status(404).json({ message: 'Lista não encontrada ou não pertence ao usuário' });
                return;
            }
            if (shoppingList.completed) {
                res.status(403).json({ message: 'Lista concluída não pode ser editada' });
                return;
            }
            if (marketId) {
                if (!mongoose_1.default.Types.ObjectId.isValid(marketId)) {
                    res.status(400).json({ message: 'ID do mercado inválido' });
                    return;
                }
                const market = await Market_1.default.findById(marketId);
                if (!market || market.status !== 'active') {
                    res.status(404).json({ message: 'Mercado não encontrado ou inativo' });
                    return;
                }
                shoppingList.marketId = new mongoose_1.default.Types.ObjectId(marketId);
                shoppingList.name = name || market.name;
            }
            else {
                shoppingList.marketId = null;
                shoppingList.name = name || `Lista ${new Date().toLocaleDateString('pt-BR')}`;
            }
            const updatedList = await shoppingList.save();
            res.status(200).json({ message: 'Lista atualizada com sucesso', data: updatedList });
        }
        catch (error) {
            const err = error;
            res.status(500).json({ message: 'Erro interno ao atualizar lista', error: err.message });
        }
    },
    // Concluir uma lista
    async completeList(req, res) {
        try {
            const { listId } = req.params;
            const { idUser, completed } = req.body;
            const shoppingList = await ShoppingList_1.default.findOne({ _id: listId, idUser });
            if (!shoppingList) {
                res.status(404).json({ message: 'Lista não encontrada' });
                return;
            }
            shoppingList.completed = completed;
            const updatedList = await shoppingList.save();
            res.status(200).json(updatedList);
        }
        catch (error) {
            const err = error;
            res.status(400).json({ message: 'Erro ao concluir lista', error: err.message });
        }
    },
    // Deletar uma lista
    async deleteList(req, res) {
        try {
            const { listId } = req.params;
            const { idUser } = req.body;
            const shoppingList = await ShoppingList_1.default.findOneAndDelete({ _id: listId, idUser });
            if (!shoppingList) {
                res.status(404).json({ message: 'Lista não encontrada' });
                return;
            }
            res.status(200).json({ message: 'Lista deletada com sucesso' });
        }
        catch (error) {
            const err = error;
            res.status(500).json({ message: 'Erro ao deletar lista', error: err.message });
        }
    }
};
exports.default = shoppingController;
//# sourceMappingURL=shoppingListController.js.map