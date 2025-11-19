// --- Configuração do Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, getDocs, orderBy, updateDoc, serverTimestamp, addDoc, collectionGroup, where, Timestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

// --- Constantes Matemáticas ---
const ADMIN_EMAIL = "washington.wn8@gmail.com";

// Multiplicadores Oficiais Spribe (apenas para cálculo de retorno previsto)
const SPRIBE_MULTIPLIERS = {
    1:  [1.01, 1.05, 1.10, 1.15, 1.21, 1.27, 1.34, 1.42],
    2:  [1.05, 1.15, 1.25, 1.38, 1.53, 1.70, 1.90, 2.13],
    3:  [1.10, 1.25, 1.44, 1.67, 1.95, 2.30, 2.73, 3.28],
    4:  [1.15, 1.38, 1.67, 2.05, 2.53, 3.16, 4.00, 5.15],
    5:  [1.21, 1.53, 1.95, 2.53, 3.32, 4.43, 6.01, 8.32],
    // ... (tabela simplificada para manter o código limpo, adicione o restante se necessário)
    20: [4.85, 29.10, 223.10]
};

// --- DOM Elements ---
const views = {
    login: document.getElementById('loginScreen'),
    app: document.getElementById('appScreen'),
    setup: document.getElementById('setupView'),
    game: document.getElementById('gameView'),
    dashboard: document.getElementById('dashboardView'),
    admin: document.getElementById('adminView'),
    pending: document.getElementById('pendingView')
};

const inputs = {
    bankroll: document.getElementById('bankroll'),
    risk: document.getElementById('sessionRiskLevel'),
    profile: document.getElementById('bettingProfile'),
    bombs: document.getElementById('bombCount'),
    strategy: document.getElementById('strategy'),
    loginEmail: document.getElementById('loginEmail'),
    loginPass: document.getElementById('loginPassword')
};

const display = {
    liveBank: document.getElementById('liveBankrollDisplay'),
    liveGoal: document.getElementById('liveGoalDisplay'),
    bet: document.getElementById('suggestedBet'),
    return: document.getElementById('potentialReturn'),
    prob: document.getElementById('mathProbability'),
    board: document.getElementById('gameBoard'),
    bar: document.getElementById('sessionProgressBar'),
    winModalReturn: document.getElementById('calcReturnDisplay')
};

// --- State ---
let currentUser = null;
let sessionState = {
    id: null,
    initialBank: 0,
    currentBank: 0,
    stopLoss: 0,
    goal: 0,
    bombs: 3,
    strategy: 'balanced',
    profile: 'balanced',
    lastResult: null, // 'win' or 'loss'
    clicksTarget: 0,
    currentBet: 0
};

// --- Auth Logic ---
onAuthStateChanged(auth, async (user) => {
    document.getElementById('loadingScreen').classList.add('hidden');
    if (user) {
        currentUser = user;
        const docSnap = await getDoc(doc(db, "users", user.uid));
        let userData = docSnap.exists() ? docSnap.data() : null;

        if (!userData) {
            userData = { 
                uid: user.uid, email: user.email, role: user.email === ADMIN_EMAIL ? 'admin' : 'user', access: user.email === ADMIN_EMAIL ? 'approved' : 'pending', lastBankroll: 100 
            };
            await setDoc(doc(db, "users", user.uid), userData);
        }

        if (userData.access === 'approved') {
            document.getElementById('userEmailDisplay').textContent = userData.email;
            if (userData.role === 'admin') document.getElementById('navAdminLink').classList.remove('hidden');
            inputs.bankroll.value = (userData.lastBankroll || 100).toFixed(2);
            showView('setup');
        } else {
            showView('pending');
        }
    } else {
        showView('login');
    }
});

// --- Core Math Functions ---

// Calcula a probabilidade REAL de não explodir em X cliques
function calculateSurvivalProbability(bombs, clicks) {
    let totalSquares = 25;
    let safeSquares = 25 - bombs;
    let prob = 1.0;

    for (let i = 0; i < clicks; i++) {
        prob *= (safeSquares - i) / (totalSquares - i);
    }
    return prob;
}

