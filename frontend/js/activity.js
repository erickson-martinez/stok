const { API_URL } = require('./config.js');

// Configuração do menu
const menuItems = [
    { name: "Atividade", route: "./activity.html" }
];

// Elementos DOM
const timerDisplay = document.getElementById('timer');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const finalizeBtn = document.getElementById('finalizeBtn'); // Novo elemento
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const dailyLog = document.getElementById('dailyLog');
const alarmSound = document.getElementById('alarmSound');
const activityInput = document.getElementById('activityInput');
const saveActivityBtn = document.getElementById('saveActivityBtn');
const userInitialsDiv = document.getElementById("userInitials");
const userFullName = document.getElementById("userFullName");
const userPhone = document.getElementById("userPhone");
const logoutButton = document.getElementById("logout");
const userModal = document.getElementById("userModal");
const openSidebarButton = document.getElementById("openSidebar");
const closeSidebarButton = document.getElementById("closeSidebar");
const sidebar = document.getElementById("sidebar");

// Variáveis de estado
let startTime = null;
let pauseTime = null;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
const MAX_HOURS = 8;
const MAX_MILLISECONDS = MAX_HOURS * 60 * 60 * 1000;
let currentUser = null;
let currentRecords = { start: [], pause: [], return: [], final: [], activities: [] };

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

