const API_URL = true ? "https://stok-5ytv.onrender.com" : "http://192.168.1.67:3000";
let schedules = [];
let currentScheduleId = null;
let openAccordions = new Set();

// Funções de gerenciamento de compromissos
async function fetchSchedules() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;
    const idUser = JSON.parse(storedUser).idUser;
    try {
        const response = await fetch(`${API_URL}/schedules/${idUser}`);
        if (!response.ok) throw new Error(`Erro ao carregar compromissos: ${response.status}`);
        schedules = await response.json();
        updateScheduleList();
    } catch (error) {
        console.error("Fetch schedules error:", error);
        alert("Erro ao carregar compromissos. Tente novamente.");
    }
}

function updateScheduleList() {
    const scheduleList = document.getElementById("scheduleList");
    if (!scheduleList) return;

    if (schedules.length === 0) {
        scheduleList.innerHTML = "<p>Nenhum compromisso cadastrado</p>";
        return;
    }

    // Organizar por mês, semana e dia
    const groupedByMonth = schedules.reduce((acc, schedule) => {
        const date = new Date(schedule.date);
        const month = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        if (!acc[month]) acc[month] = {};
        const week = Math.ceil(date.getDate() / 7);
        if (!acc[month][week]) acc[month][week] = {};
        const day = date.toLocaleDateString('pt-BR');
        if (!acc[month][week][day]) acc[month][week][day] = [];
        acc[month][week][day].push(schedule);
        return acc;
    }, {});

    scheduleList.innerHTML = Object.keys(groupedByMonth).map(month => {
        const isMonthOpen = openAccordions.has(month);
        return `
            <div class="accordion" data-month-id="${month}">
                <div class="accordion-header" onclick="toggleAccordion('${month}')">
                    <span>${month}</span>
                    <span class="accordion-toggle ${isMonthOpen ? 'open' : ''}">
                        <i class="fas fa-chevron-${isMonthOpen ? 'up' : 'down'}"></i>
                    </span>
                </div>
                <div class="accordion-content" style="display: ${isMonthOpen ? 'block' : 'none'};">
                    ${Object.keys(groupedByMonth[month]).map(week => {
            const weekId = `${month}-week-${week}`;
            const isWeekOpen = openAccordions.has(weekId);
            return `
                            <div class="accordion" data-week-id="${weekId}">
                                <div class="accordion-header" onclick="toggleAccordion('${weekId}')">
                                    <span>Semana ${week}</span>
                                    <span class="accordion-toggle ${isWeekOpen ? 'open' : ''}">
                                        <i class="fas fa-chevron-${isWeekOpen ? 'up' : 'down'}"></i>
                                    </span>
                                </div>
                                <div class="accordion-content" style="display: ${isWeekOpen ? 'block' : 'none'};">
                                    ${Object.keys(groupedByMonth[month][week]).map(day => {
                const dayId = `${weekId}-day-${day}`;
                const isDayOpen = openAccordions.has(dayId);
                return `
                                            <div class="accordion" data-day-id="${dayId}">
                                                <div class="accordion-header" onclick="toggleAccordion('${dayId}')">
                                                    <span>${day}</span>
                                                    <span class="accordion-toggle ${isDayOpen ? 'open' : ''}">
                                                        <i class="fas fa-chevron-${isDayOpen ? 'up' : 'down'}"></i>
                                                    </span>
                                                </div>
                                                <div class="accordion-content" style="display: ${isDayOpen ? 'block' : 'none'};">
                                                    ${groupedByMonth[month][week][day].map(schedule => `
                                                        <div class="schedule-item">
                                                            <div class="item-details">
                                                                <p><strong>${schedule.title}</strong></p>
                                                                <p>Horário: ${schedule.time}</p>
                                                                <p>${schedule.description || ''}</p>
                                                            </div>
                                                            <div class="options-wrapper">
                                                                <span class="options-trigger" data-id="${schedule._id}" onclick="showOptions(event, '${schedule._id}')">⋯</span>
                                                                <div id="options-${schedule._id}" class="options-menu">
                                                                    <button onclick="openScheduleModal('edit', '${schedule._id}')">Editar</button>
                                                                    <button onclick="openScheduleModal('delete', '${schedule._id}')">Excluir</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        `;
            }).join('')}
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function toggleAccordion(id) {
    const content = document.querySelector(`[data-${id.includes('month') ? 'month' : id.includes('week') ? 'week' : 'day'}-id="${id}"] .accordion-content`);
    const toggle = document.querySelector(`[data-${id.includes('month') ? 'month' : id.includes('week') ? 'week' : 'day'}-id="${id}"] .accordion-toggle`);

    if (content.style.display === "block") {
        content.style.display = "none";
        toggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
        toggle.classList.remove("open");
        openAccordions.delete(id);
    } else {
        content.style.display = "block";
        toggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
        toggle.classList.add("open");
        openAccordions.add(id);
    }
}

function showOptions(event, id) {
    event.stopPropagation();
    const optionsMenu = document.getElementById(`options-${id}`);
    const trigger = event.currentTarget;

    document.querySelectorAll('.options-menu').forEach(menu => {
        if (menu !== optionsMenu) menu.classList.remove('show');
    });

    const rect = trigger.getBoundingClientRect();
    optionsMenu.style.left = `${rect.left - 92}px`;
    optionsMenu.style.top = `${rect.bottom + window.scrollY}px`;
    optionsMenu.classList.toggle('show');

    const clickHandler = (e) => {
        if (!optionsMenu.contains(e.target) && e.target !== trigger) {
            optionsMenu.classList.remove('show');
            document.removeEventListener('click', clickHandler);
        }
    };
    setTimeout(() => document.addEventListener('click', clickHandler), 10);
}

function openScheduleModal(action, scheduleId = null) {
    const modal = document.getElementById("scheduleModal");
    const title = document.getElementById("scheduleModalTitle");
    const saveBtn = document.getElementById("saveScheduleBtn");

    currentScheduleId = scheduleId;
    title.textContent = action === 'edit' ? 'Editar Compromisso' : action === 'delete' ? 'Excluir Compromisso' : 'Adicionar Compromisso';

    if (action === 'edit' || action === 'delete') {
        const schedule = schedules.find(s => s._id === scheduleId);
        if (schedule) {
            document.getElementById("scheduleTitle").value = schedule.title;
            document.getElementById("scheduleDate").value = new Date(schedule.date).toISOString().split('T')[0];
            document.getElementById("scheduleTime").value = schedule.time;
            document.getElementById("scheduleDescription").value = schedule.description || '';
        }
    } else {
        document.getElementById("scheduleTitle").value = '';
        document.getElementById("scheduleDate").value = '';
        document.getElementById("scheduleTime").value = '';
        document.getElementById("scheduleDescription").value = '';
    }

    const inputs = document.querySelectorAll("#scheduleModal input, #scheduleModal textarea");
    inputs.forEach(input => input.disabled = action === 'delete');

    saveBtn.style.display = action === 'delete' ? 'none' : 'inline-block';
    saveBtn.onclick = action === 'edit' ? () => saveSchedule(true) : action === 'delete' ? () => deleteSchedule() : saveSchedule;

    modal.style.display = "block";
}

function closeScheduleModal() {
    const modal = document.getElementById("scheduleModal");
    modal.style.display = "none";
}

async function saveSchedule(isEdit = false) {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;
    const idUser = JSON.parse(storedUser).idUser;

    const schedule = {
        title: document.getElementById("scheduleTitle").value,
        date: document.getElementById("scheduleDate").value,
        time: document.getElementById("scheduleTime").value,
        description: document.getElementById("scheduleDescription").value,
        idUser,
    };

    if (!schedule.title || !schedule.date || !schedule.time) {
        alert("Título, data e horário são obrigatórios!");
        return;
    }

    try {
        const url = isEdit ? `${API_URL}/schedules/${currentScheduleId}` : `${API_URL}/schedules`;
        const method = isEdit ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(schedule),
        });

        if (!response.ok) throw new Error(`Erro ao ${isEdit ? 'atualizar' : 'salvar'} compromisso`);
        await fetchSchedules();
        closeScheduleModal();
    } catch (error) {
        console.error("Save schedule error:", error);
        alert(`Erro ao ${isEdit ? 'atualizar' : 'salvar'} compromisso: ${error.message}`);
    }
}

async function deleteSchedule() {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) return;
    const idUser = JSON.parse(storedUser).idUser;

    try {
        const response = await fetch(`${API_URL}/schedules/${currentScheduleId}`, {
            method: 'DELETE',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idUser }),
        });

        if (!response.ok) throw new Error('Erro ao excluir compromisso');
        await fetchSchedules();
        closeScheduleModal();
    } catch (error) {
        console.error("Delete schedule error:", error);
        alert(`Erro ao excluir compromisso: ${error.message}`);
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
    checkAuthAndLoadUser(); // Função do config.js
    await fetchSchedules();
    document.getElementById("addScheduleBtn").addEventListener("click", () => openScheduleModal('add'));
});