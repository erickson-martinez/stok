"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIncomingMessage = handleIncomingMessage;
// whatsapp/handlers/messageHandler.ts
const userCache_1 = require("../../utils/userCache");
const transactionController_1 = __importDefault(require("../../controllers/transactionController"));
/**
 * Handler principal que recebe toda mensagem de texto do WhatsApp
 * @param from Número do remetente (+55...)
 * @param text Conteúdo da mensagem
 * @param name Nome do contato (se disponível)
 * @returns Texto da resposta a ser enviada
 */
async function handleIncomingMessage(from, text, name) {
    const lowerText = text.trim().toLowerCase();
    const userGreeting = name ? `Olá ${name}` : 'Olá';
    // Resposta padrão / ajuda
    let response = `${userGreeting}! Aqui estão os comandos disponíveis:\n\n` +
        `despesa: Nome valor data [pago/pendente]\n` +
        `  ex: despesa: Aluguel 1500 10/02 pago\n` +
        `receita: Nome valor data\n` +
        `  ex: receita: Salário 4500 05/02\n` +
        `saldo               → mostra saldo do mês atual\n` +
        `dívidas             → lista pendências (em breve)\n` +
        `ponto entrar        → registra entrada\n` +
        `ponto sair          → registra saída\n` +
        `os: Descrição       → abre ordem de serviço\n\n` +
        `Digite um comando para começar!`;
    try {
        // Busca usuário com cache (muito mais rápido depois da 1ª vez)
        const userInfo = await (0, userCache_1.getUserByPhone)(from);
        if (!userInfo) {
            return 'Usuário não encontrado no sistema. Por favor, cadastre-se primeiro.';
        }
        // ────────────────────────────────────────────────────────────────
        // Parse de DESPESA (mais robusto)
        // ────────────────────────────────────────────────────────────────
        const despesaRegex = /^despesa:\s*(.+?)\s+([\d,.]+)\s+(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)(?:\s+(pago|pendente))?\s*$/i;
        const despesaMatch = lowerText.match(despesaRegex);
        if (despesaMatch) {
            const [, nomeRaw, valorStr, dataStr, statusStr = 'pendente'] = despesaMatch;
            const nome = nomeRaw.trim();
            const amount = parseFloat(valorStr.replace(',', '.'));
            if (isNaN(amount) || amount <= 0) {
                return 'Valor inválido. Use números maiores que zero (ex: 1500 ou 1.500,50)';
            }
            // Parse de data flexível
            let date;
            try {
                const parts = dataStr.split(/[/-]/);
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
                date = new Date(year, month, day);
                if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
                    throw new Error('Data inválida');
                }
            }
            catch {
                return 'Data inválida. Use formato DD/MM ou DD-MM (ex: 10/02 ou 10-02-2026)';
            }
            const isPaid = statusStr.toLowerCase() === 'pago';
            // Mock req/res para chamar o controller sem alterar ele
            let result = null;
            const mockReq = {
                body: {
                    ownerPhone: from, // plain → o controller encripta internamente
                    type: 'expense',
                    name: nome,
                    amount,
                    date: date.toISOString().split('T')[0], // YYYY-MM-DD
                    status: isPaid ? 'pago' : 'nao_pago',
                }
            };
            const mockRes = {
                status: (code) => ({
                    json: (obj) => {
                        result = { ...obj, statusCode: code };
                        return result;
                    }
                }),
                json: (obj) => {
                    result = obj;
                    return obj;
                }
            };
            await transactionController_1.default.createSimple(mockReq, mockRes);
            if (result?.error || result?.statusCode >= 400) {
                return `Erro ao registrar despesa: ${result?.error || 'falha desconhecida'}`;
            }
            return `✅ Despesa registrada com sucesso!\n\n` +
                `• Descrição: ${nome}\n` +
                `• Valor: R$ ${amount.toFixed(2)}\n` +
                `• Data: ${date.toLocaleDateString('pt-BR')}\n` +
                `• Status: ${isPaid ? 'Paga' : 'Pendente'}`;
        }
        // ────────────────────────────────────────────────────────────────
        // RECEITA (similar à despesa)
        // ────────────────────────────────────────────────────────────────
        const receitaRegex = /^receita:\s*(.+?)\s+([\d,.]+)\s+(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\s*$/i;
        const receitaMatch = lowerText.match(receitaRegex);
        if (receitaMatch) {
            const [, nomeRaw, valorStr, dataStr] = receitaMatch;
            const nome = nomeRaw.trim();
            const amount = parseFloat(valorStr.replace(',', '.'));
            if (isNaN(amount) || amount <= 0)
                return 'Valor inválido.';
            let date;
            try {
                const parts = dataStr.split(/[/-]/);
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
                date = new Date(year, month, day);
                if (isNaN(date.getTime()))
                    throw new Error();
            }
            catch {
                return 'Data inválida. Use DD/MM ou DD-MM.';
            }
            let result = null;
            const mockReq = {
                body: {
                    ownerPhone: from,
                    type: 'revenue',
                    name: nome,
                    amount,
                    date: date.toISOString().split('T')[0],
                    status: 'nao_pago' // receita geralmente começa como "recebida" ou ajuste
                }
            };
            const mockRes = {
                status: (code) => ({
                    json: (obj) => {
                        result = { ...obj, statusCode: code };
                        return result;
                    }
                }),
                json: (obj) => {
                    result = obj;
                    return obj;
                }
            };
            await transactionController_1.default.createSimple(mockReq, mockRes);
            if (result?.error || result?.statusCode >= 400) {
                return `Erro ao registrar receita: ${result?.error || 'falha desconhecida'}`;
            }
            return `✅ Receita registrada!\n\n` +
                `• Descrição: ${nome}\n` +
                `• Valor: R$ ${amount.toFixed(2)}\n` +
                `• Data: ${date.toLocaleDateString('pt-BR')}`;
        }
        // ────────────────────────────────────────────────────────────────
        // SALDO (mês atual)
        // ────────────────────────────────────────────────────────────────
        if (lowerText === 'saldo') {
            const today = new Date();
            const currentMonth = today.getMonth() + 1;
            const currentYear = today.getFullYear();
            const mockReq = {
                query: {
                    phone: from,
                    month: currentMonth.toString(),
                    year: currentYear.toString(),
                    includeShared: 'true'
                }
            };
            let summaryResult = null;
            const mockRes = {
                json: (obj) => {
                    summaryResult = obj;
                    return obj;
                }
            };
            await transactionController_1.default.listTransactions(mockReq, mockRes);
            if (summaryResult?.error) {
                return 'Não foi possível consultar o saldo no momento.';
            }
            const { summary } = summaryResult ?? {};
            const monthly = summary?.monthlyBalance ?? 0;
            const accumulated = summary?.accumulatedBalance ?? 0;
            return `Seu saldo:\n` +
                `Mês atual (${today.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}): R$ ${monthly.toFixed(2)}\n` +
                `Acumulado: R$ ${accumulated.toFixed(2)}`;
        }
        // ────────────────────────────────────────────────────────────────
        // Outros comandos podem ser adicionados aqui no futuro
        // ex: if (lowerText === 'dívidas') { ... }
        // ex: if (lowerText.startsWith('ponto entrar')) { ... }
    }
    catch (err) {
        console.error('[WhatsApp Message Handler] Erro:', err);
        return 'Ocorreu um erro interno ao processar sua mensagem. Tente novamente ou contate o suporte.';
    }
    // Se nenhum comando reconhecido → retorna ajuda
    return response;
}
//# sourceMappingURL=messageHandler.js.map