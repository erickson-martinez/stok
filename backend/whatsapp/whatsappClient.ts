// whatsapp/whatsappClient.ts
import { WhatsAppAPI } from 'whatsapp-api-js';
import { Text } from 'whatsapp-api-js/messages';  // ← importe daqui!
import dotenv from 'dotenv';
import { handleIncomingMessage } from './handlers/messageHandler';

dotenv.config();

export const Whatsapp = new WhatsAppAPI({
    token: process.env.WHATSAPP_TOKEN!,
    appSecret: process.env.WHATSAPP_APP_SECRET!,
    webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
});

// Evento principal: mensagem recebida do usuário
Whatsapp.on.message = async ({ from, message, name, reply }: any) => {
    if (message.type !== 'text') {
        await reply(new Text('Desculpe, por enquanto só aceito mensagens de texto. Envie comandos como "despesa: ..."'));
        return;
    }

    const text = message.text.body.trim();
    const responseText = await handleIncomingMessage(from, text, name);

    // Forma correta e tipada:
    await reply(new Text(responseText), true); // true = mark as read

    // Alternativa válida (objeto literal simples, também aceito pela lib):
    // await reply({ text: responseText }, true);
};

console.log('[WhatsApp] Client inicializado (versão da lib: ~6.x)');