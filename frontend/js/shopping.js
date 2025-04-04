const API_URL = "https://stok-5ytv.onrender.com";
//const API_URL = "http://192.168.1.67:3000";
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
    if (!sidebarMenu) return;

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

    if (!userInitialsDiv || !userModal || !logoutButton || !openSidebarButton || !closeSidebarButton || !sidebar) return;

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
    try {
        const response = await fetch(`${API_URL}/markets`);
        if (!response.ok) throw new Error("Erro ao carregar mercados");
        markets = await response.json();
        updateMarketSelect();
    } catch (error) {
        console.error("Fetch markets error:", error);
    }
}

async function fetchShoppingLists() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    const phone = JSON.parse(storedUser).phone;
    try {
        const response = await fetch(`${API_URL}/shopping-lists/${phone}`);
        if (!response.ok) throw new Error("Erro ao carregar listas");
        shoppingLists = await response.json();
        updateShoppingList();
    } catch (error) {
        console.error("Fetch shopping lists error:", error);
    }
}

function updateMarketSelect() {
    const select = document.getElementById("marketSelect");
    if (!select) return;

    select.innerHTML = "<option value=''>Nenhum mercado selecionado</option>" +
        markets.filter(m => m.status === "active").map(m =>
            `<option value="${m._id}">${m.name}</option>`
        ).join("");
}

