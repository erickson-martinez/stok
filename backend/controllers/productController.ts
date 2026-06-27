// controllers/productController.ts

import { Request, Response } from "express";
import Product, { IProduct } from "../models/Product";

const productController = {

    async getProducts(req: Request, res: Response): Promise<void> {

        try {

            const {
                id,
                name,
                brand,
                category,
                barcode,
                status
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

            if (category) {
                filter.category = {
                    $regex: category,
                    $options: "i"
                };
            }

            if (barcode) {
                filter.barcode = barcode;
            }

            if (status) {
                filter.status = status;
            }

            const products: IProduct[] = await Product.find(filter).sort({
                name: 1
            });

            res.status(200).json(products);

        } catch (error: any) {

            res.status(500).json({
                message: "Error listing products.",
                error: error.message
            });

        }

    },

    async createProduct(req: Request, res: Response): Promise<void> {

        try {

            const {
                name,
                brand,
                category,
                barcode,
                packageQuantity,
                unit,
                status
            } = req.body;

            const exists = await Product.findOne({
                name: {
                    $regex: `^${name}$`,
                    $options: "i"
                },
                brand: {
                    $regex: `^${brand}$`,
                    $options: "i"
                }
            });

            if (exists) {

                return void res.status(409).json({
                    message: "Product already exists."
                });

            }

            const product = await Product.create({
                name,
                brand,
                category,
                barcode,
                packageQuantity,
                unit,
                status
            });

            res.status(201).json(product);

        } catch (error: any) {

            res.status(400).json({
                message: "Error creating product.",
                error: error.message
            });

        }

    },

    async updateProduct(req: Request, res: Response): Promise<void> {

        try {

            const { id } = req.params;

            const product = await Product.findByIdAndUpdate(

                id,

                {
                    $set: req.body
                },

                {
                    new: true,
                    runValidators: true
                }

            );

            if (!product) {

                return void res.status(404).json({
                    message: "Product not found."
                });

            }

            res.status(200).json(product);

        } catch (error: any) {

            res.status(400).json({
                message: "Error updating product.",
                error: error.message
            });

        }

    },

    async deleteProduct(req: Request, res: Response): Promise<void> {

        try {

            const { id } = req.params;

            const product = await Product.findByIdAndDelete(id);

            if (!product) {

                return void res.status(404).json({
                    message: "Product not found."
                });

            }

            res.status(200).json({
                message: "Product deleted successfully."
            });

        } catch (error: any) {

            res.status(500).json({
                message: "Error deleting product.",
                error: error.message
            });

        }

    }

};

export default productController;