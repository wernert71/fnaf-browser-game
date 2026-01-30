// FNAF Browser Game - Game Logic

// Game State
const gameState = {
    night: 1,
    hour: 0, // 0 = 12 AM, 1 = 1 AM, etc.
    power: 100,
    powerUsage: 1,
    isPlaying: false,
    cameraOpen: false,
    currentCamera: '1A',
    leftDoorClosed: false,
    rightDoorClosed: false,
    leftLightOn: false,
    rightLightOn: false,
    gameOver: false,
    officePosition: 'center' // 'left', 'center', 'right'
};

// Animatronics (Animatronische figuren)
const animatronics = {
    freddy: {
        name: 'Freddy Fazbeer',
        emoji: '🐻',
        position: '1A',
        aiLevel: 0,
        path: ['1A', '1B', '2A', '4A', '4B', 'RIGHT_DOOR'],
        moveInterval: null
    },
    bonnie: {
        name: 'Bonnie het Konijn',
        emoji: '🐰',
        position: '1A',
        aiLevel: 0,
        path: ['1A', '1B', '3', '2A', '2B', 'LEFT_DOOR'],
        moveInterval: null
    },
    chica: {
        name: 'Chica de Kip',
        emoji: '🐤',
        position: '1A',
        aiLevel: 0,
        path: ['1A', '1B', '4A', '4B', 'RIGHT_DOOR'],
        moveInterval: null
    },
    foxy: {
        name: 'Foxy de Piraat',
        emoji: '🦊',
        position: '3',
        aiLevel: 0,
        stage: 0, // 0-3, bij 3 rent hij
        moveInterval: null
    }
};

// Camera locaties met beschrijvingen
const cameras = {
    '1A': { name: 'Podium', description: 'Hoofdpodium' },
    '1B': { name: 'Eetzaal', description: 'Tafels en stoelen' },
    '2A': { name: 'West Gang', description: 'Linker gang' },
    '2B': { name: 'West Hoek', description: 'Bij linker deur' },
    '3': { name: 'Piraten Hoek', description: 'Foxy\'s schuilplaats' },
    '4A': { name: 'Oost Gang', description: 'Rechter gang' },
    '4B': { name: 'Oost Hoek', description: 'Bij rechter deur' }
};

// DOM Elements
const elements = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    jumpscareScreen: document.getElementById('jumpscare-screen'),
    gameoverScreen: document.getElementById('gameover-screen'),
    victoryScreen: document.getElementById('victory-screen'),
    officeView: document.getElementById('office-view'),
    officeBg: document.getElementById('office-bg'),
    cameraView: document.getElementById('camera-view'),
    timeDisplay: document.getElementById('time-display'),
    nightDisplay: document.getElementById('night-display'),
    powerValue: document.getElementById('power-value'),
    powerFill: document.getElementById('power-fill'),
    usageBars: document.getElementById('usage-bars'),
    cameraName: document.getElementById('camera-name'),
    animatronicDisplay: document.getElementById('animatronic-display'),
    jumpscareAnimatronic: document.getElementById('jumpscare-animatronic'),
    leftDoor: document.getElementById('left-door'),
    rightDoor: document.getElementById('right-door'),
    leftDoorArea: document.getElementById('left-door-area'),
    rightDoorArea: document.getElementById('right-door-area'),
    centerArea: document.getElementById('center-area'),
    leftWindow: document.getElementById('left-window'),
    rightWindow: document.getElementById('right-window'),
    leftAnimatronic: document.getElementById('left-animatronic'),
    rightAnimatronic: document.getElementById('right-animatronic'),
    cameraToggle: document.getElementById('camera-toggle')
};

// Buttons
const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const nextNightBtn = document.getElementById('next-night-btn');
const leftDoorBtn = document.getElementById('left-door-btn');
const rightDoorBtn = document.getElementById('right-door-btn');
const leftLightBtn = document.getElementById('left-light-btn');
const rightLightBtn = document.getElementById('right-light-btn');
const camBtns = document.querySelectorAll('.cam-btn');

// Game Intervals
let hourInterval;
let powerInterval;
let checkInterval;

// Audio context for sound effects
let audioContext;

// Initialize audio context on user interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Generate sound effects
function playSound(type) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch(type) {
        case 'door':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'camera':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'jumpscare':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
        case 'powerout':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(55, audioContext.currentTime + 2);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 2);
            break;
        case 'victory':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.4);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.8);
            break;
    }
}

// Set AI levels based on night
function setAILevels() {
    const night = gameState.night;

    switch(night) {
        case 1:
            animatronics.freddy.aiLevel = 0;
            animatronics.bonnie.aiLevel = 3;
            animatronics.chica.aiLevel = 2;
            animatronics.foxy.aiLevel = 1;
            break;
        case 2:
            animatronics.freddy.aiLevel = 1;
            animatronics.bonnie.aiLevel = 5;
            animatronics.chica.aiLevel = 4;
            animatronics.foxy.aiLevel = 2;
            break;
        case 3:
            animatronics.freddy.aiLevel = 2;
            animatronics.bonnie.aiLevel = 7;
            animatronics.chica.aiLevel = 6;
            animatronics.foxy.aiLevel = 4;
            break;
        case 4:
            animatronics.freddy.aiLevel = 4;
            animatronics.bonnie.aiLevel = 9;
            animatronics.chica.aiLevel = 8;
            animatronics.foxy.aiLevel = 6;
            break;
        case 5:
            animatronics.freddy.aiLevel = 6;
            animatronics.bonnie.aiLevel = 12;
            animatronics.chica.aiLevel = 11;
            animatronics.foxy.aiLevel = 8;
            break;
        default: // Night 6+
            animatronics.freddy.aiLevel = 10;
            animatronics.bonnie.aiLevel = 15;
            animatronics.chica.aiLevel = 15;
            animatronics.foxy.aiLevel = 10;
    }
}

// Reset animatronic positions
function resetAnimatronics() {
    animatronics.freddy.position = '1A';
    animatronics.bonnie.position = '1A';
    animatronics.chica.position = '1A';
    animatronics.foxy.position = '3';
    animatronics.foxy.stage = 0;
}

// Start the game
function startGame() {
    initAudio();

    gameState.hour = 0;
    gameState.power = 100;
    gameState.powerUsage = 1;
    gameState.isPlaying = true;
    gameState.cameraOpen = false;
    gameState.leftDoorClosed = false;
    gameState.rightDoorClosed = false;
    gameState.leftLightOn = false;
    gameState.rightLightOn = false;
    gameState.gameOver = false;
    gameState.currentCamera = '1A';
    gameState.officePosition = 'center';

    resetAnimatronics();
    setAILevels();

    // Hide all screens, show game screen
    elements.startScreen.classList.add('hidden');
    elements.gameoverScreen.classList.add('hidden');
    elements.victoryScreen.classList.add('hidden');
    elements.jumpscareScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
    elements.cameraView.classList.add('hidden');
    elements.officeView.classList.remove('hidden');

    // Reset UI
    updateUI();
    updateDoors();
    updateLights();
    updateOfficeView();

    // Start game loops
    startGameLoops();
}

// Start all game loops
function startGameLoops() {
    // Hour progression (each hour = ~90 seconds, full night = ~9 minutes)
    hourInterval = setInterval(() => {
        gameState.hour++;
        updateTimeDisplay();

        if (gameState.hour >= 6) {
            victory();
        }
    }, 90000); // 90 seconds per hour

    // Power drain (slower - designed to last ~9 minutes with base usage)
    powerInterval = setInterval(() => {
        if (gameState.power > 0) {
            gameState.power -= gameState.powerUsage * 0.018;
            if (gameState.power <= 0) {
                gameState.power = 0;
                powerOut();
            }
            updatePowerDisplay();
        }
    }, 100);

    // Animatronic movement
    startAnimatronicAI();

    // Check for attacks
    checkInterval = setInterval(checkForAttacks, 1000);
}

// Start animatronic AI
function startAnimatronicAI() {
    // Bonnie AI
    animatronics.bonnie.moveInterval = setInterval(() => {
        if (Math.random() * 20 < animatronics.bonnie.aiLevel) {
            moveAnimatronic(animatronics.bonnie);
        }
    }, 5000);

    // Chica AI
    animatronics.chica.moveInterval = setInterval(() => {
        if (Math.random() * 20 < animatronics.chica.aiLevel) {
            moveAnimatronic(animatronics.chica);
        }
    }, 5000);

    // Freddy AI (only moves when cameras are down)
    animatronics.freddy.moveInterval = setInterval(() => {
        if (!gameState.cameraOpen && Math.random() * 20 < animatronics.freddy.aiLevel) {
            moveAnimatronic(animatronics.freddy);
        }
    }, 4000);

    // Foxy AI (stage progression)
    animatronics.foxy.moveInterval = setInterval(() => {
        if (gameState.cameraOpen && gameState.currentCamera === '3') {
            // Looking at Pirate Cove resets Foxy
            animatronics.foxy.stage = Math.max(0, animatronics.foxy.stage - 1);
        } else if (Math.random() * 20 < animatronics.foxy.aiLevel) {
            animatronics.foxy.stage++;
            if (animatronics.foxy.stage >= 4) {
                foxyRun();
            }
        }
    }, 6000);
}

