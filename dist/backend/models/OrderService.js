"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const orderServiceSchema = new mongoose_1.Schema({
    openerPhone: { type: String, required: true, index: true },
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
        type: String,
        enum: ['aberto', 'em_andamento', 'pausado', 'resolvido', 'cancelado'],
        default: 'aberto',
        index: true,
    },
    resolverPhone: { type: String },
    resolution: { type: String, trim: true, maxlength: 2000 },
    resolvedAt: { type: Date },
    assignedTo: { type: String },
    priority: { type: String, enum: ['baixa', 'média', 'alta', 'urgente'], default: 'média' },
    category: { type: String, trim: true },
}, { timestamps: true });
orderServiceSchema.index({ companyId: 1, status: 1 });
orderServiceSchema.index({ openerPhone: 1, createdAt: -1 });
exports.default = (0, mongoose_1.model)('OrderService', orderServiceSchema);
//# sourceMappingURL=OrderService.js.map