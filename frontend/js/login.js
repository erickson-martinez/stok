const API_URL = "https://stok-5ytv.onrender.com";
//const API_URL = "http://192.168.1.67:3000";

async function fetchApi() {
    try {
        const response = await fetch(`${API_URL}`);
        if (!response.ok) throw new Error("Erro ao carregar API");
    } catch (error) {
        console.error("Fetch Api error:", error);
    }
}

// Função para fazer login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const phone = document.getElementById("phone").value;
    const pass = document.getElementById("pass").value;
    const errorMessage = document.getElementById("error-message");

    try {
        const response = await fetch(`${API_URL}/users/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, pass }),
        });

        // Log da resposta bruta para depuração
        const textResponse = await response.text();

        // Tenta解析 como JSON
        const data = JSON.parse(textResponse);

        if (!response.ok) {
            throw new Error(data.error || "Erro ao autenticar");
        }

        user = { name: data.name, phone: data.phone, idUser: data._id };

        localStorage.setItem("currentUser", JSON.stringify(user))
        window.location.href = "./page/home.html";
    } catch (err) {
        errorMessage.textContent = err.message;
        console.error("Erro ao processar resposta:", err);
    }
});

// Função para abrir o modal de cadastro
document.getElementById("registerButton").addEventListener("click", () => {
    document.getElementById("registerModal").style.display = "block";
});

// Função para fechar o modal de cadastro
function closeRegisterModal() {
    document.getElementById("registerModal").style.display = "none";
    document.getElementById("register-error").textContent = ""; // Limpa mensagens de erro
    document.getElementById("registerForm").reset(); // Reseta o formulário
}

// Fecha o modal ao clicar fora dele
document.addEventListener("click", (event) => {
    const modal = document.getElementById("registerModal");
    if (event.target === modal) {
        closeRegisterModal();
    }
});

// Função para cadastrar novo usuário
async function registerUser() {
    const name = document.getElementById("registerName").value;
    const phone = document.getElementById("registerPhone").value;
    const pass = document.getElementById("registerPass").value;
    const errorMessage = document.getElementById("register-error");

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, pass }),
        });

        // Log da resposta bruta para depuração
        const textResponse = await response.text();

        // Tenta解析 como JSON
        const data = JSON.parse(textResponse);

        if (!response.ok) {
            throw new Error(data.error || "Erro ao cadastrar usuário");
        }

        const user = {
            name: data.name,
            phone: data.phone,
            idUser: data._id,
        };

        // Após sucesso, armazena o usuário no localStorage e redireciona
        localStorage.setItem("currentUser", JSON.stringify(user));
        closeRegisterModal();
        window.location.href = "./page/home.html";
    } catch (err) {
        errorMessage.textContent = err.message;
        console.error("Erro ao processar resposta (cadastro):", err);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    fetchApi();
});