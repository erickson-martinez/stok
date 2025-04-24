//frontend/js/stock.js
// Função para carregar a tela de estoque
function loadStock() {
    // Verificar se os elementos da sidebar existem
    const userInitialsDiv = document.getElementById("userInitials");
    const openSidebarButton = document.getElementById("openSidebar");
    const closeSidebarButton = document.getElementById("closeSidebar");
    const sidebar = document.getElementById("sidebar");

    if (!userInitialsDiv || !openSidebarButton || !closeSidebarButton || !sidebar) {
        console.error("Elementos da sidebar não encontrados!");
        return;
    }

    const userFullName = document.getElementById("userFullName");
    const userPhone = document.getElementById("userPhone");
    const logoutButton = document.getElementById("logout");
    const userModal = document.getElementById("userModal");
    const loggedUserName = document.getElementById("loggedUserName");
    const currentUser = localStorage.getItem("currentUser");

    // Se não houver currentUser, redireciona para login
    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    const user = JSON.parse(currentUser);
    if (userInitialsDiv) userInitialsDiv.textContent = getInitials(user.name);
    if (userFullName) userFullName.textContent = user.name;
    if (userPhone) userPhone.textContent = user.phone;
    if (loggedUserName) loggedUserName.textContent = user.name;

    // Carrega o menu
    loadSidebarMenu();

    // Configura eventos da sidebar apenas se os elementos existirem
    if (userInitialsDiv && userModal) {
        userInitialsDiv.addEventListener("click", (e) => {
            e.stopPropagation();
            userModal.classList.toggle("active");
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("currentUser");
            window.location.href = "../login.html";
        });
    }

    if (openSidebarButton && sidebar) {
        openSidebarButton.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.add("active");
        });
    }

    if (closeSidebarButton && sidebar) {
        closeSidebarButton.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.remove("active");
        });
    }

    // Fechar modais ao clicar fora
    document.addEventListener("click", (event) => {
        if (userModal && !userModal.contains(event.target) && !userInitialsDiv.contains(event.target)) {
            userModal.classList.remove("active");
        }
        if (sidebar && !sidebar.contains(event.target) && !openSidebarButton.contains(event.target)) {
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
        // Ajustado para usar idUser, conforme a versão anterior
        const response = await fetch(`${API_URL}/products/${currentUser.idUser}`);
        if (!response.ok) throw new Error("Erro ao carregar produtos");
        const products = await response.json();

        productList.innerHTML = "";
        const today = new Date();
        const dayOfMonth = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        if (products.length === 0) {
            productList.innerHTML = "<p>Nenhum produto cadastrado</p>";
            return;
        }

        products.forEach(product => {
            const details = document.createElement("details");
            const summary = document.createElement("summary");
            const content = document.createElement("div");
            content.classList.add("stock-content");

            const editIcon = document.createElement("span");
            editIcon.classList.add("edit-icon");
            editIcon.innerHTML = "✏️";
            editIcon.addEventListener("click", (e) => {
                e.stopPropagation();
                openEditModal(product);
            });

            const deleteIcon = document.createElement("span");
            deleteIcon.classList.add("delete-icon");
            deleteIcon.innerHTML = "🗑️";
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
            shareIcon.innerHTML = "↪️";
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
            table.classList.add("stock-table");
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
        productList.innerHTML = "<p>Erro ao carregar produtos</p>";
        console.error("Erro ao carregar produtos:", error);
    }
}

// Configurar eventos dos modais
function setupStockEvents() {
    const addProductBtn = document.getElementById("addProductBtn");
    const saveProductBtn = document.getElementById("saveProductBtn");
    const updateProductBtn = document.getElementById("updateProductBtn");
    const confirmActionBtn = document.getElementById("confirmActionBtn");

    if (!addProductBtn) {
        console.error("Botão addProductBtn não encontrado!");
        return;
    }

    if (!saveProductBtn) {
        console.error("Botão saveProductBtn não encontrado!");
    }

    if (!updateProductBtn) {
        console.error("Botão updateProductBtn não encontrado!");
    }

    if (!confirmActionBtn) {
        console.error("Botão confirmActionBtn não encontrado!");
    }

    // Adicionar produto
    addProductBtn.addEventListener("click", () => {
        console.log("Botão addProductBtn clicado!");
        const productModal = document.getElementById("productModal");
        if (productModal) {
            productModal.classList.add("active");
            console.log("Classe active adicionada ao productModal");
        } else {
            console.error("Modal productModal não encontrado!");
        }
    });

    // Salvar novo produto
    if (saveProductBtn) {
        saveProductBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            const product = {
                name: document.getElementById("productName").value,
                quantity: parseInt(document.getElementById("productQuantity").value),
                brand: document.getElementById("productBrand").value,
                unitType: document.getElementById("productUnitType").value,
                unitQuantity: document.getElementById("productUnitQuantity").value,
                idealQuantity: parseInt(document.getElementById("productIdealQuantity").value),
                idUser: currentUser.idUser,
            };

            try {
                const response = await fetch(`${API_URL}/products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(product),
                });
                if (!response.ok) throw new Error("Erro ao adicionar produto");
                closeProductModal();
                loadProducts();
                openFeedbackModal("Produto adicionado com sucesso!");
            } catch (error) {
                openFeedbackModal("Falha ao adicionar produto");
            }
        });
    }

    // Atualizar produto
    if (updateProductBtn) {
        updateProductBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const productId = document.getElementById("editModal").dataset.productId;
            const updatedProduct = {
                quantity: parseInt(document.getElementById("editQuantity").value),
                brand: document.getElementById("editBrand").value,
                unitType: document.getElementById("editUnitType").value,
                unitQuantity: document.getElementById("editUnitQuantity").value,
                idealQuantity: parseInt(document.getElementById("editIdealQuantity").value),
            };

            try {
                const response = await fetch(`${API_URL}/products/${productId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedProduct),
                });
                if (!response.ok) throw new Error("Erro ao atualizar produto");
                closeEditModal();
                loadProducts();
                openFeedbackModal("Produto atualizado com sucesso!");
            } catch (error) {
                openFeedbackModal("Falha ao atualizar produto");
            }
        });
    }
}

