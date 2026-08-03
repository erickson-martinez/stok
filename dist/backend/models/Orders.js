"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = require("mongoose");
const orderItemSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    qty: { type: Number, required: true }
});
const orderAddressSchema = new mongoose_1.Schema({
    address: String,
    number: String,
    neighborhood: String
});
const statusHistorySchema = new mongoose_1.Schema({
    start: { type: Date, required: true },
    end: Date
}, { _id: false });
const orderSchema = new mongoose_1.Schema({
    id: { type: Number, required: true, unique: true },
    burger: { type: String, required: true },
    time: { type: Date, required: true },
    name: { type: String, required: true },
    deliveredBy: { type: String, default: null },
    phone: { type: String, required: true },
    onclient: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    delivery: { type: Boolean, required: true },
    pickupTime: String,
    address: orderAddressSchema,
    distancia: Number,
    items: [orderItemSchema],
    total: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    status: {
        type: String,
        required: true,
        enum: ['Aguardando', 'Em preparo', 'Pronto', 'Entregue', 'Cancelado', "A caminho", "Aberto", "Fechamento", "Retirada"],
        default: 'Aguardando'
    },
    payment: { type: Boolean, default: false },
    receivedTime: Date,
    statusHistory: { type: Map, of: statusHistorySchema }
}, { timestamps: true });
exports.Order = (0, mongoose_1.model)('Order', orderSchema);
//# sourceMappingURL=Orders.js.map