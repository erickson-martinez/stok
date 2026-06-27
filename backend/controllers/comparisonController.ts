// controllers/comparisonController.ts

import { Request, Response } from "express";

const comparisonController = {

    async compareShoppingList(_req: Request, res: Response): Promise<void> {

        res.status(501).json({
            message: "Not implemented yet."
        });

    },

    async compareProduct(_req: Request, res: Response): Promise<void> {

        res.status(501).json({
            message: "Not implemented yet."
        });

    },

    async getBestStore(_req: Request, res: Response): Promise<void> {

        res.status(501).json({
            message: "Not implemented yet."
        });

    }

};

export default comparisonController;