// --- Configuração do Firebase (FORNECIDA PELO USUÁRIO) ---
// (Usando Firebase v12.6.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    getDocs, 
    orderBy, 
    limit, 
    updateDoc, 
    serverTimestamp,
    addDoc,
    collectionGroup, 
    where, 
    Timestamp 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCrBs-yGC0FvLA8uvOP4YAykTKHWlbEnmg",
    authDomain: "gestor-mines.firebaseapp.com",
    projectId: "gestor-mines",
    storageBucket: "gestor-mines.firebasestorage.app",
    messagingSenderId: "370610480260",
    appId: "1:370610480260:web:d4a94acb09904379c24ed1"
};

// --- Inicialização ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Constantes ---
const ADMIN_EMAIL = "washington.wn8@gmail.com";
const COOLDOWN_MINUTES = 60;
// (NOVO) Dicionário de tradução
const STRATEGY_NAMES = {
    low: "Baixo Risco",
    balanced: "Equilibrada",
    high: "Alto Risco",
    'N/A': 'N/A'
};

// --- Globais de UI ---
const loadingScreen = document.getElementById('loadingScreen');
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const allAppViews = document.querySelectorAll('.app-view');
// (Login/Signup)
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const authErrorBox = document.getElementById('authErrorBox');
// (Sidebar)
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const hamburgerButton = document.getElementById('hamburgerButton');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const navAdminLink = document.getElementById('navAdminLink');
// (Views)
const setupView = document.getElementById('setupView');
const gameView = document.getElementById('gameView');
const dashboardView = document.getElementById('dashboardView'); 
const adminView = document.getElementById('adminView');
const pendingView = document.getElementById('pendingView');
const viewTitle = document.getElementById('viewTitle');
const appContent = document.getElementById('appContent');
const pendingLogoutButton = document.getElementById('pendingLogoutButton'); 
// (Inputs)
const bankrollInput = document.getElementById('bankroll');
const lastBankrollDisplay = document.getElementById('lastBankrollDisplay');
const goalBankInput = document.getElementById('goalBank');
const sessionRiskLevelSelect = document.getElementById('sessionRiskLevel'); 
const bombCountSelect = document.getElementById('bombCount');
const strategySelect = document.getElementById('strategy');
const gameLinkInput = document.getElementById('gameLink'); 
const startButton = document.getElementById('startButton');
const errorBox = document.getElementById('errorBox');
// (Jogo)
const openGameButton = document.getElementById('openGameButton'); 
const goalProgressText = document.getElementById('goalProgressText');
const goalProgressBar = document.getElementById('goalProgressBar');
const lossProgressText = document.getElementById('lossProgressText');
const lossProgressBar = document.getElementById('lossProgressBar');
const strategyTitle = document.getElementById('strategyTitle');
const clickCount = document.getElementById('clickCount');
const successChance = document.getElementById('successChance');
const suggestedBet = document.getElementById('suggestedBet');
const gameBoard = document.getElementById('gameBoard');
const wonButton = document.getElementById('wonButton');
const lostButton = document.getElementById('lostButton');
const backButton = document.getElementById('backButton');
// (Dashboard)
const dateFilterPresets = document.getElementById('dateFilterPresets'); 
const dateFilterStart = document.getElementById('dateFilterStart'); 
const dateFilterEnd = document.getElementById('dateFilterEnd'); 
const loadDashboardButton = document.getElementById('loadDashboardButton');
const dashboardLoading = document.getElementById('dashboardLoading');
const dashboardStats = document.getElementById('dashboardStats');
const noDashboardData = document.getElementById('noDashboardData');
const kpiTotalProfit = document.getElementById('kpiTotalProfit');
const kpiTotalBet = document.getElementById('kpiTotalBet');
const kpiWinRate = document.getElementById('kpiWinRate');
const kpiBestStrategy = document.getElementById('kpiBestStrategy');
const kpiBestStrategyProfit = document.getElementById('kpiBestStrategyProfit');
const kpiWorstStrategy = document.getElementById('kpiWorstStrategy');
const kpiWorstStrategyLoss = document.getElementById('kpiWorstStrategyLoss');
const kpiTotalPlays = document.getElementById('kpiTotalPlays');
// (Admin)
const adminUserTableBody = document.getElementById('adminUserTableBody');
const noUsers = document.getElementById('noUsers');
// (Modais)
const sessionEndScreen = document.getElementById('sessionEndScreen');
const sessionEndTitle = document.getElementById('sessionEndTitle');
const sessionEndIcon = document.getElementById('sessionEndIcon');
const sessionEndMessage = document.getElementById('sessionEndMessage');
const sessionEndBank = document.getElementById('sessionEndBank');
const cooldownMessage = document.getElementById('cooldownMessage');
const restartButton = document.getElementById('restartButton');
const winInputModal = document.getElementById('winInputModal'); 
const profitInput = document.getElementById('profitInput');
const confirmWinButton = document.getElementById('confirmWinButton');
const cancelWinButton = document.getElementById('cancelWinButton');
const winErrorBox = document.getElementById('winErrorBox');

