// --- Configuração do Firebase (FORNECIDA PELO USUÁRIO) ---
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Constantes ---
const ADMIN_EMAIL = "washington.wn8@gmail.com";
const COOLDOWN_MINUTES = 60;
const STRATEGY_NAMES = {
    low: "Baixo Risco",
    balanced: "Equilibrada",
    high: "Alto Risco",
    'N/A': 'N/A'
};

// Tabela de Multiplicadores Oficiais Spribe
const SPRIBE_MULTIPLIERS = {
    1:  [1.01, 1.05, 1.10, 1.15, 1.21, 1.27, 1.34, 1.42],
    2:  [1.05, 1.15, 1.25, 1.38, 1.53, 1.70, 1.90, 2.13],
    3:  [1.10, 1.25, 1.44, 1.67, 1.95, 2.30, 2.73, 3.28],
    4:  [1.15, 1.38, 1.67, 2.05, 2.53, 3.16, 4.00, 5.15],
    5:  [1.21, 1.53, 1.95, 2.53, 3.32, 4.43, 6.01, 8.32],
    6:  [1.27, 1.70, 2.30, 3.16, 4.43, 6.33, 9.25, 13.88],
    7:  [1.34, 1.90, 2.73, 4.00, 6.01, 9.25, 14.65, 23.97],
    8:  [1.42, 2.13, 3.28, 5.15, 8.32, 13.88, 23.97, 43.15],
    9:  [1.51, 2.42, 3.98, 6.74, 11.79, 21.45, 40.75, 81.51],
    10: [1.61, 2.77, 4.90, 8.98, 17.16, 34.32, 72.45, 163.03],
    11: [1.73, 3.19, 6.12, 12.25, 25.74, 57.20, 135.86, 349.35],
    12: [1.86, 3.73, 7.80, 17.16, 40.04, 100.10, 271.72, 815.17],
    13: [2.02, 4.40, 10.14, 24.78, 65.07, 185.91, 588.73, 2119.44],
    14: [2.20, 5.29, 13.52, 37.18, 111.55, 371.83, 1412.96, 6358.35],
    15: [2.42, 6.46, 18.59, 58.43, 204.50, 818.03, 3885.65, 23313.94],
    16: [2.69, 8.08, 26.55, 97.38, 409.01, 2045.08, 12952.19, 116569.74],
    17: [3.03, 10.39, 39.83, 175.29, 920.28, 6135.25, 58284.87, 1049127.75],
    18: [3.46, 13.85, 63.74, 350.58, 2454.10, 24541.00, 466279.00],
    19: [4.04, 19.40, 111.55, 818.03, 8589.35, 171787.00],
    20: [4.85, 29.10, 223.10, 2454.10, 51536.10]
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
const returnInput = document.getElementById('returnInput');
const confirmWinButton = document.getElementById('confirmWinButton');
const cancelWinButton = document.getElementById('cancelWinButton');
const winErrorBox = document.getElementById('winErrorBox');

// --- Estado Global ---
let currentUser = null;
let currentUserData = null;
let sessionTimer = null; 

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

function calculateSuggestedGoal() {
    const bankroll = parseFloat(bankrollInput.value);
    const riskLevel = parseFloat(sessionRiskLevelSelect.value); 
    const strategy = strategySelect.value;
    const bombs = parseInt(bombCountSelect.value);
    
    if (isNaN(bankroll) || bankroll <= 0) return;

    const riskAmount = bankroll * (1 - riskLevel);

    let riskRewardRatio = 1.0; 
    if (strategy === 'low') riskRewardRatio = 0.5; 
    else if (strategy === 'balanced') riskRewardRatio = 1.0; 
    else if (strategy === 'high') riskRewardRatio = 1.5; 

    let bombFactor = 1.0;
    if (bombs >= 5 && bombs < 10) bombFactor = 1.1;
    if (bombs >= 10) bombFactor = 1.25;

    const targetProfit = riskAmount * riskRewardRatio * bombFactor;
    const suggestedGoal = bankroll + targetProfit;

    goalBankInput.value = suggestedGoal.toFixed(2);
}

// --- FUNÇÕES DE AUTENTICAÇÃO E DADOS ---

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            currentUserData = userDocSnap.data();
            userEmailDisplay.textContent = currentUserData.email;

            if (currentUserData.access === 'pending') {
                showView('pendingView');
                appContent.classList.remove('md:ml-64'); 
                sidebar.classList.add('hidden'); 
                hamburgerButton.classList.add('hidden'); 
                appScreen.classList.remove('hidden');
                loginScreen.classList.add('hidden');
            } else if (currentUserData.access === 'approved') {
                appContent.classList.add('md:ml-64'); 
                sidebar.classList.remove('hidden'); 
                hamburgerButton.classList.remove('hidden'); 
                setupAppForUser();
                showView('setupView');
                appScreen.classList.remove('hidden');
                loginScreen.classList.add('hidden');
            }
        } else {
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
        loginEmailInput.value = '';
        loginPasswordInput.value = '';
        authErrorBox.classList.add('hidden');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    }
    loadingScreen.classList.add('hidden');
});

