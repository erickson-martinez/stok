function loadFinances() {
    // Inicializar interface comum
    initializeUserInterface();

    // Carregar dados financeiros
    fetchMonthData();
    updateMonth();
}

let currentDate = new Date();
let currentType = '';
let editingId = null;
let idExpense = null;
let idItemExpense = null;
let totalReceitas;
let totalDespesas;
const receitas = [];
const despesas = [];

function formatMonth(date) {
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c);
}

function updateMonth() {
    const monthText = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toLowerCase());
    document.getElementById('currentMonth').textContent = `Controle ${monthText}`;
    updateLists();
    calculateColors();
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    updateMonth();
}

async function fetchMonthData() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const idUser = currentUser.idUser;

    try {
        const [expensesResponse, sharedResponse] = await Promise.all([
            fetch(`${API_URL}/expenses/${idUser}`),
            fetch(`${API_URL}/expensesShared/${idUser}`)
        ]);

        if (!expensesResponse.ok) throw new Error(`Erro ao carregar finanças: ${expensesResponse.statusText}`);
        if (!sharedResponse.ok) throw new Error(`Erro ao carregar finanças compartilhadas: ${sharedResponse.statusText}`);

        const expensesData = await expensesResponse.json();
        const sharedData = await sharedResponse.json();
        receitas.length = 0;
        despesas.length = 0;

        const processItems = (data, isShared = false, sharedBy = null) => {
            if (data.receitas.length > 0) {
                data.receitas.forEach(item => {
                    receitas.push({
                        id: item._id,
                        name: item.name,
                        total: item.total,
                        whenPay: item.whenPay,
                        paid: item.paid,
                        values: item.values || [{ name: item.name, value: item.total }],
                        shared: isShared,
                        sharedBy: sharedBy
                    });
                });
            }

            if (data.despesas.length > 0) {
                data.despesas.forEach(item => despesas.push({
                    id: item._id,
                    name: item.name,
                    total: item.total,
                    whenPay: item.whenPay,
                    paid: item.paid,
                    values: item.values || [{ name: item.name, value: item.total }],
                    shared: isShared,
                    sharedBy: sharedBy
                }));
            }
        };

        if (expensesData?.receitas?.length > 0 || expensesData?.despesas?.length > 0) {
            processItems(expensesData);
        }

        if (sharedData?.length > 0 && (sharedData[0]?.receitas?.length > 0 || sharedData[0]?.despesas?.length > 0)) {
            processItems(sharedData[0], true, sharedData[0]?.idUser);
        }

        updateLists();
        calculateColors();
    } catch (err) {
        console.error(err);
        alert('Erro ao carregar dados. Por favor, tente novamente.');
    }
}

function toggleAccordion(id) {
    const content = document.getElementById(`accordion-${id}`).querySelector(".accordion-content");
    const toggle = document.querySelector(`#accordion-${id}`).previousElementSibling.querySelector(".accordion-toggle");

    if (content.style.display === "block") {
        content.style.display = "none";
        toggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
        toggle.classList.remove("open");
    } else {
        content.style.display = "block";
        toggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
        toggle.classList.add("open");
    }
}

function incrementName(name, monthIndex) {
    const numberMatch = name.match(/\d+$/);
    if (numberMatch) {
        const baseName = name.replace(/\d+$/, "").trim();
        const newNumber = parseInt(numberMatch[0]) + monthIndex;
        return `${baseName} ${newNumber}`;
    }
    return name;
}

