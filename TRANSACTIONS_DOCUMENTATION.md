# 📊 Sistema de Transações - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Conceitos Principais](#conceitos-principais)
3. [Tipos de Transações](#tipos-de-transações)
4. [Endpoints](#endpoints)
5. [Modelos de Dados](#modelos-de-dados)
6. [Exemplos de Uso](#exemplos-de-uso)
7. [Casos de Uso](#casos-de-uso)
8. [Status e Pagamentos](#status-e-pagamentos)
9. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

O sistema de transações é um módulo independente e modernizado para gerenciar:
- **Receitas** (entradas de dinheiro)
- **Despesas** (saídas de dinheiro)
- **Cobranças entre usuários** (sincronizadas automaticamente)
- **Compartilhamento de transações** (seguir movimentações de outros usuários)

### Diferença do Sistema Antigo (Expenses)

| Aspecto | Expenses (Antigo) | Transactions (Novo) |
|--------|------------------|-------------------|
| Estrutura | Complexa com sub-itens | Flat e simples |
| Compartilhamento | Integrado na estrutura | Independente e opcional |
| Cobranças | Pouco flexível | Natural e sincronizado |
| Independência | Dependências cruzadas | Completamente independente |

---

## 💡 Conceitos Principais

### 1. **Transação Simples**
Uma transação que pertence apenas a um usuário:
- Não afeta outro usuário
- Pode ser receita ou despesa
- Tem status de pagamento

### 2. **Transação Controlada**
Uma cobrança entre dois usuários:
- Cria automaticamente **duas pontas**:
  - **Lado da Receita**: `ownerPhone` recebe de `counterpartyPhone`
  - **Lado da Despesa**: `counterpartyPhone` deve para `ownerPhone`
- Ambas as pontas são **sincronizadas automaticamente**
- Identificadas pelo mesmo `controlId`

### 3. **Compartilhamento (Follow)**
Um usuário pode "seguir" as transações de outro:
- Útil para análise de gastos compartilhados
- Não afeta as transações originais
- Dados são agregados na listagem

---

## 🔄 Tipos de Transações

### `type`: revenue | expense

**Revenue (Receita):**
- Dinheiro entrando
- Salário, vendas, reembolsos
- Em transações controladas: crédito para o usuário

**Expense (Despesa):**
- Dinheiro saindo
- Compras, pagamentos, empréstimos
- Em transações controladas: débito para o usuário

---

## 🌐 Endpoints

### 1. **POST** `/transactions/simple`
Cria uma transação simples (não compartilhada)

**Request:**
```json
{
  "ownerPhone": "11999999999",
  "type": "expense",
  "name": "Compra no supermercado",
  "amount": 150.50,
  "date": "2026-01-10T14:30:00Z",
  "status": "nao_pago",
  "notes": "Itens diversos"
}
```

**Response (201):**
```json
{
  "message": "Transação simples criada com sucesso",
  "transaction": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "ownerPhone": "11999999999",
    "type": "expense",
    "name": "Compra no supermercado",
    "amount": 150.50,
    "date": "2026-01-10T14:30:00.000Z",
    "isControlled": false,
    "status": "nao_pago",
    "paidAmount": 0,
    "notes": "Itens diversos",
    "createdAt": "2026-01-10T14:35:00.000Z",
    "updatedAt": "2026-01-10T14:35:00.000Z"
  }
}
```

**Campos Obrigatórios:**
- `ownerPhone` (string)
- `type` (enum: "revenue" | "expense")
- `name` (string)
- `amount` (number > 0)
- `date` (ISO string ou Date)

**Campos Opcionais:**
- `status` (padrão: "nao_pago")
- `notes` (string)

---

### 2. **POST** `/transactions/controlled`
Cria uma cobrança entre dois usuários (sincronizada)

**Request:**
```json
{
  "ownerPhone": "11999999999",
  "counterpartyPhone": "21988888888",
  "name": "Pagamento de aluguel",
  "amount": 1500.00,
  "date": "2026-02-01T00:00:00Z",
  "notes": "Aluguel referente a janeiro"
}
```

**Response (201):**
```json
{
  "message": "Cobrança criada com sucesso",
  "controlId": "ctrl-1705000000000-a1b2c3d4",
  "mySide": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "ownerPhone": "11999999999",
    "type": "revenue",
    "name": "Pagamento de aluguel",
    "amount": 1500.00,
    "isControlled": true,
    "controlId": "ctrl-1705000000000-a1b2c3d4",
    "counterpartyPhone": "21988888888",
    "status": "nao_pago",
    "paidAmount": 0
  },
  "counterpartySide": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "ownerPhone": "21988888888",
    "type": "expense",
    "name": "Pagamento de aluguel",
    "amount": 1500.00,
    "isControlled": true,
    "controlId": "ctrl-1705000000000-a1b2c3d4",
    "counterpartyPhone": "11999999999",
    "status": "nao_pago",
    "paidAmount": 0
  }
}
```

**Campos Obrigatórios:**
- `ownerPhone` (string) - quem recebe/cobra
- `counterpartyPhone` (string) - quem paga
- `name` (string)
- `amount` (number > 0)
- `date` (ISO string)

**Validações:**
- `ownerPhone ≠ counterpartyPhone`
- Ambos os usuários devem existir
- `amount > 0`

---

### 3. **PATCH** `/transactions/payment`
Atualiza status e valor pago de uma transação

**Request:**
```json
{
  "transactionId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "ownerPhone": "11999999999",
  "status": "parcial",
  "paidAmount": 75.25
}
```

**Response (200):**
```json
{
  "message": "Status atualizado com sucesso",
  "transaction": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "ownerPhone": "11999999999",
    "type": "expense",
    "status": "parcial",
    "paidAmount": 75.25,
    "amount": 150.50,
    "updatedAt": "2026-01-10T15:00:00.000Z"
  }
}
```

**Comportamento Automático:**
- Se `paidAmount >= amount`: status muda para `pago`
- Se `paidAmount > 0` e `paidAmount < amount`: status muda para `parcial`
- Se `paidAmount = 0`: status muda para `nao_pago`

**Sincronização:**
- Se for transação controlada, a contraparte é **atualizada automaticamente**

---

### 4. **GET** `/transactions`
Lista transações do usuário + opcionais compartilhadas

**Request Query Parameters:**
```
GET /transactions?phone=11999999999&includeShared=true&status=nao_pago&startDate=2026-01-01&endDate=2026-01-31
```

**Response (200):**
```json
{
  "count": 3,
  "transactions": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "ownerPhone": "11999999999",
      "type": "expense",
      "name": "Supermercado",
      "amount": 150.50,
      "date": "2026-01-10T14:30:00.000Z",
      "status": "nao_pago",
      "paidAmount": 0
    }
  ]
}
```

**Query Parameters:**
- `phone` (obrigatório) - string
- `includeShared` (opcional) - boolean, padrão: "true"
- `status` (opcional) - "pago" | "nao_pago" | "parcial" | "cancelado"
- `startDate` (opcional) - ISO string
- `endDate` (opcional) - ISO string

---

### 5. **POST** `/transactions/follow`
Começar a acompanhar ("seguir") transações de outro usuário

**Request:**
```json
{
  "myPhone": "11999999999",
  "targetPhone": "21988888888"
}
```

**Response (200):**
```json
{
  "message": "Agora você acompanha as transações de 21988888888",
  "modifiedCount": 5
}
```

**Efeito:**
- Todas as transações de `targetPhone` ganham `sharerPhone: myPhone` e `aggregate: true`
- Quando você lista com `includeShared=true`, aparece no resultado

---

### 6. **DELETE** `/transactions`
Remove uma transação (ou ambas as pontas se controlada)

**Request:**
```json
{
  "transactionId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "ownerPhone": "11999999999"
}
```

**Response (200):**
```json
{
  "message": "Transação removida com sucesso"
}
```

ou (se controlada):
```json
{
  "message": "Transação controlada e sua contraparte foram removidas"
}
```

---

## 📊 Modelos de Dados

### Transaction Document

```typescript
{
  _id: ObjectId;
  ownerPhone: string;              // Proprietário da transação
  type: 'revenue' | 'expense';    // Tipo
  name: string;                    // Nome/descrição
  amount: number;                  // Valor (> 0)
  date: Date;                      // Data da transação
  isControlled: boolean;           // Se é controlada (cobrança)
  controlId?: string;              // ID da transação controlada
  counterpartyPhone?: string;      // Outro usuário envolvido
  status: TransactionStatus;       // Status do pagamento
  paidAmount: number;              // Quanto foi pago (≥ 0)
  notes?: string;                  // Notas adicionais
  sharerPhone?: string;            // Quem está acompanhando
  aggregate?: boolean;             // Deve agregar na lista
  createdAt: Date;                 // Data de criação
  updatedAt: Date;                 // Data de atualização
}
```

### Status Possíveis

```typescript
type TransactionStatus = 'pago' | 'nao_pago' | 'parcial' | 'cancelado';
```

| Status | Significado |
|--------|------------|
| `nao_pago` | Ainda não foi pago nada |
| `parcial` | Pago parcialmente (0 < paidAmount < amount) |
| `pago` | Totalmente pago (paidAmount >= amount) |
| `cancelado` | Cancelado/anulado |

---

## 💻 Exemplos de Uso

### Cenário 1: Rastreamento de Despesa Pessoal

```javascript
// João gasta R$ 150 no supermercado
const response = await fetch('http://localhost:3000/transactions/simple', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ownerPhone: '11999999999',
    type: 'expense',
    name: 'Supermercado',
    amount: 150.50,
    date: new Date().toISOString(),
    notes: 'Compras da semana'
  })
});
```

### Cenário 2: Cobrança entre Amigos

```javascript
// João cobra Maria pelo aluguel compartilhado
const response = await fetch('http://localhost:3000/transactions/controlled', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ownerPhone: '11999999999',        // João (cobra)
    counterpartyPhone: '21988888888', // Maria (deve)
    name: 'Aluguel - parte de Maria',
    amount: 750.00,
    date: new Date().toISOString()
  })
});

// A API automaticamente cria:
// 1. Uma REVENUE para João (ele recebe)
// 2. Uma EXPENSE para Maria (ela paga)
// Ambas com o mesmo controlId e sincronizadas
```

### Cenário 3: Pagamento Parcial

```javascript
// Maria paga R$ 300 dos R$ 750 cobrados
const response = await fetch('http://localhost:3000/transactions/payment', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transactionId: '65a1b2c3d4e5f6g7h8i9j0k1',
    ownerPhone: '21988888888',
    paidAmount: 300
    // status será atualizado automaticamente para 'parcial'
  })
});
```

### Cenário 4: Seguir Transações de Outro Usuário

```javascript
// João começa a acompanhar as transações de Maria
const response = await fetch('http://localhost:3000/transactions/follow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    myPhone: '11999999999',        // João
    targetPhone: '21988888888'     // Maria
  })
});

// Agora quando João listar com includeShared=true,
// verá também as transações de Maria
```

### Cenário 5: Listar com Filtros

```javascript
// João lista suas despesas não pagas de janeiro
const response = await fetch(
  'http://localhost:3000/transactions?phone=11999999999' +
  '&status=nao_pago' +
  '&startDate=2026-01-01' +
  '&endDate=2026-01-31' +
  '&includeShared=true'
);

const data = await response.json();
console.log(`Total de transações: ${data.count}`);
data.transactions.forEach(t => {
  console.log(`${t.name}: R$ ${t.amount} (${t.status})`);
});
```

---

## 🎬 Casos de Uso

### 1. **Despesas Pessoais**
- Registrar gastos diários
- Acompanhar categoria por nome
- Marcar como pago quando usar dinheiro em caixa

### 2. **Aluguel e Contas Compartilhadas**
- Criar cobrança controlada entre dois usuários
- Ambos veem a transação em suas respectivas perspectivas
- Sincronização automática de pagamentos

### 3. **Análise de Gastos Comuns**
- Seguir transações de cônjuge/sócios
- Ver agregado de gastos combinados
- Identificar padrões de consumo

### 4. **Sistema de Crédito/Débito**
- Registrar empréstimos (expense para quem toma, revenue para quem empresta)
- Acompanhar pagamentos parciais
- Histórico completo de liquidação

### 5. **Gestão de Fluxo de Caixa**
- Receitas = entradas esperadas
- Despesas = saídas planejadas
- Status = controle de realização

---

## 💰 Status e Pagamentos

### Fluxo de Status

```
nao_pago ──(parcial payment)──> parcial ──(final payment)──> pago
   │                                                            ▲
   └────────────(full payment)──────────────────────────────┘
```

### Lógica Automática

Ao atualizar `paidAmount`:
- Se `paidAmount >= amount`: → `status = pago`
- Se `0 < paidAmount < amount`: → `status = parcial`
- Se `paidAmount = 0`: → `status = nao_pago`

Você pode também forçar manualmente (ex: `status = cancelado`)

---

## ✅ Boas Práticas

### 1. **Validação de Entrada**
- Sempre validar `amount > 0`
- Usar ISO strings para datas
- Validar formato de telefone

### 2. **Transações Controladas**
- Use apenas quando há **dois usuários envolvidos**
- Ideal para cobranças e empréstimos
- A API garante sincronização

### 3. **Listagem e Filtros**
- Use `includeShared=false` se só quiser suas transações
- Use filtros de data para relatórios
- Ordene por data decrescente para visualização

### 4. **Deletar com Cuidado**
- Transação controlada deleta **ambas as pontas**
- Não há undo - considere `status = cancelado` ao invés
- Validar permissão (`ownerPhone`)

### 5. **Performance**
- Limite período na listagem para grandes volumes
- Use índices: `ownerPhone + date`, `controlId`, `sharerPhone`
- Paginação recomendada para > 100 registros

---

## 🔐 Segurança

### Validações Realizadas

- ✅ Usuário proprietário deve existir
- ✅ Usuários em transações controladas devem existir
- ✅ Apenas o `ownerPhone` pode deletar/atualizar
- ✅ Valores sempre positivos
- ✅ Datas no formato correto

### O que NÃO é Validado (implemente no Frontend!)

- 🔒 Autenticação (implemente middleware)
- 🔒 Rate limiting
- 🔒 Validação de formato de telefone
- 🔒 Logs de auditoria

---

## 📱 Integração Frontend

Ver: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
