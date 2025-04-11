const API_URL = "https://stok-5ytv.onrender.com";
//const API_URL = "http://192.168.1.67:3000";

const menuItems = [
    { name: "Financeiro", route: "./finances.html" },
    { name: "Estoque", route: "./stock.html" },
    { name: "Atividade", route: "./activity.html" },
    { name: "Mercados", route: "./markets.html" },
    { name: "Lista de Compras", route: "./shopping.html" },
    { name: "Livros", route: "./book.html" }
];

function loadSidebarMenu() {
    const sidebarMenu = document.getElementById("sidebarMenu");
    sidebarMenu.innerHTML = "";
    menuItems.forEach(item => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = item.route;
        a.textContent = item.name;
        li.appendChild(a);
        sidebarMenu.appendChild(li);
    });
}

function getInitials(name) {
    return name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2);
}

function loadFinances() {
    const userInitialsDiv = document.getElementById("userInitials");
    const userFullName = document.getElementById("userFullName");
    const userPhone = document.getElementById("userPhone");
    const logoutButton = document.getElementById("logout");
    const userModal = document.getElementById("userModal");
    const openSidebarButton = document.getElementById("openSidebar");
    const closeSidebarButton = document.getElementById("closeSidebar");
    const sidebar = document.getElementById("sidebar");
    const currentUser = localStorage.getItem("currentUser");

    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    const user = JSON.parse(currentUser);
    userInitialsDiv.textContent = getInitials(user.name);
    userFullName.textContent = user.name;
    userPhone.textContent = user.phone;

    loadSidebarMenu();

    userInitialsDiv.addEventListener("click", () => userModal.classList.toggle("active"));
    document.addEventListener("click", (event) => {
        if (!userModal.contains(event.target) && !userInitialsDiv.contains(event.target)) {
            userModal.classList.remove("active");
        }
    });

    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        window.location.href = "../login.html";
    });

    openSidebarButton.addEventListener("click", () => sidebar.classList.add("active"));
    closeSidebarButton.addEventListener("click", () => sidebar.classList.remove("active"));
    document.addEventListener("click", (event) => {
        if (!sidebar.contains(event.target) && !openSidebarButton.contains(event.target)) {
            sidebar.classList.remove("active");
        }
    });

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
    const monthText = formatMonth(currentDate);
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

        idExpense = expensesData?._id || null;
        if (expensesData.receitas?.length > 0 || expensesData.despesas?.length > 0) {
            processItems(expensesData);
        }

        if (sharedData[0].receitas?.length > 0 || sharedData[0].despesas?.length > 0) {
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

function openActionModal(action, type, item = null) {
    currentType = type;
    editingId = item?.id || null;
    const modal = document.getElementById("actionModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalButtons = document.getElementById("modalButtons");
    const titlePrefix = type === "receita" ? "Receita" : "Despesa";

    modalTitle.textContent = action === "add" ? `Nova ${titlePrefix}` :
        action === "edit" ? `Editar ${titlePrefix}` :
            action === "view" ? `Visualizar ${titlePrefix}` :
                `Deletar ${titlePrefix}`;

    const nome = document.getElementById("modalNome");
    const valor = document.getElementById("modalValor");
    const data = document.getElementById("modalData");
    const paid = document.getElementById("modalPaid");

    if (item) {
        nome.value = item.name;
        valor.value = item.total || item.value;
        data.value = new Date(item.whenPay.split('/').reverse().join('-')).toISOString().split("T")[0];
        paid.checked = item.paid;
    } else {
        nome.value = "";
        valor.value = "";
        data.value = new Date().toISOString().split("T")[0]; // Data atual
        paid.checked = false;
    }

    const isEditable = (action === "add" || action === "edit") && !item?.shared;
    [nome, valor, data, paid].forEach(input => input.disabled = !isEditable);

    modalButtons.innerHTML = "";
    if (action === "add" || action === "edit") {
        modalButtons.innerHTML = `
            <button class="btn-secundary" onclick="closeModal()">Cancelar</button>
            <button class="btn" onclick="saveItem()" ${isEditable ? '' : 'disabled'}>Salvar</button>
        `;
    } else if (action === "view") {
        modalButtons.innerHTML = `<button class="btn" onclick="closeModal()">Fechar</button>`;
    } else if (action === "delete") {
        modalButtons.innerHTML = `
            <button class="btn-secundary" onclick="closeModal()">Cancelar</button>
            <button class="btn" onclick="confirmDelete('${item.id}')" ${item?.shared ? 'disabled' : ''}>Confirmar</button>
        `;
    }

    modal.style.display = "block";
}

function openModalAddItem(type, id) {
    const action = "add"

    currentType = type;
    const modal = document.getElementById("actionModalItem");
    const modalTitle = document.getElementById("modalTitleItem");
    const modalButtons = document.getElementById("modalButtonsItem");
    const titlePrefix = type === "receita" ? "Receita" : "Despesa";
    idItemExpense = id

    modalTitle.textContent = `Nova ${titlePrefix}`

    modalButtons.innerHTML = `
            <button class="btn-secundary" onclick="closeModal()">Cancelar</button>
            <button class="btn" onclick="saveValuesItem()" ${action ? '' : 'disabled'}>Salvar</button>
        `;

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

async function saveItem() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const idUser = currentUser.idUser;
    const nome = document.getElementById("modalNome").value;
    const valor = parseFloat(document.getElementById("modalValor").value) || 0;
    const data = document.getElementById("modalData").value; // YYYY-MM-DD
    const paid = document.getElementById("modalPaid").checked;

    const [year, month, day] = data.split("-");
    const whenPay = `${year}/${month}/${day}`;

    const item = {
        _id: editingId || undefined,
        name: nome,
        total: valor,
        whenPay: whenPay,
        paid: paid,
        values: [{ name: nome, value: valor }]
    };

    let payload;

    if (editingId) {
        const targetArray = currentType === "receita" ? receitas : despesas;
        const index = targetArray.findIndex(i => i.id === editingId);
        if (index !== -1) {
            targetArray[index] = { ...targetArray[index], ...item };
        }
    } else {
        if (currentType === "receita") {
            payload = { idUser, receitas: [item] };
        } else {
            payload = { idUser, despesas: [item] };
        }
    }

    try {
        const method = idExpense != null ? "PATCH" : "POST";
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

async function saveValuesItem() {

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const idUser = currentUser.idUser;
    const nome = document.getElementById("modalNomeItem").value;
    const valor = parseFloat(document.getElementById("modalValorItem").value) || 0;

    let payload;


    if (currentType === "receita") {
        const findReceitas = receitas.find(item => item.id === idItemExpense)

        const item = {
            _id: findReceitas.id,
            name: findReceitas.name,
            total: valor + findReceitas.total,
            whenPay: findReceitas.whenPay,
            paid: findReceitas.paid,
            values: [...findReceitas.values, { name: nome, value: valor }]
        };

        payload = { idUser, receitas: [item] };
    } else {

        const findDespesas = despesas.find(item => item.id === idItemExpense)

        const item = {
            _id: findDespesas.id,
            name: findDespesas.name,
            total: valor + findDespesas.total,
            whenPay: findDespesas.whenPay,
            paid: findDespesas.paid,
            values: [...findDespesas.values, { name: nome, value: valor }]
        };

        payload = { idUser, despesas: [item] };
    }

    try {
        const method = idExpense != null || idItemExpense != null ? "PATCH" : "POST";
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
            ${item.values.map(v => `
                <div class="list-item internal-item" data-id="${item.id}-${v.name}">
                    <span class="item-name" onclick="toggleAccordion('${item.id}-${v.name}')">${v.name}</span>
                    <div class="value-container">
                        <span class="item-value">${v.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                        <span class="options-trigger" data-id="${item.id}-${v.name}" data-type="${type}" data-internal="true">⋯</span>
                    </div>
                </div>
            `).join("")}
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

function showOptions(event, id) {
    event.stopPropagation();

    // Remove any existing options menus to avoid duplicates
    document.querySelectorAll(".options-menu").forEach(menu => menu.remove());

    // Create the options menu
    const item = getItemById(id);
    const isInternal = id.includes("-");
    const type = event.target.getAttribute("data-type");

    const modalOptions = document.createElement("div");
    modalOptions.id = `options-${id}`;
    modalOptions.className = "options-menu";
    modalOptions.innerHTML = isInternal ? `
        <button onclick="openActionModal('view', '${type}', getInternalItem('${id}'))">Visualizar</button>
        ${item.shared ? "" : `
            <button onclick="openActionModal('edit', '${type}', getInternalItem('${id}'))">Editar</button>
            <button onclick="openActionModal('delete', '${type}', getInternalItem('${id}'))">Deletar</button>
        `}
    ` : `
        ${item.shared ? `<button onclick="openActionModal('view', '${type}', getItemById('${id}'))">Visualizar</button>` : `
            <button onclick="openModalAddItem('${type}', '${id}')">+ ${type === 'receita' ? 'Receita' : 'Despesa'}</button>
            <button onclick="openActionModal('view', '${type}', getItemById('${id}'))">Visualizar</button>
            <button onclick="openActionModal('edit', '${type}', getItemById('${id}'))">Editar</button>
            <button onclick="openActionModal('delete', '${type}', getItemById('${id}'))">Deletar</button>
        `}
    `;

    event.target.parentElement.appendChild(modalOptions);

    modalOptions.style.display = "block";

    document.addEventListener("click", function closeMenu(e) {
        if (!modalOptions.contains(e.target) && e.target !== event.target) {
            modalOptions.remove();
            document.removeEventListener("click", closeMenu);
        }
    }, { once: true });

    currentType = event.target.getAttribute("data-type");
}

function getItemById(id) {
    return (currentType === "receita" ? receitas : despesas).find(i => i.id === id);
}

function getInternalItem(id) {
    const [itemId, internalName] = id.split("-");
    const item = getItemById(itemId);
    return item.values.find(v => v.name === internalName);
}

async function confirmDelete(id) {
    const idUser = JSON.parse(localStorage.getItem("currentUser")).idUser;
    try {
        const response = await fetch(`${API_URL}/expenses?idUser=${idUser}&type=${currentType}&id=${id.split("-")[0]}`, {
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

    const startDate = new Date(currentDate);
    startDate.setMonth(startDate.getMonth() - 2);
    const endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + 9);

    const despesasPorMes = {};
    const receitasPorMes = {};

    for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);
        const monthYear = formatMonth(date);
        despesasPorMes[monthYear] = 0;
        receitasPorMes[monthYear] = 0;
    }

    const parseDate = (dateStr) => {
        const [day, month, year] = dateStr.split('/');
        return new Date(`${year}-${month}-${day}`);
    };

    despesas.forEach(item => {
        const itemDate = parseDate(item.whenPay);
        if (itemDate >= startDate && itemDate <= endDate) {
            const monthYear = formatMonth(itemDate);
            despesasPorMes[monthYear] += item.total;
        }
    });

    receitas.forEach(item => {
        const itemDate = parseDate(item.whenPay);
        if (itemDate >= startDate && itemDate <= endDate) {
            const monthYear = formatMonth(itemDate);
            receitasPorMes[monthYear] += item.total;
        }
    });

    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
window.closeModal = closeModal;
window.saveItem = saveItem;
window.confirmDelete = confirmDelete;
window.openShareModal = openShareModal;
window.shareData = shareData;
window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;
window.addInternalItem = addInternalItem;
window.removeInternalItem = removeInternalItem;