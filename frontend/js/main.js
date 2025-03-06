const API_URL = "https://stok-hiqo.onrender.com";

// Elementos da interface
const loginScreen = document.getElementById("loginScreen");
const mainContent = document.getElementById("mainContent");
const loggedUserName = document.getElementById("loggedUserName");
const logoutBtn = document.getElementById("logoutBtn");
const productList = document.getElementById("productList");

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
const registerConfirmModal = document.getElementById("registerConfirmModal");
const closeRegisterConfirmModalBtn = document.getElementById("closeRegisterConfirmModalBtn");
const registerConfirmMessage = document.getElementById("registerConfirmMessage");
const confirmRegisterBtn = document.getElementById("confirmRegisterBtn");
const cancelRegisterBtn = document.getElementById("cancelRegisterBtn");
const shareModal = document.getElementById("shareModal");
const closeShareModalBtn = document.getElementById("closeShareModalBtn");

let currentUser = null;

function saveUserToLocalStorage(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    console.log("Usuário salvo no localStorage:", user);
}

// Função para carregar o usuário do localStorage
function loadUserFromLocalStorage() {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
        currentUser = JSON.parse(userData);
        console.log("Usuário carregado do localStorage:", currentUser);
        if (loginScreen) loginScreen.style.display = "none";
        if (mainContent) mainContent.style.display = "block";
        if (loggedUserName) loggedUserName.textContent = currentUser.name;
        loadProducts();
    }
}

// Função para limpar o usuário do localStorage
function clearUserFromLocalStorage() {
    localStorage.removeItem("currentUser");
    console.log("Sessão limpa do localStorage");
}

loadUserFromLocalStorage();

// Abrir o modal de adição
if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
        console.log("Botão Adicionar Produto clicado");
        if (addModal) {
            addModal.style.display = "block";
        } else {
            console.error("productModal não encontrado");
        }
    });
} else {
    console.error("openModalBtn não encontrado");
}

if (closeRegisterConfirmModalBtn) {
    closeRegisterConfirmModalBtn.addEventListener("click", () => {
        registerConfirmModal.style.display = "none";
    });
}

if (closeShareModalBtn) {
    closeShareModalBtn.addEventListener("click", () => {
        console.log("Botão × do shareModal clicado");
        if (shareModal) {
            shareModal.style.display = "none";
        } else {
            console.error("shareModal não encontrado");
        }
    });
} else {
    console.error("closeShareModalBtn não encontrado");
}

if (closeFeedbackBtn) {
    closeFeedbackBtn.addEventListener("click", () => {
        if (feedbackModal) {
            feedbackModal.style.display = "none";
        } else {
            console.error("feedbackModal não encontrado");
        }
    });
} else {
    console.error("closeFeedbackBtn não encontrado");
}

// Fechar o modal de adição
if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        if (addModal) {
            addModal.style.display = "none";
        } else {
            console.error("productModal não encontrado");
        }
    });
} else {
    console.error("closeModalBtn não encontrado");
}


function openConfirmModal(message, onConfirm) {
    console.log("Dentro de openConfirmModal, mensagem:", message);
    if (!confirmModal) {
        console.error("confirmModal não encontrado");
        return;
    }
    console.log("confirmModal encontrado, configurando mensagem");
    if (!confirmMessage) {
        console.error("confirmMessage não encontrado");
        return;
    }
    confirmMessage.textContent = message;
    console.log("Mudando display para block");
    confirmModal.style.display = "block";
    confirmModal.style.zIndex = "10010";
    confirmModal.style.visibility = "visible"; // Controlado explicitamente
    console.log("Display após mudança:", confirmModal.style.display);

    if (!confirmActionBtn) {
        console.error("confirmActionBtn não encontrado");
        return;
    }
    console.log("Configurando evento do botão Confirmar");
    confirmActionBtn.onclick = () => {
        console.log("Botão Confirmar clicado");
        onConfirm();
        confirmModal.style.display = "none";
        confirmModal.style.visibility = "hidden";
    };

    if (!cancelConfirmBtn) {
        console.error("cancelConfirmBtn não encontrado");
    } else {
        cancelConfirmBtn.onclick = () => {
            console.log("Botão Cancelar clicado");
            confirmModal.style.display = "none";
            confirmModal.style.visibility = "hidden";
            if (addModal) addModal.style.display = "block"; // Reabre o addModal
        };
    }

    if (!closeConfirmModalBtn) {
        console.error("closeConfirmModalBtn não encontrado");
    } else {
        closeConfirmModalBtn.onclick = () => {
            console.log("Botão × clicado");
            confirmModal.style.display = "none";
            confirmModal.style.visibility = "hidden";
            if (addModal) addModal.style.display = "block"; // Reabre o addModal
        };
    }
}