// --- Estado Global ---
let currentUser = null;
let currentUserData = null;
let sessionTimer = null; // para o cooldown

// --- Estado da Sessão ---
let currentSessionId = null; 
let initialBankroll = 0;
let currentBankroll = 0;
let goalBank = 0;
let stopLossBank = 0; 
let currentBombs = 0;
let currentSafeSquares = 0;
let currentStrategy = 'balanced';
let sessionGameLink = ''; 
let currentClicksToGenerate = 0;
let currentBetAmount = 0;
let lastBetWasWin = true; 

// --- FUNÇÕES DE NAVEGAÇÃO E UI ---

function showView(viewId) {
    allAppViews.forEach(view => view.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    
    // Atualiza o título do header e fecha o menu
    if (viewId === 'setupView') viewTitle.textContent = 'Diário de Sessão';
    if (viewId === 'dashboardView') viewTitle.textContent = 'Dashboard';
    if (viewId === 'adminView') viewTitle.textContent = 'Gerenciar Usuários';
    
    closeSidebar();
}

function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.remove('hidden');
    sidebarOverlay.classList.remove('opacity-0');
}

function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('opacity-0');
    setTimeout(() => sidebarOverlay.classList.add('hidden'), 300);
}

function showAuthError(message) {
    authErrorBox.textContent = message;
    authErrorBox.classList.remove('hidden');
}

function showError(message, duration = 0) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
    if (duration > 0) {
        setTimeout(() => errorBox.classList.add('hidden'), duration);
    }
}

function formatMinutes(ms) {
    const minutes = Math.ceil(ms / 60000);
    return `${minutes} minuto(s)`;
}

function formatBRL(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// --- FUNÇÕES DE AUTENTICAÇÃO E DADOS ---

// Listener principal da aplicação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            currentUserData = userDocSnap.data();
            userEmailDisplay.textContent = currentUserData.email;

            if (currentUserData.access === 'pending') {
                // (CORREÇÃO) Usuário pendente, esconde UI principal
                showView('pendingView');
                appContent.classList.remove('md:ml-64'); 
                sidebar.classList.add('hidden'); 
                hamburgerButton.classList.add('hidden'); 
                
                appScreen.classList.remove('hidden');
                loginScreen.classList.add('hidden');
            } else if (currentUserData.access === 'approved') {
                // (CORREÇÃO) Usuário aprovado, mostra UI principal
                appContent.classList.add('md:ml-64'); 
                sidebar.classList.remove('hidden'); 
                hamburgerButton.classList.remove('hidden'); 
                
                setupAppForUser();
                showView('setupView');
                appScreen.classList.remove('hidden');
                loginScreen.classList.add('hidden');
            }
        } else {
            console.warn("Documento do usuário não encontrado! Criando...");
            const isAdmin = user.email === ADMIN_EMAIL;
            const userDoc = {
                uid: user.uid,
                email: user.email,
                name: user.email, 
                role: isAdmin ? 'admin' : 'user',
                access: isAdmin ? 'approved' : 'pending',
                lastBankroll: 100,
                lockoutEndTime: null,
                createdAt: serverTimestamp() 
            };
            await setDoc(doc(db, "users", user.uid), userDoc);
            currentUserData = userDoc;
            onAuthStateChanged(auth, auth.currentUser); 
        }
    } else {
        currentUser = null;
        currentUserData = null;
        appScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        
        // (CORREÇÃO) Limpa os campos de login
        loginEmailInput.value = '';
        loginPasswordInput.value = '';
        authErrorBox.classList.add('hidden');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    }
    loadingScreen.classList.add('hidden');
});

