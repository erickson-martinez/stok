// controllers/priceSearchController.ts

import { Request, Response } from "express";
import PriceRecord from "../models/PriceRecord";

const priceSearchController = {

    async search(req: Request, res: Response): Promise<void> {

        try {

            const {
                q,
                barcode,
                storeId,
                city,
                state,
                limit = 10
            } = req.query;

            const filter: any = {};

            /**
             * Busca por código de barras
             */
            if (barcode) {

                filter.barcode = barcode;

            }

            /**
             * Busca por loja
             */
            if (storeId) {

                filter.storeId = storeId;

            }

            /**
             * Busca por nome
             */
            if (q) {

                const search = String(q)

                    .normalize("NFD")

                    .replace(/[\u0300-\u036f]/g, "")

                    .toLowerCase()

                    .trim();

                // Procura apenas produtos cujo nome começa com o texto
                filter.nameSearch = {

                    $regex: "^" + search,

                    $options: "i"

                };

            }

            const priceRecords = await PriceRecord.find(filter)

                .populate({

                    path: "storeId",

                    model: "Store",

                    select: "organization name city state"

                })

                .sort({

                    observedAt: -1

                })

                .limit(Number(limit));

            /**
             * Filtro por cidade/estado
             */
            const filtered = priceRecords.filter((record: any) => {

                if (!record.storeId) {

                    return true;

                }

                if (

                    city &&

                    record.storeId.city?.toLowerCase() !==

                    String(city).toLowerCase()

                ) {

                    return false;

                }

                if (

                    state &&

                    record.storeId.state?.toLowerCase() !==

                    String(state).toLowerCase()

                ) {

                    return false;

                }

                return true;

            });

            /**
             * DTO enviado ao Front
             */
            const result = filtered.map((record: any) => ({

                id: record._id,

                name: record.name,

                brand: record.brand,

                barcode: record.barcode,

                category: record.category,

                packageQuantity: record.packageQuantity,

                unit: record.unit,

                price: record.price,

                observedAt: record.observedAt,

                confidence: record.confidence,

                store: record.storeId
                    ? {

                        id: record.storeId._id,

                        organization: record.storeId.organization,

                        name: record.storeId.name,

                        city: record.storeId.city,

                        state: record.storeId.state

                    }
                    : null

            }));

            res.status(200).json(result);

        } catch (error: any) {

            res.status(500).json({

                message: "Error searching price records.",

                error: error.message

            });

        }

    }

};

export default priceSearchController;