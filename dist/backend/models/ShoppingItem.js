"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const shoppingItemSchema = new mongoose_1.Schema({
    shoppingListId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ShoppingList",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    brand: {
        type: String,
        trim: true,
        default: ""
    },
    barcode: {
        type: String,
        trim: true,
        default: ""
    },
    category: {
        type: String,
        trim: true,
        default: ""
    },
    unit: {
        type: String,
        enum: [
            "unidade",
            "pacote",
            "quilo",
            "grama",
            "caixa",
            "litro",
            "metro"
        ],
        default: "unidade"
    },
    packageQuantity: {
        type: Number,
        default: null,
        min: 0
    },
    quantity: {
        type: Number,
        required: false,
        default: 1,
        min: 1
    },
    price: {
        type: Number,
        default: null,
        min: 0
    },
    checked: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        trim: true,
        default: ""
    }
}, {
    timestamps: true
});
shoppingItemSchema.index({
    shoppingListId: 1,
    checked: 1
});
shoppingItemSchema.index({
    name: "text",
    brand: "text"
});
shoppingItemSchema.index({
    barcode: 1
});
exports.default = mongoose_1.default.model("ShoppingItem", shoppingItemSchema);
//# sourceMappingURL=ShoppingItem.js.map