// Configura o App para o usuário logado
function setupAppForUser() {
    const lastBank = currentUserData.lastBankroll || 100;
    bankrollInput.value = lastBank.toFixed(2);
    lastBankrollDisplay.textContent = formatBRL(lastBank);
    
    if (currentUserData.role === 'admin') {
        navAdminLink.classList.remove('hidden');
    } else {
        navAdminLink.classList.add('hidden');
    }
}

// --- FUNÇÕES DE DADOS (Firestore) ---

async function getUserProfile(userId) {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    return docSnap.exists() ? docSnap.data() : {};
}

async function updateUserDoc(userId, data) {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, data);
}

async function savePlay(playData) {
    const playsCollection = collection(db, "users", currentUser.uid, "sessions", currentSessionId, "plays");
    await addDoc(playsCollection, playData);
}

// (CORREÇÃO) Lógica atualizada do Dashboard com correção de fuso
async function loadDashboard() {
    dashboardLoading.classList.remove('hidden');
    dashboardStats.classList.add('hidden');
    noDashboardData.classList.add('hidden');
    
    // (CORREÇÃO DE FUSO HORÁRIO)
    // Pega a string 'YYYY-MM-DD' e força para data local
    const [startY, startM, startD] = dateFilterStart.value.split('-').map(Number);
    // new Date(Y, M-1, D) cria uma data à meia-noite *local*
    let startDate = new Date(startY, startM - 1, startD); 
    
    const [endY, endM, endD] = dateFilterEnd.value.split('-').map(Number);
    let endDate = new Date(endY, endM - 1, endD); 
    
    // Define para o *fim* do dia selecionado, no fuso local
    endDate.setHours(23, 59, 59, 999); 
    
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const playsCollectionGroup = collectionGroup(db, 'plays');
    const q = query(
        playsCollectionGroup,
        where("userId", "==", currentUser.uid), 
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp)
    );

    let allPlays = [];
    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            allPlays.push(doc.data());
        });
    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        dashboardLoading.classList.add('hidden');
        noDashboardData.classList.remove('hidden');
        noDashboardData.textContent = "Erro ao carregar dados. (Você pode precisar criar um índice no Firebase. Verifique o console para um link).";
        return;
    }

    if (allPlays.length === 0) {
        dashboardLoading.classList.add('hidden');
        noDashboardData.classList.remove('hidden');
        noDashboardData.textContent = "Nenhuma jogada encontrada para este período.";
        return;
    }

    // Processar os dados
    let totalProfit = 0;
    let totalBet = 0;
    let wins = 0;
    let strategyAnalysis = {
        low: { profit: 0, count: 0 },
        balanced: { profit: 0, count: 0 },
        high: { profit: 0, count: 0 }
    };

    allPlays.forEach(play => {
        totalBet += play.betAmount;
        if (play.result === 'ganho') {
            wins++;
            totalProfit += play.profit;
            if (strategyAnalysis[play.strategy]) {
                strategyAnalysis[play.strategy].profit += play.profit;
                strategyAnalysis[play.strategy].count++;
            }
        } else {
            totalProfit -= play.betAmount; 
            if (strategyAnalysis[play.strategy]) {
                strategyAnalysis[play.strategy].profit -= play.betAmount;
                strategyAnalysis[play.strategy].count++;
            }
        }
    });

    // Encontrar melhor/pior estratégia
    let bestStrat = { name: 'N/A', profit: -Infinity };
    let worstStrat = { name: 'N/A', profit: Infinity };

    for (const [name, data] of Object.entries(strategyAnalysis)) {
        if (data.count > 0) {
            if (data.profit > bestStrat.profit) {
                bestStrat = { name, profit: data.profit };
            }
            if (data.profit < worstStrat.profit) {
                worstStrat = { name, profit: data.profit };
            }
        }
    }

    // Exibir KPIs
    kpiTotalProfit.textContent = formatBRL(totalProfit);
    kpiTotalProfit.className = `kpi-value ${totalProfit >= 0 ? 'text-gain' : 'text-loss'}`;
    kpiTotalBet.textContent = formatBRL(totalBet);
    kpiWinRate.textContent = `${(wins / allPlays.length * 100).toFixed(0)}%`;
    kpiTotalPlays.textContent = allPlays.length;
    
    // (CORREÇÃO) Usar o dicionário de tradução
    kpiBestStrategy.textContent = STRATEGY_NAMES[bestStrat.name] || 'N/A';
    kpiBestStrategyProfit.textContent = formatBRL(bestStrat.profit);
    kpiWorstStrategy.textContent = STRATEGY_NAMES[worstStrat.name] || 'N/A';
    kpiWorstStrategyLoss.textContent = formatBRL(worstStrat.profit);
    
    dashboardLoading.classList.add('hidden');
    dashboardStats.classList.remove('hidden');
}

