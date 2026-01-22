"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/whatsappRouter.ts
const express_1 = require("express");
const whatsappClient_1 = require("../whatsapp/whatsappClient");
const router = (0, express_1.Router)();
router.get('/webhook', (req, res) => {
    const response = whatsappClient_1.Whatsapp.get(req.query);
    if (response)
        return res.status(200).send(response);
    res.sendStatus(403);
});
router.post('/webhook', async (req, res) => {
    try {
        await whatsappClient_1.Whatsapp.post(req.body, req.body, req.headers['x-hub-signature-256'] || '');
        res.sendStatus(200);
    }
    catch (err) {
        console.error('[WhatsApp Webhook] Erro:', err);
        res.sendStatus(200);
    }
});
exports.default = router;
//# sourceMappingURL=whatsappRouter.js.map