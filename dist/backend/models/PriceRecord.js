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
const priceRecordSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    nameSearch: {
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
    packageQuantity: {
        type: Number,
        default: null
    },
    unit: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    storeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Store",
        default: null,
        index: true
    },
    createdBy: {
        type: String,
        required: true,
        index: true
    },
    observedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    source: {
        type: String,
        enum: [
            "user",
            "store_api",
            "government",
            "ocr",
            "import"
        ],
        default: "user"
    },
    confidence: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});
priceRecordSchema.index({
    nameSearch: 1
});
priceRecordSchema.index({
    barcode: 1
});
priceRecordSchema.index({
    storeId: 1
});
priceRecordSchema.index({
    observedAt: -1
});
priceRecordSchema.index({
    nameSearch: 1,
    brand: 1,
    barcode: 1,
    packageQuantity: 1,
    unit: 1,
    storeId: 1
});
priceRecordSchema.pre("validate", function (next) {
    this.nameSearch = this.name
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    next();
});
exports.default = mongoose_1.default.model("PriceRecord", priceRecordSchema);
//# sourceMappingURL=PriceRecord.js.map