// Define o valor da aposta SEM martingale, usando gestão de banca
function calculateBetSize() {
    const bank = sessionState.currentBank;
    const prob = calculateSurvivalProbability(sessionState.bombs, sessionState.clicksTarget);
    
    // Definição de Porcentagem Base conforme Perfil
    let basePct = 0.01; // 1% padrão
    if (sessionState.profile === 'conservative') basePct = 0.005; // 0.5%
    if (sessionState.profile === 'aggressive') basePct = 0.02; // 2%

    // Ajuste pela Probabilidade (Kelly Fracionário implícito)
    // Se a chance de ganhar é alta (>70%), aumentamos a mão levemente
    // Se é baixa (<40%), reduzimos para defesa
    let adjustment = 1.0;
    if (prob > 0.80) adjustment = 1.5; // Mão forte
    else if (prob > 0.60) adjustment = 1.2;
    else if (prob < 0.40) adjustment = 0.5; // Mão defensiva

    // Ajuste pós-perda (Defensivo - NÃO Gale)
    // Se perdeu a última, reduz a aposta para proteger o emocional e a banca
    if (sessionState.lastResult === 'loss') {
        adjustment *= 0.8; 
    } else if (sessionState.lastResult === 'win') {
        // Se ganhou, pode arriscar um pouco do lucro (Lucro Composto leve)
        adjustment *= 1.1;
    }

    let bet = bank * basePct * adjustment;

    // Limites de Sanidade
    const maxBet = bank * 0.10; // Nunca apostar mais de 10% da banca
    const minBet = 1.00; // Minimo da plataforma
    
    bet = Math.max(minBet, Math.min(bet, maxBet));
    
    // Não deixar a aposta cruzar o Stop Loss
    if (bank - bet < sessionState.stopLoss) {
        bet = bank - sessionState.stopLoss;
    }

    return Math.floor(bet * 100) / 100; // Arredonda 2 casas
}

// --- Game Logic ---

function startGame() {
    const bank = parseFloat(inputs.bankroll.value);
    if (isNaN(bank) || bank <= 0) return alert("Banca inválida");

    const riskFactor = parseFloat(inputs.risk.value); // ex: 0.8 (para com 80% da banca)
    
    sessionState.initialBank = bank;
    sessionState.currentBank = bank;
    sessionState.stopLoss = bank * riskFactor;
    sessionState.goal = bank * (1 + (1 - riskFactor)); // Meta proporcional ao risco (RR 1:1)
    sessionState.bombs = parseInt(inputs.bombs.value);
    sessionState.strategy = inputs.strategy.value;
    sessionState.profile = inputs.profile.value;
    sessionState.lastResult = null;

    updateUI();
    nextRound();
    showView('game');
}

function nextRound() {
    // Definir cliques alvo
    let min = 1, max = 3;
    if (sessionState.strategy === 'fixed_1') { min = 1; max = 1; }
    else if (sessionState.strategy === 'low') { min = 1; max = 2; }
    else if (sessionState.strategy === 'balanced') { min = 3; max = 4; }
    else { min = 5; max = 8; }

    // Aleatoriedade controlada para cliques
    sessionState.clicksTarget = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Calcular Aposta
    sessionState.currentBet = calculateBetSize();

    // Calcular Retorno Potencial
    let multiplier = 1.0;
    if (SPRIBE_MULTIPLIERS[sessionState.bombs]) {
        // Array index 0 = 1 click.
        const idx = Math.min(sessionState.clicksTarget, SPRIBE_MULTIPLIERS[sessionState.bombs].length) - 1;
        multiplier = SPRIBE_MULTIPLIERS[sessionState.bombs][idx] || 1.1;
    }
    const potential = sessionState.currentBet * multiplier;

    // Atualizar UI Numerica
    display.bet.textContent = `R$ ${sessionState.currentBet.toFixed(2)}`;
    display.return.textContent = `R$ ${potential.toFixed(2)}`;
    display.winModalReturn.textContent = `R$ ${potential.toFixed(2)}`; // Pre-set modal
    
    const prob = calculateSurvivalProbability(sessionState.bombs, sessionState.clicksTarget);
    display.prob.textContent = `${(prob * 100).toFixed(1)}% Chance`;
    
    if (prob > 0.7) display.prob.className = "bg-green-700 px-2 py-1 rounded text-xs font-bold text-white";
    else if (prob > 0.4) display.prob.className = "bg-yellow-600 px-2 py-1 rounded text-xs font-bold text-white";
    else display.prob.className = "bg-red-700 px-2 py-1 rounded text-xs font-bold text-white";

    renderBoard(sessionState.clicksTarget);
}

function renderBoard(clicksNeeded) {
    display.board.innerHTML = '';
    // Gerar indices únicos aleatórios (Entropia Pura)
    const indices = new Set();
    while(indices.size < clicksNeeded) {
        indices.add(Math.floor(Math.random() * 25));
    }

    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = "w-10 h-10 bg-blue-900 rounded border border-blue-800 flex items-center justify-center transition-all";
        
        if (indices.has(i)) {
            cell.classList.remove('bg-blue-900');
            cell.classList.add('bg-yellow-500', 'animate-pulse', 'shadow-lg', 'shadow-yellow-500/50');
            cell.innerHTML = `<div class="w-3 h-3 bg-white rounded-full"></div>`;
        }

        display.board.appendChild(cell);
    }
}

