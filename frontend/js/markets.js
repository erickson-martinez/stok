const API_URL = "https://stok-5ytv.onrender.com";
const menuItems = [
    { name: "Financeiro", route: "./finances.html" },
    { name: "Estoque", route: "./stock.html" },
    { name: "Atividade", route: "./activity.html" },
    { name: "Mercados", route: "./markets.html" },
    { name: "Lista de Compras", route: "./shopping.html" }
];

let markets = [];
let editingId = null;

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

function checkAuthAndLoadUser() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
        window.location.href = "../login.html";
        return;
    }

    const currentUser = JSON.parse(storedUser);
    document.getElementById("userInitials").textContent = getInitials(currentUser.name);
    document.getElementById("userFullName").textContent = currentUser.name;
    document.getElementById("userPhone").textContent = currentUser.phone;

    loadSidebarMenu();
    setupUserEvents();
}

function setupUserEvents() {
    const userInitialsDiv = document.getElementById("userInitials");
    const userModal = document.getElementById("userModal");
    const logoutButton = document.getElementById("logout");
    const openSidebarButton = document.getElementById("openSidebar");
    const closeSidebarButton = document.getElementById("closeSidebar");
    const sidebar = document.getElementById("sidebar");

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
}

async function fetchMarkets() {
    const phone = JSON.parse(localStorage.getItem("currentUser")).phone;
    try {
        const response = await fetch(`${API_URL}/markets/${phone}`);
        if (!response.ok) throw new Error("Erro ao carregar mercados");
        markets = await response.json();
        updateMarketList();
    } catch (error) {
        console.error(error);
    }
}

function updateMarketList() {
    const marketList = document.getElementById("marketList");
    marketList.innerHTML = markets.length ? markets.map(market => `
        <div class="list-item">
            <span class="item-name">${market.name}</span>
            <span class="options-trigger" data-id="${market._id}">⋯</span>
            <div id="options-${market._id}" class="options-menu">
                <button onclick="openMarketModal('edit', '${market._id}')">Editar</button>
                <button onclick="openMarketModal('view', '${market._id}')">Visualizar</button>
                <button onclick="openMarketModal('delete', '${market._id}')">Deletar</button>
            </div>
        </div>
    `).join("") : "<p>Nenhum mercado cadastrado</p>";

    marketList.removeEventListener("click", handleOptionsClick);
    marketList.addEventListener("click", handleOptionsClick);
}

function handleOptionsClick(event) {
    const trigger = event.target.closest(".options-trigger");
    if (trigger) {
        const id = trigger.getAttribute("data-id");
        showOptions(event, id);
    }
}

function showOptions(event, id) {
    const options = document.getElementById(`options-${id}`);
    const isVisible = options.style.display === "block";
    document.querySelectorAll(".options-menu").forEach(menu => menu.style.display = "none");
    options.style.display = isVisible ? "none" : "block";

    document.addEventListener("click", function closeMenu(e) {
        if (!options.contains(e.target) && e.target !== event.target) {
            options.style.display = "none";
            document.removeEventListener("click", closeMenu);
        }
    }, { once: true });
}

function openMarketModal(action, id = null) {
    editingId = id;
    const modal = document.getElementById("marketModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalButtons = document.getElementById("modalButtons");
    const market = id ? markets.find(m => m._id === id) : null;

    modalTitle.textContent = action === "edit" ? "Editar Mercado" : action === "view" ? "Visualizar Mercado" : action === "delete" ? "Deletar Mercado" : "Cadastrar Mercado";
    const isEditable = action === "edit" || action === "add";

    document.getElementById("marketName").value = market?.name || "";
    document.getElementById("marketAddress").value = market?.address || "";
    document.getElementById("marketNumber").value = market?.number || "";
    document.getElementById("marketZip").value = market?.zip || "";
    document.getElementById("marketLat").value = market?.latitude || "";
    document.getElementById("marketLng").value = market?.longitude || "";
    document.getElementById("marketStatus").value = market?.status || "active";

    const inputs = document.querySelectorAll("#modalBody input, #modalBody select");
    inputs.forEach(input => input.disabled = !isEditable);

    modalButtons.innerHTML = "";
    if (action === "add" || action === "edit") {
        modalButtons.innerHTML = `
            <button onclick="closeMarketModal()">Cancelar</button>
            <button onclick="saveMarket()">Salvar</button>
        `;
    } else if (action === "view") {
        modalButtons.innerHTML = `<button onclick="closeMarketModal()">Fechar</button>`;
    } else if (action === "delete") {
        modalButtons.innerHTML = `
            <button onclick="closeMarketModal()">Cancelar</button>
            <button onclick="deleteMarket('${id}')">Confirmar</button>
        `;
    }

    modal.style.display = "block";
}

function closeMarketModal() {
    document.getElementById("marketModal").style.display = "none";
}

async function saveMarket() {
    const phone = JSON.parse(localStorage.getItem("currentUser")).phone;
    const market = {
        _id: editingId || undefined,
        name: document.getElementById("marketName").value,
        address: document.getElementById("marketAddress").value,
        number: document.getElementById("marketNumber").value,
        zip: document.getElementById("marketZip").value,
        latitude: parseFloat(document.getElementById("marketLat").value),
        longitude: parseFloat(document.getElementById("marketLng").value),
        status: document.getElementById("marketStatus").value,
        phone
    };

    try {
        const method = editingId ? "PATCH" : "POST";
        const response = await fetch(`${API_URL}/markets`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(market)
        });
        if (!response.ok) throw new Error("Erro ao salvar mercado");
        await fetchMarkets();
        closeMarketModal();
    } catch (error) {
        console.error(error);
    }
}

async function deleteMarket(id) {
    const phone = JSON.parse(localStorage.getItem("currentUser")).phone;
    try {
        const response = await fetch(`${API_URL}/markets?phone=${phone}&id=${id}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Erro ao deletar mercado");
        await fetchMarkets();
        closeMarketModal();
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    checkAuthAndLoadUser();
    fetchMarkets();
    document.getElementById("addMarketBtn").addEventListener("click", () => openMarketModal("add"));
});