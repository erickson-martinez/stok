import { Request, Response } from 'express';
import Store, { IStore } from '../models/Store';

const storeController = {

    async getStores(req: Request, res: Response): Promise<void> {
        try {

            const {
                id,
                name,
                organization,
                city,
                state,
                type,
                status
            } = req.query;

            const filter: any = {};

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

            const stores: IStore[] = await Store.find(filter).sort({
                organization: 1,
                name: 1
            });

            res.status(200).json(stores);

        } catch (error: any) {

            res.status(500).json({
                message: 'Error listing stores.',
                error: error.message
            });

        }
    },

    async createStore(req: Request, res: Response): Promise<void> {

        try {

            const store = await Store.create(req.body);

            res.status(201).json(store);

        } catch (error: any) {

            res.status(400).json({
                message: 'Error creating store.',
                error: error.message
            });

        }

    },

    async updateStore(req: Request, res: Response): Promise<void> {

        try {

            const { id } = req.params;

            const store = await Store.findByIdAndUpdate(
                id,
                { $set: req.body },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!store) {

                return void res.status(404).json({
                    message: 'Store not found.'
                });

            }

            res.status(200).json(store);

        } catch (error: any) {

            res.status(400).json({
                message: 'Error updating store.',
                error: error.message
            });

        }

    },

    async deleteStore(req: Request, res: Response): Promise<void> {

        try {

            const { id } = req.params;

            const store = await Store.findByIdAndDelete(id);

            if (!store) {

                return void res.status(404).json({
                    message: 'Store not found.'
                });

            }

            res.status(200).json({
                message: 'Store deleted successfully.'
            });

        } catch (error: any) {

            res.status(500).json({
                message: 'Error deleting store.',
                error: error.message
            });

        }

    }

};

export default storeController;