async function handleResult(type) {
    const bet = sessionState.currentBet;
    let profit = 0;
    let loss = 0;

    if (type === 'win') {
        // Recupera o valor do multiplicador para o cálculo exato
        let multiplier = 1.0;
        if (SPRIBE_MULTIPLIERS[sessionState.bombs]) {
            const idx = Math.min(sessionState.clicksTarget, SPRIBE_MULTIPLIERS[sessionState.bombs].length) - 1;
            multiplier = SPRIBE_MULTIPLIERS[sessionState.bombs][idx] || 1.0;
        }
        const totalReturn = bet * multiplier;
        profit = totalReturn - bet;
        sessionState.currentBank += profit;
        sessionState.lastResult = 'win';
    } else {
        loss = bet;
        sessionState.currentBank -= loss;
        sessionState.lastResult = 'loss';
    }

    // Salvar no Firestore
    try {
        await addDoc(collection(db, "users", currentUser.uid, "plays"), {
            timestamp: serverTimestamp(),
            type: type,
            bet: bet,
            profit: profit,
            loss: loss,
            bankAfter: sessionState.currentBank,
            strategy: sessionState.strategy,
            bombs: sessionState.bombs
        });
        
        // Atualizar User
        await updateDoc(doc(db, "users", currentUser.uid), {
            lastBankroll: sessionState.currentBank
        });

    } catch (e) { console.error(e); }

    updateUI();

    // Checar Fim de Sessão
    if (sessionState.currentBank >= sessionState.goal) {
        endSession("Meta Batida!", true);
    } else if (sessionState.currentBank <= sessionState.stopLoss) {
        endSession("Stop Loss Atingido", false);
    } else {
        nextRound(); // Continua
    }
}

function updateUI() {
    display.liveBank.textContent = `R$ ${sessionState.currentBank.toFixed(2)}`;
    display.liveGoal.textContent = `R$ ${sessionState.goal.toFixed(2)}`;
    
    // Barra de Progresso (Visualização de Range)
    const totalRange = sessionState.goal - sessionState.stopLoss;
    const currentPos = sessionState.currentBank - sessionState.stopLoss;
    const pct = Math.max(0, Math.min(100, (currentPos / totalRange) * 100));
    
    display.bar.style.width = `${pct}%`;
    
    // Muda cor da barra baseado na posição
    if (pct < 20) display.bar.className = "h-full bg-red-500 transition-all duration-500";
    else if (pct > 80) display.bar.className = "h-full bg-green-500 transition-all duration-500";
    else display.bar.className = "h-full bg-yellow-400 transition-all duration-500";
}

function endSession(msg, isWin) {
    document.getElementById('sessionEndTitle').textContent = msg;
    document.getElementById('sessionEndMessage').textContent = isWin ? "Parabéns! Você executou o plano com disciplina." : "Protegemos o restante da sua banca. Volte amanhã.";
    document.getElementById('sessionEndBank').textContent = `R$ ${sessionState.currentBank.toFixed(2)}`;
    document.getElementById('sessionEndScreen').classList.remove('hidden');
}

// --- Navigation ---
function showView(viewName) {
    Object.values(views).forEach(v => v.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
    views.app.classList.remove('hidden');
    if (viewName === 'login') views.app.classList.add('hidden');
    
    // Sidebar close mobile
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebarOverlay').classList.add('hidden');
}

// --- Listeners ---
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('lostButton').addEventListener('click', () => handleResult('loss'));
document.getElementById('wonButton').addEventListener('click', () => {
    document.getElementById('winInputModal').classList.remove('hidden');
});
document.getElementById('confirmWinButton').addEventListener('click', () => {
    document.getElementById('winInputModal').classList.add('hidden');
    handleResult('win');
});
document.getElementById('cancelWinButton').addEventListener('click', () => {
    document.getElementById('winInputModal').classList.add('hidden');
});
document.getElementById('restartButton').addEventListener('click', () => {
    document.getElementById('sessionEndScreen').classList.add('hidden');
    showView('setup');
});
document.getElementById('backButton').addEventListener('click', () => showView('setup'));

// Auth Forms
document.getElementById('showSignup').onclick = () => { document.getElementById('loginForm').classList.add('hidden'); document.getElementById('signupForm').classList.remove('hidden'); };
document.getElementById('showLogin').onclick = () => { document.getElementById('signupForm').classList.add('hidden'); document.getElementById('loginForm').classList.remove('hidden'); };

document.getElementById('loginForm').onsubmit = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, inputs.loginEmail.value, inputs.loginPass.value).catch(err => alert("Erro Login"));
};

// Sidebar
document.getElementById('hamburgerButton').onclick = () => {
    document.getElementById('sidebar').classList.remove('-translate-x-full');
    document.getElementById('sidebarOverlay').classList.remove('hidden');
};
document.getElementById('sidebarOverlay').onclick = () => {
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebarOverlay').classList.add('hidden');
};
document.getElementById('navDiario').onclick = () => showView('setup');
document.getElementById('navDashboard').onclick = () => showView('dashboard'); // (Dashboard load logic omitted for brevity, same as before)
document.getElementById('navSair').onclick = () => signOut(auth);
