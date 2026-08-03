"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderClient = void 0;
const mongoose_1 = require("mongoose");
const Orders_1 = require("./Orders");
const orderClientSchema = new mongoose_1.Schema({
    ...Orders_1.Order.schema.obj,
    clientNotes: String
});
exports.OrderClient = (0, mongoose_1.model)('OrderClient', orderClientSchema);
//# sourceMappingURL=OrderClient.js.map