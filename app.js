// Seletores dos elementos da tela
const cells = document.querySelectorAll('.cell');
const turnDisplay = document.getElementById('turn');
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const rankingList = document.getElementById('rankingList');
const winnerModal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');

// Variáveis de Estado do Jogo
let gameActive = false; 
let currentPlayer = "X";
let gameState = ["", "", "", "", "", "", "", "", ""];

// Dados do Campeonato
let player1Name = "Jogador 1";
let player2Name = "Computador"; // Padrão se o segundo campo estiver vazio
let player1Symbol = "X";
let player2Symbol = "◯";
let score1 = 0;
let score2 = 0;
const targetWins = 10;
let isAgainstMachine = false; // Controla se a máquina está ativa

// Histórico do Ranking local
let ranking = JSON.parse(localStorage.getItem('vegasRanking')) || [];

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]             
];

function updateRankingUI() {
    rankingList.innerHTML = "";
    const topFive = [...ranking].sort((a, b) => b.score - a.score).slice(0, 5);
    topFive.forEach(player => {
        const li = document.createElement('li');
        li.innerText = `${player.name} - ${player.score} Vitórias`;
        rankingList.appendChild(li);
    });
}
updateRankingUI();

// Função para iniciar o campeonato
function startGame() {
    const p1Input = document.getElementById('player1').value.trim();
    const p2Input = document.getElementById('player2').value.trim();
    
    player1Name = p1Input !== "" ? p1Input : "Jogador 1";
    
    // Se o campo do jogador 2 estiver vazio, ativa a Máquina
    if (p2Input === "") {
        player2Name = "🎰 Vegas Bot (IA)";
        isAgainstMachine = true;
    } else {
        player2Name = p2Input;
        isAgainstMachine = false;
    }
    
    player1Symbol = document.getElementById('symbol1').value;
    player2Symbol = document.getElementById('symbol2').value;

    if (player1Symbol === player2Symbol) {
        addChatMessage("Sistema", "Erro: Os símbolos não podem ser iguais!");
        return;
    }

    document.getElementById('name1').innerText = player1Name;
    document.getElementById('name2').innerText = player2Name;
    
    score1 = 0;
    score2 = 0;
    document.getElementById('score1').innerText = "0";
    document.getElementById('score2').innerText = "0";

    gameActive = true;
    currentPlayer = player1Symbol;
    gameState = ["", "", "", "", "", "", "", "", ""];
    
    turnDisplay.innerHTML = `Vez de: <span style="color: #ff0055">${player1Name} (${player1Symbol})</span>`;
    addChatMessage("Sistema", `Campeonato Iniciado! ${player1Name} vs ${player2Name}`);
    
    cells.forEach(cell => cell.innerText = "");
}

// Lógica de clique nas células do tabuleiro
cells.forEach(cell => {
    cell.addEventListener('click', (e) => {
        const clickedCell = e.target;
        const cellIndex = parseInt(clickedCell.getAttribute('data-index'));

        // Se a casa já tiver ocupada, o jogo não estiver ativo ou for o turno da máquina, impede o clique
        if (gameState[cellIndex] !== "" || !gameActive) return;
        if (isAgainstMachine && currentPlayer === player2Symbol) return;

        makeMove(clickedCell, cellIndex);
    });
});

// Executa o movimento (serve para você e para a máquina)
function makeMove(cellElement, index) {
    gameState[index] = currentPlayer;
    cellElement.innerText = currentPlayer;
    cellElement.style.color = currentPlayer === player1Symbol ? "#ff0055" : "#00d2ff";

    const result = checkResult();
    
    // Se o jogo continuar e for o modo contra a máquina, faz a IA jogar após um pequeno atraso
    if (!result && gameActive && isAgainstMachine && currentPlayer === player2Symbol) {
        turnDisplay.innerHTML = `🤖 <span style="color: #00d2ff">${player2Name}</span> pensando...`;
        setTimeout(machinePlay, 600); // 0.6 segundos para parecer mais natural
    }
}

