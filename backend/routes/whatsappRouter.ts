// routes/whatsappRouter.ts
import { Router } from 'express';
import { Whatsapp } from '../whatsapp/whatsappClient';

const router = Router();

router.get('/webhook', (req, res) => {
    const response = Whatsapp.get(req.query as any);
    if (response) return res.status(200).send(response);
    res.sendStatus(403);
});

router.post('/webhook', async (req, res) => {
    try {
        await Whatsapp.post(req.body, req.body, (req.headers['x-hub-signature-256'] as string) || '');
        res.sendStatus(200);
    } catch (err) {
        console.error('[WhatsApp Webhook] Erro:', err);
        res.sendStatus(200);
    }
});

export default router;