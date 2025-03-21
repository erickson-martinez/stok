// Definindo a constante API_URL
const API_URL = "https://stok-hiqo.onrender.com";

// Função para lidar com o login
function handleLogin(event) {
    event.preventDefault();

    const phoneInput = document.getElementById("phone");
    const passInput = document.getElementById("pass");
    const errorMessage = document.getElementById("error-message");

    const loginData = {
        phone: phoneInput.value,
        pass: passInput.value,
    };

    fetch(`${API_URL}/users/auth`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Erro na autenticação");
            }
            return response.json();
        })
        .then((data) => {
            // Salva o usuário no localStorage
            localStorage.setItem("currentUser", JSON.stringify(data.user));
            // Redireciona para a home
            window.location.href = "page/home.html";
        })
        .catch((error) => {
            errorMessage.textContent = "Telefone ou senha inválidos";
            console.error("Erro:", error);
        });
}

// Função para carregar o usuário na home
function loadHome() {
    const userNameSpan = document.getElementById("userName");
    const logoutButton = document.getElementById("logout");
    const currentUser = localStorage.getItem("currentUser");

    if (currentUser) {
        const user = JSON.parse(currentUser);
        userNameSpan.textContent = user.name;
    } else {
        window.location.href = "index.html"; // Redireciona para login se não houver usuário
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("currentUser");
            window.location.href = "index.html";
        });
    }
}

// Verifica em qual página estamos e aplica a lógica correspondente
if (document.getElementById("loginForm")) {
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", handleLogin);
} else if (document.getElementById("userName")) {
    loadHome();
}