// (CORREÇÃO) Atualiza os inputs de data baseado no preset
function updateDashboardDates() {
    const preset = dateFilterPresets.value;
    const endDate = new Date();
    let startDate = new Date();
    
    if (preset === '7') {
        startDate.setDate(endDate.getDate() - 7);
    } else if (preset === '30') {
        startDate.setDate(endDate.getDate() - 30);
    } else if (preset === '90') {
        startDate.setDate(endDate.getDate() - 90);
    } else if (preset === 'custom') {
        dateFilterStart.disabled = false;
        dateFilterEnd.disabled = false;
        return;
    }
    
    dateFilterStart.value = formatDateForInput(startDate);
    dateFilterEnd.value = formatDateForInput(endDate);
    dateFilterStart.disabled = true;
    dateFilterEnd.disabled = true;
}

async function loadAdminUsers() {
    // (Função sem alteração)
    adminUserTableBody.innerHTML = '';
    noUsers.classList.add('hidden');
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, orderBy("email"));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        noUsers.classList.remove('hidden');
    } else {
        querySnapshot.forEach(doc => {
            const user = doc.data();
            if (user.role === 'admin') return; 
            const statusClass = user.access === 'pending' ? 'text-pending' : 'text-gain';
            const actionButton = user.access === 'pending'
                ? `<button data-uid="${doc.id}" class="btn-approve btn btn-green btn-sm text-xs">Aprovar</button>`
                : `<button data-uid="${doc.id}" class="btn-revoke btn btn-red btn-sm text-xs">Revogar</button>`;
            const row = `<tr>
                <td>${user.email}</td><td>${user.name || 'N/A'}</td>
                <td class="${statusClass}">${user.access}</td><td>${actionButton}</td>
            </tr>`;
            adminUserTableBody.innerHTML += row;
        });
    }
}

// --- FUNÇÕES DE LÓGICA DO JOGO ---

