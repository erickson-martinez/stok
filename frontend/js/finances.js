const API_URL = "https://stok-hiqo.onrender.com";

// Configuração do menu em JSON
const menuItems = [
    { name: "Financeiro", route: "./finances.html" },
    { name: "Estoque", route: "./stock.html" },
];

// Função para carregar o menu dinamicamente
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

// Função para obter as iniciais do nome
function getInitials(name) {
    return name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2);
}

// Função para carregar a tela de finanças
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

    // Abrir/fechar modal de perfil
    userInitialsDiv.addEventListener("click", () => {
        userModal.classList.toggle("active");
    });

    // Fechar modal ao clicar fora
    document.addEventListener("click", (event) => {
        if (!userModal.contains(event.target) && !userInitialsDiv.contains(event.target)) {
            userModal.classList.remove("active");
        }
    });

    // Logout
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        window.location.href = "../login.html";
    });

    // Abrir sidebar
    openSidebarButton.addEventListener("click", () => {
        sidebar.classList.add("active");
    });

    // Fechar sidebar
    closeSidebarButton.addEventListener("click", () => {
        sidebar.classList.remove("active");
    });

    // Fechar sidebar ao clicar fora
    document.addEventListener("click", (event) => {
        if (!sidebar.contains(event.target) && !openSidebarButton.contains(event.target)) {
            sidebar.classList.remove("active");
        }
    });

    // Inicializar finanças
    updateMonth();
    setupFinanceEvents();
}

// Variáveis globais
let currentDate = new Date();
const phoneNumber = '67984726820';
let currentType = '';
let editingId = null;
const receitas = [];
const despesas = [];

// Função para formatar o mês e ano
function formatMonth(date) {
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
        .replace(/^\w/, c => c.toUpperCase());
}

// Função para atualizar o mês exibido e buscar dados
function updateMonth() {
    const monthText = formatMonth(currentDate);
    document.getElementById('currentMonth').textContent = monthText;
    document.getElementById('receitasMonth').textContent = monthText;
    document.getElementById('despesasMonth').textContent = monthText;
    fetchMonthData();
}

// Função para trocar de mês
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    updateMonth();
}

// Função para buscar dados do mês
async function fetchMonthData() {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    try {
        const response = await fetch(`${API_URL}/finances?userPhone=${JSON.parse(localStorage.getItem("currentUser")).phone}&year=${year}&month=${month}`);
        if (!response.ok) throw new Error("Erro ao carregar finanças");
        const data = await response.json();

        receitas.length = 0;
        despesas.length = 0;
        data.receitas.forEach(item => receitas.push(item));
        data.despesas.forEach(item => despesas.push(item));
        updateLists();
        calculateColors();
    } catch (err) {
        console.error('Erro ao buscar dados:', err);
        updateLists();
        calculateColors();
    }
}

// Configurar eventos de finanças
function setupFinanceEvents() {
    const actionModal = document.getElementById("actionModal");

    // Fechar modal ao clicar fora
    document.addEventListener("click", (event) => {
        if (event.target === actionModal) {
            actionModal.style.display = "none";
        }
    });
}