function setupAppForUser() {
    const lastBank = currentUserData.lastBankroll || 100;
    bankrollInput.value = lastBank.toFixed(2);
    lastBankrollDisplay.textContent = formatBRL(lastBank);
    calculateSuggestedGoal(); 
    if (currentUserData.role === 'admin') {
        navAdminLink.classList.remove('hidden');
    } else {
        navAdminLink.classList.add('hidden');
    }
}

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

async function loadDashboard() {
    dashboardLoading.classList.remove('hidden');
    dashboardStats.classList.add('hidden');
    noDashboardData.classList.add('hidden');
    
    const [startY, startM, startD] = dateFilterStart.value.split('-').map(Number);
    let startDate = new Date(startY, startM - 1, startD); 
    const [endY, endM, endD] = dateFilterEnd.value.split('-').map(Number);
    let endDate = new Date(endY, endM - 1, endD); 
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
        dashboardLoading.classList.add('hidden');
        noDashboardData.classList.remove('hidden');
        noDashboardData.textContent = "Erro ao carregar dados.";
        return;
    }

    if (allPlays.length === 0) {
        dashboardLoading.classList.add('hidden');
        noDashboardData.classList.remove('hidden');
        noDashboardData.textContent = "Nenhuma jogada encontrada para este período.";
        return;
    }

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

    kpiTotalProfit.textContent = formatBRL(totalProfit);
    kpiTotalProfit.className = `kpi-value ${totalProfit >= 0 ? 'text-gain' : 'text-loss'}`;
    kpiTotalBet.textContent = formatBRL(totalBet);
    kpiWinRate.textContent = `${(wins / allPlays.length * 100).toFixed(0)}%`;
    kpiTotalPlays.textContent = allPlays.length;
    
    kpiBestStrategy.textContent = STRATEGY_NAMES[bestStrat.name] || 'N/A';
    kpiBestStrategyProfit.textContent = formatBRL(bestStrat.profit);
    kpiWorstStrategy.textContent = STRATEGY_NAMES[worstStrat.name] || 'N/A';
    kpiWorstStrategyLoss.textContent = formatBRL(worstStrat.profit);
    
    dashboardLoading.classList.add('hidden');
    dashboardStats.classList.remove('hidden');
}

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

