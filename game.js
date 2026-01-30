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

// Animatronics
const animatronics = {
    freddy: {
        name: 'Freddy',
        emoji: '🐻',
        position: '1A',
        aiLevel: 0,
        path: ['1A', '1B', '2A', '4A', '4B', 'RIGHT_DOOR'],
        moveInterval: null
    },
    bonnie: {
        name: 'Bonnie',
        emoji: '🐰',
        position: '1A',
        aiLevel: 0,
        path: ['1A', '1B', '3', '2A', '2B', 'LEFT_DOOR'],
        moveInterval: null
    },
    chica: {
        name: 'Chica',
        emoji: '🐤',
        position: '1A',
        aiLevel: 0,
        path: ['1A', '1B', '4A', '4B', 'RIGHT_DOOR'],
        moveInterval: null
    },
    foxy: {
        name: 'Foxy',
        emoji: '🦊',
        position: '3',
        aiLevel: 0,
        stage: 0, // 0-3, at 3 he runs
        moveInterval: null
    }
};

// Camera locations with descriptions
const cameras = {
    '1A': { name: 'Show Stage', description: 'Main stage area' },
    '1B': { name: 'Dining Area', description: 'Tables and chairs' },
    '2A': { name: 'West Hall', description: 'Left corridor' },
    '2B': { name: 'West Hall Corner', description: 'Near left door' },
    '3': { name: 'Pirate Cove', description: 'Foxy\'s lair' },
    '4A': { name: 'East Hall', description: 'Right corridor' },
    '4B': { name: 'East Hall Corner', description: 'Near right door' }
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
            `${animatronic.name} got you!`;
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
    elements.cameraName.textContent = `CAM ${gameState.currentCamera} - ${cam.name.toUpperCase()}`;

    // Find animatronics at this camera
    let display = '';
    Object.values(animatronics).forEach(a => {
        if (a.position === gameState.currentCamera) {
            display += a.emoji;
        }
    });

    // Special display for Foxy at Pirate Cove
    if (gameState.currentCamera === '3') {
        if (animatronics.foxy.stage === 0) {
            display = '🏴‍☠️ (behind curtain)';
        } else if (animatronics.foxy.stage === 1) {
            display = '🦊 (peeking)';
        } else if (animatronics.foxy.stage === 2) {
            display = '🦊 (out of cove)';
        } else if (animatronics.foxy.stage >= 3) {
            display = '⚠️ EMPTY!';
        }
    }

    elements.animatronicDisplay.textContent = display || '(empty)';
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
    elements.nightDisplay.textContent = `Night ${gameState.night}`;
}

// Update time display
function updateTimeDisplay() {
    const hour = gameState.hour === 0 ? 12 : gameState.hour;
    elements.timeDisplay.textContent = `${hour} AM`;
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
    currentLocation: 'stage'
};

