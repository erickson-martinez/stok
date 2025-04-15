export async function loadProducts() {
    if (!currentUser) return console.error("Nenhum usuário logado");

    try {
        const response = await fetch(`${API_URL}/products?ownerPhone=${currentUser.phone}`);
        if (!response.ok) throw new Error("Erro ao carregar produtos");
        const products = await response.json();

        if (!DOMElements.productList) {
            return;
        }

        DOMElements.productList.innerHTML = "";
        products.forEach(product => {
            const details = document.createElement("details");
            const summary = document.createElement("summary");
            const content = document.createElement("div");
            content.classList.add("content");

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

            const today = new Date();
            const dayOfMonth = today.getDate();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const consumptionPerWeek = daysInMonth / product.idealQuantity;
            for (let index = 0; index < product.idealQuantity; index++) {
                if (dayOfMonth < (index * consumptionPerWeek) && product.quantity < (product.idealQuantity - index)) {
                    details.classList.add("low-stock");
                }
            }

            details.appendChild(summary);
            details.appendChild(content);
            DOMElements.productList.appendChild(details);
        });
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        openFeedbackModal("Falha ao carregar a lista de produtos");
    }
}

export function setupProductForm() {
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

        if (DOMElements.addModal) DOMElements.addModal.style.display = "none";
        if (DOMElements.shareModal) DOMElements.shareModal.style.display = "none";
        if (DOMElements.editModal) DOMElements.editModal.style.display = "none";
        if (DOMElements.feedbackModal) DOMElements.feedbackModal.style.display = "none";

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
}

export function setupEditForm() {
    document.getElementById("editForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const productId = DOMElements.editModal.dataset.productId;
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
                DOMElements.editModal.style.display = "none";
                loadProducts();
                openFeedbackModal("Produto atualizado com sucesso!");
            } catch (error) {
                console.error("Erro:", error);
                openFeedbackModal("Falha ao atualizar produto");
            }
        });
    });
}