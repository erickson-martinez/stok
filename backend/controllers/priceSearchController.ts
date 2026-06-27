//ontrollers/priceSearchController.ts

import { Request, Response } from "express";
import PriceRecord from "../models/PriceRecord";

const priceSearchController = {

    async search(req: Request, res: Response): Promise<void> {

        try {

            const {
                id,
                name,
                brand,
                barcode,
                storeId,
                city,
                state,
                source,
                limit = 20
            } = req.query;

            const filter: any = {};

            if (id) {
                filter._id = id;
            }

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

            const prices = await PriceRecord.find(filter)

                .populate({
                    path: "storeId",
                    select: "organization name city state"
                })

                .sort({
                    observedAt: -1
                })

                .limit(Number(limit));

            let result = prices;

            if (city || state) {

                result = prices.filter((item: any) => {

                    if (!item.storeId) return false;

                    if (
                        city &&
                        item.storeId.city
                            ?.toLowerCase() !==
                        String(city).toLowerCase()
                    ) {
                        return false;
                    }

                    if (
                        state &&
                        item.storeId.state
                            ?.toLowerCase() !==
                        String(state).toLowerCase()
                    ) {
                        return false;
                    }

                    return true;

                });

            }

            res.status(200).json(result);

        } catch (error: any) {

            res.status(500).json({

                message: "Error searching prices.",

                error: error.message

            });

        }

    }

};

export default priceSearchController;