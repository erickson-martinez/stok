const API_URL = "https://stok-5ytv.onrender.com";
//const API_URL = "http://192.168.1.67:3000";

// Configuração do menu em JSON
const menuItems = [
    { name: "Financeiro", route: "./finances.html" },
    { name: "Estoque", route: "./stock.html" },
    { name: "Atividade", route: "./activity.html" },
    { name: "Mercados", route: "./markets.html" },
    { name: "Lista de Compras", route: "./shopping.html" },
    { name: "Livros", route: "./book.html" }

];

// Carrega o menu lateral dinamicamente
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

// Obtém as iniciais do nome
function getInitials(name) {
    return name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2);
}

// Carrega a tela de finanças
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

    userInitialsDiv.addEventListener("click", () => {
        userModal.classList.toggle("active");
    });

    document.addEventListener("click", (event) => {
        if (!userModal.contains(event.target) && !userInitialsDiv.contains(event.target)) {
            userModal.classList.remove("active");
        }
    });

    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        window.location.href = "../login.html";
    });

    openSidebarButton.addEventListener("click", () => {
        sidebar.classList.add("active");
    });

    closeSidebarButton.addEventListener("click", () => {
        sidebar.classList.remove("active");
    });

    document.addEventListener("click", (event) => {
        if (!sidebar.contains(event.target) && !openSidebarButton.contains(event.target)) {
            sidebar.classList.remove("active");
        }
    });

    fetchMonthData();
    updateMonth();
    setupFinanceEvents();
}

// Variáveis globais
let currentDate = new Date();
let currentType = '';
let editingId = null;
const receitas = [];
const despesas = [];

function formatMonth(date) {
    const month = date.toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase());
    const year = date.getFullYear();
    return `${month} ${year}`;
}

function updateMonth() {
    const monthText = formatMonth(currentDate);
    document.getElementById('currentMonth').textContent = monthText;
    document.getElementById('receitasMonth').textContent = monthText;
    document.getElementById('despesasMonth').textContent = monthText;
    updateLists();
    calculateColors();
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    updateMonth();
}

async function fetchMonthData() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const phone = currentUser.phone;

    try {
        const [expensesResponse, sharedResponse] = await Promise.all([
            fetch(`${API_URL}/expenses/${phone}`),
            fetch(`${API_URL}/expensesShared/${phone}`)
        ]);

        if (!expensesResponse.ok) throw new Error(`Erro ao carregar finanças: ${expensesResponse.statusText}`);
        if (!sharedResponse.ok) throw new Error(`Erro ao carregar finanças compartilhadas: ${sharedResponse.statusText}`);

        const expensesData = await expensesResponse.json();
        const sharedData = await sharedResponse.json();

        receitas.length = 0;
        despesas.length = 0;

        if (expensesData.length > 0) {
            const userExpenses = expensesData[0];

            if (userExpenses.receita && userExpenses.receita.length > 0) {
                userExpenses.receita.forEach(item => receitas.push({
                    id: item._id,
                    name: item.name,
                    valor: item.value,
                    data: item.date,
                    recorrencia: false,
                    shared: false
                }));
            }

            if (userExpenses.despesa && userExpenses.despesa.length > 0) {
                userExpenses.despesa.forEach(item => despesas.push({
                    id: item._id,
                    name: item.name,
                    valor: item.value,
                    data: item.date,
                    recorrencia: false,
                    shared: false
                }));
            }
        }

        if (sharedData.length > 0) {
            const sharedExpenses = sharedData[0];

            if (sharedExpenses.receita && sharedExpenses.receita.length > 0) {
                sharedExpenses.receita.forEach(item => receitas.push({
                    id: item._id,
                    name: item.name,
                    valor: item.value,
                    data: item.date,
                    recorrencia: false,
                    shared: true,
                    sharedBy: sharedExpenses.phone
                }));
            }

            if (sharedExpenses.despesa && sharedExpenses.despesa.length > 0) {
                sharedExpenses.despesa.forEach(item => despesas.push({
                    id: item._id,
                    name: item.name,
                    valor: item.value,
                    data: item.date,
                    recorrencia: false,
                    shared: true,
                    sharedBy: sharedExpenses.phone
                }));
            }
        }

        updateLists();
        calculateColors();
    } catch (err) {
        alert('Erro ao carregar dados. Por favor, tente novamente.');
        updateLists();
        calculateColors();
    }
}

