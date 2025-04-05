//const API_URL = "https://stok-5ytv.onrender.com";
const API_URL = "http://192.168.1.67:3000";
const menuItems = [
    { name: "Financeiro", route: "./finances.html" },
    { name: "Estoque", route: "./stock.html" },
    { name: "Atividade", route: "./activity.html" },
    { name: "Mercados", route: "./markets.html" },
    { name: "Lista de Compras", route: "./shopping.html" }
];

const daysFindPrice = 1; // Dias para buscar o preço do produto
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

document.getElementById('marketSelectAdd').addEventListener('change', function () {
    const marketId = this.value;
    const market = markets.find(m => m._id === marketId);
    const preview = document.getElementById('listNamePreview');

    if (market) {
        preview.textContent = `${market.name} - ${new Date().toLocaleDateString('pt-BR')}`;
    } else {
        preview.textContent = `Lista de compras - ${new Date().toLocaleDateString('pt-BR')}`;
    }
});

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
        if (!response.ok) {
            throw new Error(`Erro ao carregar mercados: ${response.status} ${response.statusText}`);
        }
        markets = await response.json();
        updateMarketSelect();
        updateMarketSelectEdit();
        return markets;
    } catch (error) {
        console.error("Fetch markets error:", error.message);
        alert("Não foi possível conectar ao servidor. Verifique se ele está ativo.");
        throw error;
    }
}

async function fetchShoppingLists() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    if (markets.length === 0) {
        await fetchMarkets();
    }

    const phone = JSON.parse(storedUser).phone;
    try {
        // Busca listas próprias
        const ownResponse = await fetch(`${API_URL}/shopping-lists/${phone}`);
        if (!ownResponse.ok) {
            throw new Error(`Erro ao carregar listas próprias: ${ownResponse.status}`);
        }
        const ownLists = await ownResponse.json();

        // Busca listas compartilhadas (trata 404 como lista vazia)
        let sharedLists = [];
        try {
            const sharedResponse = await fetch(`${API_URL}/shopping-lists/shared/${phone}`);
            if (sharedResponse.ok) {
                sharedLists = await sharedResponse.json();
            } else if (sharedResponse.status !== 404) {
                throw new Error(`Erro ao carregar listas compartilhadas: ${sharedResponse.status}`);
            }
        } catch (sharedError) {
            console.error("Erro ao buscar listas compartilhadas:", sharedError);
        }

        // Combina as listas
        shoppingLists = [...ownLists, ...sharedLists.map(list => ({ ...list, isShared: true }))];
        updateShoppingList();
    } catch (error) {
        console.error("Fetch shopping lists error:", error);
        alert("Erro ao carregar listas de compras. Por favor, recarregue a página.");
    }
}

function updateMarketSelect() {
    const addSelect = document.getElementById("marketSelectAdd");
    const options = "<option value=''>Nenhum mercado selecionado</option>" +
        markets.filter(m => m.status === "active").map(m =>
            `<option value="${m._id}">${m.name}</option>`
        ).join("");
    if (addSelect) addSelect.innerHTML = options;
}

function updateMarketSelectEdit() {
    const editSelect = document.getElementById("marketSelectEdit");
    const options = "<option value=''>Nenhum mercado selecionado</option>" +
        markets.filter(m => m.status === "active").map(m =>
            `<option value="${m._id}">${m.name}</option>`
        ).join("");
    if (editSelect) editSelect.innerHTML = options;
}

function shareList(listId) {
    currentListId = listId;
    const modal = document.getElementById("shareListModal");
    if (modal) {
        document.getElementById("sharePhoneInput").value = ""; // Limpa o campo
        modal.style.display = "block";
    }
}

function closeShareModal() {
    const modal = document.getElementById("shareListModal");
    if (modal) modal.style.display = "none";
}

async function confirmShareList() {
    const phoneToShare = document.getElementById("sharePhoneInput").value.trim();
    if (!phoneToShare) {
        alert("Por favor, digite um número de telefone válido");
        return;
    }

    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    try {
        const response = await fetch(`${API_URL}/shopping-lists/${currentListId}/share`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ownerPhone: JSON.parse(storedUser).phone,
                sharedWithPhone: phoneToShare
            })
        });

        if (!response.ok) throw new Error(await response.text());

        alert("Lista compartilhada com sucesso!");
        closeShareModal();
        await fetchShoppingLists(); // Atualiza a lista após compartilhar
    } catch (error) {
        console.error("Share list error:", error);
        alert(`Erro ao compartilhar lista: ${error.message}`);
    }
}