// Move animatronic along path
function moveAnimatronic(animatronic) {
    const currentIndex = animatronic.path.indexOf(animatronic.position);
    if (currentIndex < animatronic.path.length - 1) {
        animatronic.position = animatronic.path[currentIndex + 1];
    }

    if (gameState.cameraOpen) {
        updateCameraView();
    }
}

// Foxy runs to the left door
function foxyRun() {
    animatronics.foxy.position = 'LEFT_DOOR';

    // Check if door is closed
    setTimeout(() => {
        if (animatronics.foxy.position === 'LEFT_DOOR') {
            if (gameState.leftDoorClosed) {
                // Foxy bangs on door, drains power
                gameState.power -= 5 * gameState.night;
                playSound('door');
                animatronics.foxy.position = '3';
                animatronics.foxy.stage = 0;
            } else {
                // Foxy attacks!
                jumpscare(animatronics.foxy);
            }
        }
    }, 1500);
}

// Check for attacks from animatronics at doors
function checkForAttacks() {
    // Check left door (Bonnie)
    if (animatronics.bonnie.position === 'LEFT_DOOR') {
        if (!gameState.leftDoorClosed) {
            // Random chance to attack
            if (Math.random() < 0.3) {
                jumpscare(animatronics.bonnie);
            }
        }
    }

    // Check right door (Chica and Freddy)
    if (animatronics.chica.position === 'RIGHT_DOOR') {
        if (!gameState.rightDoorClosed) {
            if (Math.random() < 0.3) {
                jumpscare(animatronics.chica);
            }
        }
    }

    if (animatronics.freddy.position === 'RIGHT_DOOR') {
        if (!gameState.rightDoorClosed) {
            if (Math.random() < 0.3 + (animatronics.freddy.aiLevel * 0.02)) {
                jumpscare(animatronics.freddy);
            }
        }
    }

    // Update door animatronic displays
    updateDoorAnimatronics();
}

// Update animatronic displays at doors
function updateDoorAnimatronics() {
    // Left door
    let leftVisible = false;
    if (gameState.leftLightOn) {
        if (animatronics.bonnie.position === 'LEFT_DOOR') {
            elements.leftAnimatronic.textContent = animatronics.bonnie.emoji;
            leftVisible = true;
        } else if (animatronics.foxy.position === 'LEFT_DOOR') {
            elements.leftAnimatronic.textContent = animatronics.foxy.emoji;
            leftVisible = true;
        }
    }
    elements.leftAnimatronic.classList.toggle('hidden', !leftVisible);

    // Right door
    let rightVisible = false;
    if (gameState.rightLightOn) {
        if (animatronics.chica.position === 'RIGHT_DOOR') {
            elements.rightAnimatronic.textContent = animatronics.chica.emoji;
            rightVisible = true;
        } else if (animatronics.freddy.position === 'RIGHT_DOOR') {
            elements.rightAnimatronic.textContent = animatronics.freddy.emoji;
            rightVisible = true;
        }
    }
    elements.rightAnimatronic.classList.toggle('hidden', !rightVisible);
}

// Jump scare!
function jumpscare(animatronic) {
    if (gameState.gameOver) return;

    gameState.gameOver = true;
    gameState.isPlaying = false;

    playSound('jumpscare');

    elements.jumpscareAnimatronic.textContent = animatronic.emoji;
    elements.gameScreen.classList.add('hidden');
    elements.jumpscareScreen.classList.remove('hidden');

    stopGameLoops();

    // Show game over after jump scare
    setTimeout(() => {
        elements.jumpscareScreen.classList.add('hidden');
        elements.gameoverScreen.classList.remove('hidden');
        document.getElementById('gameover-message').textContent =
            `${animatronic.name} heeft je gepakt! 💀`;
    }, 1500);
}

// Power out sequence
function powerOut() {
    playSound('powerout');

    // Close doors don't work, lights don't work
    gameState.leftDoorClosed = false;
    gameState.rightDoorClosed = false;
    gameState.leftLightOn = false;
    gameState.rightLightOn = false;

    updateDoors();
    updateLights();

    elements.officeView.classList.add('power-out');

    // Freddy comes after a delay
    setTimeout(() => {
        if (gameState.isPlaying && gameState.power <= 0) {
            jumpscare(animatronics.freddy);
        }
    }, Math.random() * 10000 + 5000);
}

// Victory!
function victory() {
    gameState.isPlaying = false;

    playSound('victory');
    stopGameLoops();

    elements.gameScreen.classList.add('hidden');
    elements.victoryScreen.classList.remove('hidden');
}

// Stop all game loops
function stopGameLoops() {
    clearInterval(hourInterval);
    clearInterval(powerInterval);
    clearInterval(checkInterval);

    Object.values(animatronics).forEach(a => {
        if (a.moveInterval) {
            clearInterval(a.moveInterval);
        }
    });
}

// Toggle camera
function toggleCamera() {
    gameState.cameraOpen = !gameState.cameraOpen;

    playSound('camera');

    if (gameState.cameraOpen) {
        elements.officeView.classList.add('hidden');
        elements.cameraView.classList.remove('hidden');
        elements.cameraToggle.classList.add('active');
        updateCameraView();
    } else {
        elements.cameraView.classList.add('hidden');
        elements.officeView.classList.remove('hidden');
        elements.cameraToggle.classList.remove('active');
    }

    updatePowerUsage();
}

// Switch camera
function switchCamera(camId) {
    gameState.currentCamera = camId;

    // Update button states
    camBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cam === camId);
    });

    updateCameraView();
}

// Update camera view
function updateCameraView() {
    const cam = cameras[gameState.currentCamera];
    elements.cameraName.textContent = `📹 CAM ${gameState.currentCamera} - ${cam.name.toUpperCase()}`;

    // Zoek animatronics bij deze camera
    let display = '';
    Object.values(animatronics).forEach(a => {
        if (a.position === gameState.currentCamera) {
            display += a.emoji;
        }
    });

    // Speciale weergave voor Foxy bij Piraten Hoek
    if (gameState.currentCamera === '3') {
        if (animatronics.foxy.stage === 0) {
            display = '🏴‍☠️ (achter gordijn)';
        } else if (animatronics.foxy.stage === 1) {
            display = '🦊 (gluurt...)';
        } else if (animatronics.foxy.stage === 2) {
            display = '🦊 (buiten de hoek!)';
        } else if (animatronics.foxy.stage >= 3) {
            display = '⚠️ LEEG! HIJ RENT!';
        }
    }

    elements.animatronicDisplay.textContent = display || '(leeg) 👻';
}

// Toggle doors
function toggleLeftDoor() {
    if (gameState.power <= 0) return;

    gameState.leftDoorClosed = !gameState.leftDoorClosed;
    playSound('door');
    updateDoors();
    updatePowerUsage();
}

function toggleRightDoor() {
    if (gameState.power <= 0) return;

    gameState.rightDoorClosed = !gameState.rightDoorClosed;
    playSound('door');
    updateDoors();
    updatePowerUsage();
}

// Update door display
function updateDoors() {
    elements.leftDoor.classList.toggle('closed', gameState.leftDoorClosed);
    leftDoorBtn.classList.toggle('active', gameState.leftDoorClosed);

    elements.rightDoor.classList.toggle('closed', gameState.rightDoorClosed);
    rightDoorBtn.classList.toggle('active', gameState.rightDoorClosed);
}

// Toggle lights
function toggleLeftLight() {
    if (gameState.power <= 0) return;

    gameState.leftLightOn = !gameState.leftLightOn;
    updateLights();
    updatePowerUsage();
    updateDoorAnimatronics();
}

function toggleRightLight() {
    if (gameState.power <= 0) return;

    gameState.rightLightOn = !gameState.rightLightOn;
    updateLights();
    updatePowerUsage();
    updateDoorAnimatronics();
}

// Update light display
function updateLights() {
    elements.leftWindow.classList.toggle('lit', gameState.leftLightOn);
    leftLightBtn.classList.toggle('active', gameState.leftLightOn);

    elements.rightWindow.classList.toggle('lit', gameState.rightLightOn);
    rightLightBtn.classList.toggle('active', gameState.rightLightOn);
}