// Função para abrir o modal
function openActionModal(action, type, item = null) {
    currentType = type;
    editingId = item ? item.id : null;
    const modal = document.getElementById("actionModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalHeader = document.querySelector(".modal-header");
    const modalButtons = document.getElementById("modalButtons");

    const titlePrefix = type === "receita" ? "Receita" : "Despesa";
    modalHeader.className = `modal-header ${type}`;
    if (action === "edit") {
        modalTitle.textContent = item ? `Editar ${titlePrefix}` : `Nova ${titlePrefix}`;
    } else if (action === "view") {
        modalTitle.textContent = `Visualizar ${titlePrefix}`;
    } else if (action === "delete") {
        modalTitle.textContent = `Deletar ${titlePrefix}`;
    } else if (action === "share") {
        modalTitle.textContent = "Compartilhar";
    }

    const nome = document.getElementById("modalNome");
    const valor = document.getElementById("modalValor");
    const data = document.getElementById("modalData");
    const recorrencia = document.getElementById("modalRecorrencia");
    const recorrenciaMeses = document.getElementById("modalRecorrenciaMeses");
    const qtdMeses = document.getElementById("modalQtdMeses");

    if (action === "share") {
        document.getElementById("modalBody").innerHTML = `
            <div class="form-group">
                <label>Telefone</label>
                <input type="tel" id="sharePhone">
            </div>
            <div class="form-group">
                <label><input type="checkbox" id="shareAll"> Compartilhar tudo (12 meses)</label>
                <div id="shareMonths" style="display: none;">
                    <label>Quantidade de Meses</label>
                    <input type="number" id="shareQtdMeses" min="1">
                </div>
            </div>
        `;
        modalButtons.innerHTML = `
            <button onclick="closeModal()">Cancelar</button>
            <button onclick="shareData()">Compartilhar</button>
        `;
        document.getElementById("shareAll").onchange = (e) => {
            document.getElementById("shareMonths").style.display = e.target.checked ? "none" : "block";
            updateShareTitle();
        };
        document.getElementById("shareQtdMeses").oninput = updateShareTitle;
        updateShareTitle();
    } else {
        if (item) {
            nome.value = item.name;
            valor.value = item.valor;
            data.value = item.data;
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

        const isEditable = action === "edit";
        nome.disabled = !isEditable;
        valor.disabled = !isEditable;
        data.disabled = !isEditable;
        recurrencia.disabled = !isEditable;
        qtdMeses.disabled = !isEditable;

        modalButtons.innerHTML = "";
        if (action === "edit") {
            modalButtons.innerHTML = `
                <button onclick="closeModal()">Cancelar</button>
                <button onclick="saveItem()">Salvar</button>
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
                <button onclick="confirmDelete('${item.id}')">Confirmar</button>
            `;
        }
    }

    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("actionModal").style.display = "none";
}

async function saveItem() {
    const item = {
        id: editingId || Date.now().toString(),
        name: document.getElementById("modalNome").value,
        valor: parseFloat(document.getElementById("modalValor").value),
        data: document.getElementById("modalData").value || currentDate.toISOString().split("T")[0],
        recorrencia: document.getElementById("modalRecorrencia").checked,
        phoneNumber: JSON.parse(localStorage.getItem("currentUser")).phone,
    };

    if (item.recorrencia) {
        const qtdMeses = document.getElementById("modalQtdMeses").value;
        const itemDate = new Date(item.data);
        const currentMonth = itemDate.getMonth() + 1;
        const finalMonth = currentMonth + parseInt(qtdMeses) - 1;
        item.qtdrecorrencia = `${String(currentMonth).padStart(2, "0")}-${String(finalMonth).padStart(2, "0")}`;
    } else {
        item.qtdrecorrencia = null;
    }

    const list = currentType === "receita" ? receitas : despesas;
    const endpoint = currentType === "receita" ? "receitas" : "despesas";

    if (editingId) {
        const index = list.findIndex(i => i.id === editingId);
        list[index] = item;
        await fetch(`${API_URL}/${endpoint}/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
        });
    } else {
        list.push(item);
        await fetch(`${API_URL}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
        });
    }

    updateLists();
    calculateColors();
    closeModal();
}

function updateLists(filteredReceitas = receitas, filteredDespesas = despesas) {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const receitasFiltradas = filteredReceitas.filter(item => {
        const itemDate = new Date(item.data);
        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth() + 1;
        if (item.recorrencia && item.qtdrecorrencia) {
            const [startMonth, endMonth] = item.qtdrecorrencia.split("-").map(Number);
            return currentYear === itemYear && currentMonth >= startMonth && currentMonth <= endMonth;
        }
        return itemYear === currentYear && itemMonth === currentMonth;
    });

    const despesasFiltradas = filteredDespesas.filter(item => {
        const itemDate = new Date(item.data);
        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth() + 1;
        if (item.recorrencia && item.qtdrecorrencia) {
            const [startMonth, endMonth] = item.qtdrecorrencia.split("-").map(Number);
            return currentYear === itemYear && currentMonth >= startMonth && currentMonth <= endMonth;
        }
        return itemYear === currentYear && itemMonth === currentMonth;
    });

    const receitasCard = document.getElementById("receitasCard");
    const despesasCard = document.getElementById("despesasCard");

    if (receitasFiltradas.length > 0) {
        document.getElementById("receitasList").innerHTML = receitasFiltradas.map(item => createListItem(item, "receita")).join("");
        receitasCard.style.display = "block";
    } else {
        receitasCard.style.display = "none";
    }

    if (despesasFiltradas.length > 0) {
        document.getElementById("despesasList").innerHTML = despesasFiltradas.map(item => createListItem(item, "despesa")).join("");
        despesasCard.style.display = "block";
    } else {
        despesasCard.style.display = "none";
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
    return `
        <div class="list-item">
            <span>${item.name}</span>
            <span class="options-trigger" data-id="${item.id}" data-type="${type}">⋯</span>
            <div id="options-${item.id}" class="options-menu">
                <button onclick="openActionModal('edit', '${type}', getItemById('${item.id}', '${type}'))">Editar</button>
                <button onclick="openActionModal('view', '${type}', getItemById('${item.id}', '${type}'))">Visualizar</button>
                <button onclick="openActionModal('delete', '${type}', getItemById('${item.id}', '${type}'))">Deletar</button>
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
    const list = currentType === "receita" ? receitas : despesas;
    const endpoint = currentType === "receita" ? "receitas" : "despesas";
    const index = list.findIndex(i => i.id === id);
    if (index !== -1) {
        list.splice(index, 1);
        await fetch(`${API_URL}/${endpoint}/${id}`, { method: "DELETE" });
    }
    updateLists();
    calculateColors();
    closeModal();
}

function calculateColors() {
    const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
    const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
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

    fetch(`${API_URL}/colors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: JSON.parse(localStorage.getItem("currentUser")).phone, colorReceita, colorDespesa }),
    }).catch(err => console.error("Erro ao salvar cores:", err));
}

function openShareModal() {
    openActionModal("share", null);
}

function updateShareTitle() {
    const shareAll = document.getElementById("shareAll").checked;
    const qtdMeses = document.getElementById("shareQtdMeses").value;
    const date = new Date();
    const futureDate = new Date(date.setMonth(date.getMonth() + (shareAll ? 12 : parseInt(qtdMeses || 1))));
    const month = futureDate.toLocaleString("pt-BR", { month: "long" });
    const year = futureDate.getFullYear();
    document.getElementById("modalTitle").textContent = `Compartilhar até ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
}

async function shareData() {
    const phone = document.getElementById("sharePhone").value;
    const shareAll = document.getElementById("shareAll").checked;
    const qtdMeses = document.getElementById("shareQtdMeses").value;
    console.log("Compartilhando com:", phone, shareAll ? "12 meses" : `${qtdMeses} meses`);
    // Aqui você pode adicionar a lógica de compartilhamento real com o backend
    closeModal();
}

// Inicialização
if (document.getElementById("userInitials")) {
    loadFinances();
}