function updateShoppingList() {
    const shoppingList = document.getElementById("shoppingList");
    if (!shoppingList || markets.length === 0) {
        console.log("Aguardando carregamento dos mercados...");
        return;
    }

    if (!shoppingLists || shoppingLists.length === 0) {
        shoppingList.innerHTML = "<p>Nenhuma lista cadastrada</p>";
        return;
    }

    shoppingList.innerHTML = shoppingLists.map(list => {
        const total = list.products.reduce((sum, p) => sum + (p.total || 0), 0);
        let marketName = "Sem mercado";
        if (list.marketId) {
            const market = markets.find(m => m._id === list.marketId);
            marketName = market ? market.name : "Mercado não encontrado";
        }
        const createdAt = list.createdAt ? new Date(list.createdAt).toLocaleDateString("pt-BR") : "Data desconhecida";
        const listName = `${marketName} - ${createdAt}${list.isShared ? ' (Compartilhada)' : ''}`;

        const productsHTML = list.products.length ?
            list.products.map(product => `
                <div class="list-item">
                    <span class="item-name">${product.name} (${product.quantity} ${product.type}${product.packQuantity ? `, ${product.packQuantity} un` : ""})</span>
                    <span class="item-value">${(product.total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    ${list.completed ? '' : `
                        <div class="options-wrapper">
                            <span class="options-trigger" data-id="${product._id}" data-list="${list._id}" onclick="event.stopPropagation(); showOptions(event, '${product._id}')">⋯</span>
                            <div id="options-${product._id}" class="options-menu">
                                <button onclick="event.stopPropagation(); openProductModal('edit', '${list._id}', '${product._id}')">Editar</button>
                                <button onclick="event.stopPropagation(); openProductModal('view', '${list._id}', '${product._id}')">Visualizar</button>
                                <button onclick="event.stopPropagation(); openProductModal('delete', '${list._id}', '${product._id}')">Deletar</button>
                            </div>
                        </div>
                    `}
                </div>
            `).join("") : "<p>Nenhum produto cadastrado</p>";

        return `
            <div class="list-container" data-list-id="${list._id}">
                <div class="list-header" onclick="toggleAccordion('${list._id}')">
                    <span>${listName}</span>
                    <div class="value-container">
                        <span class="item-value">${total > 0 ? total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}</span>
                        <div class="header-actions">
                            ${list.completed ? '' : `
                                <button class="add-product-btn" 
                                        title="Adicionar produto a lista"
                                        onclick="openProductModal('add', '${list._id}'); event.stopPropagation();">
                                    <i class="fas fa-plus"></i>
                                </button>
                            `}
                            <span class="accordion-toggle"><i class="fas fa-chevron-down"></i></span>
                            <div class="options-wrapper">
                                <span class="options-trigger" data-id="${list._id}" onclick="event.stopPropagation(); showOptions(event, '${list._id}')">⋯</span>
                                <div id="options-${list._id}" class="options-menu">
                                    ${list.completed ? '' : `
                                        <button onclick="event.stopPropagation(); openEditListModal('${list._id}')">Editar</button>
                                        <button onclick="event.stopPropagation(); completeList('${list._id}')">Concluir</button>
                                    `}
                                    ${list.isShared ? '' : `
                                        <button onclick="event.stopPropagation(); shareList('${list._id}')">Compartilhar</button>
                                    `}
                                    ${list.isShared ? '' : `
                                        <button onclick="event.stopPropagation(); deleteList('${list._id}')">Deletar</button>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="accordion" id="accordion-${list._id}">
                    <div class="accordion-content">
                        ${productsHTML}
                    </div>
                </div>
            </div>
        `;
    }).join("");

    shoppingList.removeEventListener("click", handleOptionsClick);
    shoppingList.addEventListener("click", handleOptionsClick);
}

function toggleAccordion(listId) {
    const content = document.getElementById(`accordion-${listId}`).querySelector(".accordion-content");
    const toggle = document.querySelector(`#accordion-${listId}`).previousElementSibling.querySelector(".accordion-toggle");

    if (content.style.display === "block") {
        content.style.display = "none";
        toggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
        toggle.classList.remove("open");
    } else {
        document.querySelectorAll(".accordion-content").forEach(c => c.style.display = "none");
        document.querySelectorAll(".accordion-toggle").forEach(t => {
            t.innerHTML = '<i class="fas fa-chevron-down"></i>';
            t.classList.remove("open");
        });
        content.style.display = "block";
        toggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
        toggle.classList.add("open");
    }
}

function handleOptionsClick(event) {
    const trigger = event.target.closest(".options-trigger");
    if (trigger) {
        const id = trigger.getAttribute("data-id");
        if (id) showOptions(event, id);
    }
}

function showOptions(event, id) {
    event.stopPropagation(); // Impede que o clique no options-trigger acione o toggleAccordion
    const options = document.getElementById(`options-${id}`);
    if (!options) {
        console.error(`Options menu with id options-${id} not found`);
        return;
    }

    const isVisible = options.style.display === "block";

    // Fecha todos os outros menus abertos
    document.querySelectorAll(".options-menu").forEach(menu => {
        menu.style.display = "none";
    });

    // Alterna a visibilidade do menu atual
    options.style.display = isVisible ? "none" : "block";

    // Adiciona um listener para fechar o menu ao clicar fora
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

function openListModalEdit() {
    const modal = document.getElementById("listModalEdit");
    if (modal) modal.style.display = "block";
}

function closeListModal() {
    const modal = document.getElementById("listModal");
    if (modal) modal.style.display = "none";
}

function closeListModalEdit() {
    const modal = document.getElementById("listModalEdit");
    if (modal) modal.style.display = "none";
}

async function saveList() {
    try {
        const storedUser = localStorage.getItem("currentUser");
        if (!storedUser) {
            alert("Usuário não autenticado. Faça login novamente.");
            window.location.href = "../login.html";
            return;
        }

        const phone = JSON.parse(storedUser).phone;
        const marketSelect = document.getElementById("marketSelectAdd");
        if (!marketSelect) {
            throw new Error("Elemento de seleção de mercado não encontrado");
        }

        const marketId = marketSelect.value;
        const market = markets.find(m => m._id === marketId);

        const list = {
            name: market ? market.name : new Date().toLocaleDateString("pt-BR"),
            marketId: marketId || undefined,
            phone,
            products: [],
            completed: false
        };

        const response = await fetch(`${API_URL}/shopping-lists`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(list)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao salvar lista");
        }

        const newList = await response.json();
        currentListId = newList._id;

        // Atualiza a lista de compras
        await fetchShoppingLists();

        // Fecha o modal
        closeListModal();

        // Abre o modal de produto para adicionar o primeiro item
        openProductModal("add", currentListId);

    } catch (error) {
        console.error("Erro ao salvar lista:", error);
        alert(`Erro ao salvar lista: ${error.message}`);
    }
}

function openListOptionsModal(listId) {
    currentListId = listId;
    const modal = document.getElementById("listOptionsModal");
    if (modal) modal.style.display = "block";
}

function closeListOptionsModal() {
    const modal = document.getElementById("listOptionsModal");
    if (modal) modal.style.display = "none";
}

async function openEditListModal(listId) {
    currentListId = listId;
    const list = shoppingLists.find(l => l._id === currentListId);
    if (!list) return;

    // Certifique-se que os mercados estão carregados
    if (markets.length === 0) {
        await fetchMarkets();
    }

    // Preenche o modal com os dados da lista existente
    const editSelect = document.getElementById("marketSelectEdit");
    if (editSelect) {
        editSelect.value = list.marketId || "";
    }

    const modal = document.getElementById("listModalEdit");
    if (modal) modal.style.display = "block";

    // Altera o botão para chamar updateList em vez de saveList
    document.getElementById("saveEditListBtn").onclick = updateList;
}

async function updateList() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser || !currentListId) return;

    const phone = JSON.parse(storedUser).phone;
    const marketId = document.getElementById("marketSelectEdit").value; // Note a mudança de ID aqui
    const market = markets.find(m => m._id === marketId);

    const updatedList = {
        marketId: marketId || undefined,
        name: market ? market.name : new Date().toLocaleDateString("pt-BR"),
        phone
    };

    try {
        const response = await fetch(`${API_URL}/shopping-lists/${currentListId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedList)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao atualizar lista");
        }

        await fetchShoppingLists();
        closeListModalEdit();
    } catch (error) {
        console.error("Update list error:", error);
        alert(`Erro ao atualizar lista: ${error.message}`);
    }
}

async function completeList(listId) {
    currentListId = listId; // Define o currentListId para uso na função
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    const phone = JSON.parse(storedUser).phone;
    try {
        const response = await fetch(`${API_URL}/shopping-lists/${currentListId}/complete`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, completed: true })
        });
        if (!response.ok) throw new Error(await response.text());
        await fetchShoppingLists();
    } catch (error) {
        console.error("Complete list error:", error);
    }
}

async function deleteList(listId) {
    currentListId = listId; // Define o currentListId para uso na função
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    const phone = JSON.parse(storedUser).phone;
    try {
        const response = await fetch(`${API_URL}/shopping-lists/${currentListId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone })
        });
        if (!response.ok) throw new Error(await response.text());
        await fetchShoppingLists();
    } catch (error) {
        console.error("Delete list error:", error);
    }
}