function openActionModal(action, type, item = null) {
    currentType = type;
    editingId = item?.id || null;
    const modal = document.getElementById("actionModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalButtons = document.getElementById("modalButtons");
    const titlePrefix = type === "receita" ? "Receita" : "Despesa";
    const debtorGroup = document.getElementById("debtorGroup");
    const recurringCheckbox = document.getElementById("modalRecurring");
    const recurringMonthsGroup = document.getElementById("recurringMonthsGroup");

    if (type === "receita" && action === "add") {
        debtorGroup.style.display = "block";
    } else {
        debtorGroup.style.display = "none";
    }

    recurringCheckbox.disabled = false;

    modalTitle.textContent = action === "add" ? `Nova ${titlePrefix}` :
        action === "edit" ? `Editar ${titlePrefix}` :
            action === "view" ? `Visualizar ${titlePrefix}` :
                `Deletar ${titlePrefix}`;

    const nome = document.getElementById("modalNome");
    const valor = document.getElementById("modalValor");
    const data = document.getElementById("modalData");
    const paid = document.getElementById("modalPaid");
    const recurring = document.getElementById("modalRecurring");
    const recurringMonths = document.getElementById("modalRecurringMonths");
    const debtorPhone = document.getElementById("modalDebtorPhone");
    const debtorInfo = document.getElementById("debtorInfo");

    action !== "add" ? idExpense = item.id : idExpense = null;

    if (item) {
        nome.value = item.name;
        valor.value = item.total || item.value;
        data.value = new Date(item.whenPay).toISOString().split("T")[0];
        paid.checked = item.paid;
        recurring.checked = item.isRecurring || false;
        recurringMonths.value = item.recurringMonths || 1;
        debtorPhone.value = "";
        debtorInfo.style.display = "none";
    } else {
        nome.value = "";
        valor.value = "";
        data.value = new Date().toISOString().split("T")[0];
        paid.checked = false;
        recurring.checked = false;
        recurringMonths.value = 1;
        debtorPhone.value = "";
        debtorInfo.style.display = "none";
    }

    const isEditable = (action === "add" || action === "edit") && !item?.shared;
    [nome, valor, data, debtorPhone, recurring, recurringMonths].forEach(input => input.disabled = !isEditable);
    paid.disabled = !isEditable || type === "despesa"; // Desabilita paid para despesas

    // Define a exibição inicial do recurringMonthsGroup
    recurringMonthsGroup.style.display = recurring.checked ? "block" : "none";

    // Remove qualquer listener anterior para evitar múltiplos listeners
    const newCheckbox = recurringCheckbox.cloneNode(true);
    recurringCheckbox.parentNode.replaceChild(newCheckbox, recurringCheckbox);

    // Adiciona listener para atualizar a exibição do recurringMonthsGroup
    newCheckbox.addEventListener('change', () => {
        recurringMonthsGroup.style.display = newCheckbox.checked ? "block" : "none";
    });

    modalButtons.innerHTML = "";

    if (action === "edit") {
        modalButtons.innerHTML = `
            <button class="btn-secundary" onclick="closeModal()">Cancelar</button>
            <button class="btn" onclick="saveItem()" ${isEditable ? '' : 'disabled'}>Salvar</button>
        `;
    } else if (action === "add") {
        modalButtons.innerHTML = `
            <button class="btn-secundary" onclick="closeModal()">Cancelar</button>
            <button class="btn" onclick="saveItem()" ${isEditable ? '' : 'disabled'}>Salvar</button>
        `;
    } else if (action === "view") {
        modalButtons.innerHTML = `<button class="btn" onclick="closeModal()">Fechar</button>`;
    } else if (action === "delete") {
        modalButtons.innerHTML = `
            <button class="btn-secundary" onclick="closeModal()">Cancelar</button>
            <button class="btn" onclick="confirmDelete('${type}','${item.id}')" ${item?.shared ? 'disabled' : ''}>Confirmar</button>
        `;
    }

    modal.style.display = "block";
}

async function saveItem() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const idUser = currentUser.idUser;
    const nome = document.getElementById("modalNome").value;
    const valor = parseFloat(document.getElementById("modalValor").value) || 0;
    const data = document.getElementById("modalData").value;
    const paid = document.getElementById("modalPaid").checked;
    const isRecurring = document.getElementById("modalRecurring").checked;
    const recurringMonths = parseInt(document.getElementById("modalRecurringMonths").value) || 1;

    // Só obtém o telefone do devedor se for uma receita
    const debtorPhone = currentType === "receita" ? document.getElementById("modalDebtorPhone").value : null;
    const isLinkedReceita = currentType === "receita" && debtorPhone;

    if (!nome || valor <= 0 || !data) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    // Verifica o devedor se for uma receita vinculada
    let debtorId = null;
    if (isLinkedReceita) {
        try {
            const response = await fetch(`${API_URL}/users/${debtorPhone}`);
            if (!response.ok) throw new Error('Usuário não encontrado');

            const user = await response.json();

            debtorId = user._id;
        } catch (error) {
            alert("Por favor, insira um telefone válido para o devedor.");
            return;
        }
    }

    const [year, month, day] = data.split("-");
    const baseDate = new Date(year, month - 1, day);

    let payload;

    if (editingId) {
        // Modo edição
        const whenPay = `${year}/${month}/${day}`;
        const item = {
            _id: editingId,
            name: nome,
            total: valor,
            whenPay: whenPay,
            paid: paid,
            isRecurring: isRecurring,
            recurringMonths: isRecurring ? recurringMonths : undefined,
            values: [{ name: nome, value: valor }]
        };

        if (isLinkedReceita) {
            item.isDebt = true;
            item.totalPaid = 0;
        }

        payload = {
            idUser,
            [currentType === "receita" ? "receitas" : "despesas"]: [item]
        };
    } else {
        // Modo adição
        const items = [];
        const totalMonths = isRecurring ? parseInt(recurringMonths) : 1;

        for (let i = 0; i < totalMonths; i++) {
            const currentDate = new Date(baseDate);
            currentDate.setMonth(baseDate.getMonth() + i);
            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            currentDate.setDate(Math.min(parseInt(day), lastDayOfMonth));

            const formattedDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
            const itemName = i === 0 ? nome : incrementName(nome, i);

            const item = {
                name: itemName,
                total: parseFloat(valor),
                idDebts: debtorId,
                isDebts: debtorId ? true : false,
                whenPay: formattedDate,
                paid: i === 0 ? paid : false,
                isRecurring: isRecurring && i === 0,
                recurringMonths: isRecurring && i === 0 ? parseInt(recurringMonths) : undefined,
                values: [{ name: itemName, value: parseFloat(valor) }]
            };

            if (isLinkedReceita && i === 0) {
                item.isDebt = true;
                item.totalPaid = 0;
            }

            items.push(item);
        }

        payload = {
            idUser,
            [currentType === "receita" ? "receitas" : "despesas"]: items
        };

        // Se for uma receita vinculada, cria também a despesa correspondente
        if (isLinkedReceita) {
            try {
                // Primeiro cria a receita para obter o ID
                const receitaResponse = await fetch(`${API_URL}/expenses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!receitaResponse.ok) throw new Error("Erro ao criar receita");

                await receitaResponse.json();

                // Cria as despesas correspondentes para o devedor, considerando a recorrência
                const despesaItems = [];
                for (let i = 0; i < totalMonths; i++) {
                    const currentDate = new Date(baseDate);
                    currentDate.setMonth(baseDate.getMonth() + i);
                    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    currentDate.setDate(Math.min(parseInt(day), lastDayOfMonth));

                    const formattedDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
                    const itemName = i === 0 ? nome : incrementName(nome, i);

                    const despesaItem = {
                        name: itemName,
                        total: parseFloat(valor),
                        whenPay: formattedDate,
                        paid: false,
                        idOrigem: idUser,
                        isDebts: idUser ? true : false,
                        notify: false,
                        totalPaid: 0,
                        values: [{
                            name: itemName,
                            value: parseFloat(valor),
                            notify: false
                        }],
                        isRecurring: isRecurring && i === 0,
                        recurringMonths: isRecurring && i === 0 ? parseInt(recurringMonths) : undefined
                    };

                    despesaItems.push(despesaItem);
                }

                const despesaPayload = {
                    idUser: debtorId,
                    despesas: despesaItems
                };

                await fetch(`${API_URL}/expenses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(despesaPayload),
                });

                await fetchMonthData();
                closeModal();
                return;
            } catch (err) {
                console.error(err);
                alert("Erro ao vincular receita/despesa: " + err.message);
                return;
            }
        }
    }

    try {
        const method = editingId ? "PATCH" : "POST";
        const response = await fetch(`${API_URL}/expenses`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao salvar item: ${response.statusText} - ${errorText}`);
        }

        await fetchMonthData();
        closeModal();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

function openActionModalItem(type, id) {
    const action = "add";
    currentType = type;
    idItemExpense = id;

    const modal = document.getElementById("actionModalItem");
    const modalTitle = document.getElementById("modalTitleItem");
    const modalButtons = document.getElementById("modalButtonsItem");
    const titlePrefix = type === "receita" ? "Receita" : "Despesa";
    const paidCheckbox = document.getElementById("modalPaidItem");
    const notifyCheckbox = document.getElementById("modalNotifyItem");
    const cobradorReceitasSelect = document.getElementById("cobradorReceitasSelect");

    modalTitle.textContent = `Nova ${titlePrefix}`;

    // Limpar campos
    document.getElementById("modalNomeItem").value = "";
    document.getElementById("modalValorItem").value = "";
    paidCheckbox.checked = false;
    notifyCheckbox.checked = false;

    // Se for despesa (devedor), carregar receitas do cobrador
    if (type === "despesa") {
        const despesa = despesas.find(item => item.id === id);
        if (despesa?.idOrigem) {
            fetchCobradorReceitas(despesa.idOrigem, cobradorReceitasSelect);
            cobradorReceitasSelect.style.display = "block";
            paidCheckbox.disabled = true; // Devedor não pode marcar paid
            notifyCheckbox.style.display = "block";
        } else {
            cobradorReceitasSelect.style.display = "none";
            notifyCheckbox.style.display = "none";
        }
    } else {
        cobradorReceitasSelect.style.display = "none";
        paidCheckbox.disabled = false; // Cobrador pode marcar paid
        notifyCheckbox.style.display = "none";
    }

    modalButtons.innerHTML = `
        <button class="btn-secundary" onclick="closeModalItem()">Cancelar</button>
        <button class="btn" onclick="saveValuesItem()">Salvar</button>
    `;

    modal.style.display = "block";
    document.querySelectorAll(".options-menu").forEach(menu => menu.remove());
}

async function fetchCobradorReceitas(cobradorId, selectElement) {
    try {
        const response = await fetch(`${API_URL}/expenses/${cobradorId}`);
        if (!response.ok) throw new Error("Erro ao carregar receitas do cobrador");
        const expenseData = await response.json();
        selectElement.innerHTML = '<option value="">Selecione uma receita</option>';
        expenseData.receitas.forEach(receita => {
            selectElement.innerHTML += `
                <option value="${receita._id}">${receita.name} - ${receita.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</option>
            `;
        });
    } catch (err) {
        console.error('Erro em fetchCobradorReceitas:', err);
        selectElement.innerHTML = '<option value="">Erro ao carregar receitas</option>';
    }
}

function renderInternalItems(values) {
    const internalItemsList = document.getElementById("internalItemsList");
    internalItemsList.innerHTML = values.length ? values.map((v, index) => `
        <div class="internal-item">
            <input type="text" value="${v.name}" data-index="${index}" class="internal-name">
            <input type="number" value="${v.value}" step="0.01" data-index="${index}" class="internal-value">
            <button class="btn delete-internal" onclick="removeInternalItem(${index})">✖</button>
        </div>
    `).join("") : "<p>Nenhum item interno cadastrado</p>";
}

function addInternalItem() {
    const internalItemsList = document.getElementById("internalItemsList");
    const items = Array.from(internalItemsList.querySelectorAll(".internal-item"));
    const newItem = document.createElement("div");
    newItem.className = "internal-item";
    newItem.innerHTML = `
        <input type="text" placeholder="Nome" data-index="${items.length}" class="internal-name">
        <input type="number" placeholder="Valor" step="0.01" data-index="${items.length}" class="internal-value">
        <button class="btn delete-internal" onclick="removeInternalItem(${items.length})">✖</button>
    `;
    internalItemsList.appendChild(newItem);
    if (items.length === 1 && internalItemsList.querySelector("p")) {
        internalItemsList.innerHTML = "";
        internalItemsList.appendChild(newItem);
    }
}

function removeInternalItem(index) {
    const internalItemsList = document.getElementById("internalItemsList");
    const items = internalItemsList.querySelectorAll(".internal-item");
    if (items[index]) items[index].remove();
    if (!internalItemsList.querySelector(".internal-item")) {
        internalItemsList.innerHTML = "<p>Nenhum item interno cadastrado</p>";
    }
}

function closeModal() {
    document.getElementById("actionModal").style.display = "none";
    document.getElementById("shareModal").style.display = "none";
}

function closeModalItem() {
    document.getElementById("actionModalItem").style.display = "none";
}



// Adicione esta função para verificar o telefone do devedor
async function checkDebtorPhone() {
    const phone = document.getElementById('modalDebtorPhone').value;
    if (!phone) {
        document.getElementById('debtorInfo').style.display = 'none';
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/users/${phone}`);
        if (!response.ok) throw new Error('Usuário não encontrado');

        const user = await response.json();
        document.getElementById('debtorInfo').textContent = `Devedor: ${user.name}`;
        document.getElementById('debtorInfo').style.display = 'block';
        return user._id;
    } catch (error) {
        document.getElementById('debtorInfo').textContent = 'Usuário não encontrado';
        document.getElementById('debtorInfo').style.color = 'red';
        document.getElementById('debtorInfo').style.display = 'block';
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('modalDebtorCheckbox');
    const phoneContainer = document.getElementById('debtorPhoneContainer');

    checkbox.addEventListener('change', () => {
        phoneContainer.style.display = checkbox.checked ? 'block' : 'none';
    });
});

