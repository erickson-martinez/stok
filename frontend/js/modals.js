import { API_URL, DOMElements } from './config.js';

export function openConfirmModal(message, onConfirm) {
    console.log("Dentro de openConfirmModal, mensagem:", message);
    if (!DOMElements.confirmModal) {
        console.error("confirmModal não encontrado");
        return;
    }
    if (!DOMElements.confirmMessage) {
        console.error("confirmMessage não encontrado");
        return;
    }
    DOMElements.confirmMessage.textContent = message;
    DOMElements.confirmModal.style.display = "block";
    DOMElements.confirmModal.style.zIndex = "10010";
    DOMElements.confirmModal.style.visibility = "visible";
    console.log("Display após mudança:", DOMElements.confirmModal.style.display);

    if (!DOMElements.confirmActionBtn) {
        console.error("confirmActionBtn não encontrado");
        return;
    }
    DOMElements.confirmActionBtn.onclick = () => {
        console.log("Botão Confirmar clicado");
        onConfirm();
        DOMElements.confirmModal.style.display = "none";
        DOMElements.confirmModal.style.visibility = "hidden";
    };

    if (!DOMElements.cancelConfirmBtn) {
        console.error("cancelConfirmBtn não encontrado");
    } else {
        DOMElements.cancelConfirmBtn.onclick = () => {
            console.log("Botão Cancelar clicado");
            DOMElements.confirmModal.style.display = "none";
            DOMElements.confirmModal.style.visibility = "hidden";
            if (DOMElements.addModal) DOMElements.addModal.style.display = "block";
        };
    }

    if (!DOMElements.closeConfirmModalBtn) {
        console.error("closeConfirmModalBtn não encontrado");
    } else {
        DOMElements.closeConfirmModalBtn.onclick = () => {
            console.log("Botão × clicado");
            DOMElements.confirmModal.style.display = "none";
            DOMElements.confirmModal.style.visibility = "hidden";
            if (DOMElements.addModal) DOMElements.addModal.style.display = "block";
        };
    }
}

export function openFeedbackModal(message) {
    if (!DOMElements.feedbackModal) return console.error("feedbackModal não encontrado");
    DOMElements.feedbackMessage.textContent = message;
    DOMElements.feedbackModal.style.display = "block";
}

export function openRegisterConfirmModal(name, phone, onConfirm) {
    if (!DOMElements.registerConfirmModal) return console.error("registerConfirmModal não encontrado");
    DOMElements.registerConfirmMessage.textContent = `Nenhum usuário encontrado com o telefone ${phone}. Deseja criar um perfil para ${name}?`;
    DOMElements.registerConfirmModal.style.display = "block";
    DOMElements.confirmRegisterBtn.onclick = () => {
        onConfirm();
        DOMElements.registerConfirmModal.style.display = "none";
    };
}

export function openEditModal(product) {
    DOMElements.editModal.dataset.productId = product._id;
    document.getElementById("editName").value = product.name;
    document.getElementById("editQuantity").value = product.quantity;
    document.getElementById("editBrand").value = product.brand;
    document.getElementById("editUnitType").value = product.unitType;
    document.getElementById("editUnitQuantity").value = product.unitQuantity;
    document.getElementById("editIdealQuantity").value = product.idealQuantity;
    DOMElements.editModal.style.display = "block";
}

export function openShareModal(product) {
    console.log("Abrindo shareModal, product ID:", product._id);
    if (!DOMElements.shareModal) {
        console.error("shareModal não encontrado");
        return;
    }
    DOMElements.shareModal.style.display = "block";

    const shareForm = document.getElementById("shareForm");
    if (!shareForm) {
        console.error("shareForm não encontrado");
        DOMElements.shareModal.style.display = "none";
        return;
    }
    console.log("shareForm encontrado");

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
                DOMElements.shareModal.style.display = "none";
                shareForm.reset();
                openFeedbackModal("Lista compartilhada com sucesso!");
            } catch (error) {
                console.error("Erro:", error.message);
                DOMElements.shareModal.style.display = "none";
                openFeedbackModal(`Falha ao compartilhar lista: ${error.message}`);
            }
        });
    };
}

export function setupModalEvents() {
    if (DOMElements.openModalBtn) {
        DOMElements.openModalBtn.addEventListener("click", () => {
            console.log("Botão Adicionar Produto clicado");
            if (DOMElements.addModal) DOMElements.addModal.style.display = "block";
            else console.error("productModal não encontrado");
        });
    } else {
        console.error("openModalBtn não encontrado");
    }

    if (DOMElements.closeModalBtn) {
        DOMElements.closeModalBtn.addEventListener("click", () => {
            if (DOMElements.addModal) DOMElements.addModal.style.display = "none";
            else console.error("productModal não encontrado");
        });
    } else {
        console.error("closeModalBtn não encontrado");
    }

    if (DOMElements.closeShareModalBtn) {
        DOMElements.closeShareModalBtn.addEventListener("click", () => {
            console.log("Botão × do shareModal clicado");
            if (DOMElements.shareModal) DOMElements.shareModal.style.display = "none";
            else console.error("shareModal não encontrado");
        });
    } else {
        console.error("closeShareModalBtn não encontrado");
    }

    if (DOMElements.closeFeedbackBtn) {
        DOMElements.closeFeedbackBtn.addEventListener("click", () => {
            if (DOMElements.feedbackModal) DOMElements.feedbackModal.style.display = "none";
            else console.error("feedbackModal não encontrado");
        });
    } else {
        console.error("closeFeedbackBtn não encontrado");
    }

    if (DOMElements.closeRegisterConfirmModalBtn) {
        DOMElements.closeRegisterConfirmModalBtn.addEventListener("click", () => {
            DOMElements.registerConfirmModal.style.display = "none";
        });
    }
}