"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PriceRecord_1 = __importDefault(require("../models/PriceRecord"));
const priceRecordController = {
    async getPriceRecords(req, res) {
        try {
            const { id, name, brand, barcode, storeId, source } = req.query;
            const filter = {};
            if (id)
                filter._id = id;
            if (name) {
                filter.name = {
                    $regex: name,
                    $options: "i"
                };
            }
            if (brand) {
                filter.brand = {
                    $regex: brand,
                    $options: "i"
                };
            }
            if (barcode) {
                filter.barcode = barcode;
            }
            if (storeId) {
                filter.storeId = storeId;
            }
            if (source) {
                filter.source = source;
            }
            const prices = await PriceRecord_1.default
                .find(filter)
                .populate("storeId", "organization name city state")
                .sort({
                observedAt: -1
            });
            res.status(200).json(prices);
        }
        catch (error) {
            res.status(500).json({
                message: "Error listing price records.",
                error: error.message
            });
        }
    },
    async deletePriceRecord(req, res) {
        try {
            const deleted = await PriceRecord_1.default.findByIdAndDelete(req.params.id);
            if (!deleted) {
                return void res.status(404).json({
                    message: "Price record not found."
                });
            }
            res.status(200).json({
                message: "Price record deleted successfully."
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Error deleting price record.",
                error: error.message
            });
        }
    }
};
exports.default = priceRecordController;
//# sourceMappingURL=priceRecordController.js.map