// Modifique a função saveItem para lidar com a vinculação
async function saveItem() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const idUser = currentUser.idUser;
    const nome = document.getElementById("modalNome").value;
    const valor = parseFloat(document.getElementById("modalValor").value) || 0;
    const data = document.getElementById("modalData").value;
    const paid = document.getElementById("modalPaid").checked;
    const isRecurring = document.getElementById("modalRecurring").checked;
    const recurringMonths = parseInt(document.getElementById("modalRecurringMonths").value) || 1;

    // Só obtém o telefone do devedor se for uma receita
    const debtorPhone = currentType === "receita" ? document.getElementById("modalDebtorPhone").value : null;
    const isLinkedReceita = currentType === "receita" && debtorPhone;

    if (!nome || valor <= 0 || !data) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    // Verifica o devedor se for uma receita vinculada
    let debtorId = null;
    if (isLinkedReceita) {
        try {
            const response = await fetch(`${API_URL}/users/${debtorPhone}`);
            if (!response.ok) throw new Error('Usuário não encontrado');

            const user = await response.json();
            debtorId = user._id;
        } catch (error) {
            alert("Por favor, insira um telefone válido para o devedor.");
            return;
        }
    }

    const [year, month, day] = data.split("-");
    const baseDate = new Date(year, month - 1, day);

    let payload;

    if (editingId) {
        // Modo edição
        const whenPay = `${year}/${month}/${day}`;
        const item = {
            _id: editingId,
            name: nome,
            total: valor,
            idDebts: debtorId,
            whenPay: whenPay,
            paid: paid,
            values: [{
                name: nome,
                value: valor
            }]
        };

        if (isLinkedReceita) {
            item.isDebt = true;
            item.totalPaid = 0;
        }

        payload = {
            idUser,
            [currentType === "receita" ? "receitas" : "despesas"]: [item]
        };


    } else {
        // Modo adição
        const items = [];
        const totalMonths = isRecurring ? parseInt(recurringMonths) : 1;

        for (let i = 0; i < totalMonths; i++) {
            const currentDate = new Date(baseDate);
            currentDate.setMonth(baseDate.getMonth() + i);
            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            currentDate.setDate(Math.min(parseInt(day), lastDayOfMonth));

            const formattedDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
            const itemName = i === 0 ? nome : incrementName(nome, i);

            const item = {
                name: itemName,
                total: parseFloat(valor),
                idDebts: debtorId,
                isDebt: debtorId ? true : false,
                whenPay: formattedDate,
                paid: i === 0 ? paid : false,
                isRecurring: isRecurring && i === 0, // Marca apenas o primeiro como recorrente
                recurringMonths: isRecurring && i === 0 ? parseInt(recurringMonths) : undefined,
                values: [{ name: itemName, value: parseFloat(valor) }]
            };

            if (isLinkedReceita && i === 0) {
                item.isDebt = true;
                item.totalPaid = 0;
            }

            items.push(item);
        }

        payload = {
            idUser,
            [currentType === "receita" ? "receitas" : "despesas"]: items
        };

        // Se for uma receita vinculada, cria também a despesa correspondente
        if (isLinkedReceita) {
            try {
                // Primeiro cria a receita para obter o ID
                const receitaResponse = await fetch(`${API_URL}/expenses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!receitaResponse.ok) throw new Error("Erro ao criar receita");

                await receitaResponse.json();

                // Cria as despesas correspondentes para o devedor, considerando a recorrência
                const despesaItems = [];
                for (let i = 0; i < totalMonths; i++) {
                    const currentDate = new Date(baseDate);
                    currentDate.setMonth(baseDate.getMonth() + i);
                    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    currentDate.setDate(Math.min(parseInt(day), lastDayOfMonth));

                    const formattedDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
                    const itemName = i === 0 ? nome : incrementName(nome, i);

                    const despesaItem = {
                        name: itemName,
                        total: parseFloat(valor),
                        whenPay: formattedDate,
                        paid: false,
                        idOrigem: idUser,
                        isDebts: idUser ? true : false,
                        notify: false,
                        totalPaid: 0,
                        values: [{
                            name: itemName,
                            value: parseFloat(valor),
                            notify: false
                        }],
                        isRecurring: isRecurring && i === 0,
                        recurringMonths: isRecurring && i === 0 ? parseInt(recurringMonths) : undefined
                    };


                    despesaItems.push(despesaItem);
                }

                const despesaPayload = {
                    idUser: debtorId,
                    despesas: despesaItems
                };

                await fetch(`${API_URL}/expenses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(despesaPayload),
                });

                await fetchMonthData();
                closeModal();
                return;
            } catch (err) {
                console.error(err);
                alert("Erro ao vincular receita/despesa: " + err.message);
                return;
            }
        }
    }

    try {
        const method = editingId ? "PATCH" : "POST";
        const response = await fetch(`${API_URL}/expenses`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });


        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao salvar item: ${response.statusText} - ${errorText}`);
        }

        await fetchMonthData();
        closeModal();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}
// Adicione esta função para atualizar o status de pagamento
async function updatePaymentStatus(itemId, type, isPaid, isDebtor = false) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const idUser = currentUser.idUser;

    try {
        // Primeiro obtemos o item completo
        const expense = await Expense.findOne({ idUser });
        const items = type === 'receita' ? expense.receitas : expense.despesas;
        const item = items.find(i => i._id.toString() === itemId);

        if (!item) throw new Error('Item não encontrado');

        // Se for o cobrador atualizando uma receita vinculada
        if (type === 'receita' && item.isDebt) {
            item.paid = isPaid;

            // Atualiza também a despesa correspondente do devedor
            if (item.idOrigem) {
                await Expense.updateOne(
                    { "despesas._id": item.idOrigem },
                    { $set: { "despesas.$.paid": isPaid } }
                );
            }
        }
        // Se for o devedor atualizando uma despesa vinculada
        else if (type === 'despesa' && item.idOrigem) {
            // Marca apenas o item específico como notificado
            const valueIndex = item.values.findIndex(v => v._id.toString() === valueId);
            if (valueIndex !== -1) {
                item.values[valueIndex].notify = true;

                // Atualiza também a receita correspondente do cobrador
                await Expense.updateOne(
                    { "receitas._id": item.idOrigem },
                    {
                        $push: {
                            "receitas.$.values": {
                                name: item.values[valueIndex].name,
                                value: item.values[valueIndex].value,
                                paid: false,
                                notify: true
                            }
                        }
                    }
                );
            }
        }
        // Caso normal (não vinculado)
        else {
            item.paid = isPaid;
        }

        await expense.save();
        await fetchMonthData();
    } catch (err) {
        console.error(err);
        alert("Erro ao atualizar status de pagamento");
    }
}

async function saveValuesItem() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const idUser = currentUser.idUser;
    const nome = document.getElementById("modalNomeItem").value;
    const valor = parseFloat(document.getElementById("modalValorItem").value) || 0;
    const paid = document.getElementById("modalPaidItem").checked;
    const notify = document.getElementById("modalNotifyItem").checked;
    const selectedReceitaId = document.getElementById("cobradorReceitasSelect")?.value;

    if (!nome || valor <= 0) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    let payload;

    if (currentType === "receita") {
        const findReceitas = receitas.find(item => item.id === idItemExpense);
        // Soma o novo valor ao total existente
        const newTotal = findReceitas.total + valor;
        // Atualiza totalPaid apenas se o item estiver marcado como pago
        const newTotalPaid = paid ? (findReceitas.totalPaid || 0) + valor : findReceitas.totalPaid || 0;

        const item = {
            _id: findReceitas.id,
            name: findReceitas.name,
            total: newTotal,
            totalPaid: newTotalPaid,
            whenPay: findReceitas.whenPay,
            paid: findReceitas.paid,
            isDebt: findReceitas.isDebt,
            idDebts: findReceitas.idDebts,
            values: [...findReceitas.values, { name: nome, value: valor, paid, notify: false }],
        };

        payload = { idUser, receitas: [item] };

        // Se for receita vinculada, atualizar a despesa correspondente
        if (findReceitas.isDebt && findReceitas.idDebts) {
            await updateDespesaDevedor(findReceitas.idDebts, findReceitas.id, nome, valor, paid);
        }
    } else {
        const findDespesas = despesas.find(item => item.id === idItemExpense);
        // Soma o novo valor ao total existente
        const newTotal = findDespesas.total + valor;
        // Atualiza totalPaid apenas se notify for true
        const newTotalPaid = notify ? (findDespesas.totalPaid || 0) + valor : findDespesas.totalPaid || 0;

        const item = {
            _id: findDespesas.id,
            name: findDespesas.name,
            total: newTotal,
            totalPaid: newTotalPaid,
            whenPay: findDespesas.whenPay,
            paid: findDespesas.paid,
            idOrigem: findDespesas.idOrigem,
            values: [...findDespesas.values, { name: nome, value: valor, paid: false, notify }],
        };

        payload = { idUser, despesas: [item] };

        // Se for despesa vinculada e notify for true, atualizar a receita do cobrador
        if (notify && findDespesas.idOrigem && selectedReceitaId) {
            await updateReceitaCobrador(findDespesas.idOrigem, selectedReceitaId, nome, valor);
        }
    }

    try {
        const method = idItemExpense ? "PATCH" : "POST";
        const response = await fetch(`${API_URL}/expenses-item`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao salvar item: ${response.statusText} - ${errorText}`);
        }
        await fetchMonthData();
        closeModalItem();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

