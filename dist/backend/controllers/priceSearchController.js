"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PriceRecord_1 = __importDefault(require("../models/PriceRecord"));
const normalize = (value) => {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
};
const priceSearchController = {
    async search(req, res) {
        try {
            const { q, barcode, storeId, city, state, limit = 10 } = req.query;
            const filter = {};
            if (barcode) {
                filter.barcode = barcode;
            }
            if (storeId) {
                filter.storeId = storeId;
            }
            if (q) {
                const search = normalize(String(q));
                filter.nameSearch = new RegExp("^" + search, "i");
            }
            const priceRecords = await PriceRecord_1.default.find(filter)
                .populate({
                path: "storeId",
                model: "Store",
                select: "organization name city state"
            })
                .sort({
                observedAt: -1
            })
                .limit(Number(limit));
            const filtered = priceRecords.filter((record) => {
                if (!record.storeId) {
                    return true;
                }
                if (city &&
                    record.storeId.city?.toLowerCase() !==
                        String(city).toLowerCase()) {
                    return false;
                }
                if (state &&
                    record.storeId.state?.toLowerCase() !==
                        String(state).toLowerCase()) {
                    return false;
                }
                return true;
            });
            const result = filtered.map((record) => {
                const storeName = record.storeId
                    ? `${record.storeId.organization} - ${record.storeId.name}`
                    : "Loja desconhecida";
                return {
                    id: record._id,
                    name: record.name,
                    brand: record.brand,
                    label: `${record.name}${record.brand ? " - " + record.brand : ""}`,
                    price: record.price,
                    packageQuantity: record.packageQuantity,
                    unit: record.unit,
                    barcode: record.barcode,
                    category: record.category,
                    observedAt: record.observedAt,
                    subtitle: `${storeName} (${new Date(record.observedAt).toLocaleDateString("pt-BR")})`,
                    store: record.storeId
                        ? {
                            id: record.storeId._id,
                            organization: record.storeId.organization,
                            name: record.storeId.name,
                            displayName: storeName,
                            city: record.storeId.city,
                            state: record.storeId.state
                        }
                        : null
                };
            });
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({
                message: "Error searching price records.",
                error: error.message
            });
        }
    }
};
exports.default = priceSearchController;
//# sourceMappingURL=priceSearchController.js.map