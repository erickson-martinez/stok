# 🧪 Guia Rápido de Testes - Transações

## 📋 Checklist de Testes

### ✅ Teste 1: Criar Transação Simples (Despesa)
```
Endpoint: POST /transactions/simple
Body:
{
  "ownerPhone": "11999999999",
  "type": "expense",
  "name": "Supermercado",
  "amount": 150.50,
  "date": "2026-01-10T14:30:00Z",
  "notes": "Compras da semana"
}

Esperado: 201 com ID da transação
```

---

### ✅ Teste 2: Criar Transação Simples (Receita)
```
Endpoint: POST /transactions/simple
Body:
{
  "ownerPhone": "11999999999",
  "type": "revenue",
  "name": "Salário",
  "amount": 3000.00,
  "date": "2026-01-05T09:00:00Z"
}

Esperado: 201, isControlled: false
```

---

### ✅ Teste 3: Criar Cobrança Controlada (2 pontas)
```
Endpoint: POST /transactions/controlled
Body:
{
  "ownerPhone": "11999999999",
  "counterpartyPhone": "21988888888",
  "name": "Aluguel",
  "amount": 1500.00,
  "date": "2026-02-01T00:00:00Z"
}

Esperado: 201 com controlId e ambas as transações
- mySide.type = "revenue"
- counterpartySide.type = "expense"
```

---

### ✅ Teste 4: Listar Transações do Usuário
```
Endpoint: GET /transactions?phone=11999999999&includeShared=true
Esperado: 200 com todas as transações
```

---

### ✅ Teste 5: Registrar Pagamento Parcial
```
Endpoint: PATCH /transactions/payment
Body (use o ID do Teste 1):
{
  "transactionId": "COPIAR_ID",
  "ownerPhone": "11999999999",
  "paidAmount": 75.25
}

Esperado: 
- Status: "parcial"
- paidAmount: 75.25
```

---

### ✅ Teste 6: Marcar como Totalmente Pago
```
Endpoint: PATCH /transactions/payment
Body:
{
  "transactionId": "COPIAR_ID",
  "ownerPhone": "11999999999",
  "paidAmount": 150.50
}

Esperado: Status muda para "pago"
```

---

### ✅ Teste 7: Verificar Sincronização de Cobrança
```
Passos:
1. Criar cobrança controlada (Teste 3)
2. Atualizar pagamento PELO LADO DO DEVEDOR
   Endpoint: PATCH /transactions/payment
   Body:
   {
     "transactionId": "COPIAR_ID_DO_counterpartySide",
     "ownerPhone": "21988888888",
     "paidAmount": 500.00
   }

3. Verificar se o lado do CREDOR também foi atualizado:
   Endpoint: GET /transactions?phone=11999999999

Esperado: Ambas as pontas com status "parcial" e paidAmount: 500
```

---

### ✅ Teste 8: Filtrar por Status
```
Endpoint: GET /transactions?phone=11999999999&status=nao_pago
Esperado: Apenas transações com status "nao_pago"
```

---

### ✅ Teste 9: Filtrar por Data
```
Endpoint: GET /transactions?phone=11999999999&startDate=2026-01-01&endDate=2026-01-31
Esperado: Apenas transações de janeiro
```

---

### ✅ Teste 10: Seguir Usuário
```
Endpoint: POST /transactions/follow
Body:
{
  "myPhone": "11999999999",
  "targetPhone": "21988888888"
}

Esperado: 
- message com modifiedCount
- Próximas listagens incluem transações de 21988888888
```

---

### ✅ Teste 11: Deletar Transação Simples
```
Endpoint: DELETE /transactions
Body:
{
  "transactionId": "COPIAR_ID_SIMPLES",
  "ownerPhone": "11999999999"
}

Esperado: 200, transação removida
```

---

### ✅ Teste 12: Deletar Cobrança (ambas pontas)
```
Endpoint: DELETE /transactions
Body:
{
  "transactionId": "COPIAR_ID_CONTROLADA",
  "ownerPhone": "11999999999"
}

Esperado: 
- Ambas as pontas deletadas
- message: "Transação controlada e sua contraparte..."
```

---

## 🔍 Cenários de Teste Integrados

### Cenário A: Gastos Compartilhados de Casal

#### Setup: João e Maria dividem aluguel
```bash
# 1. Criar ambos os usuários (em /users)
POST /users
{ "phone": "11999999999", "name": "João" }

POST /users
{ "phone": "21988888888", "name": "Maria" }
```

#### 2. João cria cobrança para Maria
```bash
POST /transactions/controlled
{
  "ownerPhone": "11999999999",
  "counterpartyPhone": "21988888888",
  "name": "Aluguel janeiro",
  "amount": 2000.00,
  "date": "2026-02-01"
}

# Resposta inclui controlId: "ctrl-1234-abcd"
```

#### 3. João verifica sua receita
```bash
GET /transactions?phone=11999999999
# Vê: 1 REVENUE de R$ 2000 (nao_pago)
```

#### 4. Maria verifica sua despesa
```bash
GET /transactions?phone=21988888888
# Vê: 1 EXPENSE de R$ 2000 (nao_pago)
```

#### 5. Maria paga R$ 1000
```bash
PATCH /transactions/payment
{
  "transactionId": "COPIAR_ID_DE_MARIA",
  "ownerPhone": "21988888888",
  "paidAmount": 1000
}
```

#### 6. Verificar sincronização
```bash
# Do lado de João
GET /transactions?phone=11999999999
# Status: "parcial", paidAmount: 1000

# Do lado de Maria
GET /transactions?phone=21988888888
# Status: "parcial", paidAmount: 1000
```