function openFeedbackModal(message) {
    if (!feedbackModal) return console.error("feedbackModal não encontrado");
    feedbackMessage.textContent = message;
    feedbackModal.style.display = "block";
}

function openRegisterConfirmModal(name, phone, onConfirm) {
    if (!registerConfirmModal) return console.error("registerConfirmModal não encontrado");
    registerConfirmMessage.textContent = `Nenhum usuário encontrado com o telefone ${phone}. Deseja criar um perfil para ${name}?`;
    registerConfirmModal.style.display = "block";
    confirmRegisterBtn.onclick = () => {
        onConfirm();
        registerConfirmModal.style.display = "none";
    };
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    console.log("Formulário encontrado");
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("Formulário enviado");

        const name = document.getElementById("userName").value;
        const phone = document.getElementById("userPhone").value;
        const password = document.getElementById("userPassword").value || undefined;

        console.log("Dados capturados:", { name, phone, password });

        try {
            console.log(`Fazendo GET: ${API_URL}/users/${phone}`);
            const response = await fetch(`${API_URL}/users/${phone}`);
            console.log("Resposta do GET:", response.status);

            if (response.ok) {
                currentUser = { name, phone, password };
                saveUserToLocalStorage(currentUser); // Salva no localStorage
                if (loginScreen) loginScreen.style.display = "none";
                else console.error("loginScreen não encontrado");
                if (mainContent) mainContent.style.display = "block";
                else console.error("mainContent não encontrado");
                if (loggedUserName) loggedUserName.textContent = currentUser.name;
                else console.error("loggedUserName não encontrado");
                loadProducts();
            } else if (response.status === 404) {
                openRegisterConfirmModal(name, phone, async () => {
                    console.log(`Fazendo POST: ${API_URL}/users`);
                    try {
                        const registerResponse = await fetch(`${API_URL}/users`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name, phone, password }),
                        });
                        console.log("Resposta do POST:", registerResponse.status);

                        if (!registerResponse.ok) {
                            const errorText = await registerResponse.text();
                            throw new Error(errorText);
                        }
                        currentUser = { name, phone, password };
                        saveUserToLocalStorage(currentUser); // Salva no localStorage após cadastro
                        if (loginScreen) loginScreen.style.display = "none";
                        else console.error("loginScreen não encontrado");
                        if (mainContent) mainContent.style.display = "block";
                        else console.error("mainContent não encontrado");
                        if (loggedUserName) loggedUserName.textContent = currentUser.name;
                        else console.error("loggedUserName não encontrado");
                        loadProducts();
                        openFeedbackModal("Usuário cadastrado com sucesso!");
                    } catch (error) {
                        console.error("Erro no cadastro:", error);
                        openFeedbackModal("Falha ao cadastrar usuário: " + error.message);
                    }
                });
            } else {
                throw new Error("Erro ao verificar usuário");
            }
        } catch (error) {
            console.error("Erro no login:", error);
            openFeedbackModal("Falha ao entrar: " + error.message);
        }
    });
} else {
    console.error("Formulário loginForm não encontrado");
}

// Evento de logout
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        console.log("Botão Sair clicado");
        currentUser = null;
        clearUserFromLocalStorage(); // Limpa o localStorage
        if (mainContent) mainContent.style.display = "none";
        if (loginScreen) loginScreen.style.display = "block";
        document.getElementById("loginForm").reset();
    });
} else {
    console.error("logoutBtn não encontrado");
}

async function loadProducts() {
    console.log("Carregando produtos...");
    if (!currentUser) return console.error("Nenhum usuário logado");

    try {
        const response = await fetch(`${API_URL}/products?ownerPhone=${currentUser.phone}`);
        console.log("Resposta do GET produtos:", response.status);
        if (!response.ok) throw new Error("Erro ao carregar produtos");
        const products = await response.json();

        if (!productList) {
            console.error("productList não encontrado");
            return;
        }

        productList.innerHTML = ""; // Limpa a lista
        products.forEach(product => {
            const details = document.createElement("details");
            const summary = document.createElement("summary");
            summary.textContent = product.name;
            details.appendChild(summary);
            productList.appendChild(details);
        });
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        openFeedbackModal("Falha ao carregar a lista de produtos");
    }
}


