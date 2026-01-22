"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const workRecordSchema = new mongoose_1.Schema({
    employeePhone: { type: String, required: true, index: true },
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    entryTime: { type: Date, required: true },
    exitTime: { type: Date },
    durationMinutes: { type: Number, min: 0 },
    notes: { type: String, trim: true },
    status: {
        type: String,
        enum: ['pendente', 'aprovado', 'rejeitado', 'cancelado'],
        default: 'pendente',
    },
    approvedBy: { type: String },
    rejectionReason: { type: String },
}, { timestamps: true });
workRecordSchema.index({ employeePhone: 1, entryTime: -1 });
workRecordSchema.index({ companyId: 1, status: 1 });
exports.default = (0, mongoose_1.model)('WorkRecord', workRecordSchema);
//# sourceMappingURL=WorkRecord.js.map