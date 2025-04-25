

const daysFindPrice = 1; // Dias para buscar o preço do produto
let markets = [];
let shoppingLists = [];
let currentListId = null;
let editingProductId = null;

document.getElementById('marketSelectAdd').addEventListener('change', function () {
    const marketId = this.value;
    const market = markets.find(m => m._id === marketId);
    const preview = document.getElementById('listNamePreview')
    if (market) {
        preview.textContent = `${market.name} - ${new Date().toLocaleDateString('pt-BR')}`;
    }
});

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

    const idUser = JSON.parse(storedUser).idUser;
    try {
        // Busca listas próprias
        const ownResponse = await fetch(`${API_URL}/shopping-lists/${idUser}`);
        if (!ownResponse.ok) {
            throw new Error(`Erro ao carregar listas próprias: ${ownResponse.status}`);
        }
        const ownLists = await ownResponse.json();

        // Busca listas compartilhadas (trata 404 como lista vazia)
        let sharedLists = [];
        try {
            const sharedResponse = await fetch(`${API_URL}/shopping-lists/shared/${idUser}`);
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
    const preview = document.getElementById('listNamePreview')
    preview.textContent = `Lista de compras - ${new Date().toLocaleDateString('pt-BR')}`
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
                idUser: JSON.parse(storedUser).idUser,
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
                            <span class="accordion-toggle"><i class="fas fa-chevron-down"></i></span>
                            <div class="options-wrapper">
                                <span class="options-trigger" data-id="${list._id}" onclick="event.stopPropagation(); showOptions(event, '${list._id}')">⋯</span>
                                <div id="options-${list._id}" class="options-menu">
                                    ${list.completed ? '' : `
                                        <button class="add-product-btn" 
                                        title="Adicionar produto a lista"
                                        onclick="openProductModal('add', '${list._id}'); event.stopPropagation();">
                                            <i class="fas fa-plus"> produto</i>
                                        </button>
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
    event.stopPropagation();
    event.preventDefault();

    const optionsMenu = document.getElementById(`options-${id}`);
    const trigger = event.currentTarget;

    // Fecha todos os outros menus
    document.querySelectorAll('.options-menu').forEach(menu => {
        if (menu !== optionsMenu) menu.classList.remove('show');
    });

    if (optionsMenu) {
        // Calcula a posição correta
        const rect = trigger.getBoundingClientRect();
        optionsMenu.style.left = `${rect.left - 92}px`;
        optionsMenu.style.top = `${rect.bottom + window.scrollY}px`;

        // Alterna a visibilidade
        optionsMenu.classList.toggle('show');

        // Fecha ao clicar fora
        const clickHandler = (e) => {
            if (!optionsMenu.contains(e.target) && e.target !== trigger) {
                optionsMenu.classList.remove('show');
                document.removeEventListener('click', clickHandler);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', clickHandler);
        }, 10);
    }
}

function openListModal() {
    const modal = document.getElementById("listModal");
    if (modal) modal.style.display = "block";
}

function closeListModal() {
    const modal = document.getElementById("listModal");
    if (modal) {
        modal.style.display = "none";
        resetMarketSelection(); // Limpa a seleção ao fechar
    }
}

function openListModalEdit() {
    const modal = document.getElementById("listModalEdit");
    if (modal) modal.classList.add("active");
}

function closeListModalEdit() {
    const modal = document.getElementById("listModalEdit");
    if (modal) modal.style.display = "none";
}

async function saveList() {
    try {
        // 1. Verificar autenticação do usuário
        const storedUser = localStorage.getItem("currentUser");
        if (!storedUser) {
            alert("Usuário não autenticado. Faça login novamente.");
            window.location.href = "../login.html";
            return;
        }

        const idUser = JSON.parse(storedUser).idUser;

        // 2. Obter seleção do mercado
        const marketSelect = document.getElementById("marketSelectAdd");
        if (!marketSelect) {
            throw new Error("Elemento de seleção de mercado não encontrado");
        }

        const marketId = marketSelect.value;
        const market = markets.find(m => m._id === marketId);

        // 3. Determinar o nome da lista conforme as regras
        let listName;
        if (market) {
            // Caso 1: Com mercado selecionado (nome do mercado + data atual)
            listName = `${market.name} - ${new Date().toLocaleDateString("pt-BR")}`;
        } else {
            // Caso 2: Sem mercado selecionado (apenas data atual)
            listName = `Lista de compras - ${new Date().toLocaleDateString("pt-BR")}`;
        }

        // 4. Criar objeto da lista
        const list = {
            name: listName,
            marketId: marketId || null, // Usar null em vez de undefined para melhor consistência
            idUser,
            products: [],
            completed: false,
            createdAt: new Date().toISOString() // Adiciona timestamp de criação
        };

        // 5. Enviar para a API
        const response = await fetch(`${API_URL}/shopping-lists`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",// Se usar autenticação por token
            },
            body: JSON.stringify(list)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro ao salvar lista");
        }

        // 6. Processar resposta
        const newList = await response.json();
        currentListId = newList._id;

        // 7. Atualizar a interface
        await fetchShoppingLists();
        closeListModal();

        // 8. Abrir modal de produto se for o fluxo de "Criar lista"
        const clickedButton = document.activeElement.id;
        if (clickedButton === "saveListBtn") {
            openProductModal("add", currentListId);
        }

        // 9. Feedback visual
        showToast("Lista criada com sucesso!");

    } catch (error) {
        console.error("Erro ao salvar lista:", error);
        alert(`Erro ao salvar lista: ${error.message}`);
    } finally {
        resetMarketSelection();
    }
}

// Função auxiliar para reset (incluir no seu código)
function resetMarketSelection() {
    const marketSelect = document.getElementById("marketSelectAdd");
    if (marketSelect) {
        marketSelect.value = "";
        document.getElementById("listNamePreview").textContent = "";
    }
}

// Função auxiliar para mostrar feedback (opcional)
function showToast(message) {
    // Implementação básica de toast notification
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
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

    console.log(modal)
    if (modal) modal.style.display = "block";

    // Altera o botão para chamar updateList em vez de saveList
    document.getElementById("saveEditListBtn").onclick = updateList;
}

async function updateList() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser || !currentListId) return;

    const idUser = JSON.parse(storedUser).idUser;
    const marketId = document.getElementById("marketSelectEdit").value; // Note a mudança de ID aqui
    const market = markets.find(m => m._id === marketId);

    const updatedList = {
        marketId: marketId || undefined,
        name: market ? market.name : new Date().toLocaleDateString("pt-BR"),
        idUser
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

    const idUser = JSON.parse(storedUser).idUser;
    try {
        const response = await fetch(`${API_URL}/shopping-lists/${currentListId}/complete`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idUser, completed: true })
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

    const idUser = JSON.parse(storedUser).idUser;
    try {
        const response = await fetch(`${API_URL}/shopping-lists/${currentListId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idUser })
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
    document.getElementById("productBrand").value = product?.brand || "";
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
        buttons.innerHTML = `<button class="btn-secundary" onclick="closeProductModal()">Fechar</button>`;
    } else if (action === "delete" && productId) {
        buttons.innerHTML = `
            <button class="btn-secundary" onclick="closeProductModal()">Cancelar</button>
            <button class="btn" onclick="deleteProduct('${listId}', '${productId}')">Confirmar</button>
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
    const productBrandInput = document.getElementById("productBrand");
    const productTypeSelect = document.getElementById("productType");
    const productValueInput = document.getElementById("productValue");
    const productSuggestions = document.getElementById("productSuggestions");

    productNameInput.addEventListener("input", async function () {
        const searchTerm = decodeURIComponent(this.value.trim());

        if (searchTerm.length < 2) {
            productSuggestions.innerHTML = "";
            productSuggestions.classList.remove("show");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/product-price/${searchTerm}/${daysFindPrice}`);
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
                productSuggestions.classList.add("show");

                document.querySelector(".create-option").addEventListener("click", function () {
                    productNameInput.value = this.getAttribute("data-name");
                    productSuggestions.innerHTML = "";
                    productSuggestions.classList.remove("show");
                    updateQuantityLabel();
                    updatePackQuantityVisibility();
                });
                return;
            }

            productSuggestions.innerHTML = products.map(p => {

                console.log(p)
                const isDisabled = selectedMarketId && p.marketId?._id !== selectedMarketId;
                const tooltipText = isDisabled || !selectedMarketId ?
                    'title="Valor apenas para comparação"' : '';

                return `
                    <div class="suggestion-item ${isDisabled ? 'disabled' : ''}" 
                         data-name="${p.productName}"
                         data-brand="${p.brand}"
                         data-price="${p.currentPrice}"
                         data-type="${p.type}"
                         data-market="${p.marketId?._id || ''}"
                         data-disabled="${isDisabled}"
                         ${tooltipText}>
                        ${p.productName} - ${p.brand} - R$ ${p.currentPrice?.toFixed(2) || '0.00'} - ${p.marketId?.name || ''}
                    </div>
                `;
            }).join("");

            productSuggestions.classList.add("show");

            document.querySelectorAll(".suggestion-item").forEach(item => {
                item.addEventListener("click", function (e) {
                    if (this.getAttribute("data-disabled") === "true") {
                        e.preventDefault();
                        return;
                    }
                    productNameInput.value = this.getAttribute("data-name");
                    productBrandInput.value = this.getAttribute("data-brand");
                    productValueInput.value = this.getAttribute("data-price");
                    productTypeSelect.value = this.getAttribute("data-type");
                    productSuggestions.innerHTML = "";
                    productSuggestions.classList.remove("show");
                    updateQuantityLabel();
                    updatePackQuantityVisibility();
                });
            });

        } catch (error) {
            console.error("Erro na busca de produtos:", error);
            productSuggestions.innerHTML = "<div class='error'>Erro ao buscar produtos</div>";
            productSuggestions.classList.add("show");
        }
    });

    document.addEventListener("click", function (e) {
        if (!productNameInput.contains(e.target) && !productSuggestions.contains(e.target)) {
            productSuggestions.innerHTML = "";
            productSuggestions.classList.remove("show");
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

    const idUser = JSON.parse(storedUser).idUser;
    const product = {
        _id: editingProductId || undefined,
        name: document.getElementById("productName").value,
        brand: document.getElementById("productBrand").value,
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
                idUser,              // Telefone do usuário atual (proprietário ou compartilhado)
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

    const idUser = JSON.parse(storedUser).idUser;
    try {
        const response = await fetch(`${API_URL}/shopping-lists/${listId}/products`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idUser, productId })
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
});