function setupFinanceEvents() {
    const actionModal = document.getElementById("actionModal");
    const reportModal = document.getElementById("reportModal");

    document.addEventListener("click", (event) => {
        if (event.target === actionModal) {
            actionModal.style.display = "none";
        }
        if (event.target === reportModal) {
            reportModal.style.display = "none";
        }
    });
}

function openActionModal(action, type, item = null) {
    currentType = type;
    editingId = item ? item.id : null;
    const modal = document.getElementById("actionModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalHeader = document.querySelector("#actionModal .modal-header");
    const modalButtons = document.getElementById("modalButtons");

    const titlePrefix = type === "receita" ? "Receita" : "Despesa";
    modalHeader.className = `modal-header ${type || 'share'}`;
    if (action === "edit") {
        modalTitle.textContent = item ? `Editar ${titlePrefix}` : `Nova ${titlePrefix}`;
    } else if (action === "view") {
        modalTitle.textContent = `Visualizar ${titlePrefix}`;
    } else if (action === "delete") {
        modalTitle.textContent = `Deletar ${titlePrefix}`;
    } else if (action === "share") {
        modalTitle.textContent = "Compartilhar";
    }

    if (action === "share") {
        document.getElementById("modalBody").innerHTML = `
            <div class="form-group">
                <label>Telefone</label>
                <input type="tel" id="sharePhone" placeholder="Digite o número de telefone">
            </div>
        `;
        modalButtons.innerHTML = `
            <button onclick="closeModal()">Cancelar</button>
            <button onclick="shareData()">Compartilhar</button>
        `;
        modal.style.display = "block";
        return;
    }

    const nome = document.getElementById("modalNome");
    const valor = document.getElementById("modalValor");
    const data = document.getElementById("modalData");
    const recorrencia = document.getElementById("modalRecorrencia");
    const recorrenciaMeses = document.getElementById("modalRecorrenciaMeses");
    const qtdMeses = document.getElementById("modalQtdMeses");

    if (item) {
        nome.value = item.name;
        valor.value = item.valor;
        data.value = item.data.split("T")[0];
        recorrencia.checked = item.recorrencia;
        recorrenciaMeses.style.display = item.recorrencia ? "block" : "none";
        qtdMeses.value = item.qtdrecorrencia ? item.qtdrecorrencia.split("-")[1] : "";
    } else {
        nome.value = "";
        valor.value = "";
        data.value = currentDate.toISOString().split("T")[0];
        recorrencia.checked = false;
        recorrenciaMeses.style.display = "none";
        qtdMeses.value = "";
    }

    const isEditable = action === "edit" && !item?.shared;
    nome.disabled = !isEditable;
    valor.disabled = !isEditable;
    data.disabled = !isEditable;
    recorrencia.disabled = !isEditable;
    qtdMeses.disabled = !isEditable;

    modalButtons.innerHTML = "";
    if (action === "edit") {
        modalButtons.innerHTML = `
            <button onclick="closeModal()">Cancelar</button>
            <button onclick="saveItem()" ${isEditable ? '' : 'disabled'}>Salvar</button>
        `;
        recorrencia.onchange = (e) => {
            recorrenciaMeses.style.display = e.target.checked ? "block" : "none";
        };
    } else if (action === "view") {
        modalButtons.innerHTML = `
            <button onclick="closeModal()">Sair</button>
        `;
    } else if (action === "delete") {
        modalButtons.innerHTML = `
            <button onclick="closeModal()">Cancelar</button>
            <button onclick="confirmDelete('${item.id}')" ${item?.shared ? 'disabled' : ''}>Confirmar</button>
        `;
    }

    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("actionModal").style.display = "none";
}

async function saveItem() {
    const phone = JSON.parse(localStorage.getItem("currentUser")).phone;
    const item = {
        _id: editingId || undefined,
        name: document.getElementById("modalNome").value,
        value: parseFloat(document.getElementById("modalValor").value),
        date: document.getElementById("modalData").value || currentDate.toISOString().split("T")[0],
    };

    const payload = {
        phone,
        [currentType]: [item]
    };

    try {
        if (editingId) {
            const response = await fetch(`${API_URL}/expenses`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(`Erro ao atualizar item: ${response.statusText}`);
        } else {
            const response = await fetch(`${API_URL}/expenses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(`Erro ao criar item: ${response.statusText}`);
        }
        await fetchMonthData();
        closeModal();
    } catch (err) {
    }
}

function updateLists(filteredReceitas = receitas, filteredDespesas = despesas) {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const receitasFiltradas = filteredReceitas.filter(item => {
        const itemDate = new Date(item.data);
        return itemDate.getFullYear() === currentYear && (itemDate.getMonth() + 1) === currentMonth;
    });

    const despesasFiltradas = filteredDespesas.filter(item => {
        const itemDate = new Date(item.data);
        return itemDate.getFullYear() === currentYear && (itemDate.getMonth() + 1) === currentMonth;
    });

    const receitasCard = document.getElementById("receitasCard");
    const despesasCard = document.getElementById("despesasCard");

    if (receitasFiltradas.length > 0) {
        document.getElementById("receitasList").innerHTML = receitasFiltradas.map(item => createListItem(item, "receita")).join("");
        receitasCard.style.display = "block";
    } else {
        document.getElementById("receitasList").innerHTML = "<p>Sem receitas para este mês</p>";
        receitasCard.style.display = "block";
    }

    if (despesasFiltradas.length > 0) {
        document.getElementById("despesasList").innerHTML = despesasFiltradas.map(item => createListItem(item, "despesa")).join("");
        despesasCard.style.display = "block";
    } else {
        document.getElementById("despesasList").innerHTML = "<p>Sem despesas para este mês</p>";
        despesasCard.style.display = "block";
    }

    document.getElementById("receitasList").removeEventListener("click", handleOptionsClick);
    document.getElementById("receitasList").addEventListener("click", handleOptionsClick);
    document.getElementById("despesasList").removeEventListener("click", handleOptionsClick);
    document.getElementById("despesasList").addEventListener("click", handleOptionsClick);
}

function handleOptionsClick(event) {
    const trigger = event.target.closest(".options-trigger");
    if (trigger) {
        const id = trigger.getAttribute("data-id");
        const type = trigger.getAttribute("data-type");
        showOptions(event, id, type);
    }
}

function createListItem(item, type) {
    const sharedBadge = item.shared ? `
      <span class="shared-badge" title="Compartilhado por: ${item.sharedBy || 'Número desconhecido'}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="2"></circle>
          <circle cx="6" cy="12" r="2"></circle>
          <circle cx="18" cy="19" r="2"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </span>
    ` : '';

    return `
        <div class="list-item ${item.shared ? 'shared-item' : ''}">
            <span class="item-name">${sharedBadge}${item.name}</span>
            <span class="options-trigger" data-id="${item.id}" data-type="${type}">⋯</span>
            <div id="options-${item.id}" class="options-menu">
                ${!item.shared ? `
                    <button onclick="openActionModal('edit', '${type}', getItemById('${item.id}', '${type}'))">Editar</button>
                    <button onclick="openActionModal('view', '${type}', getItemById('${item.id}', '${type}'))">Visualizar</button>
                    <button onclick="openActionModal('delete', '${type}', getItemById('${item.id}', '${type}'))">Deletar</button>
                ` : `
                    <button onclick="openActionModal('view', '${type}', getItemById('${item.id}', '${type}'))">Visualizar</button>
                `}
            </div>
        </div>
    `;
}

function getItemById(id, type) {
    const list = type === "receita" ? receitas : despesas;
    return list.find(i => i.id === id);
}

function showOptions(event, id, type) {
    const options = document.getElementById(`options-${id}`);
    if (!options) return;

    const isVisible = options.style.display === "block";
    document.querySelectorAll(".options-menu").forEach(menu => menu.style.display = "none");

    if (!isVisible) {
        options.style.display = "block";
    } else {
        options.style.display = "none";
    }

    document.addEventListener("click", function closeMenu(e) {
        if (!options.contains(e.target) && e.target !== event.target) {
            options.style.display = "none";
            document.removeEventListener("click", closeMenu);
        }
    }, { once: true });

    currentType = type;
}

async function confirmDelete(id) {
    const phone = JSON.parse(localStorage.getItem("currentUser")).phone;
    try {
        const response = await fetch(`${API_URL}/expenses?phone=${phone}&type=${currentType}&id=${id}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error(`Erro ao deletar item: ${response.statusText}`);
        await fetchMonthData();
        closeModal();
    } catch (err) {
    }
}

function calculateColors() {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const receitasFiltradas = receitas.filter(item => {
        const itemDate = new Date(item.data);
        return itemDate.getFullYear() === currentYear && (itemDate.getMonth() + 1) === currentMonth;
    });

    const despesasFiltradas = despesas.filter(item => {
        const itemDate = new Date(item.data);
        return itemDate.getFullYear() === currentYear && (itemDate.getMonth() + 1) === currentMonth;
    });

    const totalReceitas = receitasFiltradas.reduce((sum, r) => sum + r.valor, 0);
    const totalDespesas = despesasFiltradas.reduce((sum, d) => sum + d.valor, 0);
    const saldoRestante = totalReceitas - totalDespesas;
    const percentage = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;

    let colorDespesa, colorReceita;
    if (percentage > 95) {
        colorDespesa = "#ff3333";
        colorReceita = "#ff3333";
    } else if (percentage > 75) {
        colorDespesa = "#ff9999";
        colorReceita = "#ffff99";
    } else if (percentage > 50) {
        colorDespesa = "#ffcc99";
        colorReceita = "#ffff99";
    } else {
        colorDespesa = "#ff9999";
        colorReceita = "#9cff99";
    }

    document.getElementById("border-receitas-card").style.borderColor = colorReceita;
    document.getElementById("border-despesas-card").style.borderColor = colorDespesa;

    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    document.getElementById("totalDespesas").textContent = formatCurrency(totalDespesas);
    document.getElementById("saldoRestante").textContent = formatCurrency(saldoRestante);
    document.getElementById("saldoRestante").style.color = saldoRestante >= 0 ? "#2ecc71" : "#e74c3c";
}

function openShareModal() {
    openActionModal("share", null);
}

async function shareData() {
    const sharePhone = document.getElementById("sharePhone").value;
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const currentPhone = currentUser.phone;

    if (!sharePhone) {
        alert("Por favor, insira um número de telefone para compartilhar.");
        return;
    }

    if (sharePhone === currentPhone) {
        alert("Você não pode compartilhar com o mesmo telefone.");
        return;
    }

    const payload = {
        phone: currentPhone,
        phoneShared: sharePhone
    };

    try {
        const response = await fetch(`${API_URL}/expenses`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Erro ao compartilhar dados: ${response.statusText}`);

        currentUser.phoneShared = sharePhone;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));

        alert(`Dados compartilhados com sucesso para ${sharePhone}!`);
        closeModal();
        await fetchMonthData();
    } catch (err) {
        alert("Ocorreu um erro ao compartilhar os dados. Tente novamente.");
    }
}

// Funções para o modal de relatório
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
        const monthYear = `${date.toLocaleString('pt-BR', { month: 'long' })} ${date.getFullYear()}`.replace(/^\w/, c => c.toUpperCase());
        despesasPorMes[monthYear] = 0;
        receitasPorMes[monthYear] = 0;
    }

    despesas.forEach(item => {
        const itemDate = new Date(item.data);
        if (itemDate >= startDate && itemDate <= endDate) {
            const monthYear = `${itemDate.toLocaleString('pt-BR', { month: 'long' })} ${itemDate.getFullYear()}`.replace(/^\w/, c => c.toUpperCase());
            despesasPorMes[monthYear] += item.valor;
        }
    });

    receitas.forEach(item => {
        const itemDate = new Date(item.data);
        if (itemDate >= startDate && itemDate <= endDate) {
            const monthYear = `${itemDate.toLocaleString('pt-BR', { month: 'long' })} ${itemDate.getFullYear()}`.replace(/^\w/, c => c.toUpperCase());
            receitasPorMes[monthYear] += item.valor;
        }
    });

    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

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
        const despesa = despesasPorMes[monthYear];
        const receita = receitasPorMes[monthYear];
        html += `
            <tr>
                <td>${monthYear}</td>
                <td>${formatCurrency(despesa)}</td>
                <td>${formatCurrency(receita)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    reportSummary.innerHTML = html;
    modal.style.display = "block";
}

function closeReportModal() {
    document.getElementById("reportModal").style.display = "none";
}

// Inicialização
if (document.getElementById("userInitials")) {
    loadFinances();
}