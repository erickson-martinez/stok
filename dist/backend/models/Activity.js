"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const activitySchema = new mongoose_1.Schema({
    time: { type: Date, required: true },
    description: { type: String, required: true }
});
const activityLogSchema = new mongoose_1.Schema({
    phone: { type: String, required: true, unique: true },
    phoneShared: { type: String },
    start: [Date],
    pause: [Date],
    return: [Date],
    final: [Date],
    activities: [activitySchema],
    createAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now }
});
exports.default = (0, mongoose_1.model)('ActivityLog', activityLogSchema);
//# sourceMappingURL=Activity.js.map