// Update power usage
function updatePowerUsage() {
    let usage = 1;

    if (gameState.leftDoorClosed) usage++;
    if (gameState.rightDoorClosed) usage++;
    if (gameState.leftLightOn) usage++;
    if (gameState.rightLightOn) usage++;
    if (gameState.cameraOpen) usage++;

    gameState.powerUsage = usage;
    elements.usageBars.textContent = '|'.repeat(usage);
}

// Update UI
function updateUI() {
    updateTimeDisplay();
    updatePowerDisplay();
    elements.nightDisplay.textContent = `🌙 Nacht ${gameState.night}`;
}

// Update time display - Nederlandse tijdweergave (00:00 - 06:00)
function updateTimeDisplay() {
    const timeStr = `0${gameState.hour}:00`.slice(-5);
    elements.timeDisplay.textContent = timeStr === '00:00' ? '00:00 🌙' : timeStr;
}

// Update power display
function updatePowerDisplay() {
    const power = Math.ceil(gameState.power);
    elements.powerValue.textContent = power;
    elements.powerFill.style.width = `${power}%`;

    // Change color based on power level
    if (power > 50) {
        elements.powerFill.style.background = '#00ff00';
    } else if (power > 25) {
        elements.powerFill.style.background = '#ffcc00';
    } else {
        elements.powerFill.style.background = '#ff3333';
    }
}

// Next night
function nextNight() {
    gameState.night++;
    startGame();
}

// Office panning - look left, center, or right
function lookLeft() {
    if (gameState.cameraOpen || !gameState.isPlaying) return;
    gameState.officePosition = 'left';
    updateOfficeView();
}

function lookRight() {
    if (gameState.cameraOpen || !gameState.isPlaying) return;
    gameState.officePosition = 'right';
    updateOfficeView();
}

function lookCenter() {
    if (gameState.cameraOpen || !gameState.isPlaying) return;
    gameState.officePosition = 'center';
    updateOfficeView();
}

function updateOfficeView() {
    // Remove all position classes
    elements.officeBg.classList.remove('look-left', 'look-center', 'look-right');
    elements.officeBg.classList.add(`look-${gameState.officePosition}`);
}

// Event Listeners
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);
nextNightBtn.addEventListener('click', nextNight);
elements.cameraToggle.addEventListener('click', toggleCamera);
leftDoorBtn.addEventListener('click', toggleLeftDoor);
rightDoorBtn.addEventListener('click', toggleRightDoor);
leftLightBtn.addEventListener('click', toggleLeftLight);
rightLightBtn.addEventListener('click', toggleRightLight);

camBtns.forEach(btn => {
    btn.addEventListener('click', () => switchCamera(btn.dataset.cam));
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!gameState.isPlaying) return;

    switch(e.key.toLowerCase()) {
        case ' ':
            toggleCamera();
            break;
        case 'a':
        case 'arrowleft':
            // Look left in office, or switch cameras if camera is open
            if (!gameState.cameraOpen) {
                lookLeft();
            }
            break;
        case 'd':
        case 'arrowright':
            // Look right in office
            if (!gameState.cameraOpen) {
                lookRight();
            }
            break;
        case 'w':
        case 'arrowup':
            // Look center
            if (!gameState.cameraOpen) {
                lookCenter();
            }
            break;
        case 's':
        case 'arrowdown':
            // Look center
            if (!gameState.cameraOpen) {
                lookCenter();
            }
            break;
        case 'q':
            // Toggle left door (when looking left)
            if (gameState.officePosition === 'left') {
                toggleLeftDoor();
            }
            break;
        case 'e':
            // Toggle right door (when looking right)
            if (gameState.officePosition === 'right') {
                toggleRightDoor();
            }
            break;
        case 'f':
            // Toggle light for current view
            if (gameState.officePosition === 'left') {
                toggleLeftLight();
            } else if (gameState.officePosition === 'right') {
                toggleRightLight();
            }
            break;
        case '1':
            if (gameState.cameraOpen) switchCamera('1A');
            break;
        case '2':
            if (gameState.cameraOpen) switchCamera('1B');
            break;
        case '3':
            if (gameState.cameraOpen) switchCamera('2A');
            break;
        case '4':
            if (gameState.cameraOpen) switchCamera('2B');
            break;
        case '5':
            if (gameState.cameraOpen) switchCamera('3');
            break;
        case '6':
            if (gameState.cameraOpen) switchCamera('4A');
            break;
        case '7':
            if (gameState.cameraOpen) switchCamera('4B');
            break;
    }
});

// Initialize first camera button as active
document.querySelector('.cam-btn[data-cam="1A"]').classList.add('active');

// ==========================================
// FREE ROAM MODE
// ==========================================

const freeRoamState = {
    active: false,
    is3DMode: false, // Flag to distinguish between 2D and 3D modes
    currentLocation: 'stage'
};

