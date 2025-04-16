const API_URL = false ? "https://stok-5ytv.onrender.com" : "http://192.168.1.67:3000";

const menuItems = [
    { name: "Home", route: "./home.html" },
    { name: "Financeiro", route: "./expense.html" },
    { name: "Estoque", route: "./stock.html" },
    { name: "Atividade", route: "./activity.html" },
    { name: "Mercados", route: "./markets.html" },
    { name: "Lista de Compras", route: "./shopping.html" },
    { name: "Livros", route: "./book.html" },
    { name: "Planning livros", route: "./planning.html" },
    { name: "Meditação", route: "./meditation.html" },
];

// Funções auxiliares
function loadSidebarMenu() {
    const sidebarMenu = document.getElementById("sidebarMenu");
    if (!sidebarMenu) return;

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

function getInitials(name) {
    return name.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2);
}

function getISOTime(date) {
    return date.toISOString();
}

// Autenticação e usuário
function checkAuthAndLoadUser() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
        window.location.href = "../login.html";
        return;
    }

    currentUser = JSON.parse(storedUser);
    if (userInitialsDiv) userInitialsDiv.textContent = getInitials(currentUser.name);
    if (userFullName) userFullName.textContent = currentUser.name;
    if (userPhone) userPhone.textContent = currentUser.phone;

    loadSidebarMenu();
    setupUserEvents();
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