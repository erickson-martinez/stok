//const API_URL = "https://stok-5ytv.onrender.com";
const API_URL = "http://192.168.1.67:3000";

// Configuração do menu em JSON
const menuItems = [
    { name: "Financeiro", route: "./expense.html" },
    { name: "Estoque", route: "./stock.html" },
    { name: "Atividade", route: "./activity.html" },
    { name: "Mercados", route: "./markets.html" },
    { name: "Lista de Compras", route: "./shopping.html" },
    { name: "Livros", route: "./book.html" }
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

// Função para carregar o plano de leitura do dia atual
async function loadDailyPlan() {
    try {
        const response = await fetch('../utils/planning-read.json'); // Ajuste o caminho conforme necessário
        const plano = await response.json();
        const container = document.getElementById('plano');
        var data = new Date();
        const today = data.toLocaleDateString()

        // Filtra o dia atual
        plano.forEach(dia => {

            if (dia.data === today) {
                const accordionItem = document.createElement('div');
                accordionItem.className = `accordion-item ${dia.data === today ? 'current' : ''}`;

                const header = document.createElement('div');
                header.className = 'accordion-header';
                header.textContent = `Dia ${dia.dia} (${dia.data})`;
                accordionItem.appendChild(header);

                const content = document.createElement('div');
                content.className = `accordion-content ${dia.data === today ? 'active' : ''}`;

                const livro = document.createElement('p');
                livro.innerHTML = `<span class="livro">Livro:</span> ${dia.livro}`;
                content.appendChild(livro);

                const paginas = document.createElement('p');
                paginas.innerHTML = `<span class="paginas">Páginas:</span> ${dia.paginas_diarias}`;
                content.appendChild(paginas);

                const versiculosTitle = document.createElement('p');
                versiculosTitle.innerHTML = '<strong>Versículos:</strong>';
                content.appendChild(versiculosTitle);

                const ul = document.createElement('ul');
                dia.versiculos.forEach(versiculo => {
                    const li = document.createElement('li');
                    li.textContent = versiculo;
                    ul.appendChild(li);
                });
                content.appendChild(ul);

                accordionItem.appendChild(content);
                container.appendChild(accordionItem);

                header.addEventListener('click', () => {
                    const isActive = content.classList.contains('active');
                    document.querySelectorAll('.accordion-content').forEach(item => {
                        item.classList.remove('active');
                    });
                    if (!isActive) {
                        content.classList.add('active');
                    }
                });
            }
        });


        // Se não houver plano para o dia atual, exibe uma mensagem

    } catch (error) {
        console.error('Erro ao carregar o plano de leitura:', error);
        document.getElementById('dailyPlan').innerHTML = '<p>Erro ao carregar o plano de leitura.</p>';
    }
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
    loadDailyPlan(); // Carrega o plano de leitura do dia atual
    window.onload = loadPlano;
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