// Locatie data met verbindingen en visuele scènes (Nederlands)
const locations = {
    stage: {
        name: 'Hoofdpodium',
        emoji: '🎭',
        scene: `
     🎭 HOOFDPODIUM 🎭
    ═══════════════════
    ┌─────────────────┐
    │  🎵 ♪ ♫ 🎵 ♪   │
    │                 │
    │  🐻  🐰  🐤    │
    │  ╱│╲ ╱│╲ ╱│╲   │
    │  │   │   │     │
    │ ═══════════════│
    │   🎤  🎸  🎹   │
    └─────────────────┘
      🎪 🎈 🎉 🎈 🎪
        `,
        animatronics: ['🐻 Freddy', '🐰 Bonnie', '🐤 Chica'],
        connections: ['dining'],
        color: '#4a1a4a'
    },
    dining: {
        name: 'Eetzaal',
        emoji: '🍕',
        scene: `
      🍕 EETZAAL 🍕
    ═══════════════════
    🎈          🎈
    ┌───┐ ┌───┐ ┌───┐
    │🍕 │ │🎂 │ │🍕 │
    └─┬─┘ └─┬─┘ └─┬─┘
      │     │     │
    ┌───┐ ┌───┐ ┌───┐
    │🪑 │ │🪑 │ │🪑 │
    └───┘ └───┘ └───┘
    🎉 Feesthoedjes 🎉
        `,
        animatronics: [],
        connections: ['stage', 'westHall', 'eastHall', 'pirateCove'],
        color: '#3a2a1a'
    },
    westHall: {
        name: 'West Gang',
        emoji: '🚪',
        scene: `
      🚪 WEST GANG 🚪
    ═══════════════════
    │ 🖼️  🖼️  🖼️ │
    │              │
    │    ░░░░░░    │
    │    ░    ░    │
    │    ░ 👣 ░    │
    │    ░    ░    │
    │    ░░░░░░    │
    │              │
    │ 💡........💡 │
    ← Kantoor    Eetzaal →
        `,
        animatronics: [],
        connections: ['dining', 'westCorner', 'supplyCloset'],
        color: '#1a2a3a'
    },
    westCorner: {
        name: 'West Hoek',
        emoji: '📸',
        scene: `
      📸 WEST HOEK 📸
    ═══════════════════
         [📹]
           │
    ┌──────┴──────┐
    │             │
    │   ╔═══╗    │
    │   ║🚪 ║    │
    │   ╚═══╝    │
    │  KANTOOR   │
    │    ←       │
    └─────────────┘
      💡 flikkert...
        `,
        animatronics: [],
        connections: ['westHall', 'office'],
        color: '#1a1a2a'
    },
    eastHall: {
        name: 'Oost Gang',
        emoji: '🚪',
        scene: `
      🚪 OOST GANG 🚪
    ═══════════════════
    │ 🎪  🎪  🎪 │
    │ VIER FEEST!│
    │    ░░░░░░    │
    │    ░    ░    │
    │    ░    ░    │
    │    ░    ░    │
    │    ░░░░░░    │
    │              │
    │ 💡........💡 │
    ← Eetzaal   Kantoor →
        `,
        animatronics: [],
        connections: ['dining', 'eastCorner', 'restrooms'],
        color: '#1a3a2a'
    },
    eastCorner: {
        name: 'Oost Hoek',
        emoji: '📸',
        scene: `
      📸 OOST HOEK 📸
    ═══════════════════
         [📹]
           │
    ┌──────┴──────┐
    │   "HOU     │
    │    VOL!"   │
    │   ╔═══╗    │
    │   ║🚪 ║    │
    │   ╚═══╝    │
    │  KANTOOR → │
    └─────────────┘
       😰 ...
        `,
        animatronics: [],
        connections: ['eastHall', 'office'],
        color: '#2a1a2a'
    },
    pirateCove: {
        name: 'Piraten Hoek',
        emoji: '🏴‍☠️',
        scene: `
    🏴‍☠️ PIRATEN HOEK 🏴‍☠️
    ═══════════════════
    ┌─────────────────┐
    │ ★  ★  ★  ★  ★  │
    │╔═══════════════╗│
    │║   BUITEN     ║│
    │║   GEBRUIK    ║│
    │║     🦊?      ║│
    │║   ~~~~~~     ║│
    │╚═══════════════╝│
    └─────────────────┘
      ⚓ 🗡️ ☠️ 🗡️ ⚓
        `,
        animatronics: ['🦊 Foxy (achter gordijn)'],
        connections: ['dining'],
        color: '#4a1a2a'
    },
    office: {
        name: 'Beveiligingskantoor',
        emoji: '🖥️',
        scene: `
    🖥️ BEVEILIGINGSKANTOOR 🖥️
    ═══════════════════════
    🚪│   ┌─────────┐   │🚪
      │   │📺 📺 📺│   │
      │   │ ☕ 📋  │   │
      │   │   🌀   │   │
      │   │  (fan) │   │
      │   └────────┘   │
      │                │
    ──┴────────────────┴──
     🔒 VEILIG... toch? 🔒
        `,
        animatronics: [],
        connections: ['westCorner', 'eastCorner'],
        color: '#2a2a3a'
    },
    supplyCloset: {
        name: 'Voorraadkast',
        emoji: '🧹',
        scene: `
      🧹 VOORRAADKAST 🧹
    ═══════════════════
    ┌─────────────────┐
    │ 🧴 🧹 🪣 🧽  │
    │                 │
    │  ┌───┐         │
    │  │🤖 │  ???    │
    │  │💀 │         │
    │  └───┘         │
    │                 │
    │ 🔧 ⚙️ 🔩      │
    └─────────────────┘
        `,
        animatronics: ['🤖 Reserve Endoskelet'],
        connections: ['westHall'],
        color: '#1a1a1a'
    },
    restrooms: {
        name: 'Toiletten',
        emoji: '🚻',
        scene: `
      🚻 TOILETTEN 🚻
    ═══════════════════
    💡~~~~~💡~~~~~💡
    │ 🚹  │  🚺 │
    │     │     │
    │ ┌─┐ │ ┌─┐ │
    │ │ │ │ │ │ │
    │ └─┘ │ └─┘ │
    │     │     │
    ══════╧══════
       💧 drip...
        `,
        animatronics: [],
        connections: ['eastHall'],
        color: '#2a3a3a'
    },
    kitchen: {
        name: 'Keuken',
        emoji: '🍳',
        scene: `
      🍳 KEUKEN 🍳
    ═══════════════════
    ╔═════════════════╗
    ║  ██████████████ ║
    ║  █ CAMERA UIT █ ║
    ║  ██████████████ ║
    ║                 ║
    ║   🔊 *KLANG*   ║
    ║   🔊 *BONK*    ║
    ║   🔊 *...???*  ║
    ║                 ║
    ╚═════════════════╝
        `,
        animatronics: ['❓ Onbekende geluiden'],
        connections: ['dining'],
        color: '#3a3a1a'
    },
    backstage: {
        name: 'Backstage',
        emoji: '🎪',
        scene: `
      🎪 BACKSTAGE 🎪
    ═══════════════════
    ┌─────────────────┐
    │ 👤  👤  👤  👤 │
    │ (lege pakken)  │
    │                 │
    │ ┌───┬───┬───┐  │
    │ │🗣️ │🗣️ │🗣️ │  │
    │ │👁️ │👁️ │👁️ │  │
    │ └───┴───┴───┘  │
    │  (hoofden...)  │
    └─────────────────┘
     👁️ ze kijken... 👁️
        `,
        animatronics: ['👤 Lege Pakken', '🗣️ Reservehoofden'],
        connections: ['stage'],
        color: '#2a1a3a'
    }
};

// Add kitchen connection to dining
locations.dining.connections.push('kitchen', 'backstage');
// Add backstage connection to stage
locations.stage.connections.push('backstage');

// Free Roam DOM Elements
const freeRoamElements = {
    screen: document.getElementById('freeroam-screen'),
    locationName: document.getElementById('location-name'),
    locationDescription: document.getElementById('location-description'),
    locationVisual: document.getElementById('location-visual'),
    locationAnimatronics: document.getElementById('location-animatronics'),
    navButtons: document.getElementById('nav-buttons'),
    exitBtn: document.getElementById('freeroam-exit'),
    walkTransition: document.getElementById('walk-transition'),
    walkText: document.querySelector('.walk-text')
};

const freeRoamBtn = document.getElementById('freeroam-btn');
const freeRoamExit3D = document.getElementById('freeroam-exit-3d');

// Start Free Roam Mode (3D)
function startFreeRoam() {
    freeRoamState.active = true;
    freeRoamState.is3DMode = true;
    freeRoamState.currentLocation = 'stage';

    elements.startScreen.classList.add('hidden');
    freeRoamElements.screen.classList.remove('hidden');

    // Start 3D mode
    if (typeof startFreeRoam3D === 'function') {
        startFreeRoam3D();
    }
}

// Exit Free Roam Mode
function exitFreeRoam() {
    freeRoamState.active = false;
    freeRoamState.is3DMode = false;
    freeRoamElements.screen.classList.add('hidden');
    elements.startScreen.classList.remove('hidden');

    // Stop 3D mode
    if (typeof stopFreeRoam3D === 'function') {
        stopFreeRoam3D();
    }
    if (typeof stopSurvivalMode3D === 'function') {
        stopSurvivalMode3D();
    }
}

// Move to a location with walking animation
let isWalking = false;

function moveToLocation(locationId) {
    if (!locations[locationId] || isWalking) return;

    // Skip 2D navigation in 3D mode
    if (freeRoamState.is3DMode) return;

    const targetLocation = locations[locationId];
    isWalking = true;

    // Reset animations by removing and re-adding elements
    const walkDoor = document.querySelector('.walk-door');
    const walkChar = document.querySelector('.walk-character');

    // Check if 2D elements exist
    if (!walkDoor || !walkChar || !freeRoamElements.walkTransition) {
        isWalking = false;
        return;
    }

    // Force animation restart
    walkDoor.style.animation = 'none';
    walkChar.style.animation = 'none';
    void walkDoor.offsetWidth; // Trigger reflow
    void walkChar.offsetWidth;
    walkDoor.style.animation = '';
    walkChar.style.animation = '';

    // Show walking transition
    if (freeRoamElements.walkText) {
        freeRoamElements.walkText.textContent = `Lopen naar ${targetLocation.emoji} ${targetLocation.name}...`;
    }
    freeRoamElements.walkTransition.classList.remove('hidden');

    // Play footstep sound
    playSound('door');

    // After animation completes, change location
    setTimeout(() => {
        freeRoamState.currentLocation = locationId;
        updateFreeRoamView();

        // Hide transition with fade
        freeRoamElements.walkTransition.style.animation = 'fadeOut 0.3s ease-out forwards';

        setTimeout(() => {
            freeRoamElements.walkTransition.classList.add('hidden');
            freeRoamElements.walkTransition.style.animation = '';
            isWalking = false;
        }, 300);

    }, 1500); // Match the walk animation duration
}

// Update the free roam view (2D mode only)
function updateFreeRoamView() {
    // Skip if in 3D mode or elements don't exist
    if (freeRoamState.is3DMode) return;
    if (!freeRoamElements.locationName || !freeRoamElements.locationVisual) return;

    const loc = locations[freeRoamState.currentLocation];

    // Update location info
    freeRoamElements.locationName.textContent = `${loc.emoji} ${loc.name}`;

    // Update visual met ASCII scene
    freeRoamElements.locationVisual.innerHTML = `<pre class="location-scene">${loc.scene}</pre>`;
    freeRoamElements.locationVisual.style.background = `radial-gradient(ellipse at center, ${loc.color} 0%, #000 100%)`;

    // Hide description, scene is now the visual
    if (freeRoamElements.locationDescription) {
        freeRoamElements.locationDescription.textContent = '';
    }

    // Update aanwezige animatronics
    if (freeRoamElements.locationAnimatronics) {
        if (loc.animatronics.length > 0) {
            freeRoamElements.locationAnimatronics.innerHTML =
                '<p class="animatronics-label">⚠️ Hier aanwezig:</p>' +
                loc.animatronics.map(a => `<span class="animatronic-tag">${a}</span>`).join('');
        } else {
            freeRoamElements.locationAnimatronics.innerHTML = '<p class="empty-room">De ruimte lijkt leeg... 👻</p>';
        }
    }

    // Update navigation buttons
    if (freeRoamElements.navButtons) {
        freeRoamElements.navButtons.innerHTML = '';
        loc.connections.forEach(connId => {
            const connLoc = locations[connId];
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.textContent = `${connLoc.emoji} ${connLoc.name}`;
            btn.onclick = () => moveToLocation(connId);
            freeRoamElements.navButtons.appendChild(btn);
        });
    }
}

