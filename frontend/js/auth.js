import { API_URL, DOMElements } from './config.js';
import { openFeedbackModal, openRegisterConfirmModal } from './modals.js';
import { loadProducts } from './products.js';

export let currentUser = null;

export function saveUserToLocalStorage(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    console.log("Usuário salvo no localStorage:", user);
}

export function loadUserFromLocalStorage() {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
        currentUser = JSON.parse(userData);
        console.log("Usuário carregado do localStorage:", currentUser);
        if (DOMElements.loginScreen) DOMElements.loginScreen.style.display = "none";
        if (DOMElements.mainContent) DOMElements.mainContent.style.display = "block";
        if (DOMElements.loggedUserName) DOMElements.loggedUserName.textContent = currentUser.name;
        loadProducts();
    }
}

export function clearUserFromLocalStorage() {
    localStorage.removeItem("currentUser");
    console.log("Sessão limpa do localStorage");
}

export function setupLogin() {
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
                const response = await fetch(`${API_URL}/users/${phone}`);

                if (response.ok) {
                    currentUser = { name, phone, password };
                    saveUserToLocalStorage(currentUser);
                    if (DOMElements.loginScreen) DOMElements.loginScreen.style.display = "none";
                    if (DOMElements.mainContent) DOMElements.mainContent.style.display = "block";
                    if (DOMElements.loggedUserName) DOMElements.loggedUserName.textContent = currentUser.name;
                    loadProducts();
                } else if (response.status === 404) {
                    openRegisterConfirmModal(name, phone, async () => {
                        try {
                            const registerResponse = await fetch(`${API_URL}/users`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name, phone, password }),
                            });

                            if (!registerResponse.ok) {
                                const errorText = await registerResponse.text();
                                throw new Error(errorText);
                            }
                            currentUser = { name, phone, password };
                            saveUserToLocalStorage(currentUser);
                            if (DOMElements.loginScreen) DOMElements.loginScreen.style.display = "none";
                            if (DOMElements.mainContent) DOMElements.mainContent.style.display = "block";
                            if (DOMElements.loggedUserName) DOMElements.loggedUserName.textContent = currentUser.name;
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
}

export function setupLogout() {
    if (DOMElements.logoutBtn) {
        DOMElements.logoutBtn.addEventListener("click", () => {
            currentUser = null;
            clearUserFromLocalStorage();
            if (DOMElements.mainContent) DOMElements.mainContent.style.display = "none";
            if (DOMElements.loginScreen) DOMElements.loginScreen.style.display = "block";
            document.getElementById("loginForm").reset();
        });
    } else {
        console.error("logoutBtn não encontrado");
    }
}