// Location data with connections and descriptions
const locations = {
    stage: {
        name: 'Show Stage',
        emoji: '🎭',
        description: 'The main stage where Freddy, Bonnie, and Chica perform for the children. Colorful curtains hang behind the animatronic band.',
        animatronics: ['🐻 Freddy', '🐰 Bonnie', '🐤 Chica'],
        connections: ['dining'],
        color: '#4a1a4a'
    },
    dining: {
        name: 'Dining Area',
        emoji: '🍕',
        description: 'Tables and chairs fill this large room. Pizza boxes and party hats are scattered around. The smell of old pizza lingers.',
        animatronics: [],
        connections: ['stage', 'westHall', 'eastHall', 'pirateCove'],
        color: '#3a2a1a'
    },
    westHall: {
        name: 'West Hall',
        emoji: '🚪',
        description: 'A dimly lit corridor leading to the security office. Children\'s drawings cover the walls. You hear distant footsteps...',
        animatronics: [],
        connections: ['dining', 'westCorner', 'supplyCloset'],
        color: '#1a2a3a'
    },
    westCorner: {
        name: 'West Hall Corner',
        emoji: '📸',
        description: 'The corner before the left door of the security office. A security camera watches from above. The light flickers.',
        animatronics: [],
        connections: ['westHall', 'office'],
        color: '#1a1a2a'
    },
    eastHall: {
        name: 'East Hall',
        emoji: '🚪',
        description: 'Another corridor with faded posters on the walls. "Celebrate!" they say. Something doesn\'t feel right here...',
        animatronics: [],
        connections: ['dining', 'eastCorner', 'restrooms'],
        color: '#1a3a2a'
    },
    eastCorner: {
        name: 'East Hall Corner',
        emoji: '📸',
        description: 'The corner before the right door. A motivational poster reads "Hang in there!" The irony isn\'t lost on you.',
        animatronics: [],
        connections: ['eastHall', 'office'],
        color: '#2a1a2a'
    },
    pirateCove: {
        name: 'Pirate Cove',
        emoji: '🏴‍☠️',
        description: 'A special stage with purple star-covered curtains. "Sorry! Out of Order" - Foxy lurks behind the curtain...',
        animatronics: ['🦊 Foxy (behind curtain)'],
        connections: ['dining'],
        color: '#4a1a2a'
    },
    office: {
        name: 'Security Office',
        emoji: '🖥️',
        description: 'Your workplace. Monitors, a desk fan, and security cameras. The doors on either side are your only protection.',
        animatronics: [],
        connections: ['westCorner', 'eastCorner'],
        color: '#2a2a3a'
    },
    supplyCloset: {
        name: 'Supply Closet',
        emoji: '🧹',
        description: 'A cramped closet full of cleaning supplies and spare parts. Is that... an endoskeleton in the corner?',
        animatronics: ['🤖 Spare Endoskeleton'],
        connections: ['westHall'],
        color: '#1a1a1a'
    },
    restrooms: {
        name: 'Restrooms',
        emoji: '🚻',
        description: 'Old, flickering lights illuminate dirty tiles. The mirrors are cracked. You hear dripping water...',
        animatronics: [],
        connections: ['eastHall'],
        color: '#2a3a3a'
    },
    kitchen: {
        name: 'Kitchen',
        emoji: '🍳',
        description: 'CAMERA DISABLED - Audio only. You hear pots clanging and something... moving. Best not to investigate.',
        animatronics: ['❓ Unknown sounds'],
        connections: ['dining'],
        color: '#3a3a1a'
    },
    backstage: {
        name: 'Backstage',
        emoji: '🎪',
        description: 'Spare heads line the shelves. Empty animatronic suits hang on the walls. Their eyes seem to follow you...',
        animatronics: ['👤 Empty Suits', '🗣️ Spare Heads'],
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
    exitBtn: document.getElementById('freeroam-exit')
};

const freeRoamBtn = document.getElementById('freeroam-btn');

// Start Free Roam Mode
function startFreeRoam() {
    freeRoamState.active = true;
    freeRoamState.currentLocation = 'stage';

    elements.startScreen.classList.add('hidden');
    freeRoamElements.screen.classList.remove('hidden');

    updateFreeRoamView();
}

// Exit Free Roam Mode
function exitFreeRoam() {
    freeRoamState.active = false;
    freeRoamElements.screen.classList.add('hidden');
    elements.startScreen.classList.remove('hidden');
}

// Move to a location
function moveToLocation(locationId) {
    if (locations[locationId]) {
        freeRoamState.currentLocation = locationId;
        updateFreeRoamView();
        playSound('camera'); // Reuse camera sound for movement
    }
}

// Update the free roam view
function updateFreeRoamView() {
    const loc = locations[freeRoamState.currentLocation];

    // Update location info
    freeRoamElements.locationName.textContent = `${loc.emoji} ${loc.name}`;
    freeRoamElements.locationDescription.textContent = loc.description;

    // Update visual
    freeRoamElements.locationVisual.textContent = loc.emoji;
    freeRoamElements.locationVisual.style.background = `radial-gradient(ellipse at center, ${loc.color} 0%, #000 100%)`;

    // Update animatronics present
    if (loc.animatronics.length > 0) {
        freeRoamElements.locationAnimatronics.innerHTML =
            '<p class="animatronics-label">Present here:</p>' +
            loc.animatronics.map(a => `<span class="animatronic-tag">${a}</span>`).join('');
    } else {
        freeRoamElements.locationAnimatronics.innerHTML = '<p class="empty-room">The room appears empty...</p>';
    }

    // Update navigation buttons
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

// Free Roam Event Listeners
freeRoamBtn.addEventListener('click', startFreeRoam);
freeRoamElements.exitBtn.addEventListener('click', exitFreeRoam);

// Keyboard navigation for free roam
document.addEventListener('keydown', (e) => {
    if (!freeRoamState.active) return;

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

console.log('FNAF Browser Edition loaded! Press Start to play.');