// Free Roam Event Listeners
freeRoamBtn.addEventListener('click', startFreeRoam);

// 2D Free Roam exit button (if it exists)
if (freeRoamElements.exitBtn) {
    freeRoamElements.exitBtn.addEventListener('click', exitFreeRoam);
}

// 3D Free Roam exit button
if (freeRoamExit3D) {
    freeRoamExit3D.addEventListener('click', exitFreeRoam);
}

// ==========================================
// SURVIVAL MODE
// ==========================================

const survivalBtn = document.getElementById('survival-btn');

function startSurvival() {
    freeRoamState.active = true;
    freeRoamState.is3DMode = true;
    freeRoamState.currentLocation = 'stage';

    elements.startScreen.classList.add('hidden');
    freeRoamElements.screen.classList.remove('hidden');

    // Start 3D survival mode
    if (typeof startSurvivalMode3D === 'function') {
        startSurvivalMode3D(1); // difficulty 1
    } else {
        console.error('startSurvivalMode3D not found!');
    }
}

if (survivalBtn) {
    survivalBtn.addEventListener('click', startSurvival);
}

// Keyboard navigation for free roam (only for 2D mode, 3D has its own handlers)
document.addEventListener('keydown', (e) => {
    if (!freeRoamState.active) return;

    // In 3D mode, only handle escape - 3D movement is in freeroam3d.js
    if (freeRoamState.is3DMode) {
        if (e.key.toLowerCase() === 'escape') {
            exitFreeRoam();
        }
        return; // Let 3D engine handle other keys
    }

    // 2D mode navigation (legacy)
    const loc = locations[freeRoamState.currentLocation];
    const connections = loc.connections;

    switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            if (connections[0]) moveToLocation(connections[0]);
            break;
        case 's':
        case 'arrowdown':
            if (connections[1]) moveToLocation(connections[1]);
            break;
        case 'a':
        case 'arrowleft':
            if (connections[2]) moveToLocation(connections[2]);
            break;
        case 'd':
        case 'arrowright':
            if (connections[3]) moveToLocation(connections[3]);
            break;
        case 'escape':
            exitFreeRoam();
            break;
    }
});

// ==========================================
// MULTIPLAYER SYSTEM
// ==========================================

const multiplayerState = {
    mode: null, // 'coop', 'versus', 'online'
    role: null, // 'guard', 'animatronic'
    peer: null,
    connection: null,
    myId: null,
    moveCooldown: 0
};

// Multiplayer DOM Elements
const mpElements = {
    screen: document.getElementById('multiplayer-screen'),
    lobbyScreen: document.getElementById('online-lobby-screen'),
    versusHud: document.getElementById('versus-hud'),
    coopHud: document.getElementById('coop-hud'),
    lobbyCode: document.getElementById('my-lobby-code'),
    joinInput: document.getElementById('join-code-input'),
    connectionStatus: document.getElementById('connection-status'),
    roleSelect: document.getElementById('online-role-select'),
    cooldownDisplay: document.getElementById('move-cooldown')
};

// Multiplayer Buttons
const mpBtn = document.getElementById('multiplayer-btn');
const mpBackBtn = document.getElementById('mp-back-btn');
const lobbyBackBtn = document.getElementById('lobby-back-btn');
const startCoopBtn = document.getElementById('start-coop');
const startVersusBtn = document.getElementById('start-versus');
const startOnlineBtn = document.getElementById('start-online');
const copyCodeBtn = document.getElementById('copy-code-btn');
const joinLobbyBtn = document.getElementById('join-lobby-btn');
const roleGuardBtn = document.getElementById('role-guard');
const roleAnimBtn = document.getElementById('role-animatronic');
const animBtns = document.querySelectorAll('.anim-btn');

// Generate random lobby code
function generateLobbyCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Show Multiplayer Menu
function showMultiplayerMenu() {
    elements.startScreen.classList.add('hidden');
    mpElements.screen.classList.remove('hidden');
}

// Hide Multiplayer Menu
function hideMultiplayerMenu() {
    mpElements.screen.classList.add('hidden');
    elements.startScreen.classList.remove('hidden');
}

// ==========================================
// LOCAL CO-OP MODE
// ==========================================

function startCoopMode() {
    multiplayerState.mode = 'coop';
    mpElements.screen.classList.add('hidden');
    mpElements.coopHud.classList.remove('hidden');
    startGame();
}

// Co-op keyboard controls (separate controls for each player)
function handleCoopControls(e) {
    if (!gameState.isPlaying || multiplayerState.mode !== 'coop') return;

    const key = e.key.toLowerCase();

    // Speler 1: Linker kant (WASD + Q/F)
    if (key === 'q') {
        toggleLeftDoor();
    } else if (key === 'f' && gameState.officePosition === 'left') {
        toggleLeftLight();
    } else if (key === 'w' || key === 'a' || key === 's') {
        gameState.officePosition = 'left';
        updateOfficeView();
    }

    // Speler 2: Rechter kant (Pijltjes + [ / ] / \)
    if (key === '[' || key === 'bracketleft') {
        toggleRightDoor();
    } else if (key === '\\' || key === 'backslash') {
        toggleRightLight();
    } else if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') {
        gameState.officePosition = 'right';
        updateOfficeView();
    }

    // Beide spelers kunnen camera's gebruiken
    if (key === ' ') {
        toggleCamera();
    }
}

// ==========================================
// VERSUS MODE (Guard vs Animatronics)
// ==========================================

function startVersusMode() {
    multiplayerState.mode = 'versus';
    multiplayerState.role = 'guard'; // Default, can switch
    mpElements.screen.classList.add('hidden');
    mpElements.versusHud.classList.remove('hidden');
    startGame();

    // Start cooldown timer
    startMoveCooldownTimer();
}

let cooldownInterval;

function startMoveCooldownTimer() {
    cooldownInterval = setInterval(() => {
        if (multiplayerState.moveCooldown > 0) {
            multiplayerState.moveCooldown--;
            mpElements.cooldownDisplay.textContent = `${multiplayerState.moveCooldown}s`;

            // Enable buttons when cooldown ends
            if (multiplayerState.moveCooldown === 0) {
                mpElements.cooldownDisplay.textContent = 'Klaar!';
                animBtns.forEach(btn => btn.disabled = false);
            }
        }
    }, 1000);
}

function forceAnimatronicMove(animName) {
    if (multiplayerState.moveCooldown > 0) return;

    const anim = animatronics[animName];
    if (!anim) return;

    if (animName === 'foxy') {
        // Foxy special: sprint direct naar de deur
        animatronics.foxy.stage = 4;
        foxyRun();
        multiplayerState.moveCooldown = 15; // Langere cooldown voor Foxy
    } else {
        // Andere animatronics: forceer beweging
        moveAnimatronic(anim);
        multiplayerState.moveCooldown = 5;
    }

    // Disable buttons
    animBtns.forEach(btn => btn.disabled = true);
    mpElements.cooldownDisplay.textContent = `${multiplayerState.moveCooldown}s`;

    playSound('door');
}

// ==========================================
// ONLINE MULTIPLAYER (PeerJS)
// ==========================================

function showOnlineLobby() {
    mpElements.screen.classList.add('hidden');
    mpElements.lobbyScreen.classList.remove('hidden');

    // Initialize PeerJS
    initializePeer();
}

function hideOnlineLobby() {
    mpElements.lobbyScreen.classList.add('hidden');
    mpElements.screen.classList.remove('hidden');

    // Cleanup peer connection
    if (multiplayerState.peer) {
        multiplayerState.peer.destroy();
        multiplayerState.peer = null;
    }
}

