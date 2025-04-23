
//frontend/js/expense.js
let currentDate = new Date();
let currentType = '';
let editingId = null;
let idExpense = null;
let idItemExpense = null;
let totalReceber;
let totalPago;
let totalRecebido;
let totalPagar;
const receitas = [];
const despesas = [];
// Função para gerar UUIDs
if (typeof uuidv4 !== 'function') {
    window.uuidv4 = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
}
function loadFinances() {
    // Inicializar interface comum
    initializeUserInterface();

    // Carregar dados financeiros
    fetchMonthData();
    updateMonth();
}

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
                        isDebt: item.isDebt,
                        idDebts: item.idDebts,
                        idDespesa: item.idDespesa,
                        paid: item.paid,
                        totalPaid: item.totalPaid,
                        notify: item.notify,
                        values: item.values || [{ name: item.name, value: item.total, paid: item.paid, notify: item.notify }],
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
                    idOrigem: item.idOrigem,
                    isDebt: item.isDebt,
                    notify: item.notify,
                    idReceita: item.idReceita,
                    totalPaid: item.totalPaid,
                    paid: item.paid,
                    values: item.values || [{ name: item.name, value: item.total, paid: item.paid, notify: item.notify }],
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

function openActionModalItem(type, id) {
    const modalTitle = document.getElementById("modalTitleItem");
    modalTitle.textContent = `Nova ${type === "receita" ? "Receita" : "Despesa"}`;

    currentType = type;
    idItemExpense = id;

    const modal = document.getElementById("actionModalItem");
    const modalButtons = document.getElementById("modalButtonsItem");
    const paidCheckbox = document.getElementById("modalPaidItem");
    const notifyCheckbox = document.getElementById("modalNotifyItem");
    const notifyContant = document.getElementById("notify-content")
    document.getElementById("modalNomeItem").disabled = false;
    document.getElementById("modalValorItem").disabled = false;
    paidCheckbox.disabled = false;

    // Limpar campos
    document.getElementById("modalNomeItem").value = "";
    document.getElementById("modalValorItem").value = "";
    paidCheckbox.checked = false;
    notifyCheckbox.checked = false;

    // Se for despesa (devedor), carregar receitas do cobrador
    if (type === "despesa") {
        const despesa = despesas.find(item => item.id === id);
        if (despesa?.idOrigem && despesa?.isDebt) {
            notifyContant.disabled = false
            notifyContant.style.display = "block";
            paidCheckbox.disabled = true;
            notifyCheckbox.style.display = "block";
            notifyCheckbox.disabled = true;
            notifyCheckbox.checked = true;
            paidCheckbox.checked = false;
        } else {
            notifyCheckbox.style.display = "none";
        }
    } else {
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

// Função para editar itens
function openDeleteItemModal(type, id) {
    const action = "delete";
    const item = id.includes('-') ? getInternalItem(id) : getItemById(id);
    if (!item) return;



    currentType = type;
    editingId = id;

    const modal = document.getElementById("actionModalItem");
    const modalTitle = document.getElementById("modalTitleItem");
    const modalButtons = document.getElementById("modalButtonsItem");
    const titlePrefix = type === "receita" ? "Receita" : "Despesa";

    modalTitle.textContent = action === "edit" ? `Editar ${titlePrefix}` : `Deletar ${titlePrefix}`;

    document.getElementById("modalNomeItem").value = item.name;
    document.getElementById("modalValorItem").value = id.includes('-') ? item.value : item.total;
    document.getElementById("modalPaidItem").checked = item.paid;
    document.getElementById("modalNomeItem").disabled = true;
    document.getElementById("modalValorItem").disabled = true;
    document.getElementById("modalPaidItem").disabled = true
    modalButtons.innerHTML = "";

    modalButtons.innerHTML = `
            <button class="btn-secundary" onclick="closeModalItem()">Cancelar</button>
            <button class="btn" onclick="confirmDeleteInternal('${type}','${id}')" ${item?.shared ? 'disabled' : ''}>Confirmar</button>
        `;
    modal.style.display = "block";
}

function openEditItemModal(type, id) {
    // Redefinir estados dos campos
    const modalNomeItem = document.getElementById("modalNomeItem");
    const modalValorItem = document.getElementById("modalValorItem");
    const paidCheckbox = document.getElementById("modalPaidItem");
    const notifyCheckbox = document.getElementById("modalNotifyItem");
    const notifyContent = document.getElementById("notify-content");

    modalNomeItem.disabled = false;
    modalValorItem.disabled = false;
    paidCheckbox.disabled = false;
    notifyCheckbox.disabled = false;
    notifyCheckbox.style.display = "none";
    notifyContent.style.display = "none";

    // Configurar título
    const modalTitle = document.getElementById("modalTitleItem");
    modalTitle.textContent = `Editar ${type === "receita" ? "Receita" : "Despesa"}`;

    // Obter dados do item
    const itemInternal = getInternalItem(id);
    const item = getItemById(id.split('-')[0]);

    if (!item && !itemInternal) return;

    // Armazenar ID e tipo
    idItemExpense = id;
    currentType = type;
    editingId = id;

    // Preencher campos
    modalNomeItem.value = itemInternal.name;
    modalValorItem.value = id.includes('-') ? itemInternal.value : itemInternal.total;
    paidCheckbox.checked = itemInternal.paid;
    notifyCheckbox.checked = itemInternal.notify;

    // Aplicar bloqueios para despesas
    if (type === "despesa") {
        if (itemInternal.paid === false && itemInternal.notify === true) {
            modalNomeItem.disabled = true;
            modalValorItem.disabled = true;
            notifyContent.style.display = "block";
            paidCheckbox.disabled = true;
            notifyCheckbox.style.display = "block";
            notifyCheckbox.disabled = true;
            notifyCheckbox.checked = true;
        } else {
            notifyCheckbox.style.display = "none";
        }
    } else {
        paidCheckbox.disabled = false;
        notifyCheckbox.style.display = "none";
    }

    // Configurar botões
    const modalButtons = document.getElementById("modalButtonsItem");
    modalButtons.innerHTML = `
        <button class="btn-secundary" onclick="closeModalItem()">Cancelar</button>
        ${item?.shared || type === "despesa" && itemInternal.paid === false && itemInternal.notify === true ? '' : `<button class="btn" onclick="editValuesItem('${type}','${id}')">Salvar</button>`}
    `;

    // Exibir modal
    const modal = document.getElementById("actionModalItem");
    modal.style.display = "block";
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
            total: paid ? 0 : valor,
            whenPay: whenPay,
            paid: paid,
            totalPaid: paid ? valor : 0,
            isRecurring: isRecurring,
            recurringMonths: isRecurring ? recurringMonths : undefined,
            values: [{ name: nome, value: valor, paid, notify: false, uuid: uuidv4() }]
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
        const namesIncremental = [];
        const uuids = []; // Array para armazenar UUIDs para cada mês

        // Gera UUIDs para cada mês
        for (let i = 0; i < totalMonths; i++) {
            uuids.push(uuidv4());
        }

        for (let i = 0; i < totalMonths; i++) {
            const currentDate = new Date(baseDate);
            currentDate.setMonth(baseDate.getMonth() + i);
            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            currentDate.setDate(Math.min(parseInt(day), lastDayOfMonth));

            const formattedDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
            const itemName = i === 0 ? nome : incrementName(nome, i);
            namesIncremental.push(itemName);

            const item = {
                name: itemName,
                total: i === 0 && paid ? 0 : parseFloat(valor),
                idDebts: debtorId,
                isDebt: debtorId !== null ? true : false,
                whenPay: formattedDate,
                totalPaid: i === 0 && paid ? parseFloat(valor) : 0,
                paid: i === 0 ? paid : false,
                isRecurring: isRecurring && i === 0,
                recurringMonths: isRecurring && i === 0 ? parseInt(recurringMonths) : undefined,
                values: [{ name: itemName, value: parseFloat(valor), paid: i === 0 ? paid : false, notify: false, uuid: uuids[i] }]
            };

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
                let receitaId = [];
                const receitaCobrador = await receitaResponse.json();

                for (let i = 0; i < namesIncremental.length; i++) {
                    receitaCobrador.receitas.filter(receitaFind => {
                        if (receitaFind.idDebts === debtorId && receitaFind.name === namesIncremental[i]) {
                            receitaFind.values.filter((receitaFilter) => {
                                if (receitaFilter.name === namesIncremental[i] && receitaFilter.value === valor && receitaFilter.uuid === uuids[i]) {
                                    receitaId.push({ id: receitaFind._id, name: namesIncremental[i], uuid: uuids[i] });
                                }
                            });
                        }
                    });
                }

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
                        total: i === 0 && paid ? 0 : parseFloat(valor),
                        whenPay: formattedDate,
                        paid: paid,
                        idOrigem: idUser,
                        isDebt: idUser ? true : false,
                        notify: false,
                        idReceita: receitaId.find(r => r.name === itemName)?.id || null,
                        totalPaid: i === 0 && paid ? parseFloat(valor) : 0,
                        values: [{
                            name: itemName,
                            value: parseFloat(valor),
                            paid: false,
                            notify: false,
                            uuid: uuids[i] // Usa o mesmo UUID da receita correspondente
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

                const despesaResponse = await fetch(`${API_URL}/expenses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(despesaPayload),
                });

                if (!despesaResponse.ok) throw new Error("Erro ao criar despesa");
                const despesaId = [];
                const despesaDevedor = await despesaResponse.json();

                for (let i = 0; i < namesIncremental.length; i++) {
                    despesaDevedor.despesas.filter(despesaFind => {
                        if (despesaFind.idOrigem === idUser && despesaFind.name === namesIncremental[i]) {
                            despesaFind.values.filter((despesaFilter) => {
                                if (despesaFilter.name === namesIncremental[i] && despesaFilter.value === valor && despesaFilter.uuid === uuids[i]) {
                                    despesaId.push({
                                        idUser: despesaFind.idOrigem,
                                        idReceita: despesaFind.idReceita,
                                        idDespesa: despesaFind._id,
                                    });
                                }
                            });
                        }
                    });
                }

                // Atualiza as receitas com os IDs das despesas
                for (const despesa of despesaId) {
                    await fetch(`${API_URL}/expenses/update-receita-despesa`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(despesa),
                    });
                }

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

    if (!nome || valor <= 0) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    // Gera um uuid único para o novo value
    const sharedUuid = uuidv4();

    let payload;

    if (currentType === "receita") {
        const findReceitas = receitas.find(item => item.id === idItemExpense);
        const newTotal = paid ? (findReceitas.total || 0) - valor : (findReceitas.total || 0) + valor;
        const newTotalPaid = paid ? (findReceitas.totalPaid || 0) + valor : findReceitas.totalPaid || 0;

        const item = {
            _id: findReceitas.id,
            name: findReceitas.name,
            total: newTotal,
            totalPaid: newTotalPaid,
            whenPay: findReceitas.whenPay,
            paid: findReceitas.paid,
            isDebt: findReceitas.isDebt,
            idDespesa: findReceitas.idDespesa,
            idDebts: findReceitas.idDebts,
            values: [...findReceitas.values, { name: nome, value: valor, paid, notify: false, uuid: sharedUuid }],
        };

        payload = { idUser, receitas: [item] };

        // Se for receita vinculada, atualizar a despesa correspondente
        if (findReceitas.isDebt && findReceitas.idDebts && findReceitas.idDespesa) {
            await updateDespesaDevedor(findReceitas.idDebts, findReceitas.idDespesa, nome, valor, paid, sharedUuid);
        }
    } else {
        const findDespesas = despesas.find(item => item.id === idItemExpense);
        let newTotalPaid = 0;
        let newTotal = 0;

        if (findDespesas.isDebt === true && paid === false && notify === true) {
            newTotal = findDespesas.total
            newTotalPaid = findDespesas.totalPaid;
        }
        if (!findDespesas.isDebt) {
            newTotal = paid ? findDespesas.total - valor : findDespesas.total + valor
            newTotalPaid = paid ? findDespesas.totalPaid + valor : findDespesas.totalPaid;
        }

        const item = {
            _id: findDespesas.id,
            name: findDespesas.name,
            total: newTotal,
            totalPaid: newTotalPaid,
            whenPay: findDespesas.whenPay,
            paid: findDespesas.paid,
            idOrigem: findDespesas.idOrigem,
            isDebt: findDespesas.isDebt,
            notify: findDespesas.notify,
            idReceita: findDespesas.idReceita,
            values: [...findDespesas.values, { name: nome, value: valor, paid: false, notify, uuid: sharedUuid }],
        };

        payload = { idUser, despesas: [item] };

        // Se for despesa vinculada e notify for true, atualizar a receita do cobrador
        if (findDespesas.isDebt && notify && findDespesas.idOrigem && findDespesas.idReceita) {
            await updateReceitaCobrador(findDespesas.idOrigem, findDespesas.idReceita, nome, paid, valor, notify, sharedUuid);
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

async function editValuesItem(type, id) {
    currentType = type
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const idUser = currentUser.idUser;
    const nome = document.getElementById("modalNomeItem").value;
    const valor = parseFloat(document.getElementById("modalValorItem").value) || 0;
    const paid = document.getElementById("modalPaidItem").checked;
    const notify = document.getElementById("modalNotifyItem").checked;

    if (!nome || valor <= 0) {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    // Obter os itens original e interno
    const item = getItemById(editingId.split('-')[0]);
    const itemInternal = getInternalItem(editingId);

    if (!item && !itemInternal) return;

    let payload;
    const sharedUuid = itemInternal.uuid; // Mantém o mesmo UUID

    if (currentType === "receita") {
        const findReceitas = receitas.find(r => r.id === item.id);

        // Encontra o item específico no array values
        const valueIndex = findReceitas.values.findIndex(v => v.uuid === sharedUuid);
        if (valueIndex === -1) {
            alert("Item não encontrado para edição");
            return;
        }

        // Calcula diferença de valor se o valor foi alterado
        const oldValue = findReceitas.values[valueIndex].value;
        const valueDiff = valor - oldValue;

        // Atualiza totais
        let newTotal = findReceitas.total;
        let newTotalPaid = findReceitas.totalPaid;

        if (paid) {
            // Se estava pago e continua pago, apenas ajusta o valor
            if (findReceitas.values[valueIndex].paid) {
                newTotalPaid += valueDiff;
            }
            // Se não estava pago e agora está
            else {
                newTotal -= valor;
                newTotalPaid += valor;
            }
        } else {
            // Se estava pago e agora não está
            if (findReceitas.values[valueIndex].paid) {
                newTotal += oldValue;
                newTotalPaid -= oldValue;
            }
            // Se não estava pago e continua não pago, apenas ajusta o valor
            else {
                newTotal += valueDiff;
            }
        }

        // Cria cópia atualizada dos values
        const updatedValues = [...findReceitas.values];
        updatedValues[valueIndex] = {
            ...updatedValues[valueIndex],
            name: nome,
            value: valor,
            paid,
            notify
        };

        const updatedItem = {
            _id: findReceitas.id,
            name: findReceitas.name,
            total: newTotal,
            totalPaid: newTotalPaid,
            whenPay: findReceitas.whenPay,
            paid: findReceitas.paid,
            isDebt: findReceitas.isDebt,
            idDespesa: findReceitas.idDespesa,
            idDebts: findReceitas.idDebts,
            values: updatedValues,
        };

        payload = {
            idUser,
            receitas: [updatedItem],
            uuid: sharedUuid // Envia o UUID para identificar qual item atualizar
        };

        // Atualização vinculada (se necessário)
        if (findReceitas.isDebt && findReceitas.idDebts && findReceitas.idDespesa) {
            await updateDespesa(findReceitas.idDebts, findReceitas.idDespesa, nome, valor, paid, notify, sharedUuid);
        }
    } else {
        const findDespesas = despesas.find(d => d.id === item.id);

        // Encontra o item específico no array values
        const valueIndex = findDespesas.values.findIndex(v => v.uuid === sharedUuid);
        if (valueIndex === -1) {
            alert("Item não encontrado para edição");
            return;
        }

        // Calcula diferença de valor se o valor foi alterado
        const oldValue = findDespesas.values[valueIndex].value;
        const valueDiff = valor - oldValue;

        // Atualiza totais para despesas normais
        let newTotal = findDespesas.total;
        let newTotalPaid = findDespesas.totalPaid;

        if (!findDespesas.isDebt) {
            if (paid) {
                // Se estava pago e continua pago, apenas ajusta o valor
                if (findDespesas.values[valueIndex].paid) {
                    newTotalPaid += valueDiff;
                }
                // Se não estava pago e agora está
                else {
                    newTotal -= valor;
                    newTotalPaid += valor;
                }
            } else {
                // Se estava pago e agora não está
                if (findDespesas.values[valueIndex].paid) {
                    newTotal += oldValue;
                    newTotalPaid -= oldValue;
                }
                // Se não estava pago e continua não pago, apenas ajusta o valor
                else {
                    newTotal += valueDiff;
                }
            }
        }

        // Cria cópia atualizada dos values
        const updatedValues = [...findDespesas.values];
        updatedValues[valueIndex] = {
            ...updatedValues[valueIndex],
            name: nome,
            value: valor,
            paid,
            notify
        };

        const updatedItem = {
            _id: findDespesas.id,
            name: findDespesas.name,
            total: newTotal,
            totalPaid: newTotalPaid,
            whenPay: findDespesas.whenPay,
            paid: findDespesas.paid,
            idOrigem: findDespesas.idOrigem,
            isDebt: findDespesas.isDebt,
            notify: findDespesas.notify,
            idReceita: findDespesas.idReceita,
            values: updatedValues,
        };

        payload = {
            idUser,
            despesas: [updatedItem],
            uuid: sharedUuid // Envia o UUID para identificar qual item atualizar
        };

        // Atualização vinculada (se necessário)
        if (notify && findDespesas.idOrigem && findDespesas.idReceita) {
            await updateReceitaCobrador(findDespesas.idOrigem, findDespesas.idReceita, nome, paid, valor, notify, sharedUuid);
        }
    }

    try {
        const response = await fetch(`${API_URL}/expenses-item`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao editar item: ${response.statusText} - ${errorText}`);
        }

        await fetchMonthData();
        closeModalItem();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}



async function updateReceitaCobrador(idOrigem, idReceita, nome, paid, valor, notify, uuid) {
    const idUser = idOrigem; // idOrigem é o idUser do cobrador
    const [expensesResponse] = await Promise.all([
        fetch(`${API_URL}/expenses/${idOrigem}`)
    ]);
    const expensesData = await expensesResponse.json();
    // Busca a receita existente
    const receita = expensesData.receitas.find(r => r._id === idReceita);
    if (!receita) {
        console.error('Receita não encontrada:', idReceita);
        return;
    }

    const newTotal = receita.total
    const newTotalPaid = receita.totalPaid

    const payload = {
        idUser,
        receitas: [{
            _id: idReceita,
            name: receita.name,
            total: newTotal,
            totalPaid: newTotalPaid,
            whenPay: receita.whenPay,
            paid: receita.paid,
            isDebt: receita.isDebt,
            idDespesa: receita.idDespesa,
            idDebts: receita.idDebts,
            notify: receita.notify,
            values: [...receita.values, { name: nome, value: valor, paid, notify, uuid }]
        }]
    };

    try {
        const response = await fetch(`${API_URL}/expenses-item`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao atualizar receita do cobrador: ${response.statusText} - ${errorText}`);
        }
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}
async function updateDespesa(idDebts, idDespesa, nome, valor, paid, notify, uuid) {
    const idUser = idDebts; // idDebts é o idUser do devedor
    const [expensesResponse] = await Promise.all([
        fetch(`${API_URL}/expenses/${idDebts}`)
    ]);

    const expensesData = await expensesResponse.json();

    // Busca a despesa existente
    const findDespesas = expensesData.despesas.find(d => d._id === idDespesa);
    // Encontra o item específico no array values
    const valueIndex = findDespesas.values.findIndex(v => v.uuid === uuid);
    if (valueIndex === -1) {
        alert("Item não encontrado para edição");
        return;
    }

    // Atualiza totais para despesas normais
    let newTotal = findDespesas.total;
    let newTotalPaid = findDespesas.totalPaid;

    if (paid) {
        newTotal = findDespesas.total - valor;
        newTotalPaid = findDespesas.totalPaid + valor;
    } else {
        // Se estava pago e agora não está
        if (findDespesas.values[valueIndex].paid) {
            newTotal = findDespesas.total + valor
            newTotalPaid = findDespesas.totalPaid - valor;
        }
    }

    // Cria cópia atualizada dos values
    const updatedValues = [...findDespesas.values];
    updatedValues[valueIndex] = {
        ...updatedValues[valueIndex],
        name: nome,
        value: valor,
        paid,
        notify: false
    };

    const updatedItem = {
        _id: idDespesa,
        name: findDespesas.name,
        total: newTotal,
        totalPaid: newTotalPaid,
        whenPay: findDespesas.whenPay,
        paid: findDespesas.paid,
        idOrigem: findDespesas.idOrigem,
        isDebt: findDespesas.isDebt,
        notify: findDespesas.notify,
        idReceita: findDespesas.idReceita,
        values: updatedValues,
    };

    payload = {
        idUser,
        despesas: [updatedItem],
        uuid: uuid // Envia o UUID para identificar qual item atualizar
    };

    console.log(payload)

    try {
        const response = await fetch(`${API_URL}/expenses-item`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao atualizar despesa do devedor: ${response.statusText} - ${errorText}`);
        }
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

async function updateDespesaDevedor(idDebts, idDespesa, nome, valor, paid, uuid) {
    const idUser = idDebts; // idDebts é o idUser do devedor
    const [expensesResponse] = await Promise.all([
        fetch(`${API_URL}/expenses/${idDebts}`)
    ]);

    const expensesData = await expensesResponse.json();

    // Busca a despesa existente
    const despesa = expensesData.despesas.find(d => d._id === idDespesa);
    if (!despesa) {
        console.error('Despesa não encontrada:', idDespesa);
        return;
    }

    const newTotal = paid ? despesa.total - valor : despesa.total + valor;
    const newTotalPaid = paid ? despesa.totalPaid + valor : despesa.totalPaid;

    const payload = {
        idUser,
        despesas: [{
            _id: idDespesa,
            name: despesa.name,
            total: newTotal,
            totalPaid: newTotalPaid,
            whenPay: despesa.whenPay,
            paid: despesa.paid,
            idOrigem: despesa.idOrigem,
            isDebt: despesa.isDebt,
            idReceita: despesa.idReceita,
            notify: despesa.notify,
            values: [...despesa.values, { name: nome, value: valor, paid, notify: false, uuid }]
        }]
    };


    try {
        const response = await fetch(`${API_URL}/expenses-item`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao atualizar despesa do devedor: ${response.statusText} - ${errorText}`);
        }
    } catch (err) {
        console.error(err);
        alert(err.message);
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

    totalRecebido = receitasFiltradas.reduce((sum, r) => sum + r.totalPaid, 0);
    totalPagar = despesasFiltradas.reduce((sum, d) => sum + d.total, 0);
    totalReceber = receitasFiltradas.reduce((sum, r) => sum + r.total, 0);
    totalPago = despesasFiltradas.reduce((sum, d) => sum + d.totalPaid, 0);
    document.getElementById("receitasList").innerHTML = receitasFiltradas.length ?
        receitasFiltradas.map(item => createListItem(item, "receita", totalRecebido)).join("") :
        "<p>Nenhuma receita cadastrada</p>";

    document.getElementById("despesasList").innerHTML = despesasFiltradas.length ?
        despesasFiltradas.map(item => createListItem(item, "despesa", totalPagar)).join("") :
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
                        <span class="item-name-accordion" onclick="toggleAccordion('${item.id}-${v._id}')">${v.name}</span>
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
            <button onclick="openEditItemModal('${type}', '${id}')">Editar</button>
            <button onclick="openDeleteItemModal('${type}','${id}')">Deletar</button>
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

function openViewItemModal(type, id) {
    const modalTitle = document.getElementById("modalTitleItem");
    modalTitle.textContent = `Visualizar ${type === "receita" ? "Receita" : "Despesa"}`;

    const itemInternal = getInternalItem(id);
    const item = getItemById(id.split('-')[0]);

    if (!item && !itemInternal) return;

    // Preencher campos como somente leitura
    document.getElementById("modalNomeItem").value = itemInternal.name;
    document.getElementById("modalNomeItem").disabled = true; // Somente leitura
    document.getElementById("modalValorItem").value = id.includes('-') ? itemInternal.value : itemInternal.total;
    document.getElementById("modalValorItem").disabled = true; // Somente leitura
    document.getElementById("modalPaidItem").checked = itemInternal.paid;
    document.getElementById("modalPaidItem").disabled = true; // Somente leitura
    document.getElementById("modalNotifyItem").style.display = "none"; // Ocultar notificação

    const modalButtons = document.getElementById("modalButtonsItem");
    modalButtons.innerHTML = `
        <button class="btn-secundary" onclick="closeModalItem()">Fechar</button>
    `;

    const modal = document.getElementById("actionModalItem");
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
        id: internalItem._id,
        name: internalItem.name,
        value: internalItem.value,
        uuid: internalItem?.uuid,
        paid: internalItem.paid,
        notify: internalItem.notify
    };
}

// Função auxiliar para obter item por ID
function getItemById(id) {
    const items = currentType === 'receita' ? receitas : despesas;
    return items.find(item => item.id === id);
}

async function confirmDelete(type, id) {
    const idUser = JSON.parse(localStorage.getItem("currentUser")).idUser;
    const parentId = id.split("-")[0]; // Garante que estamos lidando com o ID do item pai

    try {
        // Define o tipo atual e busca o item pai
        currentType = type;
        const parentItem = getItemById(parentId);
        if (!parentItem) {
            throw new Error("Item pai não encontrado.");
        }

        // Deleta o item atual (receita ou despesa)
        const response = await fetch(
            `${API_URL}/expenses?idUser=${idUser}&type=${type}s&id=${parentId}`,
            {
                method: "DELETE",
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao deletar item: ${response.statusText} - ${errorText}`);
        }

        // Verifica se o item está vinculado
        if (type === "receita" && parentItem.isDebt && parentItem.idDebts && parentItem.idDespesa) {
            // É uma receita vinculada, deletar a despesa correspondente do devedor
            await deleteCorrespondingDespesa(parentItem.idDebts, parentItem.idDespesa);
        } else if (type === "despesa" && parentItem.idOrigem && parentItem.idReceita) {
            // É uma despesa vinculada, deletar a receita correspondente do cobrador
            await deleteCorrespondingReceita(parentItem.idOrigem, parentItem.idReceita);
        }

        // Recarrega os dados financeiros
        await fetchMonthData();
        closeModal();
    } catch (err) {
        console.error(err);
        alert("Erro ao deletar item: " + err.message);
    }
}

// Função para deletar a despesa vinculada do devedor
async function deleteCorrespondingDespesa(idUserDevedor, idDespesa) {
    try {
        const response = await fetch(
            `${API_URL}/expenses?idUser=${idUserDevedor}&type=despesas&id=${idDespesa}`,
            {
                method: "DELETE",
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao deletar despesa vinculada: ${response.statusText} - ${errorText}`);
        }
    } catch (err) {
        console.error(err);
        throw new Error("Erro ao deletar despesa correspondente: " + err.message);
    }
}

// Função para deletar a receita vinculada do cobrador
async function deleteCorrespondingReceita(idUserCobrador, idReceita) {
    try {
        const response = await fetch(
            `${API_URL}/expenses?idUser=${idUserCobrador}&type=receitas&id=${idReceita}`,
            {
                method: "DELETE",
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao deletar receita vinculada: ${response.statusText} - ${errorText}`);
        }
    } catch (err) {
        console.error(err);
        throw new Error("Erro ao deletar receita correspondente: " + err.message);
    }
}

async function confirmDeleteInternal(type, id) {
    const idUser = JSON.parse(localStorage.getItem("currentUser")).idUser;
    const [parentId, internalId] = id.split("-");

    try {
        // Garante que currentType está definido corretamente
        currentType = type;

        // Busca o item pai (receita ou despesa)
        const parentItem = getItemById(parentId);
        if (!parentItem) {
            throw new Error("Item pai não encontrado.");
        }

        const internalItem = parentItem.values.find(v => v._id === internalId);
        if (!internalItem) {
            throw new Error("Item interno não encontrado.");
        }

        const uuidToDelete = internalItem.uuid;

        // Calcula o novo total e totalPaid para o item pai
        const remainingValues = parentItem.values.filter(v => v._id !== internalId);
        const newTotal = remainingValues.reduce((sum, v) => sum + v.value, 0);
        const newTotalPaid = remainingValues.reduce((sum, v) => (v.paid ? sum + v.value : sum), 0);

        // Deleta o item interno da receita/despesa atual e atualiza totais
        const payload = {
            idUser,
            [type === "receita" ? "receitas" : "despesas"]: [
                {
                    _id: parentId,
                    name: parentItem.name,
                    total: newTotal,
                    totalPaid: newTotalPaid,
                    whenPay: parentItem.whenPay,
                    paid: parentItem.paid,
                    isDebt: parentItem.isDebt,
                    idDespesa: parentItem.idDespesa,
                    idDebts: parentItem.idDebts,
                    idOrigem: parentItem.idOrigem,
                    idReceita: parentItem.idReceita,
                    notify: parentItem.notify,
                    values: remainingValues,
                },
            ],
        };

        const response = await fetch(`${API_URL}/expenses-item`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao deletar item: ${response.statusText} - ${errorText}`);
        }

        // Verifica se o item está vinculado (receita com isDebt ou despesa com idOrigem)
        if (type === "receita" && parentItem.isDebt && parentItem.idDebts && parentItem.idDespesa) {
            // É uma receita vinculada, deletar o item correspondente na despesa do devedor
            await deleteCorrespondingDespesaItem(
                parentItem.idDebts, // idUser do devedor
                parentItem.idDespesa, // ID da despesa vinculada
                uuidToDelete // UUID do item a ser deletado
            );
        } else if (type === "despesa" && parentItem.idOrigem && parentItem.idReceita) {
            // É uma despesa vinculada, deletar o item correspondente na receita do cobrador
            await deleteCorrespondingReceitaItem(
                parentItem.idOrigem, // idUser do cobrador
                parentItem.idReceita, // ID da receita vinculada
                uuidToDelete // UUID do item a ser deletado
            );
        }

        // Recarrega os dados financeiros
        await fetchMonthData();
        closeModalItem();
    } catch (err) {
        console.error(err);
        alert("Erro ao deletar item: " + err.message);
    }
}

// Função para deletar item correspondente na despesa do devedor
async function deleteCorrespondingDespesaItem(idUserDevedor, idDespesa, uuid) {
    try {
        // Busca a despesa do devedor
        const response = await fetch(`${API_URL}/expenses/${idUserDevedor}`);
        if (!response.ok) {
            throw new Error("Erro ao buscar despesa do devedor.");
        }

        const expensesData = await response.json();
        const despesa = expensesData.despesas.find(d => d._id === idDespesa);
        if (!despesa) {
            console.warn("Despesa vinculada não encontrada:", idDespesa);
            return;
        }

        // Encontra o item interno com o mesmo UUID
        const valueToDelete = despesa.values.find(v => v.uuid === uuid);
        if (!valueToDelete) {
            console.warn("Item interno com UUID correspondente não encontrado na despesa:", uuid);
            return;
        }

        // Calcula novos totais
        const remainingValues = despesa.values.filter(v => v.uuid !== uuid);
        const newTotal = remainingValues.reduce((sum, v) => sum + v.value, 0);
        const newTotalPaid = remainingValues.reduce((sum, v) => (v.paid ? sum + v.value : sum), 0);

        // Atualiza a despesa, removendo o item interno
        const payload = {
            idUser: idUserDevedor,
            despesas: [
                {
                    _id: idDespesa,
                    name: despesa.name,
                    total: newTotal,
                    totalPaid: newTotalPaid,
                    whenPay: despesa.whenPay,
                    paid: despesa.paid,
                    idOrigem: despesa.idOrigem,
                    isDebt: despesa.isDebt,
                    idReceita: despesa.idReceita,
                    notify: despesa.notify,
                    values: remainingValues,
                },
            ],
        };

        const updateResponse = await fetch(`${API_URL}/expenses-item`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Erro ao atualizar despesa do devedor: ${updateResponse.statusText} - ${errorText}`);
        }
    } catch (err) {
        console.error(err);
        throw new Error("Erro ao deletar item correspondente na despesa: " + err.message);
    }
}

// Função para deletar item correspondente na receita do cobrador
async function deleteCorrespondingReceitaItem(idUserCobrador, idReceita, uuid) {
    try {
        // Busca a receita do cobrador
        const response = await fetch(`${API_URL}/expenses/${idUserCobrador}`);
        if (!response.ok) {
            throw new Error("Erro ao buscar receita do cobrador.");
        }

        const expensesData = await response.json();
        const receita = expensesData.receitas.find(r => r._id === idReceita);
        if (!receita) {
            console.warn("Receita vinculada não encontrada:", idReceita);
            return;
        }

        // Encontra o item interno com o mesmo UUID
        const valueToDelete = receita.values.find(v => v.uuid === uuid);
        if (!valueToDelete) {
            console.warn("Item interno com UUID correspondente não encontrado na receita:", uuid);
            return;
        }

        // Calcula novos totais
        const remainingValues = receita.values.filter(v => v.uuid !== uuid);
        const newTotal = remainingValues.reduce((sum, v) => sum + v.value, 0);
        const newTotalPaid = remainingValues.reduce((sum, v) => (v.paid ? sum + v.value : sum), 0);

        // Atualiza a receita, removendo o item interno
        const payload = {
            idUser: idUserCobrador,
            receitas: [
                {
                    _id: idReceita,
                    name: receita.name,
                    total: newTotal,
                    totalPaid: newTotalPaid,
                    whenPay: receita.whenPay,
                    paid: receita.paid,
                    isDebt: receita.isDebt,
                    idDespesa: receita.idDespesa,
                    idDebts: receita.idDebts,
                    notify: receita.notify,
                    values: remainingValues,
                },
            ],
        };

        const updateResponse = await fetch(`${API_URL}/expenses-item`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Erro ao atualizar receita do cobrador: ${updateResponse.statusText} - ${errorText}`);
        }
    } catch (err) {
        console.error(err);
        throw new Error("Erro ao deletar item correspondente na receita: " + err.message);
    }
}

function calculateColors() {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const filterByMonth = (items) => items.filter(item => {
        return parseInt(item.whenPay.split("/")[0]) === currentYear && parseInt(item.whenPay.split("/")[1]) === currentMonth;
    });

    const saldoRestante = currentMonth == new Date().getMonth() + 1 ? totalRecebido - totalPago : (totalReceber + totalRecebido) - (totalPagar + totalPago);
    const percentage = totalRecebido > 0 ? (totalPagar / totalRecebido) * 100 : 0;

    let colorDespesa = percentage > 95 ? "#ff3333" : percentage > 75 ? "#ff9999" : percentage > 50 ? "#ffcc99" : "#ff9999";
    let colorReceita = percentage > 95 ? "#ff3333" : percentage > 75 ? "#ffff99" : percentage > 50 ? "#ffff99" : "#9cff99";

    document.getElementById("border-receitas-card").style.borderColor = colorReceita;
    document.getElementById("border-despesas-card").style.borderColor = colorDespesa;

    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("totalPagar").textContent = formatCurrency(totalPagar);
    document.getElementById("totalPago").textContent = formatCurrency(totalPago);
    document.getElementById("saldoRestante").textContent = formatCurrency(saldoRestante);
    document.getElementById("saldoRecebido").textContent = formatCurrency(totalRecebido);
    document.getElementById("saldoHaReceber").textContent = formatCurrency(totalReceber);
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
    const currentDate = new Date();
    const startDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1)); // Primeiro dia do mês atual em UTC
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 11);
    endDate.setDate(0);
    const despesasPorMes = {};
    const receitasPorMes = {};

    // Inicializa os meses no relatório
    for (let i = 0; i < 11; i++) {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);
        // Formata o mês diretamente, garantindo UTC
        const monthYear = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(/^\w/, c => c.toLowerCase());
        despesasPorMes[monthYear] = 0;
        receitasPorMes[monthYear] = 0;
    }

    // Função para parsear whenPay (formato ISO: YYYY-MM-DDTHH:mm:ss.sssZ)
    const parseDate = (dateStr) => {
        return new Date(dateStr); // Converte diretamente a string ISO para Date
    };

    // Agrega despesas
    despesas.forEach(item => {
        const itemDate = parseDate(item.whenPay);
        if (itemDate >= startDate && itemDate <= endDate) {
            // Formata o mês diretamente, garantindo UTC
            const monthYear = itemDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(/^\w/, c => c.toLowerCase());
            if (despesasPorMes[monthYear] !== undefined) {
                despesasPorMes[monthYear] += item.total;
            } else {
                despesasPorMes[monthYear] = item.total; // Inicializa se não existir
            }
        }
    });

    // Agrega receitas
    receitas.forEach(item => {
        const itemDate = parseDate(item.whenPay);
        if (itemDate >= startDate && itemDate <= endDate) {
            // Formata o mês diretamente, garantindo UTC
            const monthYear = itemDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(/^\w/, c => c.toLowerCase());
            if (receitasPorMes[monthYear] !== undefined) {
                receitasPorMes[monthYear] += item.total;
            } else {
                receitasPorMes[monthYear] = item.total; // Inicializa se não existir
            }
        }
    });

    // Formata valores para exibição
    const formatCurrency = (value) => {
        return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

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