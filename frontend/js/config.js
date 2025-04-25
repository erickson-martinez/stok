//frontend/js/config.js
const API_URL = true ? "https://stok-5ytv.onrender.com" : "http://192.168.1.67:3000";

const menuItems = [
    { name: "Home", route: "./home.html" },
    { name: "Financeiro", route: "./expense.html" },
    { name: "Estoque", route: "./stock.html" },
    // { name: "Atividade", route: "./activity.html" },
    // { name: "Mercados", route: "./markets.html" },
    { name: "Lista de Compras", route: "./shopping.html" },
    // { name: "Livros", route: "./book.html" },
    // { name: "Planning livros", route: "./planning.html" },
    { name: "Meditação", route: "./meditation.html" },
];

// Função para obter iniciais do nome
function getInitials(name) {
    return name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2);
}

// Função para obter data em formato ISO
function getISOTime(date) {
    return date.toISOString();
}

function setupUserEvents() {
    if (!userInitialsDiv) return;

    userInitialsDiv.addEventListener("click", () => {
        userModal.classList.toggle("active");
    });

    document.addEventListener("click", (event) => {
        if (!userModal.contains(event.target) && !userInitialsDiv.contains(event.target)) {
            userModal.classList.remove("active");
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("currentUser");
            window.location.href = "../login.html";
        });
    }

    if (openSidebarButton) {
        openSidebarButton.addEventListener("click", () => {
            sidebar.classList.add("active");
        });
    }

    if (closeSidebarButton) {
        closeSidebarButton.addEventListener("click", () => {
            sidebar.classList.remove("active");
        });
    }

    document.addEventListener("click", (event) => {
        if (!sidebar.contains(event.target) && !openSidebarButton.contains(event.target)) {
            sidebar.classList.remove("active");
        }
    });
}

function checkAuthAndLoadUser() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
        window.location.href = "../login.html";
        return;
    }

    const currentUser = JSON.parse(storedUser);
    document.getElementById("userInitials").textContent = getInitials(currentUser.name);
    document.getElementById("userFullName").textContent = currentUser.name;
    document.getElementById("userPhone").textContent = currentUser.phone;

    loadSidebarMenu();
    setupUserEvents();
}

// Função para mostrar o loading
function showLoading(msg) {
    let loadingElement = document.getElementById("loading-overlay");
    if (!loadingElement) {
        loadingElement = document.createElement("div");
        loadingElement.id = "loading-overlay";
        loadingElement.innerHTML = `
            <div class="spinner"></div>
            <p class="loading-message">${msg}</p>
        `;
        document.body.appendChild(loadingElement);
    }
    loadingElement.style.display = "flex";
}

// Carregar menu da sidebar
function loadSidebarMenu() {
    const sidebarMenu = document.getElementById("sidebarMenu");
    if (!sidebarMenu) {
        console.error("Elemento #sidebarMenu não encontrado");
        return;
    }

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

// Inicializar interface do usuário
function initializeUserInterface() {
    const userInitialsDiv = document.getElementById("userInitials");
    const userFullName = document.getElementById("userFullName");
    const userPhone = document.getElementById("userPhone");
    const logoutButton = document.getElementById("logout");
    const userModal = document.getElementById("userModal");
    const openSidebarButton = document.getElementById("openSidebar");
    const closeSidebarButton = document.getElementById("closeSidebar");
    const sidebar = document.getElementById("sidebar");

    const elements = {
        userInitialsDiv,
        userFullName,
        userPhone,
        logoutButton,
        userModal,
        openSidebarButton,
        closeSidebarButton,
        sidebar
    };

    // Verificar elementos essenciais
    if (!userInitialsDiv || !sidebar || !openSidebarButton || !closeSidebarButton) {
        console.error("Elementos essenciais não encontrados:", elements);
        return;
    }

    // Verificar autenticação
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    const user = JSON.parse(currentUser);
    userInitialsDiv.textContent = getInitials(user.name);
    if (userFullName) userFullName.textContent = user.name;
    if (userPhone) userPhone.textContent = user.phone;

    // Carregar menu
    loadSidebarMenu();

    // Clonar elementos para evitar duplicação de eventos
    userInitialsDiv.replaceWith(userInitialsDiv.cloneNode(true));
    const newUserInitialsDiv = document.getElementById("userInitials");
    openSidebarButton.replaceWith(openSidebarButton.cloneNode(true));
    const newOpenSidebarButton = document.getElementById("openSidebar");
    closeSidebarButton.replaceWith(closeSidebarButton.cloneNode(true));
    const newCloseSidebarButton = document.getElementById("closeSidebar");

    // Configurar eventos
    let isTogglingModal = false;
    newUserInitialsDiv.addEventListener("click", (e) => {
        e.stopPropagation();
        if (userModal) {
            isTogglingModal = true;
            const wasActive = userModal.classList.contains("active");
            userModal.classList.toggle("active");
            setTimeout(() => {
                isTogglingModal = false;
            }, 50);
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("currentUser");
            window.location.href = "../login.html";
        });
    }

    newOpenSidebarButton.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.add("active");
        console.log("Sidebar opened");
    });

    newCloseSidebarButton.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.remove("active");
        console.log("Sidebar closed");
    });

    // Fechar modais ao clicar fora
    document.addEventListener("click", (event) => {
        if (isTogglingModal) return;

        if (userModal && !userModal.contains(event.target) && !newUserInitialsDiv.contains(event.target)) {
            userModal.classList.remove("active");
        }

        if (!sidebar.contains(event.target) && !newOpenSidebarButton.contains(event.target)) {
            sidebar.classList.remove("active");
        }
    });
}

function setupUserEvents() {
    const userInitialsDiv = document.getElementById("userInitials");
    const userModal = document.getElementById("userModal");
    const logoutButton = document.getElementById("logout");
    const openSidebarButton = document.getElementById("openSidebar");
    const closeSidebarButton = document.getElementById("closeSidebar");
    const sidebar = document.getElementById("sidebar");

    if (!userInitialsDiv || !userModal || !logoutButton || !openSidebarButton || !closeSidebarButton || !sidebar) return;

    userInitialsDiv.addEventListener("click", () => userModal.classList.toggle("active"));
    document.addEventListener("click", (event) => {
        if (!userModal.contains(event.target) && !userInitialsDiv.contains(event.target)) {
            userModal.classList.remove("active");
        }
    });
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        window.location.href = "../login.html";
    });
    openSidebarButton.addEventListener("click", () => sidebar.classList.add("active"));
    closeSidebarButton.addEventListener("click", () => sidebar.classList.remove("active"));
    document.addEventListener("click", (event) => {
        if (!sidebar.contains(event.target) && !openSidebarButton.contains(event.target)) {
            sidebar.classList.remove("active");
        }
    });
}

// Função para esconder o loading
function hideLoading() {
    const loadingElement = document.getElementById("loading-overlay");
    if (loadingElement) {
        loadingElement.style.display = "none";
    }
}