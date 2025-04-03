// Definindo a constante API_URL
const API_URL = "https://stok-5ytv.onrender.com";
//const API_URL = "http://192.168.1.67:3000";

// Configuração do menu em JSON
const menuItems = [
    { name: "Financeiro", route: "./finances.html" },
    { name: "Estoque", route: "./stock.html" },
    { name: "Atividade", route: "./activity.html" },
    { name: "Mercados", route: "./markets.html" },
    { name: "Lista de Compras", route: "./shopping.html" }
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

// Função para carregar a home e configurar o modal
function loadHome() {
    const userInitialsDiv = document.getElementById("userInitials");
    const userFullName = document.getElementById("userFullName");
    const userPhone = document.getElementById("userPhone");
    const logoutButton = document.getElementById("logout");
    const userModal = document.getElementById("userModal");
    const openSidebarButton = document.getElementById("openSidebar");
    const closeSidebarButton = document.getElementById("closeSidebar");
    const sidebar = document.getElementById("sidebar");
    const currentUser = localStorage.getItem("currentUser");

    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    const user = JSON.parse(currentUser);
    userInitialsDiv.textContent = getInitials(user.name);
    userFullName.textContent = user.name;
    userPhone.textContent = user.phone;

    loadSidebarMenu();

    // Abrir/fechar modal
    userInitialsDiv.addEventListener("click", () => {
        userModal.classList.toggle("active");
    });

    // Fechar modal ao clicar fora
    document.addEventListener("click", (event) => {
        if (!userModal.contains(event.target) && !userInitialsDiv.contains(event.target)) {
            userModal.classList.remove("active");
        }
    });

    // Logout
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("currentUser");
            window.location.href = "../login.html";
        });
    }

    // Abrir sidebar
    if (openSidebarButton) {
        openSidebarButton.addEventListener("click", () => {
            sidebar.classList.add("active");
        });
    }

    // Fechar sidebar
    if (closeSidebarButton) {
        closeSidebarButton.addEventListener("click", () => {
            sidebar.classList.remove("active");
        });
    }

    // Fechar sidebar ao clicar fora
    document.addEventListener("click", (event) => {
        if (!sidebar.contains(event.target) && !openSidebarButton.contains(event.target)) {
            sidebar.classList.remove("active");
        }
    });
}

// Verifica em qual página estamos
if (document.getElementById("loginForm")) {
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", handleLogin);
} else if (document.getElementById("userInitials")) {
    loadHome();
}

// Função de login
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
            localStorage.setItem("currentUser", JSON.stringify(data.user));
            window.location.href = "home.html";
        })
        .catch((error) => {
            errorMessage.textContent = "Telefone ou senha inválidos";
            console.error("Erro:", error);
        });
}