function formatDuration(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

// Operações com API
async function loadRecords() {
    if (!currentUser || !currentUser.phone) return currentRecords;

    try {
        const response = await fetch(`${API_URL}/activity/${currentUser.phone}`);
        if (!response.ok) throw new Error(`Erro ao carregar atividades: ${response.statusText}`);

        const data = await response.json();

        const convertDates = (arr) => arr ? arr.map(d => new Date(d)) : [];
        const convertActivities = (arr) => arr ? arr.map(a => ({
            time: new Date(a.time),
            description: a.description
        })) : [];

        currentRecords = {
            start: convertDates(data.start),
            pause: convertDates(data.pause),
            return: convertDates(data.return),
            final: convertDates(data.final),
            activities: convertActivities(data.activities)
        };

        return currentRecords;
    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        return currentRecords;
    }
}

async function saveRecord(type, value) {
    if (!currentUser || !currentUser.phone) return;

    const payload = {
        phone: currentUser.phone,
        [type]: Array.isArray(value) ? value : [value]
    };

    try {
        const response = await fetch(`${API_URL}/activity`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Erro ao salvar atividade: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao salvar atividade:', error);
        throw error;
    }
}

// Lógica do timer
function calculateWorkedTime() {
    const today = new Date().toLocaleDateString('pt-BR');
    let totalTime = 0;
    let activeStart = null;
    const now = new Date();

    const allEvents = [];

    currentRecords.start.forEach(time => {
        if (time.toLocaleDateString('pt-BR') === today) {
            allEvents.push({ time: time, type: 'start' });
        }
    });

    currentRecords.pause.forEach(time => {
        if (time.toLocaleDateString('pt-BR') === today) {
            allEvents.push({ time: time, type: 'pause' });
        }
    });

    currentRecords.return.forEach(time => {
        if (time.toLocaleDateString('pt-BR') === today) {
            allEvents.push({ time: time, type: 'return' });
        }
    });

    allEvents.sort((a, b) => a.time - b.time);

    for (const event of allEvents) {
        if (event.type === 'start' || event.type === 'return') {
            activeStart = event.time;
        } else if (event.type === 'pause' && activeStart) {
            totalTime += event.time - activeStart;
            activeStart = null;
        }
    }

    if (activeStart) {
        totalTime += now - activeStart;
        startTime = activeStart;
        isRunning = true;
    } else {
        isRunning = false;
    }

    return totalTime;
}

function updateDisplay() {
    elapsedTime = calculateWorkedTime();

    const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);

    if (timerDisplay) {
        timerDisplay.textContent =
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    const progressPercentage = Math.min((elapsedTime / MAX_MILLISECONDS) * 100, 100);
    if (progressBar) progressBar.style.width = `${progressPercentage}%`;

    if (progressText) {
        progressText.textContent = `${progressPercentage.toFixed(1)}% completado (${hours}:${minutes.toString().padStart(2, '0')} de ${MAX_HOURS} horas)`;

        if (elapsedTime >= MAX_MILLISECONDS * 0.9) {
            progressBar.style.backgroundColor = '#ff9800';
        }
        if (elapsedTime >= MAX_MILLISECONDS) {
            progressBar.style.backgroundColor = '#f44336';
            progressText.classList.add('completed');
            progressText.textContent = `100% completado (8:00:00 de 8 horas) - DIÁRIA CONCLUÍDA!`;
        }
    }
}

function updateLogDisplay() {
    if (!dailyLog) return;

    dailyLog.innerHTML = '';
    const today = new Date().toLocaleDateString('pt-BR');
    let allEvents = [];

    currentRecords.start.forEach(time => {
        if (time.toLocaleDateString('pt-BR') === today) {
            allEvents.push({
                time: time,
                text: `▶ Iniciado às ${time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                color: '#4CAF50'
            });
        }
    });

    currentRecords.pause.forEach(time => {
        if (time.toLocaleDateString('pt-BR') === today) {
            allEvents.push({
                time: time,
                text: `⏸ Pausado às ${time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                color: '#f44336'
            });
        }
    });

    currentRecords.return.forEach(time => {
        if (time.toLocaleDateString('pt-BR') === today) {
            allEvents.push({
                time: time,
                text: `▶ Retomado às ${time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                color: '#4CAF50'
            });
        }
    });

    currentRecords.final.forEach(time => {
        if (time.toLocaleDateString('pt-BR') === today) {
            allEvents.push({
                time: time,
                text: `✔ Concluído às ${time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                color: '#2196F3'
            });
        }
    });

    currentRecords.activities.forEach(activity => {
        if (activity.time.toLocaleDateString('pt-BR') === today) {
            allEvents.push({
                time: activity.time,
                text: `📝 ${activity.description} (${activity.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`,
                color: '#9C27B0'
            });
        }
    });

    allEvents.sort((a, b) => a.time - b.time);

    allEvents.forEach(event => {
        const p = document.createElement('p');
        p.textContent = event.text;
        p.style.color = event.color;
        dailyLog.appendChild(p);
    });

    if (elapsedTime > 0) {
        const totalP = document.createElement('p');
        totalP.textContent = `Total hoje: ${formatDuration(elapsedTime)}`;
        totalP.style.fontWeight = 'bold';
        dailyLog.appendChild(totalP);
    }
}

// Controles do timer
async function startTimer() {
    if (elapsedTime >= MAX_MILLISECONDS) {
        alert('Você já completou as 8 horas diárias!');
        return;
    }

    startTime = new Date();
    isRunning = true;

    if (startPauseBtn) {
        startPauseBtn.textContent = 'Pausar';
        startPauseBtn.style.display = 'inline-block';
    }
    if (resetBtn) resetBtn.style.display = 'none';

    try {
        await saveRecord('start', getISOTime(startTime));
        currentRecords.start.push(startTime);
        timerInterval = setInterval(updateTimer, 1000);
        updateDisplay();
        updateLogDisplay();
    } catch (error) {
        console.error('Erro ao iniciar timer:', error);
    }
}

async function pauseTimer() {
    clearInterval(timerInterval);
    pauseTime = new Date();
    isRunning = false;

    if (startPauseBtn) startPauseBtn.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'inline-block';

    try {
        await saveRecord('pause', getISOTime(pauseTime));
        currentRecords.pause.push(pauseTime);
        updateDisplay();
        updateLogDisplay();
    } catch (error) {
        console.error('Erro ao pausar timer:', error);
    }
}

async function resetTimer() {
    const resumeTime = new Date();
    isRunning = true;

    if (startPauseBtn) {
        startPauseBtn.textContent = 'Pausar';
        startPauseBtn.style.display = 'inline-block';
    }
    if (resetBtn) resetBtn.style.display = 'none';

    try {
        await saveRecord('return', getISOTime(resumeTime));
        currentRecords.return.push(resumeTime);
        startTime = resumeTime;
        timerInterval = setInterval(updateTimer, 1000);
        updateDisplay();
        updateLogDisplay();
    } catch (error) {
        console.error('Erro ao retornar timer:', error);
    }
}

function toggleTimer() {
    if (!isRunning) {
        startTimer();
    } else {
        pauseTimer();
    }
}

// Função para verificar se é após 18:00 em Brasília
function isAfterSixPMBrasilia() {
    const now = new Date();
    const brasiliaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    return brasiliaTime.getHours() >= 18;
}

// Função para gerenciar o botão "Finalizar"
function setupFinalizeButton() {
    if (!finalizeBtn) return;

    if (isAfterSixPMBrasilia() && elapsedTime > 0 && elapsedTime < MAX_MILLISECONDS) {
        finalizeBtn.style.display = 'inline-block';
    } else {
        finalizeBtn.style.display = 'none';
    }
}

async function finalizeTimer() {
    if (elapsedTime >= MAX_MILLISECONDS) {
        alert('Você já completou as 8 horas diárias!');
        return;
    }

    const finalTime = new Date();
    try {
        await saveRecord('final', getISOTime(finalTime));
        currentRecords.final.push(finalTime);
        clearInterval(timerInterval);
        isRunning = false;

        if (startPauseBtn) {
            startPauseBtn.textContent = 'Iniciar';
            startPauseBtn.disabled = true;
        }
        if (resetBtn) resetBtn.style.display = 'none';
        if (finalizeBtn) finalizeBtn.style.display = 'none';

        updateDisplay();
        updateLogDisplay();
        alert('Jornada finalizada com sucesso!');
    } catch (error) {
        console.error('Erro ao finalizar jornada:', error);
        alert('Erro ao finalizar jornada. Tente novamente.');
    }
}

function updateTimer() {
    updateDisplay();
    setupFinalizeButton();

    if (elapsedTime >= MAX_MILLISECONDS) {
        clearInterval(timerInterval);
        isRunning = false;
        if (startPauseBtn) {
            startPauseBtn.textContent = 'Iniciar';
            startPauseBtn.disabled = true;
        }
        if (resetBtn) resetBtn.style.display = 'none';
        if (finalizeBtn) finalizeBtn.style.display = 'none';
        if (alarmSound) alarmSound.play();

        const finalEntry = getISOTime(new Date());
        saveRecord('final', finalEntry).then(() => {
            currentRecords.final.push(new Date());
            updateLogDisplay();
        });
    }
}

// Função para salvar atividades
async function saveActivity() {
    const activityText = activityInput.value.trim();
    if (!activityText) {
        alert('Por favor, digite uma descrição para a atividade!');
        return;
    }

    const activityTime = new Date();
    const activityEntry = {
        time: getISOTime(activityTime),
        description: activityText
    };

    try {
        await saveRecord('activities', activityEntry);
        currentRecords.activities.push({
            time: activityTime,
            description: activityText
        });
        activityInput.value = '';
        updateLogDisplay();
    } catch (error) {
        console.error('Erro ao salvar atividade:', error);
    }
}

// Inicialização
async function initializeTimer() {
    await loadRecords();
    updateDisplay();

    const today = new Date().toLocaleDateString('pt-BR');
    const hasTodayRecords = currentRecords.start.some(start =>
        start.toLocaleDateString('pt-BR') === today
    );

    if (isRunning) {
        if (startPauseBtn) {
            startPauseBtn.textContent = 'Pausar';
            startPauseBtn.style.display = 'inline-block';
        }
        if (resetBtn) resetBtn.style.display = 'none';
        if (finalizeBtn) finalizeBtn.style.display = 'none';
        timerInterval = setInterval(updateTimer, 1000);
    } else if (hasTodayRecords) {
        if (startPauseBtn) startPauseBtn.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'inline-block';
        setupFinalizeButton();
    } else {
        if (startPauseBtn) {
            startPauseBtn.textContent = 'Iniciar';
            startPauseBtn.style.display = 'inline-block';
        }
        if (resetBtn) resetBtn.style.display = 'none';
        if (finalizeBtn) finalizeBtn.style.display = 'none';
    }

    updateLogDisplay();
}

function setupTimerEvents() {
    if (startPauseBtn) startPauseBtn.addEventListener('click', toggleTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);
    if (finalizeBtn) finalizeBtn.addEventListener('click', finalizeTimer);
    if (saveActivityBtn) saveActivityBtn.addEventListener('click', saveActivity);
}

// Inicialização da página
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadUser();
    setupTimerEvents();
    initializeTimer();
});