function getRandomInt(min, max) { 
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createBoard() {
    gameBoard.innerHTML = '';
    for (let r = 0; r < 5; r++) { for (let c = 0; c < 5; c++) {
        const cell = document.createElement('div');
        cell.id = `cell-${r}-${c}`;
        cell.className = 'grid-cell';
        // (CORREÇÃO) Adiciona o círculo interno
        cell.innerHTML = '<div class="grid-cell-inner"></div>';
        gameBoard.appendChild(cell);
    }}
}

function resetBoard() {
    for (let r = 0; r < 5; r++) { for (let c = 0; c < 5; c++) {
        const cell = document.getElementById(`cell-${r}-${c}`);
        if (cell) { 
            cell.className = 'grid-cell'; 
            cell.innerHTML = '<div class="grid-cell-inner"></div>'; 
        }
    }}
}

function generateIndications() {
    resetBoard();
    const numClicks = currentClicksToGenerate;
    const selectedCells = new Set();
    while (selectedCells.size < numClicks) {
        const row = getRandomInt(0, 4); 
        const col = getRandomInt(0, 4); 
        selectedCells.add(`${row}-${col}`);
    }
    selectedCells.forEach(coord => {
        const cell = document.getElementById(`cell-${coord}`);
        if (cell) { 
            cell.classList.add('indicated-cell'); 
            // (CORREÇÃO) Adiciona o ícone de estrela embutido
            cell.innerHTML = `<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"></path></svg>`;
        }
    });
}

function updateProgressBars() {
    const gainRange = goalBank - initialBankroll;
    const currentGain = currentBankroll - initialBankroll;
    const gainPercent = Math.max(0, Math.min(100, (currentGain / gainRange) * 100));
    goalProgressBar.style.width = `${gainPercent}%`;
    goalProgressText.textContent = `${formatBRL(currentBankroll)} / ${formatBRL(goalBank)}`;

    const lossRange = initialBankroll - stopLossBank;
    const currentLoss = initialBankroll - currentBankroll;
    const lossPercent = Math.max(0, Math.min(100, (currentLoss / lossRange) * 100));
    lossProgressBar.style.width = `${lossPercent}%`;
    lossProgressText.textContent = `${formatBRL(currentBankroll)} / ${formatBRL(stopLossBank)}`;
}

async function checkSessionEnd(isManualStop = false) {
    let result = null;
    if (currentBankroll >= goalBank) result = "Meta Atingida";
    else if (currentBankroll <= stopLossBank) result = "Limite Atingido";
    else if (isManualStop) result = "Sessão Encerrada";
    
    if (result) {
        // Atualiza o documento da SESSÃO com os dados finais
        const sessionDocRef = doc(db, "users", currentUser.uid, "sessions", currentSessionId);
        await updateDoc(sessionDocRef, {
            result: result,
            finalBankroll: currentBankroll,
            totalProfitOrLoss: currentBankroll - initialBankroll,
            status: "completed"
        });
        
        const updateData = { lastBankroll: currentBankroll };
        let showCooldown = false;
        
        if (result !== "Sessão Encerrada") {
            updateData.lockoutEndTime = Date.now() + (COOLDOWN_MINUTES * 60 * 1000);
            showCooldown = true;
        }
        
        await updateUserDoc(currentUser.uid, updateData);
        currentUserData.lastBankroll = currentBankroll; 
        
        showSessionEnd(result === "Meta Atingida", showCooldown);
        return true;
    }
    return false;
}

function showSessionEnd(didWin, showCooldown) {
    if (didWin) {
        sessionEndTitle.textContent = "META ATINGIDA!";
        // (CORREÇÃO) Ícone embutido
        sessionEndIcon.innerHTML = '<svg class="w-16 h-16 text-yellow-400 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2m-6-6v6m0 6a6 6 0 0 1-6-6v-6a6 6 0 0 1 6 6v6a6 6 0 0 1 6 6v-6a6 6 0 0 1-6 6v-6z"></path></svg>';
    } else {
        sessionEndTitle.textContent = "LIMITE ATINGIDO!";
        // (CORREÇÃO) Ícone embutido
        sessionEndIcon.innerHTML = '<svg class="w-16 h-16 text-red-400 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    }
    
    if (showCooldown) {
        cooldownMessage.classList.remove('hidden');
    } else {
        cooldownMessage.classList.add('hidden');
    }
    
    sessionEndBank.textContent = formatBRL(currentBankroll);
    sessionEndScreen.classList.remove('hidden');
}

function generateNewRound() {
    // (Lógica de geração de jogada... sem alterações)
    if (!lastBetWasWin && currentStrategy !== 'low') {
        strategyTitle.textContent = "Jogada de Recuperação";
        if (currentStrategy === 'high') currentStrategy = 'balanced';
        else currentStrategy = 'low';
    } else if (lastBetWasWin) {
        strategyTitle.textContent = "Próxima Jogada";
        currentStrategy = strategySelect.value;
    }

    let minClicks, maxClicks;
    switch (currentStrategy) {
        case 'low': minClicks = 1; maxClicks = 3; break;
        case 'balanced': minClicks = 4; maxClicks = 5; break;
        case 'high': minClicks = 6; maxClicks = 8; break;
    }
    maxClicks = Math.min(maxClicks, currentSafeSquares);
    minClicks = Math.min(minClicks, maxClicks);
    if (minClicks > maxClicks) minClicks = maxClicks;

    currentClicksToGenerate = getRandomInt(minClicks, maxClicks); 

    let prob = 1.0;
    if (currentClicksToGenerate > currentSafeSquares) prob = 0; 
    else { for (let i = 0; i < currentClicksToGenerate; i++) { prob *= (currentSafeSquares - i) / (25 - i); } }

    let baseBetPercentage = 0.01; 
    if (prob > 0.8) baseBetPercentage = 0.05; 
    else if (prob > 0.5) baseBetPercentage = 0.025; 
    else if (prob > 0.3) baseBetPercentage = 0.015; 
    if (!lastBetWasWin) baseBetPercentage = 0.01; 
    
    currentBetAmount = Math.max(1, Math.floor(currentBankroll * baseBetPercentage));
    if (currentBankroll - currentBetAmount < stopLossBank) {
        currentBetAmount = currentBankroll - stopLossBank;
        currentBetAmount = Math.max(1, Math.floor(currentBetAmount)); 
    }
    currentBetAmount = Math.min(currentBankroll, currentBetAmount);

    clickCount.textContent = currentClicksToGenerate;
    const probPercent = (prob * 100).toFixed(1);
    successChance.textContent = `${probPercent}%`;
    successChance.className = 'text-xl sm:text-2xl font-bold'; 
    if (prob > 0.6) successChance.classList.add('prob-safe');
    else if (prob > 0.3) successChance.classList.add('prob-mid');
    else successChance.classList.add('prob-danger');
    suggestedBet.textContent = formatBRL(currentBetAmount);
    generateIndications();
}

// --- Event Listeners ---
// (Sem alterações na lógica dos listeners)

// (Login/Signup)
document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    authErrorBox.classList.add('hidden');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authErrorBox.classList.add('hidden');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginButton.disabled = true;
    loginButton.textContent = "Entrando...";
    authErrorBox.classList.add('hidden');
    try {
        const email = loginEmailInput.value;
        const pass = loginPasswordInput.value;
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        showAuthError("Email ou senha inválidos.");
        console.error("Erro Login:", error.message);
    }
    loginButton.disabled = false;
    loginButton.textContent = "Entrar";
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupButton.disabled = true;
    signupButton.textContent = "Criando...";
    authErrorBox.classList.add('hidden');
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const pass = document.getElementById('signupPassword').value;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        
        const isAdmin = user.email === ADMIN_EMAIL;
        const userDoc = {
            uid: user.uid,
            email: user.email,
            name: name,
            role: isAdmin ? 'admin' : 'user',
            access: isAdmin ? 'approved' : 'pending',
            lastBankroll: 100, 
            lockoutEndTime: null,
            createdAt: serverTimestamp() 
        };
        
        await setDoc(doc(db, "users", user.uid), userDoc);
        
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            showAuthError("Este email já está em uso.");
        } else if (error.code === 'auth/weak-password') {
            showAuthError("A senha deve ter no mínimo 6 caracteres.");
        } else {
            showAuthError("Erro ao criar conta.");
        }
        console.error("Erro Signup:", error.message);
    }
    signupButton.disabled = false;
    signupButton.textContent = "Criar Conta";
});

