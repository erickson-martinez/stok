const API_URL = "https://stok-5ytv.onrender.com";
//const API_URL = "http://192.168.1.67:3000";
const menuItems = [
    { name: "Financeiro", route: "./finances.html" },
    { name: "Estoque", route: "./stock.html" },
    { name: "Atividade", route: "./activity.html" },
    { name: "Mercados", route: "./markets.html" },
    { name: "Lista de Compras", route: "./shopping.html" },
    { name: "Livros", route: "./book.html" }
];

// Cache de elementos DOM
const DOM = {
    userInitials: document.getElementById("userInitials"),
    userFullName: document.getElementById("userFullName"),
    userPhone: document.getElementById("userPhone"),
    logoutButton: document.getElementById("logout"),
    userModal: document.getElementById("userModal"),
    openSidebarButton: document.getElementById("openSidebar"),
    closeSidebarButton: document.getElementById("closeSidebar"),
    sidebar: document.getElementById("sidebar"),
    sidebarMenu: document.getElementById("sidebarMenu")
};

// Estado da aplicação
const AppState = {
    currentUser: null
};

// Utilitários
const Utils = {
    getInitials: (name) => name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2),

    checkAuth: () => {
        const storedUser = localStorage.getItem("currentUser");
        if (!storedUser) {
            window.location.href = "../login.html";
            return false;
        }
        AppState.currentUser = JSON.parse(storedUser);
        return true;
    }
};

// Gerenciamento do Menu
const MenuManager = {
    init: () => {
        if (!Utils.checkAuth()) return;

        MenuManager.loadUserInfo();
        MenuManager.loadSidebarMenu();
        MenuManager.setupEventListeners();
    },

    loadUserInfo: () => {
        const { currentUser } = AppState;
        if (DOM.userInitials) DOM.userInitials.textContent = Utils.getInitials(currentUser.name);
        if (DOM.userFullName) DOM.userFullName.textContent = currentUser.name;
        if (DOM.userPhone) DOM.userPhone.textContent = currentUser.phone;
    },

    loadSidebarMenu: () => {
        if (!DOM.sidebarMenu) return;

        DOM.sidebarMenu.innerHTML = menuItems.map(item => `
            <li>
                <a href="${item.route}">${item.name}</a>
            </li>
        `).join("");
    },

    setupEventListeners: () => {
        // Modal do usuário
        if (DOM.userInitials) {
            DOM.userInitials.addEventListener("click", () => {
                DOM.userModal.classList.toggle("active");
            });

            document.addEventListener("click", (event) => {
                if (!DOM.userModal.contains(event.target) && !DOM.userInitials.contains(event.target)) {
                    DOM.userModal.classList.remove("active");
                }
            });
        }

        // Logout
        if (DOM.logoutButton) {
            DOM.logoutButton.addEventListener("click", () => {
                localStorage.removeItem("currentUser");
                window.location.href = "../login.html";
            });
        }

        // Sidebar
        if (DOM.openSidebarButton) {
            DOM.openSidebarButton.addEventListener("click", () => {
                DOM.sidebar.classList.add("active");
            });
        }

        if (DOM.closeSidebarButton) {
            DOM.closeSidebarButton.addEventListener("click", () => {
                DOM.sidebar.classList.remove("active");
            });
        }

        // Fechar sidebar ao clicar fora
        document.addEventListener("click", (event) => {
            if (!DOM.sidebar.contains(event.target) &&
                !DOM.openSidebarButton.contains(event.target) &&
                event.target !== DOM.openSidebarButton) {
                DOM.sidebar.classList.remove("active");
            }
        });
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', MenuManager.init);