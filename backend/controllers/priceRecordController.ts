// controllers/priceRecordController.ts

import { Request, Response } from "express";
import PriceRecord, { IPriceRecord } from "../models/PriceRecord";

const priceRecordController = {

    async getPriceRecords(req: Request, res: Response): Promise<void> {

        try {

            const {
                id,
                productId,
                storeId,
                createdBy
            } = req.query;

            const filter: any = {};

            if (id) filter._id = id;
            if (productId) filter.productId = productId;
            if (storeId) filter.storeId = storeId;
            if (createdBy) filter.createdBy = createdBy;

            const records = await PriceRecord
                .find(filter)
                .populate("productId")
                .populate("storeId")
                .sort({
                    observedAt: -1
                });

            res.status(200).json(records);

        } catch (error: any) {

            res.status(500).json({
                message: "Error listing price records.",
                error: error.message
            });

        }

    },

    async createPriceRecord(req: Request, res: Response): Promise<void> {

        try {

            const record = await PriceRecord.create(req.body);

            res.status(201).json(record);

        } catch (error: any) {

            res.status(400).json({
                message: "Error creating price record.",
                error: error.message
            });

        }

    },

    async updatePriceRecord(req: Request, res: Response): Promise<void> {

        try {

            const { id } = req.params;

            const record = await PriceRecord.findByIdAndUpdate(
                id,
                {
                    $set: req.body
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!record) {

                return void res.status(404).json({
                    message: "Price record not found."
                });

            }

            res.status(200).json(record);

        } catch (error: any) {

            res.status(400).json({
                message: "Error updating price record.",
                error: error.message
            });

        }

    },

    async deletePriceRecord(req: Request, res: Response): Promise<void> {

        try {

            const { id } = req.params;

            const record = await PriceRecord.findByIdAndDelete(id);

            if (!record) {

                return void res.status(404).json({
                    message: "Price record not found."
                });

            }

            res.status(200).json({
                message: "Price record deleted successfully."
            });

        } catch (error: any) {

            res.status(500).json({
                message: "Error deleting price record.",
                error: error.message
            });

        }

    }

};

export default priceRecordController;