async function updateReceitaCobrador(cobradorId, receitaId, nome, valor) {
    try {
        const response = await fetch(`${API_URL}/expenses/${cobradorId}`);
        if (!response.ok) throw new Error("Erro ao buscar receitas do cobrador");
        const expenseData = await response.json();
        const receita = expenseData.receitas.find(r => r._id === receitaId);

        if (receita) {
            const payload = {
                idUser: cobradorId,
                receitas: [{
                    _id: receita._id,
                    name: receita.name,
                    total: receita.total,
                    totalPaid: receita.totalPaid,
                    whenPay: receita.whenPay,
                    paid: receita.paid,
                    isDebt: receita.isDebt,
                    idDebts: receita.idDebts,
                    values: [...receita.values, { name, value: valor, paid: false, notify: true }],
                }],
            };

            const updateResponse = await fetch(`${API_URL}/expenses-item`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!updateResponse.ok) throw new Error("Erro ao atualizar receita do cobrador");
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao atualizar receita do cobrador.");
    }
}

async function updateDespesaDevedor(devedorId, receitaId, nome, valor, paid) {
    try {
        const response = await fetch(`${API_URL}/expenses/${devedorId}`);
        if (!response.ok) throw new Error("Erro ao buscar despesas do devedor");
        const expenseData = await response.json();
        const despesa = expenseData.despesas.find(d => d.idOrigem === receitaId);

        if (despesa) {
            const newTotal = paid ? despesa.total : despesa.total + valor;
            const newTotalPaid = paid ? despesa.totalPaid + valor : despesa.totalPaid;

            const payload = {
                idUser: devedorId,
                despesas: [{
                    _id: despesa._id,
                    name: despesa.name,
                    total: newTotal,
                    totalPaid: newTotalPaid,
                    whenPay: despesa.whenPay,
                    paid: despesa.paid,
                    idOrigem: despesa.idOrigem,
                    values: [...despesa.values, { name, value: valor, paid: false, notify: false }],
                }],
            };

            const updateResponse = await fetch(`${API_URL}/expenses-item`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!updateResponse.ok) throw new Error("Erro ao atualizar despesa do devedor");
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao atualizar despesa do devedor.");
    }
}

function updateLists() {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const filterByMonth = (items) => items.filter(item => {
        return parseInt(item.whenPay.split("-")[0]) === currentYear && parseInt(item.whenPay.split("-")[1]) === currentMonth;
    });

    const receitasFiltradas = filterByMonth(receitas);
    const despesasFiltradas = filterByMonth(despesas);

    totalReceitas = receitasFiltradas.reduce((sum, r) => sum + r.total, 0);
    totalDespesas = despesasFiltradas.reduce((sum, d) => sum + d.total, 0);
    document.getElementById("receitasList").innerHTML = receitasFiltradas.length ?
        receitasFiltradas.map(item => createListItem(item, "receita", totalReceitas)).join("") :
        "<p>Nenhuma receita cadastrada</p>";

    document.getElementById("despesasList").innerHTML = despesasFiltradas.length ?
        despesasFiltradas.map(item => createListItem(item, "despesa", totalDespesas)).join("") :
        "<p>Nenhuma despesa cadastrada</p>";

    document.getElementById("receitasList").addEventListener("click", handleOptionsClick);
    document.getElementById("despesasList").addEventListener("click", handleOptionsClick);
}

function handleOptionsClick(event) {
    const trigger = event.target.closest(".options-trigger");
    if (trigger) {
        const id = trigger.getAttribute("data-id");
        showOptions(event, id);
    }
}

function createListItem(item, type) {
    const sharedBadge = item.shared ? `
        <span class="shared-badge" title="Compartilhado por: ${item.sharedBy || 'Número desconhecido'}">
            <i class="fas fa-share-alt"></i>
        </span>` : '';

    const internalItemsHTML = item.values?.length ? `
        <div class="accordion-content">
            ${item.values.map(v => {
        const borderStyle = v.notify && !v.paid ? 'border: 2px solid yellow' : '';
        return `
                    <div class="list-item internal-item" data-id="${item.id}-${v._id}" style="${borderStyle}">
                        <span class="item-name" onclick="toggleAccordion('${item.id}-${v._id}')">${v.name}</span>
                        <div class="value-container">
                            <span class="item-value">${v.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                            <span class="options-trigger" data-id="${item.id}-${v._id}" data-type="${type}" data-internal="true" data-internal-id="${v._id}">⋯</span>
                        </div>
                    </div>
                `;
    }).join("")}
        </div>` : "";

    return `
        <div class="list-container" data-id="${item.id}">
            <div class="list-header">
                <span class="item-name" onclick="toggleAccordion('${item.id}')">${sharedBadge} ${item.name}</span>
                <div class="value-container">
                    <span class="item-value">${item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    <span class="accordion-toggle" onclick="toggleAccordion('${item.id}')"><i class="fas fa-chevron-down"></i></span>
                    <span class="options-trigger" data-id="${item.id}" data-type="${type}">⋯</span>
                </div>
            </div>
            <div class="accordion" id="accordion-${item.id}">
                ${internalItemsHTML}
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById("userInitials")) {
        loadFinances();
    }
});

function showOptions(event, id) {
    event.stopPropagation();
    event.preventDefault();

    const existingMenus = document.querySelectorAll('.options-menu');
    existingMenus.forEach(menu => menu.remove());

    const trigger = event.target.closest('.options-trigger') || event.target;
    const type = trigger.getAttribute('data-type');
    currentType = type;

    const isInternal = trigger.hasAttribute('data-internal');

    const optionsMenu = document.createElement('div');
    optionsMenu.className = 'options-menu';
    optionsMenu.style.position = 'absolute';
    optionsMenu.style.zIndex = '1000';
    optionsMenu.style.background = 'white';
    optionsMenu.style.border = '1px solid #ccc';
    optionsMenu.style.padding = '5px';
    optionsMenu.style.borderRadius = '4px';

    if (isInternal) {
        optionsMenu.innerHTML = `
            <button onclick="openViewItemModal('${type}', '${id}')">Visualizar</button>
            <button onclick="openEditItemModal('edit','${type}', '${id}')">Editar</button>
            <button onclick="openEditItemModal('delete','${type}','${id}')">Deletar</button>
        `;
    } else {
        optionsMenu.innerHTML = `
            <button onclick="openActionModalItem('${type}', '${id}')">+ ${type === 'receita' ? 'Receita' : 'Despesa'}</button>
            <button onclick="openActionModal('view', '${type}', getItemById('${id}'))">Visualizar</button>
            <button onclick="openActionModal('edit', '${type}', getItemById('${id}'))">Editar</button>
            <button onclick="openActionModal('delete', '${type}', getItemById('${id}'))">Deletar</button>
        `;
    }

    trigger.appendChild(optionsMenu);

    // Posicionamento dinâmico
    const rect = trigger.getBoundingClientRect();
    optionsMenu.style.top = `${rect.bottom + window.scrollY}px`;
    optionsMenu.style.left = `${rect.left + window.scrollX}px`;

    document.addEventListener('click', function closeMenu(e) {
        if (!optionsMenu.contains(e.target)) {
            optionsMenu.remove();
            document.removeEventListener('click', closeMenu);
        }
    }, { once: true });
}

// Adicione estas novas funções para lidar com pagamentos
async function notifyPayment(itemId, valueId) {
    try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const response = await fetch(`${API_URL}/expenses/payment`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idUser: currentUser.idUser,
                itemId,
                type: 'despesa',
                valueId,
                isPaid: false // Apenas marca como notificado
            })
        });

        if (!response.ok) throw new Error('Erro ao notificar pagamento');
        await fetchMonthData();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

async function confirmPayment(itemId, valueId, confirm) {
    try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const response = await fetch(`${API_URL}/expenses/payment`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idUser: currentUser.idUser,
                itemId,
                type: 'receita',
                valueId,
                isPaid: confirm
            })
        });

        if (!response.ok) throw new Error('Erro ao confirmar pagamento');
        await fetchMonthData();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

async function toggleReceitaPaid(itemId, isPaid) {
    try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const response = await fetch(`${API_URL}/expenses/payment`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idUser: currentUser.idUser,
                itemId,
                type: 'receita',
                isPaid
            })
        });

        if (!response.ok) throw new Error('Erro ao atualizar status de pagamento');
        await fetchMonthData();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

function showOptions(event, id) {
    // Impede a propagação do evento
    event.stopPropagation();
    event.preventDefault();

    // Remove qualquer menu de opções existente
    const existingMenus = document.querySelectorAll('.options-menu');
    existingMenus.forEach(menu => menu.remove());

    // Obtém o elemento que disparou o evento
    const trigger = event.target.closest('.options-trigger') || event.target;

    // Obtém o tipo (receita/despesa) do atributo data-type
    const type = trigger.getAttribute('data-type');

    currentType = type;

    // Verifica se é um item interno
    const isInternal = trigger.hasAttribute('data-internal');

    // Cria o menu de opções
    const optionsMenu = document.createElement('div');
    optionsMenu.className = 'options-menu';
    optionsMenu.style.display = 'block';
    optionsMenu.style.position = 'absolute';
    optionsMenu.style.right = '0';
    optionsMenu.style.zIndex = '1000';

    // Adiciona as opções conforme o tipo de item
    if (isInternal) {
        optionsMenu.innerHTML = `
           <button onclick="openViewItemModal('${type}', '${id}')">Visualizar</button>
            <button onclick="openEditItemModal('edit','${type}', '${id}')">Editar</button>
            <button onclick="openEditItemModal('delete','${type}','${id}')">Deletar</button>
        `;
    } else {
        optionsMenu.innerHTML = `
            <button onclick="openActionModalItem('${type}', '${id}')">+ ${type === 'receita' ? 'Receita' : 'Despesa'}</button>
            <button onclick="openActionModal('view', '${type}', getItemById('${id}'))">Visualizar</button>
            <button onclick="openActionModal('edit', '${type}', getItemById('${id}'))">Editar</button>
            <button onclick="openActionModal('delete', '${type}', getItemById('${id}'))">Deletar</button>
        `;
    }

    // Adiciona o menu ao elemento que foi clicado
    trigger.appendChild(optionsMenu);

    // Fecha o menu quando clicar fora
    document.addEventListener('click', function closeMenu(e) {
        if (!optionsMenu.contains(e.target)) {
            optionsMenu.remove();
            document.removeEventListener('click', closeMenu);
        }
    }, { once: true });
}

function handleInternalAction(action, fullId) {
    const [parentId, itemId] = fullId.split('-');
    const item = getInternalItem(fullId);

    if (!item) {
        console.error('Item interno não encontrado:', fullId);
        return;
    }

    if (action === 'delete') {
        confirmDeleteInternal(fullId);
    } else {
        // Obtenha o tipo correto do elemento que disparou o evento
        const triggerElement = document.querySelector(`[data-id="${fullId}"]`);
        const type = triggerElement ? triggerElement.getAttribute('data-type') : currentType;

        if (!type) {
            console.error('Tipo não encontrado para o item:', fullId);
            return;
        }

        openActionModal(action, type, {
            ...item,
            id: fullId,
            name: item.name,
            value: item.value,
            whenPay: getItemById(parentId)?.whenPay || new Date().toISOString(),
            paid: getItemById(parentId)?.paid || false
        });
    }
}

// Função para visualizar itens (apenas leitura)
function openViewItemModal(type, id) {
    const item = id.includes('-') ? getInternalItem(id) : getItemById(id);
    if (!item) return;
    const modal = document.getElementById("actionModalItem");
    const modalTitle = document.getElementById("modalTitleItem");
    const modalButtons = document.getElementById("modalButtonsItem");

    modalTitle.textContent = `Visualizar ${type === 'receita' ? 'Receita' : 'Despesa'}`;

    // Preenche os campos (só leitura)
    document.getElementById("modalNomeItem").value = item.name;
    document.getElementById("modalValorItem").value = id.includes('-') ? item.value : item.total;

    // Desabilita todos os campos
    ['modalNomeItem', 'modalValorItem'].forEach(id => {
        document.getElementById(id).disabled = true;
    });

    modalButtons.innerHTML = `<button class="btn" onclick="closeModalItem()">Fechar</button>`;
    modal.style.display = "block";
}

// Função para editar itens
function openEditItemModal(action, type, id) {
    const item = id.includes('-') ? getInternalItem(id) : getItemById(id);
    if (!item) return;

    currentType = type;
    editingId = id;

    const modal = document.getElementById("actionModalItem");
    const modalTitle = document.getElementById("modalTitleItem");
    const modalButtons = document.getElementById("modalButtonsItem");
    const titlePrefix = type === "receita" ? "Receita" : "Despesa";

    modalTitle.textContent = action === "edit" ? `Editar ${titlePrefix}` : `Deletar ${titlePrefix}`;

    // Preenche os campos (editáveis)

    if (action !== "add") {
        document.getElementById("modalNomeItem").value = item.name;
        document.getElementById("modalValorItem").value = id.includes('-') ? item.value : item.total;
    }

    modalButtons.innerHTML = "";
    if (action === "edit") {
        modalButtons.innerHTML = `
            <button class="btn-secundary" onclick="closeModalItem()">Cancelar</button>
            <button class="btn" onclick="saveValuesItem()" ${item?.shared ? 'disabled' : ''}>Salvar</button>
        `;
    } else if (action === "delete") {
        modalButtons.innerHTML = `
            <button class="btn-secundary" onclick="closeModalItem()">Cancelar</button>
            <button class="btn" onclick="confirmDeleteInternal('${type}','${id}')" ${item?.shared ? 'disabled' : ''}>Confirmar</button>
        `;
    }
    modal.style.display = "block";
}

function getInternalItem(fullId) {
    if (!fullId.includes('-')) return null;

    const [parentId, itemId] = fullId.split('-');
    const parent = getItemById(parentId);
    if (!parent) return null;

    const internalItem = parent.values.find(v => v._id === itemId);
    if (!internalItem) return null;

    return {
        ...internalItem,
        id: fullId,
        parentId: parentId,
        whenPay: parent.whenPay,
        paid: parent.paid
    };
}

function getItemById(id) {
    const items = currentType === 'receita' ? receitas : despesas;
    return items.find(item => item.id === id);
}

async function confirmDelete(type, id) {
    getItemById(id)
    const idUser = JSON.parse(localStorage.getItem("currentUser")).idUser;
    try {
        const response = await fetch(`${API_URL}/expenses?idUser=${idUser}&type=${type}s&id=${id.split("-")[0]}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error(`Erro ao deletar item: ${response.statusText}`);
        await fetchMonthData();
        closeModal();
    } catch (err) {
        console.error(err);
        alert("Erro ao deletar item.");
    }
}

async function confirmDeleteInternal(type, id) {

    const idUser = JSON.parse(localStorage.getItem("currentUser")).idUser;
    const [parentId, internalId] = id.split("-");

    try {
        const response = await fetch(`${API_URL}/expenses-item?idUser=${idUser}&type=${type}s&id=${parentId}&valuesId=${internalId}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error(`Erro ao deletar item: ${response.statusText}`);
        await fetchMonthData();
        closeModalItem();
    } catch (err) {
        console.error(err);
        alert("Erro ao deletar item.");
    }
}

function calculateColors() {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const filterByMonth = (items) => items.filter(item => {
        return parseInt(item.whenPay.split("/")[0]) === currentYear && parseInt(item.whenPay.split("/")[1]) === currentMonth;
    });

    const saldoRestante = totalReceitas - totalDespesas;
    const percentage = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;

    let colorDespesa = percentage > 95 ? "#ff3333" : percentage > 75 ? "#ff9999" : percentage > 50 ? "#ffcc99" : "#ff9999";
    let colorReceita = percentage > 95 ? "#ff3333" : percentage > 75 ? "#ffff99" : percentage > 50 ? "#ffff99" : "#9cff99";

    document.getElementById("border-receitas-card").style.borderColor = colorReceita;
    document.getElementById("border-despesas-card").style.borderColor = colorDespesa;

    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("totalDespesas").textContent = formatCurrency(totalDespesas);
    document.getElementById("saldoRestante").textContent = formatCurrency(saldoRestante);
    document.getElementById("saldoRestante").style.color = saldoRestante >= 0 ? "#2ecc71" : "#e74c3c";
}

function openShareModal() {
    document.getElementById("shareModal").style.display = "block";
}

async function shareData() {
    const shareidUser = document.getElementById("shareidUser").value;
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentidUser = currentUser.idUser;

    if (!shareidUser) {
        alert("Por favor, insira um número de telefone para compartilhar.");
        return;
    }

    if (shareidUser === currentidUser) {
        alert("Você não pode compartilhar com o mesmo telefone.");
        return;
    }

    const payload = { idUser: currentidUser, idUserShared: shareidUser };
    try {
        const response = await fetch(`${API_URL}/expenses`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`Erro ao compartilhar dados: ${response.statusText}`);
        currentUser.idUserShared = shareidUser;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        alert(`Dados compartilhados com sucesso para ${shareidUser}!`);
        closeModal();
        await fetchMonthData();
    } catch (err) {
        alert("Erro ao compartilhar os dados.");
    }
}

function openReportModal() {
    const modal = document.getElementById("reportModal");
    const reportSummary = document.getElementById("reportSummary");

    // Define o intervalo: mês atual + próximos 11 meses
    const startDate = new Date(currentDate);
    startDate.setDate(1); // Primeiro dia do mês atual
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 11);

    const despesasPorMes = {};
    const receitasPorMes = {};

    // Inicializa os meses no relatório
    for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);
        // Formata o mês diretamente
        const monthYear = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toLowerCase());
        despesasPorMes[monthYear] = 0;
        receitasPorMes[monthYear] = 0;
    }

    // Função para parsear whenPay (formato YYYY/MM/DD)
    const parseDate = (dateStr) => {
        const [year, month, day] = dateStr.split('/');
        return new Date(year, month - 1, day);
    };

    // Agrega despesas
    despesas.forEach(item => {
        const itemDate = parseDate(item.whenPay);
        if (itemDate >= startDate && itemDate <= endDate) {
            // Formata o mês diretamente
            const monthYear = itemDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toLowerCase());
            despesasPorMes[monthYear] += item.total;
        }
    });

    // Agrega receitas
    receitas.forEach(item => {
        const itemDate = parseDate(item.whenPay);
        if (itemDate >= startDate && itemDate <= endDate) {
            // Formata o mês diretamente
            const monthYear = itemDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toLowerCase());
            receitasPorMes[monthYear] += item.total;
        }
    });

    // Formata valores para exibição
    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Gera a tabela HTML
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Mês</th>
                    <th>Despesa</th>
                    <th>Receita</th>
                </tr>
            </thead>
            <tbody>
    `;
    Object.keys(despesasPorMes).forEach(monthYear => {
        html += `
            <tr>
                <td>${monthYear}</td>
                <td>${formatCurrency(despesasPorMes[monthYear])}</td>
                <td>${formatCurrency(receitasPorMes[monthYear])}</td>
            </tr>
        `;
    });
    html += "</tbody></table>";

    reportSummary.innerHTML = html;
    modal.style.display = "block";
}

function closeReportModal() {
    document.getElementById("reportModal").style.display = "none";
}

if (document.getElementById("userInitials")) {
    loadFinances();
}

window.toggleAccordion = toggleAccordion;
window.openActionModal = openActionModal;
window.openActionModalItem = openActionModalItem;
window.closeModal = closeModal;
window.saveItem = saveItem;
window.confirmDelete = confirmDelete;
window.openShareModal = openShareModal;
window.shareData = shareData;
window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;
window.addInternalItem = addInternalItem;
window.removeInternalItem = removeInternalItem;