async function openProductModal(action, listId, productId = null) {
    const list = shoppingLists.find(l => l._id === listId);
    if (list.completed) {
        alert("Esta lista está concluída e não pode ser editada.");
        return;
    }

    currentListId = listId;
    editingProductId = productId;
    const modal = document.getElementById("productModal");
    const title = document.getElementById("productModalTitle");
    const buttons = document.getElementById("productModalButtons");

    if (!modal || !title || !buttons) return;

    const product = productId ?
        list.products.find(p => p._id === productId) :
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
            <button class="btn-secundary" onclick="closeProductModal()">Cancelar</button>
            <button class="btn" onclick="saveProduct()">Salvar</button>
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
            const response = await fetch(`${API_URL}/product/${searchTerm}/${daysFindPrice}`);
            if (!response.ok) throw new Error("Erro na busca");

            const products = await response.json();
            const currentList = shoppingLists.find(l => l._id === currentListId);
            const selectedMarketId = currentList?.marketId || null;

            if (!products || products.length === 0) {
                productSuggestions.innerHTML = `
                    <div class="suggestion-item create-option" 
                         data-name="${searchTerm}">
                        Criar: ${searchTerm}
                    </div>
                `;
                document.querySelector(".create-option").addEventListener("click", function () {
                    productNameInput.value = this.getAttribute("data-name");
                    productSuggestions.innerHTML = "";
                    updateQuantityLabel();
                    updatePackQuantityVisibility();
                });
                return;
            }

            productSuggestions.innerHTML = products.map(p => {
                const isDisabled = selectedMarketId && p.marketId?._id !== selectedMarketId;
                const tooltipText = isDisabled || !selectedMarketId ?
                    'title="Valor apenas para comparação"' : '';

                return `
                    <div class="suggestion-item ${isDisabled ? 'disabled' : ''}" 
                         data-name="${p.productName}"
                         data-price="${p.currentPrice}"
                         data-type="${p.type}"
                         data-market="${p.marketId?._id || ''}"
                         data-disabled="${isDisabled}"
                         ${tooltipText}>
                        ${p.productName} - R$ ${p.currentPrice?.toFixed(2) || '0.00'} - ${p.marketId?.name || ''}
                    </div>
                `;
            }).join("");

            document.querySelectorAll(".suggestion-item").forEach(item => {
                item.addEventListener("click", function (e) {
                    if (this.getAttribute("data-disabled") === "true") {
                        e.preventDefault();
                        return; // Impede a seleção de itens bloqueados
                    }
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

    if (!product.name) {
        alert("O nome do produto é obrigatório!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/shopping-lists/${currentListId}/products`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone,              // Telefone do usuário atual (proprietário ou compartilhado)
                listId: currentListId, // Inclui o ID da lista explicitamente
                product             // Dados do produto
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao salvar produto");
        }

        await fetchShoppingLists();
        closeProductModal();
    } catch (error) {
        console.error("Save product error:", error.message);
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, productId })
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
window.closeListModalEdit = closeListModalEdit;
window.saveList = saveList;
window.openListOptionsModal = openListOptionsModal;
window.closeListOptionsModal = closeListOptionsModal;
window.openEditListModal = openEditListModal;
window.completeList = completeList;
window.deleteList = deleteList;
window.toggleAccordion = toggleAccordion;
window.showOptions = showOptions;

document.addEventListener("DOMContentLoaded", async () => {
    checkAuthAndLoadUser();

    try {
        await fetchMarkets();
        await fetchShoppingLists();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        alert("Erro ao carregar dados. Por favor, recarregue a página.");
    }

    // Adiciona os event listeners
    document.getElementById("addListBtn")?.addEventListener("click", openListModal);

    // Adiciona o listener para o botão de salvar lista
    const saveListBtn = document.getElementById("saveListBtn");
    if (saveListBtn) {
        saveListBtn.addEventListener("click", saveList);
    } else {
        console.error("Botão saveListBtn não encontrado no HTML");
    }

    document.getElementById("addProductBtn")?.addEventListener("click", () => {
        if (!currentListId) {
            openListModal();
        } else {
            openProductModal("add", currentListId);
        }
    });
});