function initializePeer() {
    // Cleanup existing peer first
    if (multiplayerState.peer) {
        multiplayerState.peer.destroy();
        multiplayerState.peer = null;
    }

    const myCode = generateLobbyCode();
    mpElements.lobbyCode.textContent = myCode;
    setConnectionStatus('Peer initialiseren...', 'connecting');

    try {
        // Check if PeerJS is available
        if (typeof Peer === 'undefined') {
            setConnectionStatus('PeerJS bibliotheek niet geladen! Probeer de pagina te verversen.', 'error');
            console.error('PeerJS not loaded');
            return;
        }

        console.log('Initializing PeerJS with code:', myCode);
        multiplayerState.peer = new Peer(myCode, {
            debug: 2, // Show warnings and errors
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });

        multiplayerState.peer.on('open', (id) => {
            multiplayerState.myId = id;
            mpElements.lobbyCode.textContent = id;
            setConnectionStatus('✅ Klaar! Wachten op verbinding...', 'connecting');
        });

        multiplayerState.peer.on('connection', (conn) => {
            handleConnection(conn);
        });

        multiplayerState.peer.on('error', (err) => {
            console.error('Peer error:', err);
            if (err.type === 'unavailable-id') {
                // ID already taken, generate new one
                setConnectionStatus('Code al in gebruik, nieuwe genereren...', 'connecting');
                setTimeout(() => initializePeer(), 1000);
            } else if (err.type === 'peer-unavailable') {
                setConnectionStatus('Speler niet gevonden! Check de code.', 'error');
            } else if (err.type === 'network') {
                setConnectionStatus('Netwerkfout - check je internet', 'error');
            } else {
                setConnectionStatus('Fout: ' + err.type, 'error');
            }
        });

        multiplayerState.peer.on('disconnected', () => {
            setConnectionStatus('Verbinding verbroken, opnieuw verbinden...', 'connecting');
            multiplayerState.peer.reconnect();
        });

    } catch (e) {
        console.error('Peer init error:', e);
        setConnectionStatus('PeerJS niet beschikbaar: ' + e.message, 'error');
    }
}

function joinLobby() {
    const code = mpElements.joinInput.value.toUpperCase().trim();
    if (!code || code.length < 4) {
        setConnectionStatus('Voer een geldige code in!', 'error');
        return;
    }

    // Check if our peer is ready
    if (!multiplayerState.peer || !multiplayerState.peer.open) {
        setConnectionStatus('Even wachten, peer nog niet klaar...', 'connecting');
        setTimeout(() => joinLobby(), 500);
        return;
    }

    // Don't connect to yourself
    if (code === multiplayerState.myId) {
        setConnectionStatus('Je kunt niet met jezelf verbinden!', 'error');
        return;
    }

    setConnectionStatus('Verbinden met ' + code + '...', 'connecting');

    try {
        const conn = multiplayerState.peer.connect(code, {
            reliable: true
        });

        if (conn) {
            handleConnection(conn);
        } else {
            setConnectionStatus('Kon geen verbinding maken', 'error');
        }
    } catch (e) {
        console.error('Connect error:', e);
        setConnectionStatus('Verbindingsfout: ' + e.message, 'error');
    }
}

function handleConnection(conn) {
    multiplayerState.connection = conn;

    // Connection timeout
    const connectionTimeout = setTimeout(() => {
        if (!conn.open) {
            setConnectionStatus('Verbinding timeout - probeer opnieuw', 'error');
        }
    }, 10000);

    conn.on('open', () => {
        clearTimeout(connectionTimeout);
        setConnectionStatus('🎮 Verbonden met ' + conn.peer + '!', 'connected');
        mpElements.roleSelect.classList.remove('hidden');

        // Send a ping to confirm connection
        conn.send({ type: 'ping' });
    });

    conn.on('data', (data) => {
        // Handle ping/pong for connection test
        if (data.type === 'ping') {
            conn.send({ type: 'pong' });
            return;
        }
        if (data.type === 'pong') {
            console.log('Connection confirmed!');
            return;
        }
        handleNetworkData(data);
    });

    conn.on('close', () => {
        clearTimeout(connectionTimeout);
        setConnectionStatus('Verbinding verbroken', 'error');
        mpElements.roleSelect.classList.add('hidden');
        multiplayerState.connection = null;
    });

    conn.on('error', (err) => {
        clearTimeout(connectionTimeout);
        console.error('Connection error:', err);
        setConnectionStatus('Verbindingsfout: ' + err, 'error');
    });
}

function setConnectionStatus(message, type) {
    mpElements.connectionStatus.textContent = message;
    mpElements.connectionStatus.className = 'connection-status ' + type;
}

function sendNetworkData(data) {
    if (multiplayerState.connection && multiplayerState.connection.open) {
        multiplayerState.connection.send(data);
    }
}

function handleNetworkData(data) {
    switch (data.type) {
        case 'role':
            // Andere speler heeft een rol gekozen
            if (data.role === 'guard') {
                multiplayerState.role = 'animatronic';
            } else {
                multiplayerState.role = 'guard';
            }
            startOnlineGame();
            break;

        case 'gameState':
            // Synchroniseer game state
            if (data.power !== undefined) gameState.power = data.power;
            if (data.hour !== undefined) gameState.hour = data.hour;
            if (data.leftDoor !== undefined) {
                gameState.leftDoorClosed = data.leftDoor;
                updateDoors();
            }
            if (data.rightDoor !== undefined) {
                gameState.rightDoorClosed = data.rightDoor;
                updateDoors();
            }
            break;

        case 'animatronicMove':
            // Andere speler laat animatronic bewegen
            if (data.animatronic === 'foxy') {
                animatronics.foxy.stage = 4;
                foxyRun();
            } else if (animatronics[data.animatronic]) {
                moveAnimatronic(animatronics[data.animatronic]);
            }
            break;

        case 'jumpscare':
            jumpscare(animatronics[data.animatronic]);
            break;

        case 'victory':
            victory();
            break;
    }
}

function startOnlineGame() {
    multiplayerState.mode = 'online';
    mpElements.lobbyScreen.classList.add('hidden');

    if (multiplayerState.role === 'guard') {
        startGame();
    } else {
        // Animatronic player
        mpElements.versusHud.classList.remove('hidden');
        elements.gameScreen.classList.remove('hidden');
        startMoveCooldownTimer();
    }
}

function selectRole(role) {
    multiplayerState.role = role;
    sendNetworkData({ type: 'role', role: role });
    startOnlineGame();
}

function copyLobbyCode() {
    const code = mpElements.lobbyCode.textContent;
    navigator.clipboard.writeText(code).then(() => {
        copyCodeBtn.textContent = '✓ Gekopieerd!';
        setTimeout(() => {
            copyCodeBtn.textContent = '📋 Kopieer Code';
        }, 2000);
    });
}

// ==========================================
// MULTIPLAYER EVENT LISTENERS
// ==========================================

mpBtn.addEventListener('click', showMultiplayerMenu);
mpBackBtn.addEventListener('click', hideMultiplayerMenu);
lobbyBackBtn.addEventListener('click', hideOnlineLobby);
startCoopBtn.addEventListener('click', startCoopMode);
startVersusBtn.addEventListener('click', startVersusMode);
startOnlineBtn.addEventListener('click', showOnlineLobby);
copyCodeBtn.addEventListener('click', copyLobbyCode);
joinLobbyBtn.addEventListener('click', joinLobby);
roleGuardBtn.addEventListener('click', () => selectRole('guard'));
roleAnimBtn.addEventListener('click', () => selectRole('animatronic'));

// Animatronic control buttons
animBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const animName = btn.dataset.anim;
        forceAnimatronicMove(animName);

        // Send to other player in online mode
        if (multiplayerState.mode === 'online') {
            sendNetworkData({ type: 'animatronicMove', animatronic: animName });
        }
    });
});

// Co-op keyboard handler
document.addEventListener('keydown', handleCoopControls);

// Sync game state in online mode
setInterval(() => {
    if (multiplayerState.mode === 'online' && multiplayerState.role === 'guard' && gameState.isPlaying) {
        sendNetworkData({
            type: 'gameState',
            power: gameState.power,
            hour: gameState.hour,
            leftDoor: gameState.leftDoorClosed,
            rightDoor: gameState.rightDoorClosed
        });
    }
}, 1000);

// Cleanup on game end
const originalVictory = victory;
victory = function() {
    originalVictory();
    mpElements.versusHud.classList.add('hidden');
    mpElements.coopHud.classList.add('hidden');
    if (cooldownInterval) clearInterval(cooldownInterval);

    if (multiplayerState.mode === 'online') {
        sendNetworkData({ type: 'victory' });
    }
};

const originalJumpscare = jumpscare;
jumpscare = function(animatronic) {
    originalJumpscare(animatronic);
    mpElements.versusHud.classList.add('hidden');
    mpElements.coopHud.classList.add('hidden');
    if (cooldownInterval) clearInterval(cooldownInterval);

    if (multiplayerState.mode === 'online' && multiplayerState.role === 'guard') {
        sendNetworkData({ type: 'jumpscare', animatronic: animatronic.name });
    }
};

console.log('FNAF Browser Edition + Multiplayer loaded! Druk op Start om te spelen.');

// ==========================================
// FEATURE INTEGRATION - Progress, Achievements, Easy Mode
// ==========================================