#### 7. Maria paga resto
```bash
PATCH /transactions/payment
{
  "transactionId": "COPIAR_ID",
  "ownerPhone": "21988888888",
  "paidAmount": 2000
}

# Ambos veem status: "pago"
```

---

### Cenário B: Acompanhamento de Gastos

#### 1. João segue María
```bash
POST /transactions/follow
{
  "myPhone": "11999999999",
  "targetPhone": "21988888888"
}
```

#### 2. Maria cria algumas transações
```bash
POST /transactions/simple
{
  "ownerPhone": "21988888888",
  "type": "expense",
  "name": "Gasolina",
  "amount": 200,
  "date": "2026-01-10"
}

POST /transactions/simple
{
  "ownerPhone": "21988888888",
  "type": "expense",
  "name": "Refeição",
  "amount": 80,
  "date": "2026-01-11"
}
```

#### 3. João lista com shared
```bash
GET /transactions?phone=11999999999&includeShared=true

# Resposta inclui:
# - Suas transações
# - Transações de Maria (sharerPhone = João, aggregate = true)
```

#### 4. João filtra apenas compartilhadas
```bash
GET /transactions?phone=11999999999&includeShared=true
# Análise manual: filtra onde sharerPhone === João
```

---

### Cenário C: Validações

#### ❌ Teste: Mesmo usuário em cobrança
```bash
POST /transactions/controlled
{
  "ownerPhone": "11999999999",
  "counterpartyPhone": "11999999999",
  "name": "Teste",
  "amount": 100,
  "date": "2026-01-10"
}

Esperado: 400, error: "Não é permitido criar cobrança para o mesmo usuário"
```

#### ❌ Teste: Valor negativo/zero
```bash
POST /transactions/simple
{
  "ownerPhone": "11999999999",
  "type": "expense",
  "name": "Teste",
  "amount": -50,
  "date": "2026-01-10"
}

Esperado: 400, error: "O valor (amount) deve ser maior que zero"
```

#### ❌ Teste: Usuário não existe
```bash
POST /transactions/simple
{
  "ownerPhone": "99999999999",
  "type": "expense",
  "name": "Teste",
  "amount": 100,
  "date": "2026-01-10"
}

Esperado: 404, error: "Usuário proprietário não encontrado"
```

#### ❌ Teste: Campo obrigatório faltando
```bash
POST /transactions/simple
{
  "ownerPhone": "11999999999",
  "type": "expense",
  "name": "Teste"
  # amount faltando
}

Esperado: 400, error: "Campos obrigatórios: ..."
```

#### ❌ Teste: Deletar sem permissão
```bash
DELETE /transactions
{
  "transactionId": "COPIAR_ID",
  "ownerPhone": "99999999999"  # outro usuário
}

Esperado: 403, error: "Não autorizado"
```

---

## 🚀 Ordem Recomendada de Testes

1. **Primeiro**: Testes 1-6 (CRUD básico)
2. **Depois**: Teste 7 (sincronização)
3. **Então**: Testes 8-10 (filtros e follow)
4. **Por fim**: Testes 11-12 (delete)
5. **Integrados**: Cenários A, B, C

---

## 📊 Script de Teste Automático (JavaScript)

```javascript
// test-transactions.js
const BASE_URL = 'http://localhost:3000';

const testUser1 = '11999999999';
const testUser2 = '21988888888';

async function runTests() {
  console.log('🧪 Iniciando testes...\n');
  
  try {
    // Teste 1: Transação simples
    console.log('1️⃣ Criando transação simples...');
    const simpleRes = await fetch(`${BASE_URL}/transactions/simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerPhone: testUser1,
        type: 'expense',
        name: 'Supermercado',
        amount: 150.50,
        date: new Date().toISOString()
      })
    });
    const simple = await simpleRes.json();
    console.log('✅ Transação criada:', simple.transaction._id);
    
    // Teste 2: Cobrança controlada
    console.log('\n2️⃣ Criando cobrança controlada...');
    const controlledRes = await fetch(`${BASE_URL}/transactions/controlled`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerPhone: testUser1,
        counterpartyPhone: testUser2,
        name: 'Aluguel',
        amount: 1500,
        date: new Date().toISOString()
      })
    });
    const controlled = await controlledRes.json();
    console.log('✅ Cobrança criada:', controlled.controlId);
    
    // Teste 3: Listar
    console.log('\n3️⃣ Listando transações...');
    const listRes = await fetch(`${BASE_URL}/transactions?phone=${testUser1}`);
    const listed = await listRes.json();
    console.log(`✅ ${listed.count} transações encontradas`);
    
    // Teste 4: Atualizar pagamento
    console.log('\n4️⃣ Registrando pagamento...');
    const payRes = await fetch(`${BASE_URL}/transactions/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId: simple.transaction._id,
        ownerPhone: testUser1,
        paidAmount: 75.25
      })
    });
    const paid = await payRes.json();
    console.log('✅ Status:', paid.transaction.status);
    
    console.log('\n✨ Todos os testes completados com sucesso!');
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

runTests();
```

Execute com:
```bash
node test-transactions.js
```

---

## 💡 Dicas para Debugging

1. **Use o DevTools**: F12 → Network → veja requests/responses
2. **Console Browser**: `console.log(error)` para ver detalhes
3. **Postman**: Salve variáveis com `{{variable}}`
4. **MongoDB Compass**: Verifique dados direto no banco
5. **Logs do servidor**: `console.error()` no transactionController

---

## ✅ Requisitos Antes de Testar

- [ ] MongoDB rodando
- [ ] Servidor Node rodando em http://localhost:3000
- [ ] Pelo menos 2 usuários criados em `/users`
- [ ] Postman ou cURL instalado
- [ ] `.env` com `MONGO_URI` configurado
