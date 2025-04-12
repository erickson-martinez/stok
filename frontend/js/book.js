const API_URL = "https://stok-5ytv.onrender.com/books";
//const API_URL = "http://192.168.1.67:3000/books"; // Ajustado para /book
const menuItems = [
    { name: "Financeiro", route: "./expense.html" },
    { name: "Estoque", route: "./stock.html" },
    { name: "Atividade", route: "./activity.html" },
    { name: "Mercados", route: "./markets.html" },
    { name: "Lista de Compras", route: "./shopping.html" },
    { name: "Livros", route: "./book.html" }
];

let books = [];
let currentBookId = null;

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

async function fetchBooks() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    const idUser = JSON.parse(storedUser).idUser;
    try {
        const response = await fetch(`${API_URL}/${idUser}`);
        if (!response.ok) throw new Error(`Erro ao carregar livros: ${response.status}`);
        const data = await response.json();
        books = data.books || []; // Ajustado para acessar o array de subdocumentos
        updateBookList();
    } catch (error) {
        console.error("Fetch books error:", error.message);
        alert("Erro ao carregar livros. Por favor, recarregue a página.");
    }
}

function updateBookList() {
    const bookList = document.getElementById("bookList");
    if (!bookList) return;

    if (!books || books.length === 0) {
        bookList.innerHTML = "<p>Nenhum livro cadastrado</p>";
        return;
    }

    bookList.innerHTML = books.map(book => `
        <div class="list-container" data-book-id="${book._id}">
            <div class="list-header">
                <span>${book.name} - ${book.intent}</span>
                <div class="value-container">
                    <div class="options-wrapper">
                        <span class="options-trigger" data-id="${book._id}" onclick="event.stopPropagation(); showOptions(event, '${book._id}')">⋯</span>
                        <div id="options-${book._id}" class="options-menu">
                            <button onclick="event.stopPropagation(); openEditBookModal('${book._id}')">Editar</button>
                            <button onclick="event.stopPropagation(); viewBook('${book._id}')">Visualizar</button>
                            <button onclick="event.stopPropagation(); deleteBook('${book._id}')">Deletar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join("");

    bookList.removeEventListener("click", handleOptionsClick);
    bookList.addEventListener("click", handleOptionsClick);
}

function handleOptionsClick(event) {
    const trigger = event.target.closest(".options-trigger");
    if (trigger) {
        const id = trigger.getAttribute("data-id");
        if (id) showOptions(event, id);
    }
}

function showOptions(event, id) {
    event.stopPropagation();
    const options = document.getElementById(`options-${id}`);
    if (!options) {
        console.error(`Options menu with id options-${id} not found`);
        return;
    }

    const isVisible = options.style.display === "block";

    document.querySelectorAll(".options-menu").forEach(menu => {
        menu.style.display = "none";
    });

    options.style.display = isVisible ? "none" : "block";

    document.addEventListener("click", function closeMenu(e) {
        if (!options.contains(e.target) && e.target !== event.target) {
            options.style.display = "none";
            document.removeEventListener("click", closeMenu);
        }
    }, { once: true });
}

function openBookModal() {
    const modal = document.getElementById("bookModal");
    if (modal) {
        document.getElementById("bookName").value = "";
        document.getElementById("bookYear").value = "";
        document.getElementById("bookAuthor").value = "";
        document.getElementById("bookCondition").value = "Novo";
        document.getElementById("bookStatus").value = "Novo";
        document.getElementById("bookPhone").value = JSON.parse(localStorage.getItem("currentUser")).phone; // Pre-fill with user's phone
        document.getElementById("bookIntent").value = "Emprestar";
        document.getElementById("bookRead").value = "false";
        document.getElementById("bookPages").value = "";
        modal.style.display = "block";
    }
}

function closeBookModal() {
    const modal = document.getElementById("bookModal");
    if (modal) modal.style.display = "none";
}

function openBookOptionsModal(bookId) {
    currentBookId = bookId;
    const modal = document.getElementById("bookOptionsModal");
    if (modal) modal.style.display = "block";
}

function closeBookOptionsModal() {
    const modal = document.getElementById("bookOptionsModal");
    if (modal) modal.style.display = "none";
}

function openEditBookModal(bookId) {
    currentBookId = bookId;
    const book = books.find(b => b._id === currentBookId);
    if (!book) return;

    document.getElementById("bookName").value = book.name;
    document.getElementById("bookYear").value = book.year;
    document.getElementById("bookAuthor").value = book.author;
    document.getElementById("bookCondition").value = book.condition;
    document.getElementById("bookStatus").value = book.status;
    document.getElementById("bookPhone").value = book.idUser;
    document.getElementById("bookIntent").value = book.intent;
    document.getElementById("bookRead").value = book.read.toString();
    document.getElementById("bookPages").value = book.pages;

    const modal = document.getElementById("bookModal");
    if (modal) modal.style.display = "block";
}

async function saveBook() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    const idUser = JSON.parse(storedUser).idUser;
    const book = {
        name: document.getElementById("bookName").value,
        year: parseInt(document.getElementById("bookYear").value),
        author: document.getElementById("bookAuthor").value,
        condition: document.getElementById("bookCondition").value,
        status: document.getElementById("bookStatus").value,
        phone: document.getElementById("bookPhone").value,
        intent: document.getElementById("bookIntent").value,
        read: document.getElementById("bookRead").value === "true", // Converte para booleano
        pages: parseInt(document.getElementById("bookPages").value)
    };

    if (!book.name || !book.year || !book.author || !book.phone || !book.pages) {
        alert("Todos os campos obrigatórios devem ser preenchidos!");
        return;
    }

    try {
        const url = currentBookId ? `${API_URL}/${idUser}/${currentBookId}` : `${API_URL}/${idUser}`;
        const method = currentBookId ? "PUT" : "POST";

        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(book)
        });

        if (!response.ok) throw new Error(await response.text());

        await fetchBooks();
        closeBookModal();
    } catch (error) {
        console.error("Save book error:", error.message);
        alert(`Erro ao salvar livro: ${error.message}`);
    }
}

async function viewBook(bookId) {
    currentBookId = bookId;
    const book = books.find(b => b._id === currentBookId);
    if (!book) return;

    alert(`Livro: ${book.name}\nAutor: ${book.author}\nAno: ${book.year}\nCondição: ${book.condition}\nSituação: ${book.status}\nTelefone: ${book.phone}\nDesejo: ${book.intent}\nLeitura: ${book.read ? 'Sim' : 'Não'}\nPáginas: ${book.pages}`);
}

async function deleteBook(bookId) {
    currentBookId = bookId;
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;

    const idUser = JSON.parse(storedUser).idUser;
    try {
        const response = await fetch(`${API_URL}/${idUser}/${currentBookId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error(await response.text());
        await fetchBooks();
        closeBookOptionsModal();
    } catch (error) {
        console.error("Delete book error:", error);
        alert(`Erro ao deletar livro: ${error.message}`);
    }
}

async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("Minha Lista de Livros", 10, y);
    y += 10;

    books.forEach((book, index) => {
        if (y > 280) {
            doc.addPage();
            y = 10;
        }
        doc.setFontSize(12);
        doc.text(`Livro: ${book.name}`, 10, y);
        y += 5;
        doc.text(`Autor: ${book.author}`, 10, y);
        y += 5;
        doc.text(`Ano: ${book.year}`, 10, y);
        y += 5;
        doc.text(`Condição: ${book.condition}`, 10, y);
        y += 5;
        doc.text(`Situação: ${book.status}`, 10, y);
        y += 5;
        doc.text(`Telefone: ${book.phone}`, 10, y);
        y += 5;
        doc.text(`Desejo: ${book.intent}`, 10, y);
        y += 5;
        doc.text(`Leitura: ${book.read ? 'Sim' : 'Não'}`, 10, y);
        y += 5;
        doc.text(`Páginas: ${book.pages}`, 10, y);
        y += 10;
        if (index < books.length - 1) doc.text("------------------------", 10, y);
        y += 10;
    });

    doc.save("lista_de_livros.pdf");
}

function loadJsPDF() {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => window.jsPDF = jspdf.jsPDF;
    document.body.appendChild(script);
}

document.addEventListener("DOMContentLoaded", async () => {
    checkAuthAndLoadUser();
    loadJsPDF();

    try {
        await fetchBooks();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        alert("Erro ao carregar dados. Por favor, recarregue a página.");
    }

    document.getElementById("addBookBtn")?.addEventListener("click", openBookModal);
    document.getElementById("exportPdfBtn")?.addEventListener("click", exportToPDF);
});

window.openBookModal = openBookModal;
window.closeBookModal = closeBookModal;
window.saveBook = saveBook;
window.openBookOptionsModal = openBookOptionsModal;
window.closeBookOptionsModal = closeBookOptionsModal;
window.openEditBookModal = openEditBookModal;
window.viewBook = viewBook;
window.deleteBook = deleteBook;