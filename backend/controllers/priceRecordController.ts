// controllers/priceRecordController.ts

import { Request, Response } from "express";
import PriceRecord from "../models/PriceRecord";

const priceRecordController = {

    async getPriceRecords(req: Request, res: Response): Promise<void> {

        try {

            const {
                id,
                name,
                brand,
                barcode,
                storeId,
                source
            } = req.query;

            const filter: any = {};

            if (id) filter._id = id;

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

            const prices = await PriceRecord
                .find(filter)
                .populate("storeId", "organization name city state")
                .sort({
                    observedAt: -1
                });

            res.status(200).json(prices);

        } catch (error: any) {

            res.status(500).json({

                message: "Error listing price records.",

                error: error.message

            });

        }

    },

    async deletePriceRecord(req: Request, res: Response): Promise<void> {

        try {

            const deleted = await PriceRecord.findByIdAndDelete(

                req.params.id

            );

            if (!deleted) {

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