// Progress Storage System
const progressStorage = {
    key: 'fnaf_progress',

    getDefault() {
        return {
            highestNightCompleted: 0,
            totalNightsSurvived: 0,
            totalDeaths: 0,
            totalPlaytimeSeconds: 0,
            pizzaSlicesCollected: [],
            photosTaken: 0,
            easyModeEnabled: false,
            achievements: [],
            nightStars: {}, // { night: stars }
            nightScores: {}, // { night: score }
        };
    },

    load() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? { ...this.getDefault(), ...JSON.parse(data) } : this.getDefault();
        } catch (e) {
            console.error('Failed to load progress:', e);
            return this.getDefault();
        }
    },

    save(progress) {
        try {
            localStorage.setItem(this.key, JSON.stringify(progress));
        } catch (e) {
            console.error('Failed to save progress:', e);
        }
    },

    update(updates) {
        const progress = this.load();
        Object.assign(progress, updates);
        this.save(progress);
        return progress;
    }
};

// Game progress state
let playerProgress = progressStorage.load();
let sessionStartTime = null;
let cameraUsedInSession = false;

// Easy Mode State
const easyModeState = {
    enabled: false,
    aiMultiplier: 0.6,
    powerDrainMultiplier: 0.7,
    hourDurationMultiplier: 1.2,
    jumpscareEnabled: false
};

// Achievement Definitions
const achievementDefs = [
    { id: 'survive_night_1', name: 'Eerste Nacht', desc: 'Overleef Nacht 1', icon: '🌙', points: 10 },
    { id: 'survive_night_2', name: 'Tweede Nacht', desc: 'Overleef Nacht 2', icon: '🌙', points: 15 },
    { id: 'survive_night_3', name: 'Derde Nacht', desc: 'Overleef Nacht 3', icon: '🌙', points: 20 },
    { id: 'survive_night_4', name: 'Vierde Nacht', desc: 'Overleef Nacht 4', icon: '🌙', points: 30 },
    { id: 'survive_night_5', name: 'Veteraan', desc: 'Overleef Nacht 5', icon: '⭐', points: 50 },
    { id: 'survive_night_6', name: 'Nachtmerrie', desc: 'Overleef Nacht 6', icon: '💀', points: 75 },
    { id: 'survive_night_7', name: 'Aangepaste Meester', desc: 'Overleef Nacht 7', icon: '🎮', points: 100 },
    { id: 'power_saver', name: 'Energie Bespaarder', desc: 'Eindig met 50%+ stroom', icon: '🔋', points: 20 },
    { id: 'no_cameras', name: 'Blind Spelen', desc: 'Win zonder camera\'s', icon: '📵', points: 40 },
    { id: 'speed_demon', name: 'Snelheidsduivel', desc: 'Win onder 5 minuten', icon: '⚡', points: 35 },
    { id: 'all_nights', name: 'Meester Bewaker', desc: 'Voltooi alle 5 nachten', icon: '🏆', points: 100 },
];

// UI Element References
const featureElements = {
    easyModeCheckbox: document.getElementById('easy-mode-checkbox'),
    achievementCount: document.getElementById('achievement-count'),
    pizzaCount: document.getElementById('pizza-count'),
    highestNight: document.getElementById('highest-night'),
    achievementsBtn: document.getElementById('achievements-btn'),
    nightSelectBtn: document.getElementById('night-select-btn'),
    achievementsScreen: document.getElementById('achievements-screen'),
    nightSelectScreen: document.getElementById('night-select-screen'),
    achievementGrid: document.getElementById('achievement-grid'),
    nightGrid: document.getElementById('night-grid'),
    victoryStars: document.getElementById('victory-stars'),
    ratingMessage: document.getElementById('rating-message'),
    victoryScore: document.getElementById('victory-score'),
    victoryAchievement: document.getElementById('victory-achievement'),
    menuBtn: document.getElementById('menu-btn'),
    achievementsBack: document.getElementById('achievements-back'),
    nightSelectBack: document.getElementById('night-select-back'),
    achievementNotification: document.getElementById('achievement-notification'),
};

// Calculate Star Rating
function calculateStarRating(finalPower, timeSeconds, nightNum, usedCameras) {
    let stars = 1; // Base star for survival

    // Power efficiency
    if (finalPower >= 50) stars += 2;
    else if (finalPower >= 25) stars += 1;

    // Speed bonus (harder on higher nights, so more lenient time)
    const timeBonus = 420 + (nightNum * 30); // Extra 30s per night
    if (timeSeconds <= timeBonus) stars += 1;

    // No camera bonus
    if (!usedCameras) stars += 1;

    return Math.min(5, stars);
}

// Calculate Score
function calculateScore(night, finalPower, stars, easyMode) {
    let score = night * 1000;
    score += finalPower * 10;
    score += stars * 100;

    // Difficulty multiplier
    score *= (1 + (night - 1) * 0.1);

    // Easy mode penalty
    if (easyMode) score *= 0.5;

    return Math.floor(score);
}

// Show Achievement Notification
function showAchievementNotification(achievement) {
    const notif = featureElements.achievementNotification;
    if (!notif) return;

    notif.querySelector('.achievement-icon').textContent = achievement.icon;
    notif.querySelector('.achievement-name').textContent = achievement.name;
    notif.querySelector('.achievement-points').textContent = `+${achievement.points} punten`;

    notif.classList.remove('hidden');
    notif.classList.add('show');

    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.classList.add('hidden'), 500);
    }, 4000);
}

// Try to unlock achievement
function tryUnlockAchievement(achievementId) {
    if (playerProgress.achievements.includes(achievementId)) return false;

    const achievement = achievementDefs.find(a => a.id === achievementId);
    if (!achievement) return false;

    playerProgress.achievements.push(achievementId);
    progressStorage.save(playerProgress);

    showAchievementNotification(achievement);
    updateProgressDisplay();

    return true;
}

// Update Progress Display
function updateProgressDisplay() {
    if (featureElements.achievementCount) {
        featureElements.achievementCount.textContent = playerProgress.achievements.length;
    }
    if (featureElements.pizzaCount) {
        featureElements.pizzaCount.textContent = playerProgress.pizzaSlicesCollected.length;
    }
    if (featureElements.highestNight) {
        featureElements.highestNight.textContent = Math.max(1, playerProgress.highestNightCompleted);
    }

    // Show night select button if completed at least night 1
    if (featureElements.nightSelectBtn && playerProgress.highestNightCompleted > 0) {
        featureElements.nightSelectBtn.classList.remove('hidden');
    }
}