// Lógica da Jogada da Máquina
function machinePlay() {
    if (!gameActive) return;

    // Descobre todas as posições vazias no tabuleiro
    let availableCells = [];
    gameState.forEach((val, idx) => {
        if (val === "") availableCells.push(idx);
    });

    if (availableCells.length === 0) return;

    // Escolhe uma casa aleatória entre as vazias
    const randomIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
    const targetCell = document.querySelector(`.cell[data-index="${randomIndex}"]`);

    makeMove(targetCell, randomIndex);
}

function checkResult() {
    let roundWon = false;
    for (let i = 0; i < winningConditions.length; i++) {
        const condition = winningConditions[i];
        let a = gameState[condition[0]];
        let b = gameState[condition[1]];
        let c = gameState[condition[2]];
        if (a === '' || b === '' || c === '') continue;
        if (a === b && b === c) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        const winnerName = currentPlayer === player1Symbol ? player1Name : player2Name;
        if (currentPlayer === player1Symbol) {
            score1++;
            document.getElementById('score1').innerText = score1;
        } else {
            score2++;
            document.getElementById('score2').innerText = score2;
        }

        addChatMessage("Sistema", `${winnerName} venceu a rodada!`);

        if (score1 === targetWins || score2 === targetWins) {
            showModal(`🎰 JACKPOT! ${winnerName} é o Grande Campeão de Vegas! 🎰`);
            saveToRanking(winnerName, Math.max(score1, score2));
            gameActive = false;
            turnDisplay.innerText = "Campeonato Encerrado!";
        } else {
            showModal(`🎉 ${winnerName} ganhou esta rodada!`);
            gameActive = false; 
        }
        return true; // Rodada finalizada
    }

    let roundDraw = !gameState.includes("");
    if (roundDraw) {
        showModal("💥 Deu Velha! A banca levou tudo nesta rodada! 💥");
        addChatMessage("Sistema", "A rodada empatou!");
        gameActive = false;
        return true; // Rodada finalizada
    }

    // Alterna o turno
    currentPlayer = currentPlayer === player1Symbol ? player2Symbol : player1Symbol;
    const currentName = currentPlayer === player1Symbol ? player1Name : player2Name;
    turnDisplay.innerHTML = `Vez de: <span style="color: ${currentPlayer === player1Symbol ? '#ff0055' : '#00d2ff'}">${currentName} (${currentPlayer})</span>`;
    
    return false; // Jogo continua
}

function resetBoard() {
    if (score1 === targetWins || score2 === targetWins) {
        addChatMessage("Sistema", "O campeonato acabou! Inicie um novo torneio.");
        return;
    }
    gameState = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    currentPlayer = player1Symbol;
    turnDisplay.innerHTML = `Vez de: <span style="color: #ff0055">${player1Name} (${player1Symbol})</span>`;
    cells.forEach(cell => cell.innerText = "");
    addChatMessage("Sistema", "Nova rodada iniciada!");
}

function saveToRanking(name, score) {
    ranking.push({ name, score, date: new Date().toLocaleDateString() });
    localStorage.setItem('vegasRanking', JSON.stringify(ranking));
    updateRankingUI();
}

function clearRanking() {
    document.getElementById('confirmModal').style.display = "flex";
}

function confirmClear(isConfirmed) {
    document.getElementById('confirmModal').style.display = "none";
    if (isConfirmed) {
        ranking = [];
        localStorage.removeItem('vegasRanking');
        updateRankingUI();
        addChatMessage("Sistema", "O ranking foi limpo!");
    }
}

function sendMessage() {
    const text = chatInput.value.trim();
    if (text === "") return;
    addChatMessage("Você", text);
    chatInput.value = "";
}

function addChatMessage(sender, message) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    if (sender === "Sistema") msgDiv.classList.add('system');
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showModal(text) {
    winnerText.innerText = text;
    winnerModal.style.display = "flex";
}

function closeModal() {
    winnerModal.style.display = "none";
    if(score1 < targetWins && score2 < targetWins) {
        resetBoard();
        // Se a máquina for a segunda a jogar e o jogo recomeçar no turno dela, ela joga
        if (isAgainstMachine && currentPlayer === player2Symbol) {
            setTimeout(machinePlay, 600);
        }
    }
}

function shareWhatsApp() {
    const text = `🎰 Jogo da Velha Vegas Edition \nPlacar Atual:\n${player1Name}: ${score1} Vitórias\n${player2Name}: ${score2} Vitórias`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}
