
export async function loadFinances() {
    console.log("Carregando finanças...");
    if (!currentUser) return console.error("Nenhum usuário logado");

    try {
        const response = await fetch(`${API_URL}/finances?userPhone=${currentUser.phone}`);
        if (!response.ok) throw new Error("Erro ao carregar finanças");
        const finances = await response.json();

        if (!DOMElements.financeList) return console.error("financeList não encontrado");

        DOMElements.financeList.innerHTML = "";
        finances.forEach(finance => {
            const div = document.createElement("div");
            div.textContent = `${finance.description} - ${finance.type === "income" ? "+" : "-"}R$${finance.amount.toFixed(2)} - ${new Date(finance.date).toLocaleDateString()}`;
            DOMElements.financeList.appendChild(div);
        });
    } catch (error) {
        console.error("Erro ao carregar finanças:", error);
        openFeedbackModal("Falha ao carregar finanças");
    }
}

export function setupFinanceForm() {
    const financeForm = document.getElementById("financeForm");
    if (financeForm) {
        financeForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("Formulário de transação enviado");

            const finance = {
                description: document.getElementById("description").value,
                amount: parseFloat(document.getElementById("amount").value),
                type: document.getElementById("type").value,
                date: document.getElementById("date").value,
                userPhone: currentUser.phone
            };

            if (DOMElements.addModal) DOMElements.addModal.style.display = "none";

            openConfirmModal("Deseja confirmar esta transação?", async () => {
                try {
                    const response = await fetch(`${API_URL}/finances`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(finance),
                    });
                    if (!response.ok) throw new Error("Erro ao adicionar transação");
                    financeForm.reset();
                    loadFinances();
                    openFeedbackModal("Transação adicionada com sucesso!");
                } catch (error) {
                    console.error("Erro:", error);
                    openFeedbackModal("Falha ao adicionar transação");
                }
            });
        });
    }
}