function updateShoppingList() {
    const shoppingList = document.getElementById("shoppingList");
    if (!shoppingList) return;

    shoppingList.innerHTML = shoppingLists.length ? shoppingLists.map(list => {
        const total = list.products.reduce((sum, p) => sum + (p.total || 0), 0);

        return `
            <div class="accordion">
                <div class="accordion-header">
                    <span>${list.name || new Date(list.createdAt).toLocaleDateString("pt-BR")}</span>
                    <span>${total > 0 ? total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}</span>
                    <div class="header-actions">
                        <button class="add-product-btn" 
                                title="Adicionar produto a lista"
                                onclick="openProductModal('add', '${list._id}')">
                            <i class="fas fa-plus"></i>
                        </button>
                        <span class="accordion-toggle">▼</span>
                    </div>
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
        toggle.addEventListener("click", (e) => {
            e.stopPropagation(); // Impede a propagação do evento
            const header = toggle.closest(".accordion-header");
            const content = header?.nextElementSibling;

            if (content) {
                const isHidden = content.style.display !== "block";
                // Esconde todos os outros conteúdos primeiro
                document.querySelectorAll(".accordion-content").forEach(c => {
                    c.style.display = "none";
                    c.previousElementSibling.querySelector(".accordion-toggle").textContent = "▼";
                });

                // Mostra/esconde o conteúdo clicado
                content.style.display = isHidden ? "block" : "none";
                toggle.textContent = isHidden ? "▲" : "▼";
            }
        });
    });
}

function handleOptionsClick(event) {
    const trigger = event.target.closest(".options-trigger");
    if (trigger) {
        const id = trigger.getAttribute("data-id");
        if (id) showOptions(event, id);
    }
}

function showOptions(event, id) {
    const options = document.getElementById(`options-${id}`);
    if (!options) return;

    const isVisible = options.style.display === "block";
    document.querySelectorAll(".options-menu").forEach(menu => {
        menu.style.display = "none";
    });
    options.style.display = isVisible ? "none" : "block";

    document.addEventListener("click", function closeMenu(e) {
        if (!options.contains(e.target) && e.target !== event.target) {
            options.style.display = "none";
            document.removeEventListener("click", closeMenu);
        }
    }, { once: true });
}

function openListModal() {
    const modal = document.getElementById("listModal");
    if (modal) modal.style.display = "block";
}

function closeListModal() {
    const modal = document.getElementById("listModal");
    if (modal) modal.style.display = "none";
}

async function saveList() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    const phone = JSON.parse(storedUser).phone;
    const marketId = document.getElementById("marketSelect").value;
    const market = markets.find(m => m._id === marketId);

    const list = {
        name: market ? market.name : new Date().toLocaleDateString("pt-BR"),
        marketId: marketId || undefined,
        phone,
        products: []
    };

    try {
        const response = await fetch(`${API_URL}/shopping-lists`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(list)
        });
        if (!response.ok) throw new Error(await response.text());
        const newList = await response.json();
        currentListId = newList._id;
        await fetchShoppingLists();
        closeListModal();
        openProductModal("add", currentListId);
    } catch (error) {
        console.error("Save list error:", error);
    }
}

async function openProductModal(action, listId, productId = null) {
    currentListId = listId;
    editingProductId = productId;
    const modal = document.getElementById("productModal");
    const title = document.getElementById("productModalTitle");
    const buttons = document.getElementById("productModalButtons");

    if (!modal || !title || !buttons) return;

    const product = productId ?
        shoppingLists.find(l => l._id === listId)?.products.find(p => p._id === productId) :
        null;

    title.textContent = action === "edit" ? "Editar Produto" :
        action === "view" ? "Visualizar Produto" :
            action === "delete" ? "Deletar Produto" :
                "Cadastrar Produto";

    const isEditable = action === "edit" || action === "add";

    document.getElementById("productName").value = product?.name || "";
    document.getElementById("productType").value = product?.type || "quilo";
    document.getElementById("productQuantity").value = product?.quantity?.toString() || "";
    document.getElementById("packQuantity").value = product?.packQuantity?.toString() || "";
    document.getElementById("productValue").value = product?.value?.toString() || "";
    document.getElementById("productTotal").value = product?.total?.toString() || "";
    updateQuantityLabel();
    updatePackQuantityVisibility();

    if (isEditable && !productId) {
        setupProductAutocomplete();
    }

    const inputs = document.querySelectorAll("#productModalBody input, #productModalBody select");
    inputs.forEach(input => {
        input.disabled = !isEditable;
    });

    buttons.innerHTML = "";
    if (action === "add" || action === "edit") {
        buttons.innerHTML = `
            <button onclick="closeProductModal()">Cancelar</button>
            <button onclick="saveProduct()">Salvar</button>
        `;
    } else if (action === "view") {
        buttons.innerHTML = `<button onclick="closeProductModal()">Fechar</button>`;
    } else if (action === "delete" && productId) {
        buttons.innerHTML = `
            <button onclick="closeProductModal()">Cancelar</button>
            <button onclick="deleteProduct('${listId}', '${productId}')">Confirmar</button>
        `;
    }

    modal.style.display = "block";
    if (isEditable) setupProductEvents();
}

function closeProductModal() {
    const modal = document.getElementById("productModal");
    if (modal) modal.style.display = "none";
}

function updateQuantityLabel() {
    const type = document.getElementById("productType").value;
    document.getElementById("quantityLabel").textContent = `Quantidade (${type})`;
}

function updatePackQuantityVisibility() {
    const type = document.getElementById("productType").value;
    document.getElementById("packQuantityGroup").style.display =
        (type === "pacote" || type === "caixa") ? "block" : "none";
}

async function setupProductAutocomplete() {
    const productNameInput = document.getElementById("productName");
    const productTypeSelect = document.getElementById("productType");
    const productValueInput = document.getElementById("productValue");
    const productSuggestions = document.getElementById("productSuggestions");

    productNameInput.addEventListener("input", async function () {
        const searchTerm = this.value.trim().toLowerCase();

        if (searchTerm.length < 2) {
            productSuggestions.innerHTML = "";
            return;
        }

        try {
            const response = await fetch(`${API_URL}/product/${searchTerm}/5`);
            if (!response.ok) throw new Error("Erro na busca");

            const products = await response.json();

            if (!products || products.length === 0) {
                // Exibe a opção "Criar: ${searchTerm}" quando não há resultados
                productSuggestions.innerHTML = `
                    <div class="suggestion-item create-option" 
                         data-name="${searchTerm}">
                        Criar: ${searchTerm}
                    </div>
                `;

                // Adiciona evento ao item "Criar"
                document.querySelector(".create-option").addEventListener("click", function () {
                    productNameInput.value = this.getAttribute("data-name");
                    productSuggestions.innerHTML = "";
                    updateQuantityLabel();
                    updatePackQuantityVisibility();
                });
                return;
            }

            // Exibe os produtos encontrados
            productSuggestions.innerHTML = products.map(p => `
                <div class="suggestion-item" 
                     data-name="${p.productName}"
                     data-price="${p.currentPrice}"
                     data-type="${p.type}"
                     data-market="${p.marketId?.name || ''}">
                    ${p.productName} - ${p.marketId?.name || ''} - R$ ${p.currentPrice?.toFixed(2) || '0.00'}
                </div>
            `).join("");

            // Adiciona eventos aos itens de sugestão
            document.querySelectorAll(".suggestion-item").forEach(item => {
                item.addEventListener("click", function () {
                    productNameInput.value = this.getAttribute("data-name");
                    productValueInput.value = this.getAttribute("data-price");
                    productTypeSelect.value = this.getAttribute("data-type");
                    productSuggestions.innerHTML = "";
                    updateQuantityLabel();
                    updatePackQuantityVisibility();
                });
            });

        } catch (error) {
            console.error("Erro na busca de produtos:", error);
            productSuggestions.innerHTML = "<div class='error'>Erro ao buscar produtos</div>";
        }
    });


    // Fecha sugestões ao clicar fora
    document.addEventListener("click", function (e) {
        if (!productNameInput.contains(e.target) && !productSuggestions.contains(e.target)) {
            productSuggestions.innerHTML = "";
        }
    });
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
        const packQty = (typeSelect.value === "pacote" || typeSelect.value === "caixa") ?
            (parseFloat(packQuantity.value) || 1) : 1;
        const val = parseFloat(value.value) || 0;
        total.value = (qty * val).toFixed(2);
    }
}

async function saveProduct() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    const phone = JSON.parse(storedUser).phone;
    const product = {
        _id: editingProductId || undefined,
        name: document.getElementById("productName").value,
        type: document.getElementById("productType").value,
        quantity: parseFloat(document.getElementById("productQuantity").value),
        packQuantity: (document.getElementById("productType").value === "pacote" ||
            document.getElementById("productType").value === "caixa") ?
            parseInt(document.getElementById("packQuantity").value) : undefined,
        value: parseFloat(document.getElementById("productValue").value),
        total: parseFloat(document.getElementById("productTotal").value)
    };

    if (product.name.length === 0) {
        alert(product.name + "O nome do produto é obrigatório!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/shopping-lists/${currentListId}/products`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phone,
                product: product
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao salvar produto");
        }

        await fetchShoppingLists();
        closeProductModal();
    } catch (error) {
        console.error("Save product error:", error);
        alert(`Erro ao salvar produto: ${error.message}`);
    }
}

async function deleteProduct(listId, productId) {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    const phone = JSON.parse(storedUser).phone;
    try {
        const response = await fetch(`${API_URL}/shopping-lists/${listId}/products`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token") || ''}`
            },
            body: JSON.stringify({
                phone,
                productId
            })
        });

        if (!response.ok) throw new Error(await response.text());
        await fetchShoppingLists();
        closeProductModal();
    } catch (error) {
        console.error("Delete product error:", error);
        alert(`Erro ao deletar produto: ${error.message}`);
    }
}

// Atribui as funções ao escopo global para acesso via HTML
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
window.openListModal = openListModal;
window.closeListModal = closeListModal;
window.saveList = saveList;

document.addEventListener("DOMContentLoaded", () => {
    checkAuthAndLoadUser();
    fetchMarkets();
    fetchShoppingLists();

    document.getElementById("addListBtn")?.addEventListener("click", openListModal);
    document.getElementById("saveListBtn")?.addEventListener("click", saveList);
    document.getElementById("addProductBtn")?.addEventListener("click", () => {
        if (!currentListId) saveList();
        else openProductModal("add", currentListId);
    });
});