// Outros eventos (logout, etc.)
logoutBtn.addEventListener("click", () => {
    currentUser = null;
    mainContent.style.display = "none";
    loginScreen.style.display = "block";
    document.getElementById("loginForm").reset();
});

// (Inclua aqui as outras funções como loadProducts, openEditModal, etc.)

// Botão de logout
logoutBtn.addEventListener("click", () => {
    currentUser = null;
    mainContent.style.display = "none";
    loginScreen.style.display = "block";
    document.getElementById("loginForm").reset();
});

// Cadastro de produtos
document.getElementById("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Formulário de cadastro de produto enviado");

    const product = {
        name: document.getElementById("name").value,
        quantity: parseInt(document.getElementById("quantity").value),
        brand: document.getElementById("brand").value,
        unitType: document.getElementById("unitType").value,
        unitQuantity: document.getElementById("unitQuantity").value,
        idealQuantity: parseInt(document.getElementById("idealQuantity").value),
        ownerPhone: currentUser.phone,
    };

    // Fecha todos os modais antes de abrir o confirmModal
    if (addModal) {
        addModal.style.display = "none";
        console.log("addModal fechado");
    }
    if (shareModal) {
        shareModal.style.display = "none";
        console.log("shareModal fechado");
    }
    if (editModal) {
        editModal.style.display = "none";
        console.log("editModal fechado");
    }
    if (feedbackModal) {
        feedbackModal.style.display = "none";
        console.log("feedbackModal fechado");
    }

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
            console.error("Erro:", error);
            openFeedbackModal("Falha ao adicionar produto");
        }
    });
});

// Edição de produtos
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
            console.error("Erro:", error);
            openFeedbackModal("Falha ao atualizar produto");
        }
    });
});

// Carregar produtos do usuário logado
async function loadProducts() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_URL}/products?ownerPhone=${currentUser.phone}`);
        if (!response.ok) throw new Error("Erro ao carregar produtos");
        const products = await response.json();
        const list = document.getElementById("productList");
        list.innerHTML = "";

        const today = new Date();
        const dayOfMonth = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

        products.forEach(product => {
            const details = document.createElement("details");
            const summary = document.createElement("summary");
            const content = document.createElement("div");
            content.classList.add("content");

            // Ícones de Editar, Excluir e Compartilhar
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
                        console.error("Erro:", error);
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
            list.appendChild(details);
        });
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        openFeedbackModal("Falha ao carregar a lista de produtos");
    }
}

function openEditModal(product) {
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
    console.log("Abrindo shareModal, product ID:", product._id);
    if (!shareModal) {
        console.error("shareModal não encontrado");
        return;
    }
    shareModal.style.display = "block";

    const shareForm = document.getElementById("shareForm");
    if (!shareForm) {
        console.error("shareForm não encontrado");
        shareModal.style.display = "none";
        return;
    }
    console.log("shareForm encontrado");

    // Limpar listener anterior para evitar duplicação
    shareForm.removeEventListener("submit", shareForm.onsubmit);

    shareForm.onsubmit = async (e) => {
        e.preventDefault();
        console.log("Formulário enviado");

        const sharePhoneElement = document.getElementById("sharePhone");
        if (!sharePhoneElement) {
            console.error("sharePhone não encontrado");
            openFeedbackModal("Erro: Campo de telefone não encontrado.");
            return;
        }

        const sharePhone = sharePhoneElement.value.trim();
        if (!sharePhone) {
            console.error("Nenhum telefone fornecido");
            openFeedbackModal("Por favor, insira um telefone.");
            return;
        }
        console.log("Telefone capturado:", sharePhone);

        console.log("Chamando openConfirmModal");
        openConfirmModal(`Deseja compartilhar a lista com ${sharePhone}?`, async () => {
            console.log("Confirmação recebida, iniciando compartilhamento");
            try {
                const response = await fetch(`${API_URL}/products/${product._id}/share`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sharedWithPhone: sharePhone }),
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Erro ao compartilhar lista: ${errorText}`);
                }
                console.log("Compartilhamento bem-sucedido");
                shareModal.style.display = "none"; // Fecha o shareModal após sucesso
                shareForm.reset();
                openFeedbackModal("Lista compartilhada com sucesso!");
            } catch (error) {
                console.error("Erro:", error.message);
                shareModal.style.display = "none"; // Fecha o shareModal em caso de erro
                openFeedbackModal(`Falha ao compartilhar lista: ${error.message}`);
            }
        });
    };
}