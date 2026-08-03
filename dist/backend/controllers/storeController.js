"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Store_1 = __importDefault(require("../models/Store"));
const storeController = {
    async getStores(req, res) {
        try {
            const { id, name, organization, city, state, type, status } = req.query;
            const filter = {};
            if (name) {
                filter.name = { $regex: name, $options: 'i' };
            }
            if (city) {
                filter.city = { $regex: city, $options: 'i' };
            }
            if (state) {
                filter.state = { $regex: state, $options: 'i' };
            }
            if (type) {
                filter.type = type;
            }
            if (status) {
                filter.status = status;
            }
            if (id) {
                filter._id = id;
            }
            if (organization) {
                filter.organization = { $regex: organization, $options: 'i' };
            }
            const stores = await Store_1.default.find(filter).sort({
                organization: 1,
                name: 1
            });
            res.status(200).json(stores);
        }
        catch (error) {
            res.status(500).json({
                message: 'Error listing stores.',
                error: error.message
            });
        }
    },
    async createStore(req, res) {
        try {
            const store = await Store_1.default.create(req.body);
            res.status(201).json(store);
        }
        catch (error) {
            res.status(400).json({
                message: 'Error creating store.',
                error: error.message
            });
        }
    },
    async updateStore(req, res) {
        try {
            const { id } = req.params;
            const store = await Store_1.default.findByIdAndUpdate(id, { $set: req.body }, {
                new: true,
                runValidators: true
            });
            if (!store) {
                return void res.status(404).json({
                    message: 'Store not found.'
                });
            }
            res.status(200).json(store);
        }
        catch (error) {
            res.status(400).json({
                message: 'Error updating store.',
                error: error.message
            });
        }
    },
    async deleteStore(req, res) {
        try {
            const { id } = req.params;
            const store = await Store_1.default.findByIdAndDelete(id);
            if (!store) {
                return void res.status(404).json({
                    message: 'Store not found.'
                });
            }
            res.status(200).json({
                message: 'Store deleted successfully.'
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Error deleting store.',
                error: error.message
            });
        }
    }
};
exports.default = storeController;
//# sourceMappingURL=storeController.js.map