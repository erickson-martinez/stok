"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductBurgerModel = void 0;
const mongoose_1 = require("mongoose");
const ProductBurgerSchema = new mongoose_1.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Ativo', 'Inativo'],
        required: true
    }
});
exports.ProductBurgerModel = (0, mongoose_1.model)('ProductBurger', ProductBurgerSchema);
//# sourceMappingURL=ProductBurger.js.map