"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const stockchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    brand: { type: String },
    unitType: { type: String, required: true },
    unitQuantity: { type: String, required: true },
    idealQuantity: { type: Number, required: true },
    idUser: { type: String, required: true },
    idUserShared: [{ type: String }],
});
exports.default = mongoose_1.default.model("Stock", stockchema);
//# sourceMappingURL=Stock.js.map