// (Sidebar e Navegação)
hamburgerButton.addEventListener('click', openSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

document.getElementById('navDiario').addEventListener('click', (e) => {
    e.preventDefault();
    setupAppForUser(); 
    showView('setupView');
});

document.getElementById('navDashboard').addEventListener('click', async (e) => {
    e.preventDefault();
    showView('dashboardView');
    updateDashboardDates(); 
    await loadDashboard(); 
});

document.getElementById('navAdmin').addEventListener('click', async (e) => {
    e.preventDefault();
    await loadAdminUsers();
    showView('adminView');
});

document.getElementById('navSair').addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth);
});

// (CORREÇÃO) Botão de Sair da tela de Pendentes
pendingLogoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth);
});

// (Início do Jogo)
startButton.addEventListener('click', async () => {
    const bankroll = parseFloat(bankrollInput.value);
    const goal = parseFloat(goalBankInput.value);
    const riskLevel = parseFloat(sessionRiskLevelSelect.value); 
    
    if (isNaN(bankroll) || bankroll <= 0) { showError("Banca inicial inválida."); return; }
    if (isNaN(goal) || goal <= bankroll) { showError("A Meta de Ganhos deve ser maior que a banca inicial."); return; }
    
    // Verifica Cooldown
    startButton.disabled = true;
    startButton.textContent = "Verificando...";
    const profile = await getUserProfile(currentUser.uid);
    const now = Date.now();
    
    if (profile.lockoutEndTime && now < profile.lockoutEndTime) {
        const timeLeft = profile.lockoutEndTime - now;
        showError(`App bloqueado. Tente novamente em ${formatMinutes(timeLeft)}.`);
        startButton.disabled = false;
        startButton.textContent = "Iniciar Sessão";
        return;
    }
    startButton.disabled = false;
    startButton.textContent = "Iniciar Sessão";
    
    sessionGameLink = gameLinkInput.value;
    if (sessionGameLink && !(sessionGameLink.startsWith('http://') || sessionGameLink.startsWith('https://'))) {
        showError("O link do jogo parece ser inválido. (Deve começar com http:// ou https://)");
        return;
    }
    
    errorBox.classList.add('hidden');
    
    initialBankroll = bankroll;
    currentBankroll = bankroll;
    goalBank = goal;
    stopLossBank = bankroll * riskLevel; 
    currentBombs = parseInt(bombCountSelect.value);
    currentStrategy = strategySelect.value;
    currentSafeSquares = 25 - currentBombs;
    lastBetWasWin = true; 
    
    try {
        const sessionCollection = collection(db, "users", currentUser.uid, "sessions");
        const sessionDocRef = await addDoc(sessionCollection, {
            date: serverTimestamp(),
            initialBankroll,
            goalBank,
            stopLossBank,
            bombs: currentBombs,
            strategy: currentStrategy,
            status: "active", 
            userId: currentUser.uid 
        });
        currentSessionId = sessionDocRef.id; 
    } catch (error) {
        console.error("Erro ao criar sessão:", error);
        showError("Falha ao iniciar a sessão. Tente novamente.");
        return;
    }
    
    if (sessionGameLink) openGameButton.classList.remove('hidden');
    else openGameButton.classList.add('hidden');
    
    updateProgressBars();
    generateNewRound();
    showView('gameView');
});

