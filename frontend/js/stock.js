const API_URL = "https://stok-5ytv.onrender.com";
//const API_URL = "http://192.168.1.67:3000";

// Configuração do menu em JSON
const menuItems = [
    { name: "Financeiro", route: "./finances.html" },
    { name: "Estoque", route: "./stock.html" },
    { name: "Trabalho", route: "./activity.html" },
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

// Função para carregar a tela de estoque
function loadStock() {
    const userInitialsDiv = document.getElementById("userInitials");
    const userFullName = document.getElementById("userFullName");
    const userPhone = document.getElementById("userPhone");
    const logoutButton = document.getElementById("logout");
    const userModal = document.getElementById("userModal");
    const openSidebarButton = document.getElementById("openSidebar");
    const closeSidebarButton = document.getElementById("closeSidebar");
    const sidebar = document.getElementById("sidebar");
    const loggedUserName = document.getElementById("loggedUserName");
    const currentUser = localStorage.getItem("currentUser");

    // Se não houver currentUser, redireciona para login
    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    const user = JSON.parse(currentUser);
    userInitialsDiv.textContent = getInitials(user.name);
    userFullName.textContent = user.name;
    userPhone.textContent = user.phone;
    loggedUserName.textContent = user.name;

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

    // Logout: apaga currentUser e redireciona para login
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

    // Carregar produtos
    loadProducts();

    // Configurar eventos dos modais
    setupStockEvents();
}

// Função para carregar produtos
async function loadProducts() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const productList = document.getElementById("productList");

    try {
        const response = await fetch(`${API_URL}/products?ownerPhone=${currentUser.phone}`);
        if (!response.ok) throw new Error("Erro ao carregar produtos");
        const products = await response.json();

        productList.innerHTML = "";
        const today = new Date();
        const dayOfMonth = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        products.forEach(product => {
            const details = document.createElement("details");
            const summary = document.createElement("summary");
            const content = document.createElement("div");
            content.classList.add("stock-content");

            const editIcon = document.createElement("span");
            editIcon.classList.add("edit-icon");
            editIcon.addEventListener("click", (e) => {
                e.stopPropagation();
                openEditModal(product);
            });

            const deleteIcon = document.createElement("span");
            deleteIcon.classList.add("delete-icon");
            deleteIcon.addEventListener("click", (e) => {
                e.stopPropagation();
                openConfirmModal(`Deseja excluir ${product.name}?`, async () => {
                    try {
                        const deleteResponse = await fetch(`${API_URL}/products/${product._id}`, { method: "DELETE" });
                        if (!deleteResponse.ok) throw new Error("Erro ao excluir produto");
                        loadProducts();
                        openFeedbackModal("Produto excluído com sucesso!");
                    } catch (error) {
                        openFeedbackModal("Falha ao excluir produto");
                    }
                });
            });

            const shareIcon = document.createElement("span");
            shareIcon.classList.add("share-icon");
            shareIcon.addEventListener("click", (e) => {
                e.stopPropagation();
                openShareModal(product);
            });

            const accordionIcon = document.createElement("span");
            accordionIcon.classList.add("accordion-icon");
            accordionIcon.textContent = "▼";
            details.addEventListener("toggle", () => {
                accordionIcon.textContent = details.open ? "▲" : "▼";
            });

            const iconsContainer = document.createElement("span");
            iconsContainer.classList.add("icons-container");
            iconsContainer.appendChild(deleteIcon);
            iconsContainer.appendChild(editIcon);
            iconsContainer.appendChild(shareIcon);
            iconsContainer.appendChild(accordionIcon);

            summary.appendChild(document.createTextNode(product.name));
            summary.appendChild(iconsContainer);

            const table = document.createElement("table");
            const thead = document.createElement("thead");
            const tbody = document.createElement("tbody");
            const headerRow = document.createElement("tr");
            const dataRow = document.createElement("tr");

            const headers = ["Ideal", "Qtd", "Marca"];
            headers.forEach(headerText => {
                const th = document.createElement("th");
                th.textContent = headerText;
                headerRow.appendChild(th);
            });

            const idealCell = document.createElement("td");
            idealCell.textContent = product.idealQuantity.toString();
            const quantityCell = document.createElement("td");
            quantityCell.textContent = `${product.quantity} ${product.unitType} (${product.unitQuantity})`;
            const brandCell = document.createElement("td");
            brandCell.textContent = product.brand;

            dataRow.appendChild(idealCell);
            dataRow.appendChild(quantityCell);
            dataRow.appendChild(brandCell);

            thead.appendChild(headerRow);
            tbody.appendChild(dataRow);
            table.appendChild(thead);
            table.appendChild(tbody);
            content.appendChild(table);

            const consumptionPerWeek = daysInMonth / product.idealQuantity;
            for (let index = 0; index < product.idealQuantity; index++) {
                if (dayOfMonth < (index * consumptionPerWeek) && product.quantity < (product.idealQuantity - index)) {
                    details.classList.add("low-stock");
                }
            }

            details.appendChild(summary);
            details.appendChild(content);
            productList.appendChild(details);
        });
    } catch (error) {
        openFeedbackModal("Falha ao carregar a lista de produtos");
    }
}

