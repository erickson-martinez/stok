"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Whatsapp = void 0;
const whatsapp_api_js_1 = require("whatsapp-api-js");
const messages_1 = require("whatsapp-api-js/messages");
const dotenv_1 = __importDefault(require("dotenv"));
const messageHandler_1 = require("./handlers/messageHandler");
dotenv_1.default.config();
exports.Whatsapp = new whatsapp_api_js_1.WhatsAppAPI({
    token: process.env.WHATSAPP_TOKEN,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    webhookVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
});
exports.Whatsapp.on.message = async ({ from, message, name, reply }) => {
    if (message.type !== 'text') {
        await reply(new messages_1.Text('Desculpe, por enquanto só aceito mensagens de texto. Envie comandos como "despesa: ..."'));
        return;
    }
    const text = message.text.body.trim();
    const responseText = await (0, messageHandler_1.handleIncomingMessage)(from, text, name);
    await reply(new messages_1.Text(responseText), true);
};
console.log('[WhatsApp] Client inicializado (versão da lib: ~6.x)');
//# sourceMappingURL=whatsappClient.js.map