// Render Achievements Grid
function renderAchievementsGrid() {
    if (!featureElements.achievementGrid) return;

    const totalPoints = playerProgress.achievements.reduce((sum, id) => {
        const ach = achievementDefs.find(a => a.id === id);
        return sum + (ach ? ach.points : 0);
    }, 0);

    document.getElementById('total-points').textContent = totalPoints;
    document.getElementById('unlocked-count').textContent = playerProgress.achievements.length;
    document.getElementById('total-achievements').textContent = achievementDefs.length;

    featureElements.achievementGrid.innerHTML = achievementDefs.map(ach => {
        const unlocked = playerProgress.achievements.includes(ach.id);
        return `
            <div class="achievement-card ${unlocked ? 'unlocked' : ''}">
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-content">
                    <div class="ach-name">${ach.name}</div>
                    <div class="ach-desc">${ach.desc}</div>
                    <div class="ach-points">${ach.points} punten</div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Night Selection Grid
function renderNightGrid() {
    if (!featureElements.nightGrid) return;

    const nights = [
        { num: 1, name: 'Nacht 1' },
        { num: 2, name: 'Nacht 2' },
        { num: 3, name: 'Nacht 3' },
        { num: 4, name: 'Nacht 4' },
        { num: 5, name: 'Nacht 5' },
        { num: 6, name: 'Nacht 6', special: true },
        { num: 7, name: 'Custom', special: true },
    ];

    featureElements.nightGrid.innerHTML = nights.map(n => {
        const unlocked = n.num <= playerProgress.highestNightCompleted + 1;
        const completed = n.num <= playerProgress.highestNightCompleted;
        const stars = playerProgress.nightStars[n.num] || 0;

        return `
            <button class="night-btn ${unlocked ? '' : 'locked'} ${completed ? 'completed' : ''} ${n.special ? 'special' : ''}"
                    data-night="${n.num}" ${unlocked ? '' : 'disabled'}>
                <span class="night-number">${n.num === 7 ? '?' : n.num}</span>
                <span class="night-stars">${completed ? '⭐'.repeat(stars) + '☆'.repeat(5 - stars) : ''}</span>
            </button>
        `;
    }).join('');

    // Add click handlers
    featureElements.nightGrid.querySelectorAll('.night-btn:not(.locked)').forEach(btn => {
        btn.addEventListener('click', () => {
            const night = parseInt(btn.dataset.night);
            if (night === 7) {
                // Show custom night controls
                document.getElementById('custom-night-container').classList.remove('hidden');
            } else {
                gameState.night = night;
                featureElements.nightSelectScreen.classList.add('hidden');
                elements.startScreen.classList.remove('hidden');
            }
        });
    });
}

// Apply Easy Mode
function applyEasyMode() {
    if (!easyModeState.enabled) return;

    // Reduce AI levels
    Object.keys(animatronics).forEach(key => {
        animatronics[key].aiLevel = Math.floor(animatronics[key].aiLevel * easyModeState.aiMultiplier);
    });

    console.log('Easy mode applied - AI levels reduced');
}

// Enhanced Victory Function
const baseVictory = victory;
victory = function() {
    // Calculate session stats
    const sessionTime = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 540;
    const stars = calculateStarRating(gameState.power, sessionTime, gameState.night, cameraUsedInSession);
    const score = calculateScore(gameState.night, gameState.power, stars, easyModeState.enabled);

    // Update progress
    playerProgress.totalNightsSurvived++;
    if (gameState.night > playerProgress.highestNightCompleted) {
        playerProgress.highestNightCompleted = gameState.night;
    }
    playerProgress.nightStars[gameState.night] = Math.max(stars, playerProgress.nightStars[gameState.night] || 0);
    playerProgress.nightScores[gameState.night] = Math.max(score, playerProgress.nightScores[gameState.night] || 0);
    playerProgress.totalPlaytimeSeconds += sessionTime;
    progressStorage.save(playerProgress);

    // Display star rating
    if (featureElements.victoryStars) {
        featureElements.victoryStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
    }
    if (featureElements.ratingMessage) {
        const messages = ['', 'Overleefd!', 'Goed!', 'Geweldig!', 'Uitstekend!', 'Perfect!'];
        featureElements.ratingMessage.textContent = messages[stars];
    }
    if (featureElements.victoryScore) {
        featureElements.victoryScore.textContent = score.toLocaleString();
    }

    // Check achievements
    tryUnlockAchievement(`survive_night_${gameState.night}`);
    if (gameState.power >= 50) tryUnlockAchievement('power_saver');
    if (!cameraUsedInSession) tryUnlockAchievement('no_cameras');
    if (sessionTime < 300) tryUnlockAchievement('speed_demon');
    if (playerProgress.highestNightCompleted >= 5) tryUnlockAchievement('all_nights');

    // Show achievement on victory screen
    const unlockedAch = achievementDefs.find(a =>
        a.id === `survive_night_${gameState.night}` &&
        !playerProgress.achievements.includes(a.id)
    );

    if (unlockedAch && featureElements.victoryAchievement) {
        featureElements.victoryAchievement.innerHTML = `
            <span class="ach-icon">${unlockedAch.icon}</span>
            <span class="ach-name">${unlockedAch.name}</span>
        `;
        featureElements.victoryAchievement.classList.remove('hidden');
    }

    updateProgressDisplay();
    baseVictory();
};

// Enhanced Game Over
const baseJumpscare = jumpscare;
jumpscare = function(animatronic) {
    playerProgress.totalDeaths++;
    if (sessionStartTime) {
        playerProgress.totalPlaytimeSeconds += Math.floor((Date.now() - sessionStartTime) / 1000);
    }
    progressStorage.save(playerProgress);

    if (easyModeState.enabled && !easyModeState.jumpscareEnabled) {
        // Skip jumpscare animation in easy mode
        gameState.isPlaying = false;
        gameState.gameOver = true;
        stopGameLoops();
        elements.gameScreen.classList.add('hidden');
        elements.gameoverScreen.classList.remove('hidden');
        const msg = document.getElementById('gameover-message');
        if (msg) msg.textContent = `${animatronic.emoji} ${animatronic.name} heeft je gevonden!`;
        return;
    }

    baseJumpscare(animatronic);
};

// Enhanced Start Game
const baseStartGame = startGame;
startGame = function() {
    sessionStartTime = Date.now();
    cameraUsedInSession = false;
    baseStartGame();
    applyEasyMode();
};

// Track camera usage
const baseToggleCamera = toggleCamera;
toggleCamera = function() {
    if (gameState.isPlaying && !gameState.cameraOpen) {
        cameraUsedInSession = true;
    }
    baseToggleCamera();
};

// Event Listeners for new UI
if (featureElements.easyModeCheckbox) {
    // Load saved easy mode preference
    featureElements.easyModeCheckbox.checked = playerProgress.easyModeEnabled;
    easyModeState.enabled = playerProgress.easyModeEnabled;

    featureElements.easyModeCheckbox.addEventListener('change', (e) => {
        easyModeState.enabled = e.target.checked;
        playerProgress.easyModeEnabled = e.target.checked;
        progressStorage.save(playerProgress);
        console.log('Easy mode:', easyModeState.enabled ? 'enabled' : 'disabled');
    });
}

if (featureElements.achievementsBtn) {
    featureElements.achievementsBtn.addEventListener('click', () => {
        renderAchievementsGrid();
        elements.startScreen.classList.add('hidden');
        featureElements.achievementsScreen.classList.remove('hidden');
    });
}

if (featureElements.achievementsBack) {
    featureElements.achievementsBack.addEventListener('click', () => {
        featureElements.achievementsScreen.classList.add('hidden');
        elements.startScreen.classList.remove('hidden');
    });
}

if (featureElements.nightSelectBtn) {
    featureElements.nightSelectBtn.addEventListener('click', () => {
        renderNightGrid();
        elements.startScreen.classList.add('hidden');
        featureElements.nightSelectScreen.classList.remove('hidden');
    });
}

if (featureElements.nightSelectBack) {
    featureElements.nightSelectBack.addEventListener('click', () => {
        featureElements.nightSelectScreen.classList.add('hidden');
        elements.startScreen.classList.remove('hidden');
    });
}

if (featureElements.menuBtn) {
    featureElements.menuBtn.addEventListener('click', () => {
        elements.victoryScreen.classList.add('hidden');
        elements.startScreen.classList.remove('hidden');
    });
}

// Custom Night Sliders
const customNightSliders = {
    freddy: document.getElementById('freddy-slider'),
    bonnie: document.getElementById('bonnie-slider'),
    chica: document.getElementById('chica-slider'),
    foxy: document.getElementById('foxy-slider')
};

Object.entries(customNightSliders).forEach(([key, slider]) => {
    if (slider) {
        const valueSpan = document.getElementById(`${key}-value`);
        slider.addEventListener('input', () => {
            if (valueSpan) valueSpan.textContent = slider.value;
        });
    }
});

// Preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const presets = {
            easy: { freddy: 5, bonnie: 5, chica: 5, foxy: 5 },
            normal: { freddy: 10, bonnie: 10, chica: 10, foxy: 10 },
            hard: { freddy: 15, bonnie: 15, chica: 15, foxy: 15 },
            '2020': { freddy: 20, bonnie: 20, chica: 20, foxy: 20 }
        };

        const preset = presets[btn.dataset.preset];
        if (preset) {
            Object.entries(preset).forEach(([key, value]) => {
                if (customNightSliders[key]) {
                    customNightSliders[key].value = value;
                    const valueSpan = document.getElementById(`${key}-value`);
                    if (valueSpan) valueSpan.textContent = value;
                }
            });
        }
    });
});

// Start custom night button
const startCustomNightBtn = document.getElementById('start-custom-night');
if (startCustomNightBtn) {
    startCustomNightBtn.addEventListener('click', () => {
        gameState.night = 7;
        gameState.customDifficulty = {
            freddy: parseInt(customNightSliders.freddy?.value || 10),
            bonnie: parseInt(customNightSliders.bonnie?.value || 10),
            chica: parseInt(customNightSliders.chica?.value || 10),
            foxy: parseInt(customNightSliders.foxy?.value || 10)
        };

        featureElements.nightSelectScreen.classList.add('hidden');
        startGame();

        // Override AI levels for custom night
        animatronics.freddy.aiLevel = gameState.customDifficulty.freddy;
        animatronics.bonnie.aiLevel = gameState.customDifficulty.bonnie;
        animatronics.chica.aiLevel = gameState.customDifficulty.chica;
        animatronics.foxy.aiLevel = gameState.customDifficulty.foxy;
    });
}

// Initialize progress display on load
updateProgressDisplay();

console.log('Features loaded: Easy Mode, Achievements, Star Rating, Night Selection');