// Funções auxiliares para modais
function openConfirmModal(message, onConfirm) {
    const confirmModal = document.getElementById("confirmModal");
    const confirmMessage = document.getElementById("confirmMessage");
    const confirmActionBtn = document.getElementById("confirmActionBtn");

    if (!confirmModal || !confirmMessage || !confirmActionBtn) {
        console.error("Elementos do confirmModal não encontrados!");
        return;
    }

    confirmMessage.textContent = message;
    confirmModal.classList.add("active");

    // Remove event listeners anteriores para evitar duplicação
    const newConfirmBtn = confirmActionBtn.cloneNode(true);
    confirmActionBtn.parentNode.replaceChild(newConfirmBtn, confirmActionBtn);

    newConfirmBtn.addEventListener("click", () => {
        onConfirm();
        confirmModal.classList.remove("active");
    });
}

function openFeedbackModal(message) {
    const feedbackModal = document.getElementById("feedbackModal");
    const feedbackMessage = document.getElementById("feedbackMessage");

    if (!feedbackModal || !feedbackMessage) {
        console.error("Elementos do feedbackModal não encontrados!");
        return;
    }

    feedbackMessage.textContent = message;
    feedbackModal.classList.add("active");
}

function openEditModal(product) {
    const editModal = document.getElementById("editModal");
    if (!editModal) {
        console.error("Modal editModal não encontrado!");
        return;
    }

    editModal.dataset.productId = product._id;
    document.getElementById("editName").value = product.name;
    document.getElementById("editQuantity").value = product.quantity;
    document.getElementById("editBrand").value = product.brand;
    document.getElementById("editUnitType").value = product.unitType;
    document.getElementById("editUnitQuantity").value = product.unitQuantity;
    document.getElementById("editIdealQuantity").value = product.idealQuantity;
    editModal.classList.add("active");
}

function openShareModal(product) {
    const shareModal = document.getElementById("shareModal");
    if (!shareModal) {
        console.error("Modal shareModal não encontrado!");
        return;
    }

    shareModal.dataset.productId = product._id;
    shareModal.classList.add("active");
}

function closeProductModal() {
    const productModal = document.getElementById("productModal");
    const productForm = document.getElementById("productForm");
    if (productModal) productModal.classList.remove("active");
    if (productForm) productForm.reset();
}

function closeEditModal() {
    const editModal = document.getElementById("editModal");
    if (editModal) editModal.classList.remove("active");
}

function closeConfirmModal() {
    const confirmModal = document.getElementById("confirmModal");
    if (confirmModal) confirmModal.classList.remove("active");
}

// Fechar modais ao clicar fora
document.addEventListener("click", (event) => {
    const modals = document.querySelectorAll(".modal");
    modals.forEach(modal => {
        if (!modal.contains(event.target) && !event.target.matches("[data-target]") && !event.target.closest("#addProductBtn")) {
            modal.classList.remove("active");
        }
    });
});

// Fechar modais com botão close
document.querySelectorAll(".close").forEach(btn => {
    btn.addEventListener("click", function () {
        this.closest(".modal").classList.remove("active");
    });
});

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado, iniciando loadStock");
    loadStock();
});