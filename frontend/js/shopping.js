const API_URL = "https://stok-5ytv.onrender.com";
const menuItems = [
    { name: "Financeiro", route: "./finances.html" },
    { name: "Estoque", route: "./stock.html" },
    { name: "Atividade", route: "./activity.html" },
    { name: "Mercados", route: "./markets.html" },
    { name: "Lista de Compras", route: "./shopping.html" }
];

let markets = [];
let shoppingLists = [];
let currentListId = null;
let editingProductId = null;

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
        updateMarketSelect();
    } catch (error) {
        console.error(error);
    }
}

async function fetchShoppingLists() {
    const phone = JSON.parse(localStorage.getItem("currentUser")).phone;
    try {
        const response = await fetch(`${API_URL}/shopping/${phone}`);
        if (!response.ok) throw new Error("Erro ao carregar listas");
        shoppingLists = await response.json();
        updateShoppingList();
    } catch (error) {
        console.error(error);
    }
}

function updateMarketSelect() {
    const select = document.getElementById("marketSelect");
    select.innerHTML = "<option value=''>Nenhum mercado selecionado</option>" +
        markets.filter(m => m.status === "active").map(m => `<option value="${m._id}">${m.name}</option>`).join("");
}

function updateShoppingList() {
    const shoppingList = document.getElementById("shoppingList");
    shoppingList.innerHTML = shoppingLists.length ? shoppingLists.map(list => {
        const total = list.products.reduce((sum, p) => sum + (p.total || 0), 0);
        return `
            <div class="accordion">
                <div class="accordion-header">
                    <span>${list.name || new Date(list.createdAt).toLocaleDateString("pt-BR")}</span>
                    <span>${total > 0 ? total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}</span>
                    <span class="accordion-toggle">▼</span>
                </div>
                <div class="accordion-content">
                    ${list.products.length ? list.products.map(product => `
                        <div class="list-item">
                            <span class="item-name">${product.name} (${product.quantity} ${product.type}${product.packQuantity ? `, ${product.packQuantity} un` : ""})</span>
                            <span>${product.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                            <span class="options-trigger" data-id="${product._id}" data-list="${list._id}">⋯</span>
                            <div id="options-${product._id}" class="options-menu">
                                <button onclick="openProductModal('edit', '${list._id}', '${product._id}')">Editar</button>
                                <button onclick="openProductModal('view', '${list._id}', '${product._id}')">Visualizar</button>
                                <button onclick="openProductModal('delete', '${list._id}', '${product._id}')">Deletar</button>
                            </div>
                        </div>
                    `).join("") : "<p>Nenhum produto cadastrado</p>"}
                </div>
            </div>
        `;
    }).join("") : "<p>Nenhuma lista cadastrada</p>";

    setupAccordion();
    shoppingList.removeEventListener("click", handleOptionsClick);
    shoppingList.addEventListener("click", handleOptionsClick);
}

function setupAccordion() {
    document.querySelectorAll(".accordion-toggle").forEach(toggle => {
        toggle.addEventListener("click", () => {
            const content = toggle.parentElement.nextElementSibling;
            content.style.display = content.style.display === "block" ? "none" : "block";
            toggle.textContent = content.style.display === "block" ? "▲" : "▼";
        });
    });
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

function openListModal() {
    document.getElementById("listModal").style.display = "block";
}

function closeListModal() {
    document.getElementById("listModal").style.display = "none";
}

async function saveList() {
    const phone = JSON.parse(localStorage.getItem("currentUser")).phone;
    const marketId = document.getElementById("marketSelect").value;
    const market = markets.find(m => m._id === marketId);
    const list = {
        name: market ? market.name : new Date().toLocaleDateString("pt-BR"),
        marketId: marketId || undefined,
        phone,
        products: []
    };

    try {
        const response = await fetch(`${API_URL}/shopping`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(list)
        });
        if (!response.ok) throw new Error("Erro ao salvar lista");
        const newList = await response.json();
        currentListId = newList._id;
        await fetchShoppingLists();
        closeListModal();
        openProductModal("add", currentListId);
    } catch (error) {
        console.error(error);
    }
}

function openProductModal(action, listId, productId = null) {
    currentListId = listId;
    editingProductId = productId;
    const modal = document.getElementById("productModal");
    const title = document.getElementById("productModalTitle");
    const buttons = document.getElementById("productModalButtons");
    const product = productId ? shoppingLists.find(l => l._id === listId).products.find(p => p._id === productId) : null;

    title.textContent = action === "edit" ? "Editar Produto" : action === "view" ? "Visualizar Produto" : action === "delete" ? "Deletar Produto" : "Cadastrar Produto";
    const isEditable = action === "edit" || action === "add";

    document.getElementById("productName").value = product?.name || "";
    document.getElementById("productType").value = product?.type || "quilo";
    document.getElementById("productQuantity").value = product?.quantity || "";
    document.getElementById("packQuantity").value = product?.packQuantity || "";
    document.getElementById("productValue").value = product?.value || "";
    document.getElementById("productTotal").value = product?.total || "";
    updateQuantityLabel();
    updatePackQuantityVisibility();

    const inputs = document.querySelectorAll("#productModalBody input, #productModalBody select");
    inputs.forEach(input => input.disabled = !isEditable);

    buttons.innerHTML = "";
    if (action === "add" || action === "edit") {
        buttons.innerHTML = `
            <button onclick="closeProductModal()">Cancelar</button>
            <button onclick="saveProduct()">Salvar</button>
        `;
    } else if (action === "view") {
        buttons.innerHTML = `<button onclick="closeProductModal()">Fechar</button>`;
    } else if (action === "delete") {
        buttons.innerHTML = `
            <button onclick="closeProductModal()">Cancelar</button>
            <button onclick="deleteProduct('${listId}', '${productId}')">Confirmar</button>
        `;
    }

    modal.style.display = "block";
    if (isEditable) setupProductEvents();
}

function closeProductModal() {
    document.getElementById("productModal").style.display = "none";
}

function updateQuantityLabel() {
    const type = document.getElementById("productType").value;
    document.getElementById("quantityLabel").textContent = `Quantidade (${type})`;
}

function updatePackQuantityVisibility() {
    const type = document.getElementById("productType").value;
    document.getElementById("packQuantityGroup").style.display = (type === "pacote" || type === "caixa") ? "block" : "none";
}

function setupProductEvents() {
    const typeSelect = document.getElementById("productType");
    const quantity = document.getElementById("productQuantity");
    const packQuantity = document.getElementById("packQuantity");
    const value = document.getElementById("productValue");
    const total = document.getElementById("productTotal");

    typeSelect.addEventListener("change", () => {
        updateQuantityLabel();
        updatePackQuantityVisibility();
        calculateTotal();
    });

    quantity.addEventListener("input", calculateTotal);
    packQuantity.addEventListener("input", calculateTotal);
    value.addEventListener("input", calculateTotal);

    function calculateTotal() {
        const qty = parseFloat(quantity.value) || 0;
        const packQty = (typeSelect.value === "pacote" || typeSelect.value === "caixa") ? parseFloat(packQuantity.value) || 1 : 1;
        const val = parseFloat(value.value) || 0;
        total.value = (qty * val * packQty).toFixed(2);
    }
}

async function saveProduct() {
    const phone = JSON.parse(localStorage.getItem("currentUser")).phone;
    const product = {
        _id: editingProductId || undefined,
        name: document.getElementById("productName").value,
        type: document.getElementById("productType").value,
        quantity: parseFloat(document.getElementById("productQuantity").value),
        packQuantity: (document.getElementById("productType").value === "pacote" || document.getElementById("productType").value === "caixa") ? parseInt(document.getElementById("packQuantity").value) : undefined,
        value: parseFloat(document.getElementById("productValue").value),
        total: parseFloat(document.getElementById("productTotal").value)
    };

    if (!product.name) {
        alert("O nome do produto é obrigatório!");
        return;
    }

    try {
        const method = editingProductId ? "PATCH" : "POST";
        const response = await fetch(`${API_URL}/shopping/${currentListId}`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, products: [product] })
        });
        if (!response.ok) throw new Error("Erro ao salvar produto");
        await fetchShoppingLists();
        closeProductModal();
    } catch (error) {
        console.error(error);
    }
}

async function deleteProduct(listId, productId) {
    const phone = JSON.parse(localStorage.getItem("currentUser")).phone;
    try {
        const response = await fetch(`${API_URL}/shopping/${listId}?phone=${phone}&productId=${productId}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Erro ao deletar produto");
        await fetchShoppingLists();
        closeProductModal();
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    checkAuthAndLoadUser();
    fetchMarkets();
    fetchShoppingLists();

    document.getElementById("addListBtn").addEventListener("click", openListModal);
    document.getElementById("saveListBtn").addEventListener("click", saveList);
    document.getElementById("addProductBtn").addEventListener("click", () => {
        if (!currentListId) saveList();
        else openProductModal("add", currentListId);
    });
});