function getRandomInt(min, max) { 
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createBoard() {
    gameBoard.innerHTML = '';
    for (let r = 0; r < 5; r++) { for (let c = 0; c < 5; c++) {
        const cell = document.createElement('div');
        cell.id = `cell-${r}-${c}`;
        cell.className = 'grid-cell';
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

// (MODIFICADO) Visual melhor e menos repetitivo
function generateIndications() {
    resetBoard();
    const numClicks = currentClicksToGenerate;
    const selectedCells = new Set();
    
    // Evita selecionar a mesma célula visualmente
    while (selectedCells.size < numClicks) {
        const row = getRandomInt(0, 4); 
        const col = getRandomInt(0, 4); 
        selectedCells.add(`${row}-${col}`);
    }
    
    selectedCells.forEach(coord => {
        const cell = document.getElementById(`cell-${coord}`);
        if (cell) { 
            cell.classList.add('indicated-cell'); 
            // Ícone de Diamante/Estrela com animação
            cell.innerHTML = `<svg class="w-8 h-8 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg>`;
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
        sessionEndIcon.innerHTML = `
            <svg class="w-16 h-16 text-yellow-400 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>`;
    } else {
        sessionEndTitle.textContent = "LIMITE ATINGIDO!";
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

// (MODIFICADO) Removemos Martingale e "Tilt Mode"
function generateNewRound() {
    // Reseta para a estratégia escolhida pelo usuário, ignorando derrotas passadas
    strategyTitle.textContent = "Próxima Jogada";
    currentStrategy = strategySelect.value;

    let minClicks, maxClicks;
    switch (currentStrategy) {
        case 'low': minClicks = 1; maxClicks = 3; break;
        case 'balanced': minClicks = 3; maxClicks = 4; break; // Ajustado para segurança
        case 'high': minClicks = 4; maxClicks = 6; break; // Ajustado para segurança
    }
    
    maxClicks = Math.min(maxClicks, currentSafeSquares);
    minClicks = Math.min(minClicks, maxClicks);
    if (minClicks > maxClicks) minClicks = maxClicks;

    currentClicksToGenerate = getRandomInt(minClicks, maxClicks); 

    // Cálculo real de probabilidade
    let prob = 1.0;
    if (currentClicksToGenerate > currentSafeSquares) prob = 0; 
    else { for (let i = 0; i < currentClicksToGenerate; i++) { prob *= (currentSafeSquares - i) / (25 - i); } }

    // Gestão de Banca Conservadora (1% ou 0.5% fixo)
    let safePercentage = 0.01; 
    if (currentStrategy === 'high') safePercentage = 0.005; // Menos risco na aposta se a estratégia for arriscada
    
    currentBetAmount = Math.max(1, Math.floor(currentBankroll * safePercentage));

    // Proteção absoluta de Stop Loss
    if (currentBankroll - currentBetAmount < stopLossBank) {
        currentBetAmount = currentBankroll - stopLossBank;
        if (currentBetAmount < 1) currentBetAmount = 0;
    }
    
    // Atualização UI
    clickCount.textContent = currentClicksToGenerate;
    const probPercent = (prob * 100).toFixed(1);
    successChance.textContent = `${probPercent}%`;
    
    // Classes de cor baseadas em probabilidade real
    successChance.className = 'text-xl sm:text-2xl font-bold'; 
    if (prob > 0.8) successChance.classList.add('prob-safe');
    else if (prob > 0.5) successChance.classList.add('prob-mid');
    else successChance.classList.add('prob-danger');
    
    suggestedBet.textContent = currentBetAmount > 0 ? formatBRL(currentBetAmount) : "PAUSAR (Limite)";
    
    if (currentBetAmount <= 0) {
        showError("Você está muito próximo do seu Stop Loss. Recomendamos parar.");
    }

    generateIndications();
}

// --- Event Listeners ---

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

bankrollInput.addEventListener('input', calculateSuggestedGoal);
sessionRiskLevelSelect.addEventListener('change', calculateSuggestedGoal);
strategySelect.addEventListener('change', calculateSuggestedGoal);
bombCountSelect.addEventListener('change', calculateSuggestedGoal);

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

pendingLogoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth);
});

startButton.addEventListener('click', async () => {
    const bankroll = parseFloat(bankrollInput.value);
    const goal = parseFloat(goalBankInput.value);
    const riskLevel = parseFloat(sessionRiskLevelSelect.value); 
    
    if (isNaN(bankroll) || bankroll <= 0) { showError("Banca inicial inválida."); return; }
    if (isNaN(goal) || goal <= bankroll) { showError("A Meta de Ganhos deve ser maior que a banca inicial."); return; }
    
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

wonButton.addEventListener('click', () => {
    winErrorBox.classList.add('hidden'); 
    winInputModal.classList.remove('hidden'); 
    
    const clicks = currentClicksToGenerate;
    let multiplier = 1.0;
    
    if (SPRIBE_MULTIPLIERS[currentBombs] && clicks > 0) {
        const index = Math.min(clicks, 8) - 1; 
        multiplier = SPRIBE_MULTIPLIERS[currentBombs][index] || 1.0;
    }

    const calculatedReturn = currentBetAmount * multiplier;
    
    returnInput.value = calculatedReturn.toFixed(2);
    returnInput.focus(); 
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
    const totalReturn = parseFloat(returnInput.value);
    
    if (isNaN(totalReturn) || totalReturn < currentBetAmount) {
        winErrorBox.textContent = `Valor inválido. Deve ser pelo menos ${formatBRL(currentBetAmount)}.`;
        winErrorBox.classList.remove('hidden');
        return;
    }
    
    const profit = totalReturn - currentBetAmount;
    
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
    await checkSessionEnd(true); 
    setupAppForUser(); 
    showView('setupView');
});

restartButton.addEventListener('click', () => {
    sessionEndScreen.classList.add('hidden');
    setupAppForUser(); 
    showView('setupView');
});

loadDashboardButton.addEventListener('click', loadDashboard);
dateFilterPresets.addEventListener('change', updateDashboardDates);

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

createBoard();
updateDashboardDates();
