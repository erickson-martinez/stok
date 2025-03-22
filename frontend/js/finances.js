const API_URL = "https://stok-hiqo.onrender.com";

// Configuração do menu em JSON
const menuItems = [
    { name: "Financeiro", route: "./finances.html" },
    { name: "Estoque", route: "./stock.html" },
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

    // Abre/fecha o modal de perfil
    userInitialsDiv.addEventListener("click", () => {
        userModal.classList.toggle("active");
    });

    // Fecha o modal ao clicar fora
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

    // Abre a barra lateral
    openSidebarButton.addEventListener("click", () => {
        sidebar.classList.add("active");
    });

    // Fecha a barra lateral
    closeSidebarButton.addEventListener("click", () => {
        sidebar.classList.remove("active");
    });

    // Fecha a barra lateral ao clicar fora
    document.addEventListener("click", (event) => {
        if (!sidebar.contains(event.target) && !openSidebarButton.contains(event.target)) {
            sidebar.classList.remove("active");
        }
    });

    // Inicializa as finanças
    updateMonth();
    setupFinanceEvents();
}

// Variáveis globais
let currentDate = new Date();
let currentType = '';
let editingId = null;
const receitas = [];
const despesas = [];

// Formata o mês e ano
function formatMonth(date) {
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
        .replace(/^\w/, c => c.toUpperCase());
}

// Atualiza o mês exibido e busca os dados
function updateMonth() {
    const monthText = formatMonth(currentDate);
    document.getElementById('currentMonth').textContent = monthText;
    document.getElementById('receitasMonth').textContent = monthText;
    document.getElementById('despesasMonth').textContent = monthText;
    fetchMonthData();
}

// Muda o mês
function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    updateMonth();
}

// Busca os dados do mês na API
async function fetchMonthData() {
    const phone = JSON.parse(localStorage.getItem("currentUser")).phone;
    console.log('Buscando dados para o telefone:', phone);
    try {
        const response = await fetch(`${API_URL}/expenses?phone=${phone}`);
        if (!response.ok) throw new Error(`Erro ao carregar finanças: ${response.statusText}`);
        const data = await response.json();
        console.log('Dados recebidos da API:', data);

        receitas.length = 0;
        despesas.length = 0;
        if (data.receita) {
            data.receita.forEach(item => receitas.push({
                id: item._id,
                name: item.name,
                valor: item.value,
                data: item.date,
                recorrencia: false
            }));
        }
        if (data.despesa) {
            data.despesa.forEach(item => despesas.push({
                id: item._id,
                name: item.name,
                valor: item.value,
                data: item.date,
                recorrencia: false
            }));
        }
        console.log('Receitas após preenchimento:', receitas);
        console.log('Despesas após preenchimento:', despesas);
        updateLists();
        calculateColors();
    } catch (err) {
        console.error('Erro ao buscar dados:', err);
        updateLists();
        calculateColors();
    }
}

// Configura eventos de finanças
function setupFinanceEvents() {
    const actionModal = document.getElementById("actionModal");

    // Fecha o modal ao clicar fora
    document.addEventListener("click", (event) => {
        if (event.target === actionModal) {
            actionModal.style.display = "none";
        }
    });
}

// Abre o modal de ação
function openActionModal(action, type, item = null) {
    console.log('Abrindo modal:', action, type, item);
    currentType = type;
    editingId = item ? item.id : null;
    const modal = document.getElementById("actionModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalHeader = document.querySelector(".modal-header");
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
        modal.style.display = "block";
        return; // Sai da função após configurar o modo "share"
    }

    // Configuração dos campos padrão (edit/view/delete)
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

    const isEditable = action === "edit";
    nome.disabled = !isEditable;
    valor.disabled = !isEditable;
    data.disabled = !isEditable;
    recorrencia.disabled = !isEditable;
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

    console.log('Enviando payload para a API:', payload);

    try {
        if (editingId) {
            const response = await fetch(`${API_URL}/expenses`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(`Erro ao atualizar item: ${response.statusText}`);
            console.log('Resposta do PATCH:', await response.json());
        } else {
            const response = await fetch(`${API_URL}/expenses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(`Erro ao criar item: ${response.statusText}`);
            console.log('Resposta do POST:', await response.json());
        }

        await fetchMonthData();
        closeModal();
    } catch (err) {
        console.error('Erro ao salvar item:', err);
    }
}

function updateLists(filteredReceitas = receitas, filteredDespesas = despesas) {
    console.log('Atualizando listas com receitas:', filteredReceitas);
    console.log('Atualizando listas com despesas:', filteredDespesas);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    console.log('Filtrando para ano:', currentYear, 'e mês:', currentMonth);

    const receitasFiltradas = filteredReceitas.filter(item => {
        const itemDate = new Date(item.data);
        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth() + 1;
        console.log(`Item Receita: ${item.name}, Ano: ${itemYear}, Mês: ${itemMonth}`);
        return itemYear === currentYear && itemMonth === currentMonth;
    });

    const despesasFiltradas = filteredDespesas.filter(item => {
        const itemDate = new Date(item.data);
        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth() + 1;
        console.log(`Item Despesa: ${item.name}, Ano: ${itemYear}, Mês: ${itemMonth}`);
        return itemYear === currentYear && itemMonth === currentMonth;
    });

    console.log('Receitas filtradas:', receitasFiltradas);
    console.log('Despesas filtradas:', despesasFiltradas);

    const receitasCard = document.getElementById("receitasCard");
    const despesasCard = document.getElementById("despesasCard");

    if (receitasFiltradas.length > 0) {
        document.getElementById("receitasList").innerHTML = receitasFiltradas.map(item => createListItem(item, "receita")).join("");
        receitasCard.style.display = "block";
    } else {
        console.log('Nenhuma receita filtrada para exibir');
        document.getElementById("receitasList").innerHTML = "<p>Sem receitas para este mês</p>";
        receitasCard.style.display = "block";
    }

    if (despesasFiltradas.length > 0) {
        document.getElementById("despesasList").innerHTML = despesasFiltradas.map(item => createListItem(item, "despesa")).join("");
        despesasCard.style.display = "block";
    } else {
        console.log('Nenhuma despesa filtrada para exibir');
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
    const phone = JSON.parse(localStorage.getItem("currentUser")).phone;
    try {
        const response = await fetch(`${API_URL}/expenses?phone=${phone}&type=${currentType}&id=${id}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error(`Erro ao deletar item: ${response.statusText}`);
        console.log('Item deletado, buscando dados atualizados');
        await fetchMonthData();
        closeModal();
    } catch (err) {
        console.error('Erro ao deletar item:', err);
    }
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
    closeModal();
}

// Inicialização
if (document.getElementById("userInitials")) {
    loadFinances();
}