openGameButton.addEventListener('click', () => {
    if(sessionGameLink) { window.open(sessionGameLink, '_blank'); }
});

// (Controles do Jogo)
wonButton.addEventListener('click', () => {
    profitInput.value = ''; 
    winErrorBox.classList.add('hidden'); 
    winInputModal.classList.remove('hidden'); 
    profitInput.focus(); 
});

lostButton.addEventListener('click', async () => {
    const betAmount = currentBetAmount;
    const bankrollBefore = currentBankroll;
    
    currentBankroll -= betAmount;
    lastBetWasWin = false;
    
    await savePlay({
        timestamp: serverTimestamp(),
        userId: currentUser.uid, 
        result: 'perda',
        betAmount: betAmount,
        profit: 0,
        loss: betAmount,
        strategy: currentStrategy,
        bombs: currentBombs,
        clicksSuggested: currentClicksToGenerate,
        bankrollBefore: bankrollBefore,
        bankrollAfter: currentBankroll
    });
    
    updateProgressBars();
    if (!await checkSessionEnd()) generateNewRound();
});

confirmWinButton.addEventListener('click', async () => {
    const profit = parseFloat(profitInput.value);
    if (isNaN(profit) || profit < 0) { 
        winErrorBox.classList.remove('hidden');
        return;
    }
    winErrorBox.classList.add('hidden');
    winInputModal.classList.add('hidden');
    
    const betAmount = currentBetAmount;
    const bankrollBefore = currentBankroll;
    
    currentBankroll += profit;
    lastBetWasWin = true;
    
    await savePlay({
        timestamp: serverTimestamp(),
        userId: currentUser.uid, 
        result: 'ganho',
        betAmount: betAmount,
        profit: profit,
        loss: 0,
        strategy: currentStrategy,
        bombs: currentBombs,
        clicksSuggested: currentClicksToGenerate,
        bankrollBefore: bankrollBefore,
        bankrollAfter: currentBankroll
    });
    
    updateProgressBars();
    if (!await checkSessionEnd()) generateNewRound();
});

cancelWinButton.addEventListener('click', () => {
    winInputModal.classList.add('hidden');
});

backButton.addEventListener('click', async () => {
    await checkSessionEnd(true); // Encerra manually
    setupAppForUser(); 
    showView('setupView');
});

restartButton.addEventListener('click', () => {
    sessionEndScreen.classList.add('hidden');
    setupAppForUser(); 
    showView('setupView');
});

// (CORREÇÃO) Listeners do Dashboard
loadDashboardButton.addEventListener('click', loadDashboard);
dateFilterPresets.addEventListener('change', updateDashboardDates);

// (Listener Tela Admin)
adminUserTableBody.addEventListener('click', async (e) => {
    const target = e.target;
    const uid = target.dataset.uid;
    if (!uid) return;
    
    try {
        if (target.classList.contains('btn-approve')) {
            await updateUserDoc(uid, { access: 'approved' });
        } else if (target.classList.contains('btn-revoke')) {
            await updateUserDoc(uid, { access: 'pending' });
        }
        await loadAdminUsers(); 
    } catch (err) {
        console.error("Erro ao atualizar usuário:", err);
        alert("Falha ao atualizar status do usuário.");
    }
});

// Inicializa o tabuleiro
createBoard();
// Inicializa as datas do dashboard
updateDashboardDates();