// Configurar eventos dos modais
function setupStockEvents() {
    const addModal = document.getElementById("productModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const editModal = document.getElementById("editModal");
    const closeEditModalBtn = document.getElementById("closeEditModalBtn");
    const confirmModal = document.getElementById("confirmModal");
    const closeConfirmModalBtn = document.getElementById("closeConfirmModalBtn");
    const confirmMessage = document.getElementById("confirmMessage");
    const confirmActionBtn = document.getElementById("confirmActionBtn");
    const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
    const feedbackModal = document.getElementById("feedbackModal");
    const closeFeedbackModalBtn = document.getElementById("closeFeedbackModalBtn");
    const feedbackMessage = document.getElementById("feedbackMessage");
    const closeFeedbackBtn = document.getElementById("closeFeedbackBtn");
    const shareModal = document.getElementById("shareModal");
    const closeShareModalBtn = document.getElementById("closeShareModalBtn");

    openModalBtn.addEventListener("click", () => addModal.style.display = "block");
    closeModalBtn.addEventListener("click", () => addModal.style.display = "none");
    closeEditModalBtn.addEventListener("click", () => editModal.style.display = "none");
    closeConfirmModalBtn.addEventListener("click", () => confirmModal.style.display = "none");
    cancelConfirmBtn.addEventListener("click", () => confirmModal.style.display = "none");
    closeFeedbackModalBtn.addEventListener("click", () => feedbackModal.style.display = "none");
    closeFeedbackBtn.addEventListener("click", () => feedbackModal.style.display = "none");
    closeShareModalBtn.addEventListener("click", () => shareModal.style.display = "none");

    document.getElementById("productForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const product = {
            name: document.getElementById("name").value,
            quantity: parseInt(document.getElementById("quantity").value),
            brand: document.getElementById("brand").value,
            unitType: document.getElementById("unitType").value,
            unitQuantity: document.getElementById("unitQuantity").value,
            idealQuantity: parseInt(document.getElementById("idealQuantity").value),
            ownerPhone: currentUser.phone,
        };

        addModal.style.display = "none";
        openConfirmModal("Deseja confirmar o cadastro deste produto?", async () => {
            try {
                const response = await fetch(`${API_URL}/products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(product),
                });
                if (!response.ok) throw new Error("Erro ao adicionar produto");
                document.getElementById("productForm").reset();
                loadProducts();
                openFeedbackModal("Produto adicionado com sucesso!");
            } catch (error) {
                openFeedbackModal("Falha ao adicionar produto");
            }
        });
    });

    document.getElementById("editForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const productId = editModal.dataset.productId;
        const updatedProduct = {
            quantity: parseInt(document.getElementById("editQuantity").value),
            brand: document.getElementById("editBrand").value,
            unitType: document.getElementById("editUnitType").value,
            unitQuantity: document.getElementById("editUnitQuantity").value,
            idealQuantity: parseInt(document.getElementById("editIdealQuantity").value),
        };

        openConfirmModal("Deseja confirmar a edição deste produto?", async () => {
            try {
                const response = await fetch(`${API_URL}/products/${productId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedProduct),
                });
                if (!response.ok) throw new Error("Erro ao atualizar produto");
                editModal.style.display = "none";
                loadProducts();
                openFeedbackModal("Produto atualizado com sucesso!");
            } catch (error) {
                openFeedbackModal("Falha ao atualizar produto");
            }
        });
    });

    document.getElementById("shareForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const sharePhone = document.getElementById("sharePhone").value.trim();
        const productId = shareModal.dataset.productId;

        openConfirmModal(`Deseja compartilhar a lista com ${sharePhone}?`, async () => {
            try {
                const response = await fetch(`${API_URL}/products/${productId}/share`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sharedWithPhone: sharePhone }),
                });
                if (!response.ok) throw new Error("Erro ao compartilhar lista");
                shareModal.style.display = "none";
                document.getElementById("shareForm").reset();
                openFeedbackModal("Lista compartilhada com sucesso!");
            } catch (error) {
                openFeedbackModal(`Falha ao compartilhar lista: ${error.message}`);
            }
        });
    });
}

// Funções auxiliares para abrir modais
function openConfirmModal(message, onConfirm) {
    const confirmModal = document.getElementById("confirmModal");
    const confirmMessage = document.getElementById("confirmMessage");
    const confirmActionBtn = document.getElementById("confirmActionBtn");

    confirmMessage.textContent = message;
    confirmModal.style.display = "block";
    confirmActionBtn.onclick = () => {
        onConfirm();
        confirmModal.style.display = "none";
    };
}

function openFeedbackModal(message) {
    const feedbackModal = document.getElementById("feedbackModal");
    const feedbackMessage = document.getElementById("feedbackMessage");
    feedbackMessage.textContent = message;
    feedbackModal.style.display = "block";
}

function openEditModal(product) {
    const editModal = document.getElementById("editModal");
    editModal.dataset.productId = product._id;
    document.getElementById("editName").value = product.name;
    document.getElementById("editQuantity").value = product.quantity;
    document.getElementById("editBrand").value = product.brand;
    document.getElementById("editUnitType").value = product.unitType;
    document.getElementById("editUnitQuantity").value = product.unitQuantity;
    document.getElementById("editIdealQuantity").value = product.idealQuantity;
    editModal.style.display = "block";
}

function openShareModal(product) {
    const shareModal = document.getElementById("shareModal");
    shareModal.dataset.productId = product._id;
    shareModal.style.display = "block";
}

// Inicialização
if (document.getElementById("userInitials")) {
    loadStock();
}