"use strict";
// ==========================================
// VERSION
// ==========================================
var GAME_VERSION = '2.7.3';
var GAME_BUILD_CACHE = 'v27c';

// ==========================================
// SAVE DATA
// ==========================================
var saveData = {
    coins: 0,
    highscores: [],
    escapeRecord: 0,
    endlessRecord: 0,
    chaosRecord: 0,
    hardPriceBoost: false,
    ownedSkins: ['default'],
    selectedSkin: 'default',
    upgrades: { ice: 0, speed: 0, shield: 0, staminaCap: 0, staminaRegen: 0, shieldStack: 0, batteryPickup: 0, flashlightLife: 0 },
    settings: {
        sprintKey: 'ShiftLeft',
        flashlightKey: 'KeyF',
        sprintMode: 'hold',
        desktopSensitivity: 5,
        mobileSensitivity: 8,
        inputMode: 'auto',
        musicVolume: 100,
        minimapEnabled: true,
        fov: 75,
        mapPickerEnabled: false,
        selectedMap: 'auto',
        backroomsSecondFloor: false,
        crosshair: { shape: 'dot', color: '#ffffff', size: 6, opacity: 80, thickness: 2 }
    }
};

function loadSaveData() {
    try {
        var saved = localStorage.getItem('oliveDelights');
        if (saved) {
            var parsed = JSON.parse(saved);
            for (var key in parsed) {
                if (parsed.hasOwnProperty(key)) saveData[key] = parsed[key];
            }
            if (!saveData.settings.crosshair) {
                saveData.settings.crosshair = { shape: 'dot', color: '#ffffff', size: 6, opacity: 80, thickness: 2 };
            }
            if (saveData.settings.desktopSensitivity === undefined) {
                saveData.settings.desktopSensitivity = saveData.settings.sensitivity || 5;
            }
            if (saveData.settings.mobileSensitivity === undefined) saveData.settings.mobileSensitivity = 8;
            if (saveData.settings.inputMode === undefined) saveData.settings.inputMode = 'auto';
            if (saveData.settings.fov === undefined) saveData.settings.fov = 75;
            if (saveData.settings.mapPickerEnabled === undefined) saveData.settings.mapPickerEnabled = false;
            if (saveData.settings.selectedMap === undefined) saveData.settings.selectedMap = 'auto';
            if (saveData.settings.backroomsSecondFloor === undefined) saveData.settings.backroomsSecondFloor = false;
            if (saveData.settings.flashlightKey === undefined) saveData.settings.flashlightKey = 'KeyF';
            if (saveData.settings.sprintMode === undefined) saveData.settings.sprintMode = 'hold';
            // Old "Park" saved selection maps to the renamed Forest map.
            if (saveData.settings.selectedMap === 'park') saveData.settings.selectedMap = 'forest';
            if (saveData.settings.selectedMap === 'warehouse') saveData.settings.selectedMap = 'auto';
            if (saveData.settings.selectedMap !== 'auto' && !MAP_DEFS[saveData.settings.selectedMap]) {
                saveData.settings.selectedMap = 'auto';
            }
            if (saveData.endlessRecord === undefined) saveData.endlessRecord = 0;
            if (saveData.chaosRecord === undefined) saveData.chaosRecord = 0;
            if (saveData.hardPriceBoost !== undefined) saveData.hardPriceBoost = false;
            if (saveData.upgrades.staminaCap === undefined) saveData.upgrades.staminaCap = 0;
            if (saveData.upgrades.staminaRegen === undefined) saveData.upgrades.staminaRegen = 0;
            if (saveData.upgrades.shieldStack === undefined) saveData.upgrades.shieldStack = 0;
            if (saveData.upgrades.batteryPickup === undefined) saveData.upgrades.batteryPickup = 0;
            if (saveData.upgrades.flashlightLife === undefined) saveData.upgrades.flashlightLife = 0;
        }
    } catch (e) { console.log('Save load error:', e); }
    updateUI();
}

function saveSaveData() {
    try { localStorage.setItem('oliveDelights', JSON.stringify(saveData)); } catch (e) {}
}

// ==========================================
// SHOP & UPGRADE DEFINITIONS
// ==========================================
var SKINS = [
    { id: 'default', name: 'Classic Kanye', url: 'assets/kanye.png', cost: 0, type: 'image' },
    { id: 'kanye2', name: 'Weird Kanye', url: 'assets/kanye2.png', cost: 50, type: 'image' },
    { id: 'kanye3', name: 'Anime Kanye', url: 'assets/kanye3.png', cost: 45, type: 'image' },
    { id: 'kanye4', name: 'Christmas Kanye', url: 'assets/kanye4.png', cost: 55, type: 'image' },
    { id: 'kanye5', name: 'Fih', url: 'assets/kanye5.png', cost: 50, type: 'image' },
    { id: 'kanye6', name: 'Obunga', url: 'assets/knaye6.png', cost: 50, type: 'image' },
    { id: 'scp_wish', name: 'SCP Wish I New', url: 'scp.png', cost: 60, type: 'video', videoUrl: 'scp.mp4', desc: 'Terrifying SCP' },
    { id: 'hamood', name: 'Hamood Habibi', url: 'hamood.png', cost: 55, type: 'image_audio', audioUrl: 'hamood.mp3', desc: 'Hamood Habibi!' },
    { id: 'captain_clark', name: 'Captain Clark', url: 'assets/captain-clark.png', cost: 60, type: 'image', desc: "The Ottoman Empire pirate" },
    { id: 'creepy_ye', name: 'Creepy Ye', url: 'assets/creepy-ye.png', cost: 50, type: 'image', desc: 'Something is wrong with him...' }
];

// Returns the number of shield hits the player gets from an active shield pickup,
// factoring in the shield upgrade (hit quality) and shieldStack upgrade (extra stacks).
function getBaseShieldHits(chaosBoost) {
    var base = (chaosBoost || saveData.upgrades.shield >= 3) ? 2 : 1;
    var stackLv = saveData.upgrades.shieldStack || 0;
    if (stackLv >= 2) base += 2;
    else if (stackLv >= 1) base += 1;
    return base;
}

var UPGRADES = {
    ice: [
        { level: 1, cost: 10, desc: '+1 sec freeze' },
        { level: 2, cost: 15, desc: '+3 sec freeze' },
        { level: 3, cost: 25, desc: '+3 sec freeze + 3 sec half speed' }
    ],
    speed: [
        { level: 1, cost: 10, desc: '+3 sec duration' },
        { level: 2, cost: 15, desc: '+5 sec duration' },
        { level: 3, cost: 25, desc: '+5 sec + speed boost' }
    ],
    shield: [
        { level: 1, cost: 10, desc: '+1 sec freeze on block' },
        { level: 2, cost: 15, desc: '+2 sec freeze on block' },
        { level: 3, cost: 25, desc: '2 hits + 2 sec freeze' }
    ],
    staminaCap: [
        { level: 1, cost: 30, desc: '+15 max stamina' },
        { level: 2, cost: 40, desc: '+30 max stamina' },
        { level: 3, cost: 50, desc: '+50 max stamina' }
    ],
    staminaRegen: [
        { level: 1, cost: 30, desc: '+8% regen speed' },
        { level: 2, cost: 40, desc: '+15% regen speed' },
        { level: 3, cost: 50, desc: '+22% regen speed' }
    ],
    shieldStack: [
        { level: 1, cost: 30, desc: '+1 max shield stack' },
        { level: 2, cost: 40, desc: '+2 max shield stacks' },
        { level: 3, cost: 50, desc: '+2 stacks + 5s speed boost on break' }
    ],
    batteryPickup: [
        { level: 1, cost: 30, desc: 'Battery pickup gives +20%' },
        { level: 2, cost: 40, desc: 'Battery pickup gives +25%' },
        { level: 3, cost: 50, desc: '+25% + 20% chance: 10s no drain' }
    ],
    flashlightLife: [
        { level: 1, cost: 30, desc: '+15% flashlight battery life' },
        { level: 2, cost: 40, desc: '+20% flashlight battery life' },
        { level: 3, cost: 50, desc: '+35% flashlight battery life' }
    ]
};

var CH_SHAPES = [
    { id: 'dot', label: '• Dot' },
    { id: 'plus', label: '+ Plus' },
    { id: 'cross', label: 'X Cross' },
    { id: 'circle', label: 'O Circle' },
    { id: 'square', label: '[] Square' },
    { id: 'diamond', label: '<> Diamond' }
];
var CH_COLORS = ['#ffffff', '#ff0000', '#00ff00', '#00ffff', '#ffff00', '#ff00ff', '#ff8c00', '#4ade80'];

// ==========================================
// GAME STATE VARIABLES
// ==========================================
var gameStarted = false;
var isPaused = false;
var isDead = false;
var startTime = 0;
var sessionCoins = 0;
var pausedTime = 0;
var lastPauseStart = 0;
var sprintKeyCode = 'ShiftLeft';
var flashlightKeyCode = 'KeyF';
var keyCaptureType = null;
var keyCaptureButton = null;
var baseSensDesk = 0.0012;
var baseSensMob = 0.002;
var mouseSens = baseSensDesk * 5;
var mobileSens = baseSensMob * 8;
var musicVolMul = 1;
var isMobile = false;
var forceInputMode = 'auto';
var isEscapeMode = false;
var isEndlessMode = false;
var isChaosMode = false;
var isDarkEscapeMode = false;
var isDarkEscapeHard = false;
var isDarkEscapeExtreme = false;
var darkEscapeKeysFound = 0;
var darkEscapeWon = false;
var flashlightOn = true;
var flashlightBattery = 100;
var escapeRound = 0;
var escapeDoors = [];
var endlessDoorsFound = 0;
var baseGridSize = 25;
var pageVisible = true;

var mobileJoystick = { active: false, startX: 0, startY: 0, moveX: 0, moveZ: 0 };
var mobileLook = { active: false, startX: 0, startY: 0 };
var mobileSprintActive = false;
var mobileJumpPressed = false;

var scene, camera, renderer, wallTexture, floorTexture;
var backroomsCeilTexture, backroomsL1WallTexture, backroomsL1FloorTexture, backroomsL1CeilTexture, crateTexture;

// Multi-floor Backrooms (Level 0: The Lobby -> Level 1: Habitable Zone) + Secret Test Mode state
var SECOND_FLOOR_Y = 4.0;
var SECOND_WALL_H = 3.8;
var SLAB_THICKNESS = 0.5;
var mazeFloors = [null, null];
var backroomsStairs = [];
var stairShaftSet = {};
var pathBlockedGridFloors = [null, null];

var noBotMode = false;
var testInfiniteStamina = false;
var testStartFloor = 0;
var sessionUsedTestMode = false;
var forceMapNextRun = null;
var secretModalOpen = false;
var secretWasPausedBefore = false;
var secretKeyBuffer = '';

var skinAudioBuffer = null;
var skinAudioSource = null;
var skinGainNode = null;
var skinAudioReady = false;
var skinAudioPlaying = false;
var scpVideoTexture = null;

var player = {
    x: 0, y: 1.6, z: 0,
    yaw: 0, pitch: 0,
    onGround: true, vy: 0,
    shieldHits: 0,
    shieldSpeedBoost: false,
    shieldSpeedBoostTimer: 0,
    flashlightNoDrain: false,
    flashlightNoDrainTimer: 0,
    infiniteStamina: false,
    infiniteStaminaTimer: 0,
    speedBoost: false,
    speedBoostTimer: 0
};

var kanye = {
    x: 0, z: 0, y: 1.25, baseY: 0,
    vx: 0, vz: 0,
    sprite: null,
    pathTimer: 0,
    path: [],
    pathIndex: 0,
    frozen: false, frozenTimer: 0,
    halfSpeed: false, halfSpeedTimer: 0,
    usesVideo: false,
    usesCustomAudio: false,
    stuckTimer: 0
};

var chaosNextbots = [];

var powerups = [];
var coins = [];
var POWERUP_TYPES = ['ice', 'speed', 'shield'];
var DARK_ESCAPE_POWERUP_TYPES = ['ice', 'speed', 'shield', 'battery'];

// Proper Fisher-Yates shuffle — returns the same array shuffled in-place.
// Use this instead of arr.sort(Math.random - 0.5) which is biased with Timsort.
function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
}
var MIN_POWERUP_SPACING = 8;

var keys = {};
var isLocked = false;
var stamina = 100;
var maxStamina = 100;
var isSprinting = false;
var sprintLocked = false;
var sprintNeedsRelease = false;

var audioCtx, audioBuffer, audioSource, gainNode;
var audioReady = false;
var audioPlaying = false;
var cachedAudioBuffers = {};

function resetSprintState() {
    isSprinting = false;
    mobileSprintActive = false;
    sprintLocked = false;
    sprintNeedsRelease = false;
    var sprintBtn = document.getElementById('btn-sprint');
    if (sprintBtn) sprintBtn.classList.remove('active');
}

var CELL = 4;
var GRID_SIZE = 25;
var WALL_H = 3.5;
var maze = [];
var walkableCells = [];
var decorations = [];
var currentMap = 'backrooms';
var textureLoader = new THREE.TextureLoader();

// ==========================================
// MAP DEFINITIONS & SHARED ASSETS
// ==========================================
var MAP_DEFS = {
    backrooms: { name: 'Backrooms', normal: 25, escape: 50, extreme: 62, chaos: 25, outdoor: false },
    hospital: { name: 'Hospital', normal: 25, escape: 50, extreme: 62, chaos: 25, outdoor: false },
    forest: { name: 'Forest', normal: 46, escape: 64, extreme: 78, chaos: 36, outdoor: true }
};

// Shared reusable geometry. Marking these makes clearScene leave them alive for the next run.
var SHARED_GEO = {};
var SHARED_MATS = {};
var MAP_MATS_CACHE = {};
var TEXTURE_CACHE = {};
var worldAmbientLight = null;

function markShared(resource) {
    if (resource) {
        if (!resource.userData) resource.userData = {};
        resource.userData.shared = true;
    }
    return resource;
}

function getSharedBox() {
    if (!SHARED_GEO.box) SHARED_GEO.box = markShared(new THREE.BoxGeometry(CELL, WALL_H, CELL));
    return SHARED_GEO.box;
}

function getSharedBoxUpper() {
    if (!SHARED_GEO.boxUpper) SHARED_GEO.boxUpper = markShared(new THREE.BoxGeometry(CELL, SECOND_WALL_H, CELL));
    return SHARED_GEO.boxUpper;
}

function getSharedUnitBox() {
    if (!SHARED_GEO.unitBox) SHARED_GEO.unitBox = markShared(new THREE.BoxGeometry(1, 1, 1));
    return SHARED_GEO.unitBox;
}

function getSharedTrunkGeo() {
    if (!SHARED_GEO.trunk) SHARED_GEO.trunk = markShared(new THREE.CylinderGeometry(0.28, 0.42, 1, 8));
    return SHARED_GEO.trunk;
}

function getSharedLeafGeo() {
    if (!SHARED_GEO.leaf) SHARED_GEO.leaf = markShared(new THREE.ConeGeometry(1, 1, 8));
    return SHARED_GEO.leaf;
}

function getSharedSphereGeo() {
    if (!SHARED_GEO.sphere) SHARED_GEO.sphere = markShared(new THREE.SphereGeometry(0.5, 12, 10));
    return SHARED_GEO.sphere;
}

function getSharedCircleGeo() {
    if (!SHARED_GEO.circle) SHARED_GEO.circle = markShared(new THREE.CircleGeometry(1, 24));
    return SHARED_GEO.circle;
}

function getFloorGeo(size) {
    var key = 'floor' + size;
    if (!SHARED_GEO[key]) SHARED_GEO[key] = markShared(new THREE.PlaneGeometry(size, size));
    return SHARED_GEO[key];
}

function getTexture(url, nearest) {
    if (TEXTURE_CACHE[url]) return TEXTURE_CACHE[url];
    var tex = textureLoader.load(url);
    if (nearest) {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
    } else {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
    }
    TEXTURE_CACHE[url] = tex;
    return tex;
}

function getSpriteMaterial(url, nearest) {
    var key = 'mat:' + url;
    if (!TEXTURE_CACHE[key]) {
        var tex = getTexture(url, nearest === undefined ? true : nearest);
        TEXTURE_CACHE[key] = markShared(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    }
    return TEXTURE_CACHE[key];
}

function getForestGroundTexture() {
    if (!TEXTURE_CACHE['forestGroundCanvas']) {
        var c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#2b542b';
        ctx.fillRect(0, 0, 256, 256);
        for (var i = 0; i < 1900; i++) {
            ctx.fillStyle = (i % 2 === 0) ? 'rgba(80,140,80,0.5)' : 'rgba(35,75,35,0.45)';
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
        var tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(12, 12);
        TEXTURE_CACHE['forestGroundCanvas'] = markShared(tex);
    }
    return TEXTURE_CACHE['forestGroundCanvas'];
}

function isForestMap() {
    return currentMap === 'forest' || currentMap === 'park';
}

function getMapSize() {
    var key = currentMap === 'park' ? 'forest' : currentMap;
    var def = MAP_DEFS[key] || MAP_DEFS.backrooms;
    if (isDarkEscapeMode) return isDarkEscapeExtreme ? (def.extreme || def.escape + 12) : def.escape;
    if (isEscapeMode) return def.escape;
    if (isChaosMode) return def.chaos;
    return def.normal;
}

function getModeAllowedMaps() {
    if (isEscapeMode) return ['backrooms', 'hospital'];
    if (isChaosMode) return ['backrooms', 'hospital', 'forest'];
    if (isEndlessMode) return ['backrooms', 'hospital'];
    return ['backrooms', 'hospital', 'forest'];
}

function getTabAllowedMaps(tabId) {
    if (tabId === 'tab-play') return ['backrooms', 'hospital', 'forest'];
    if (tabId === 'tab-escape') return ['backrooms', 'hospital'];
    if (tabId === 'tab-chaos') return ['backrooms', 'hospital', 'forest'];
    return ['backrooms', 'hospital', 'forest'];
}

function isBackroomsSecondFloorEnabled() {
    return saveData.settings.backroomsSecondFloor === true;
}

function hasSecondFloorActive() {
    return currentMap === 'backrooms' && isBackroomsSecondFloorEnabled() && !isEndlessMode;
}

function getFloorBaseY(floor) {
    return floor === 1 ? SECOND_FLOOR_Y : 0;
}

function getPlayerFloor() {
    if (!hasSecondFloorActive()) return 0;
    return (player.y - 1.6) >= SECOND_FLOOR_Y * 0.5 ? 1 : 0;
}

function getMazeForFloor(floor) {
    if (floor === 1 && hasSecondFloorActive() && mazeFloors[1]) return mazeFloors[1];
    return mazeFloors[0] || maze;
}

function isStairShaftCell(gx, gz) {
    return !!stairShaftSet[gx + ',' + gz];
}

function syncSecondFloorCheckboxes() {
    var enabled = isBackroomsSecondFloorEnabled();
    var boxes = document.querySelectorAll('.backrooms-2f-checkbox');
    for (var i = 0; i < boxes.length; i++) {
        boxes[i].checked = enabled;
    }
}

function setBackroomsSecondFloor(val) {
    saveData.settings.backroomsSecondFloor = !!val;
    saveSaveData();
    syncSecondFloorCheckboxes();
}

function updateTestBadgeUI() {
    var badge = document.getElementById('test-mode-badge');
    if (!badge) return;
    if (gameStarted && (noBotMode || testInfiniteStamina)) {
        var parts = [];
        if (noBotMode) parts.push('NO BOT');
        if (testInfiniteStamina) parts.push('INF STAMINA');
        badge.textContent = '🧪 TEST MODE · ' + parts.join(' · ');
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function syncSecretMenuUI() {
    var nbEl = document.getElementById('secret-nobot-toggle');
    if (nbEl) nbEl.checked = !!noBotMode;
    var stEl = document.getElementById('secret-stamina-toggle');
    if (stEl) stEl.checked = !!testInfiniteStamina;
    var flEl = document.getElementById('secret-start-floor');
    if (flEl) flEl.value = String(testStartFloor || 0);
    syncSecondFloorCheckboxes();
    var liveBox = document.getElementById('secret-live-actions');
    if (liveBox) {
        liveBox.style.display = (gameStarted && !isDead && hasSecondFloorActive()) ? 'block' : 'none';
    }
}

function openSecretTestMenu() {
    var modal = document.getElementById('secret-test-modal');
    if (!modal) return;
    secretModalOpen = true;
    secretWasPausedBefore = isPaused;
    if (gameStarted && !isDead && !isPaused) {
        isPaused = true;
        lastPauseStart = Date.now();
        pauseAudio();
    }
    if (!isMobile && document.pointerLockElement) {
        document.exitPointerLock();
    }
    syncSecretMenuUI();
    modal.classList.add('open');
}

function closeSecretTestMenu() {
    var modal = document.getElementById('secret-test-modal');
    if (!modal) return;
    secretModalOpen = false;
    modal.classList.remove('open');
    if (gameStarted && !isDead && !secretWasPausedBefore) {
        isPaused = false;
        if (lastPauseStart > 0) {
            pausedTime += Date.now() - lastPauseStart;
            lastPauseStart = 0;
        }
        if (!isMobile && renderer && renderer.domElement) {
            renderer.domElement.requestPointerLock();
        }
    }
}

function toggleSecretTestMenu() {
    if (secretModalOpen) closeSecretTestMenu();
    else openSecretTestMenu();
}

function setNoBotMode(val) {
    noBotMode = !!val;
    if (noBotMode) sessionUsedTestMode = true;
    if (gameStarted) {
        if (noBotMode) {
            if (kanye && kanye.sprite) kanye.sprite.visible = false;
            for (var i = 0; i < chaosNextbots.length; i++) {
                if (chaosNextbots[i].sprite) chaosNextbots[i].sprite.visible = false;
            }
            setAudioVolume(0);
            var fear = document.getElementById('fear-overlay');
            var warn = document.getElementById('warning');
            if (fear) fear.style.opacity = '0';
            if (warn) warn.style.opacity = '0';
        } else {
            if (kanye && kanye.sprite) {
                kanye.sprite.visible = true;
                kanye.pathTimer = 0;
            }
            for (var j = 0; j < chaosNextbots.length; j++) {
                if (chaosNextbots[j].sprite) {
                    chaosNextbots[j].sprite.visible = true;
                    chaosNextbots[j].pathTimer = 0;
                }
            }
        }
        if (isChaosMode) {
            var chEl = document.getElementById('chaos-chasers');
            if (chEl) chEl.textContent = noBotMode ? '🧪 Peaceful Test (No Bots)' : '3 Nextbots hunting you!';
        }
    }
    updateTestBadgeUI();
    syncSecretMenuUI();
}

function setTestInfiniteStamina(val) {
    testInfiniteStamina = !!val;
    if (testInfiniteStamina) {
        sessionUsedTestMode = true;
        stamina = maxStamina;
        sprintLocked = false;
        sprintNeedsRelease = false;
    }
    updateTestBadgeUI();
    syncSecretMenuUI();
}

function setTestStartFloor(val) {
    testStartFloor = parseInt(val, 10) === 1 ? 1 : 0;
}

function launchBackroomsTest(mode, startFloor) {
    setNoBotMode(true);
    setBackroomsSecondFloor(true);
    testStartFloor = startFloor === 1 ? 1 : 0;
    forceMapNextRun = 'backrooms';
    secretModalOpen = false;
    secretWasPausedBefore = false;
    var modal = document.getElementById('secret-test-modal');
    if (modal) modal.classList.remove('open');
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('death-screen').style.display = 'none';
    document.getElementById('win-screen').style.display = 'none';
    isPaused = false;
    isDead = false;
    resetDarkEscapeState();

    if (mode === 'escape') startEscapeMode();
    else if (mode === 'darkescape') startDarkEscapeMode('easy');
    else if (mode === 'chaos') startChaosMode();
    else startGame();
}

function teleportTestFloor(targetFloor) {
    if (!gameStarted || !hasSecondFloorActive()) return;
    sessionUsedTestMode = true;
    var fl = targetFloor === 1 ? 1 : 0;
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < walkableCells.length; i++) {
        var c = walkableCells[i];
        if ((c.floor || 0) !== fl) continue;
        if (!isWalkableGrid(c.x, c.z, fl)) continue;
        var wp = gridToWorld(c.x, c.z);
        var d = Math.hypot(wp.x - player.x, wp.z - player.z);
        if (d < bestDist) { bestDist = d; best = wp; }
    }
    if (best) {
        player.x = best.x;
        player.z = best.z;
        player.y = getFloorBaseY(fl) + 1.6;
        player.vy = 0;
        player.onGround = true;
        camera.position.set(player.x, player.y, player.z);
        showPickupMessage(fl === 1 ? '🏭 TELEPORTED TO FLOOR 2 (LEVEL 1: HABITABLE ZONE)' : '🏢 TELEPORTED TO FLOOR 1 (LEVEL 0: THE LOBBY)', 2200);
    }
    closeSecretTestMenu();
}

function teleportToNearestStair() {
    if (!gameStarted || !hasSecondFloorActive() || backroomsStairs.length === 0) return;
    sessionUsedTestMode = true;
    var pFloor = getPlayerFloor();
    var bestStair = backroomsStairs[0];
    var bestDist = Infinity;
    for (var i = 0; i < backroomsStairs.length; i++) {
        var st = backroomsStairs[i];
        var landing = pFloor === 1 ? st.topWorld : st.bottomWorld;
        var d = Math.hypot(landing.x - player.x, landing.z - player.z);
        if (d < bestDist) { bestDist = d; bestStair = st; }
    }
    var target = pFloor === 1 ? bestStair.topWorld : bestStair.bottomWorld;
    player.x = target.x;
    player.z = target.z;
    player.y = getFloorBaseY(pFloor) + 1.6;
    player.vy = 0;
    player.onGround = true;
    // Face directly toward the staircase opening!
    var lookDirX = pFloor === 1 ? -bestStair.dx : bestStair.dx;
    var lookDirZ = pFloor === 1 ? -bestStair.dz : bestStair.dz;
    player.yaw = Math.atan2(-lookDirX, -lookDirZ);
    player.pitch = 0;
    camera.position.set(player.x, player.y, player.z);
    showPickupMessage('🪜 TELEPORTED TO STAIRWELL', 1800);
    closeSecretTestMenu();
}

function resolveSelectedMap() {
    if (forceMapNextRun) {
        var forced = forceMapNextRun;
        forceMapNextRun = null;
        return forced;
    }
    if (saveData.settings.selectedMap === 'park') saveData.settings.selectedMap = 'forest';
    // Dark Escape never has a map picker unless forced via secret test menu.
    if (isDarkEscapeMode) {
        return ['backrooms', 'hospital'][Math.floor(Math.random() * 2)];
    }
    var pickerOn = saveData.settings.mapPickerEnabled === true;
    var chosen = saveData.settings.selectedMap;
    var allowed = getModeAllowedMaps();
    if (pickerOn && chosen && chosen !== 'auto' && allowed.indexOf(chosen) !== -1) return chosen;

    return allowed[Math.floor(Math.random() * allowed.length)];
}

var CHUNK_SIZE = 25;
var endlessChunks = new Map();
var endlessChunkMeshes = new Map();
var endlessLRU = [];
var endlessLoadRadius = 2;
var endlessUnloadRadius = 4;
var MAX_CACHED_CHUNKS = 30;
var endlessDoorsList = [];
var endlessDecorations = [];

// Precomputed pathfinding grid. Tree/props are blockers to the nextbot, but the
// grid margin is tuned so A* can route around them instead of treating cells as blocked.
var pathBlockedGrid = null;

// ==========================================
// PAGE VISIBILITY
// ==========================================
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        pageVisible = false;
        if (gameStarted && !isDead && !isPaused) lastPauseStart = Date.now();
    } else {
        pageVisible = true;
        if (gameStarted && !isDead && !isPaused && lastPauseStart > 0) {
            pausedTime += Date.now() - lastPauseStart;
            lastPauseStart = 0;
        }
    }
});

function getElapsedTime() {
    return (Date.now() - startTime - pausedTime) / 1000;
}

// ==========================================
// FULLSCREEN
// ==========================================
function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        var el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}
document.addEventListener('fullscreenchange', function () {
    var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    var buttons = document.querySelectorAll('.fullscreen-btn');
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].id !== 'fullscreen-btn') continue;
        buttons[i].textContent = isFs ? 'Exit Fullscreen' : 'Enter Fullscreen';
    }
});

// ==========================================
// STAMINA CALCULATIONS
// ==========================================
function getMaxStamina() {
    var m = 100;
    var lv = saveData.upgrades.staminaCap || 0;
    if (lv >= 1) m += 15;
    if (lv >= 2) m += 15;
    if (lv >= 3) m += 20;
    return m;
}
function getStaminaRegenRate() {
    var r = 15;
    var lv = saveData.upgrades.staminaRegen || 0;
    if (lv >= 1) r *= 1.08;
    if (lv >= 2) r *= 1.07;
    if (lv >= 3) r *= 1.07;
    return r;
}

// ==========================================
// CROSSHAIR RENDERING
// ==========================================
function renderCHInto(el, ch) {
    el.innerHTML = '';
    el.style.cssText = '';
    var shape = ch.shape, color = ch.color, size = ch.size, opacity = ch.opacity, thickness = ch.thickness;
    el.style.opacity = opacity / 100;

    if (shape === 'dot') {
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.background = color;
        el.style.borderRadius = '50%';
        el.style.boxShadow = '0 0 ' + Math.max(2, size / 2) + 'px ' + color;
    } else if (shape === 'plus' || shape === 'cross') {
        var totalSize = size * 3;
        var container = document.createElement('div');
        container.style.cssText = 'position:relative;width:' + totalSize + 'px;height:' + totalSize + 'px;';
        var rot = shape === 'cross' ? 45 : 0;
        var hLine = document.createElement('div');
        hLine.style.cssText = 'position:absolute;top:50%;left:0;width:100%;height:' + thickness +
            'px;background:' + color + ';transform:translateY(-50%) rotate(' + rot + 'deg);box-shadow:0 0 4px ' + color + ';';
        container.appendChild(hLine);
        var vLine = document.createElement('div');
        vLine.style.cssText = 'position:absolute;left:50%;top:0;width:' + thickness +
            'px;height:100%;background:' + color + ';transform:translateX(-50%) rotate(' + rot + 'deg);box-shadow:0 0 4px ' + color + ';';
        container.appendChild(vLine);
        el.appendChild(container);
        el.style.width = totalSize + 'px';
        el.style.height = totalSize + 'px';
    } else if (shape === 'circle') {
        var circSize = size * 2.5;
        el.style.width = circSize + 'px';
        el.style.height = circSize + 'px';
        el.style.border = thickness + 'px solid ' + color;
        el.style.borderRadius = '50%';
        el.style.boxShadow = '0 0 4px ' + color;
    } else if (shape === 'square') {
        var sqSize = size * 2;
        el.style.width = sqSize + 'px';
        el.style.height = sqSize + 'px';
        el.style.border = thickness + 'px solid ' + color;
        el.style.boxShadow = '0 0 4px ' + color;
    } else if (shape === 'diamond') {
        var diaSize = size * 2;
        el.style.width = diaSize + 'px';
        el.style.height = diaSize + 'px';
        el.style.border = thickness + 'px solid ' + color;
        el.style.boxShadow = '0 0 4px ' + color;
    }
}

function renderCH() {
    var el = document.getElementById('crosshair');
    renderCHInto(el, saveData.settings.crosshair);
    el.style.transform = saveData.settings.crosshair.shape === 'diamond'
        ? 'translate(-50%,-50%) rotate(45deg)' : 'translate(-50%,-50%)';
}

function renderCHPreview() {
    var p = document.getElementById('ch-preview');
    if (!p) return;
    p.innerHTML = '';
    var w = document.createElement('div');
    w.style.position = 'relative';
    renderCHInto(w, saveData.settings.crosshair);
    if (saveData.settings.crosshair.shape === 'diamond') w.style.transform = 'rotate(45deg)';
    p.appendChild(w);
}

function buildCHShapes() {
    var container = document.getElementById('crosshair-shapes');
    container.innerHTML = '';
    for (var i = 0; i < CH_SHAPES.length; i++) {
        var shapeData = CH_SHAPES[i];
        var btn = document.createElement('button');
        btn.className = 'shape-btn';
        if (saveData.settings.crosshair.shape === shapeData.id) btn.classList.add('active');
        btn.textContent = shapeData.label;
        btn.setAttribute('data-shape', shapeData.id);
        btn.onclick = function () {
            saveData.settings.crosshair.shape = this.getAttribute('data-shape');
            saveSaveData();
            renderCH();
            renderCHPreview();
            buildCHShapes();
        };
        container.appendChild(btn);
    }
}

function buildCHColors() {
    var container = document.getElementById('crosshair-colors');
    container.innerHTML = '';
    for (var i = 0; i < CH_COLORS.length; i++) {
        var colorVal = CH_COLORS[i];
        var swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        if (saveData.settings.crosshair.color === colorVal) swatch.classList.add('active');
        swatch.style.background = colorVal;
        swatch.setAttribute('data-color', colorVal);
        swatch.onclick = function () {
            saveData.settings.crosshair.color = this.getAttribute('data-color');
            saveSaveData();
            renderCH();
            renderCHPreview();
            buildCHColors();
        };
        container.appendChild(swatch);
    }
}

function updateCrosshairSettings() {
    saveData.settings.crosshair.size = parseInt(document.getElementById('ch-size').value);
    saveData.settings.crosshair.opacity = parseInt(document.getElementById('ch-opacity').value);
    saveData.settings.crosshair.thickness = parseInt(document.getElementById('ch-thick').value);
    document.getElementById('ch-size-d').textContent = saveData.settings.crosshair.size;
    document.getElementById('ch-opa-d').textContent = saveData.settings.crosshair.opacity + '%';
    document.getElementById('ch-thk-d').textContent = saveData.settings.crosshair.thickness;
    saveSaveData();
    renderCH();
    renderCHPreview();
}

// ==========================================
// DETECT MOBILE
// ==========================================
function detectMobile() {
    var naturalMobile = ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (forceInputMode === 'desktop') isMobile = false;
    else if (forceInputMode === 'mobile') isMobile = true;
    else isMobile = naturalMobile;

    document.body.classList.toggle('is-mobile', isMobile);
}

function setInputMode(mode) {
    saveData.settings.inputMode = mode;
    forceInputMode = mode;
    saveSaveData();
    detectMobile();
    updateUI();
    if (isMobile && gameStarted) setupMobileControls();
}

// ==========================================
// RESET ACTIVE EFFECTS
// ==========================================
function resetActiveEffects() {
    player.infiniteStamina = false;
    player.infiniteStaminaTimer = 0;
    player.speedBoost = false;
    player.speedBoostTimer = 0;
    player.shieldHits = 0;
    player.shieldSpeedBoost = false;
    player.shieldSpeedBoostTimer = 0;
    player.flashlightNoDrain = false;
    player.flashlightNoDrainTimer = 0;

    kanye.frozen = false;
    kanye.frozenTimer = 0;
    kanye.halfSpeed = false;
    kanye.halfSpeedTimer = 0;

    for (var i = 0; i < chaosNextbots.length; i++) {
        chaosNextbots[i].frozen = false;
        chaosNextbots[i].frozenTimer = 0;
        chaosNextbots[i].halfSpeed = false;
        chaosNextbots[i].halfSpeedTimer = 0;
    }

    document.getElementById('stamina-bar').classList.remove('infinite', 'boosted');
    document.getElementById('freeze-overlay').style.opacity = '0';
    document.getElementById('shield-indicator').style.opacity = '0';
    document.getElementById('fear-overlay').style.opacity = '0';
    document.getElementById('warning').style.opacity = '0';
    document.querySelectorAll('.powerup-slot').forEach(function (s) { s.classList.remove('active'); });
}

// ==========================================
// UI UPDATE FUNCTION
// ==========================================
function showTab(id, btn) {
    document.querySelectorAll('.tab-content').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    document.getElementById('tab-' + id).classList.add('active');
    btn.classList.add('active');
    if (id === 'settings') {
        buildCHShapes();
        buildCHColors();
        renderCHPreview();
    }
    populateMapPickers();
    applyMapPickerVisibility();
}

function updateUI() {
    document.getElementById('total-coins').textContent = saveData.coins;
    document.getElementById('sprint-key-display').textContent =
        saveData.settings.sprintKey.replace('ShiftLeft', 'SHIFT')
            .replace('ShiftRight', 'R-SHIFT')
            .replace('ControlLeft', 'CTRL')
            .replace('KeyC', 'C');

    var hsDiv = document.getElementById('highscores');
    hsDiv.innerHTML = '';
    for (var i = 0; i < 3; i++) {
        var time = saveData.highscores[i];
        var span = document.createElement('span');
        if (time) {
            var mins = Math.floor(time / 60);
            var secs = Math.floor(time % 60);
            span.textContent = (i + 1) + '. ' + mins + ':' + secs.toString().padStart(2, '0');
        } else {
            span.textContent = (i + 1) + '. --:--';
        }
        hsDiv.appendChild(span);
    }

    var skinShop = document.getElementById('skin-shop');
    skinShop.innerHTML = '';
    SKINS.forEach(function (skin) {
        var div = document.createElement('div');
        div.className = 'shop-item';
        if (saveData.ownedSkins.includes(skin.id)) div.classList.add('owned');
        if (saveData.selectedSkin === skin.id) div.classList.add('selected');
        var media = skin.url
            ? '<img src="' + skin.url + '" onerror="this.style.display=\'none\'">'
            : '<div style="width:36px;height:36px;background:#333;margin:0 auto;border-radius:4px;display:flex;align-items:center;justify-content:center;">?</div>';
        div.innerHTML = media + '<br><small>' + skin.name + '</small><br>';
        if (skin.desc) {
            div.innerHTML += '<small style="color:#888;font-size:9px;">' + skin.desc + '</small><br>';
        }
        if (!saveData.ownedSkins.includes(skin.id)) {
            var skinPrice = getDisplayPrice(skin.cost);
            div.innerHTML += '<button class="menu-btn small" onclick="buySkin(\'' + skin.id + '\')">' + skinPrice + ' 💰</button>';
        } else if (saveData.selectedSkin !== skin.id) {
            div.innerHTML += '<button class="menu-btn small" onclick="selectSkin(\'' + skin.id + '\')">SELECT</button>';
        } else {
            div.innerHTML += '<small style="color:#4ade80;">EQUIPPED</small>';
        }
        skinShop.appendChild(div);
    });

    var upgradeContainerIds = {
        ice: 'ice-upgrades',
        speed: 'speed-upgrades',
        shield: 'shield-upgrades',
        staminaCap: 'stamina-cap-upgrades',
        staminaRegen: 'stamina-regen-upgrades',
        shieldStack: 'shield-stack-upgrades',
        batteryPickup: 'battery-pickup-upgrades',
        flashlightLife: 'flashlight-life-upgrades'
    };
    var upgradeTypes = ['ice', 'speed', 'shield', 'staminaCap', 'staminaRegen', 'shieldStack', 'batteryPickup', 'flashlightLife'];
    upgradeTypes.forEach(function (type) {
        var container = document.getElementById(upgradeContainerIds[type]);
        if (!container) return;
        container.innerHTML = '';
        var upgList = UPGRADES[type] || [];
        upgList.forEach(function (upg) {
            var div = document.createElement('div');
            div.className = 'upgrade-item';
            var currentLevel = saveData.upgrades[type] || 0;
            if (currentLevel >= upg.level) div.classList.add('owned');
            div.innerHTML = '<span>Lv' + upg.level + ': ' + upg.desc + '</span>';
            if (currentLevel >= upg.level) {
                div.innerHTML += '<span style="color:#4ade80;">OWNED</span>';
            } else if (currentLevel === upg.level - 1) {
                var upgPrice = getDisplayPrice(upg.cost);
                div.innerHTML += '<button class="menu-btn small" onclick="buyUpgrade(\'' + type + '\',' + upg.level + ')">' + upgPrice + ' 💰</button>';
            } else {
                div.innerHTML += '<span style="color:#666;">LOCKED</span>';
            }
            container.appendChild(div);
        });
    });

    var note = document.getElementById('price-boost-note');
    var upgradeNote = document.getElementById('upgrade-price-boost-note');
    var boostTxt = '💰 Shop & upgrade prices are boosted 1.5x.';
    if (note) {
        note.style.display = 'block';
        note.textContent = boostTxt;
    }
    if (upgradeNote) {
        upgradeNote.style.display = 'block';
        upgradeNote.textContent = boostTxt;
    }

    var sprintBtn = document.getElementById('sprint-key-btn');
    if (sprintBtn) sprintBtn.textContent = formatKeyDisplay(saveData.settings.sprintKey);
    var flashlightBtn = document.getElementById('flashlight-key-btn');
    if (flashlightBtn) flashlightBtn.textContent = formatKeyDisplay(saveData.settings.flashlightKey);
    if (document.getElementById('sprint-mode-select')) {
        document.getElementById('sprint-mode-select').value = saveData.settings.sprintMode;
    }
    document.getElementById('desktop-sensitivity').value = saveData.settings.desktopSensitivity;
    document.getElementById('desktop-sens-display').textContent = saveData.settings.desktopSensitivity;
    document.getElementById('mobile-sensitivity').value = saveData.settings.mobileSensitivity;
    document.getElementById('mobile-sens-display').textContent = saveData.settings.mobileSensitivity;
    document.getElementById('music-volume').value = saveData.settings.musicVolume;
    document.getElementById('music-vol-display').textContent = saveData.settings.musicVolume;
    document.getElementById('minimap-toggle').checked = saveData.settings.minimapEnabled !== false;

    document.getElementById('fov-set').value = saveData.settings.fov;
    document.getElementById('fov-d').textContent = saveData.settings.fov;
    document.getElementById('map-picker-enabled').checked = saveData.settings.mapPickerEnabled === true;
    syncSecondFloorCheckboxes();
    populateMapPickers();
    applyMapPickerVisibility();

    document.getElementById('ch-size').value = saveData.settings.crosshair.size;
    document.getElementById('ch-size-d').textContent = saveData.settings.crosshair.size;
    document.getElementById('ch-opacity').value = saveData.settings.crosshair.opacity;
    document.getElementById('ch-opa-d').textContent = saveData.settings.crosshair.opacity + '%';
    document.getElementById('ch-thick').value = saveData.settings.crosshair.thickness;
    document.getElementById('ch-thk-d').textContent = saveData.settings.crosshair.thickness;

    document.getElementById('mode-desktop').classList.toggle('active', saveData.settings.inputMode === 'desktop');
    document.getElementById('mode-mobile').classList.toggle('active', saveData.settings.inputMode === 'mobile');

    // Sensitivity subsections: only show the relevant one when an input mode is forced.
    var inputMode = saveData.settings.inputMode;
    var desktopSection = document.getElementById('desktop-sens-section');
    var mobileSection  = document.getElementById('mobile-sens-section');
    if (desktopSection) desktopSection.style.display = (inputMode === 'mobile') ? 'none' : '';
    if (mobileSection)  mobileSection.style.display  = (inputMode === 'desktop') ? 'none' : '';

    // Flashlight mobile button: only relevant in Dark Escape mode.
    var btnFL = document.getElementById('btn-flashlight');
    if (btnFL) btnFL.style.display = (gameStarted && isDarkEscapeMode) ? 'flex' : 'none';

    sprintKeyCode = saveData.settings.sprintKey;
    flashlightKeyCode = saveData.settings.flashlightKey || 'KeyF';
    mouseSens = baseSensDesk * saveData.settings.desktopSensitivity;
    mobileSens = baseSensMob * saveData.settings.mobileSensitivity;
    musicVolMul = saveData.settings.musicVolume / 100;

    var mmVis = saveData.settings.minimapEnabled !== false;
    document.getElementById('minimap').style.display = mmVis ? 'block' : 'none';
    document.getElementById('minimap-floor').style.display = mmVis ? 'block' : 'none';

    document.getElementById('escape-record').textContent = 'Best: ' + saveData.escapeRecord + ' escapes';
    document.getElementById('endless-record').textContent = 'Best: ' + (saveData.endlessRecord || 0) + ' doors';
    var chaosRec = saveData.chaosRecord || 0;
    document.getElementById('chaos-record').textContent = 'Best: ' + Math.floor(chaosRec / 60) + ':' +
        Math.floor(chaosRec % 60).toString().padStart(2, '0');

    maxStamina = getMaxStamina();
    renderCH();
}

// ==========================================
// SHOP FUNCTIONS
// ==========================================
function getPriceMultiplier() {
    // Global economy: shop skin/upgrade prices are always shown and charged boosted.
    return 1.5;
}

function getDisplayPrice(base) {
    return Math.ceil(base * getPriceMultiplier());
}

function buySkin(skinId) {
    var skin = SKINS.find(function (s) { return s.id === skinId; });
    var cost = getDisplayPrice(skin ? skin.cost : 0);
    if (skin && saveData.coins >= cost && !saveData.ownedSkins.includes(skinId)) {
        saveData.coins -= cost;
        saveData.ownedSkins.push(skinId);
        saveData.selectedSkin = skinId;
        saveSaveData();
        updateUI();
    }
}
function selectSkin(skinId) {
    if (saveData.ownedSkins.includes(skinId)) {
        saveData.selectedSkin = skinId;
        saveSaveData();
        updateUI();
    }
}
function buyUpgrade(type, level) {
    var upgList = UPGRADES[type] || [];
    var upg = upgList.find(function (u) { return u.level === level; });
    var currentLevel = saveData.upgrades[type] || 0;
    var cost = getDisplayPrice(upg ? upg.cost : 0);
    if (upg && saveData.coins >= cost && currentLevel === level - 1) {
        saveData.coins -= cost;
        saveData.upgrades[type] = level;
        saveSaveData();
        updateUI();
        maxStamina = getMaxStamina();
    }
}

// ==========================================
// SETTINGS FUNCTIONS
// ==========================================
function updateSprintMode() {
    saveData.settings.sprintMode = document.getElementById('sprint-mode-select').value;
    saveSaveData();
}

function formatKeyDisplay(code) {
    if (!code) return '';
    if (code.indexOf('Key') === 0) return code.substring(3);
    var names = {
        ShiftLeft: 'SHIFT',
        ShiftRight: 'R-SHIFT',
        ControlLeft: 'CTRL',
        ControlRight: 'R-CTRL',
        AltLeft: 'ALT',
        AltRight: 'R-ALT',
        MetaLeft: 'META',
        MetaRight: 'R-META',
        Space: 'SPACE',
        Enter: 'ENTER',
        Tab: 'TAB',
        ArrowUp: '↑',
        ArrowDown: '↓',
        ArrowLeft: '←',
        ArrowRight: '→',
        Backspace: 'BACKSPACE',
        Escape: 'ESC'
    };
    return names[code] || code;
}

function startKeyCapture(type, btn) {
    if (keyCaptureType === type) {
        keyCaptureType = null;
        keyCaptureButton = null;
        updateKeyBindButtons();
        return;
    }
    keyCaptureType = type;
    keyCaptureButton = btn || null;
    updateKeyBindButtons();
}

function cancelKeyCapture() {
    keyCaptureType = null;
    keyCaptureButton = null;
    updateKeyBindButtons();
}

function finishKeyCapture(code) {
    if (!keyCaptureType) return;
    var otherCode = keyCaptureType === 'sprint'
        ? saveData.settings.flashlightKey
        : saveData.settings.sprintKey;
    if (code === otherCode) {
        showPickupMessage('⚠️ That key is already in use!', 1500);
        return;
    }
    if (keyCaptureType === 'sprint') {
        saveData.settings.sprintKey = code;
        sprintKeyCode = code;
    } else {
        saveData.settings.flashlightKey = code;
        flashlightKeyCode = code;
    }
    saveSaveData();
    keyCaptureType = null;
    keyCaptureButton = null;
    updateKeyBindButtons();
}

function updateKeyBindButtons() {
    var sprintBtn = document.getElementById('sprint-key-btn');
    var flashlightBtn = document.getElementById('flashlight-key-btn');
    if (sprintBtn) {
        sprintBtn.classList.toggle('capturing', keyCaptureType === 'sprint');
        sprintBtn.textContent = keyCaptureType === 'sprint'
            ? 'Press a key...'
            : formatKeyDisplay(saveData.settings.sprintKey || 'ShiftLeft');
    }
    if (flashlightBtn) {
        flashlightBtn.classList.toggle('capturing', keyCaptureType === 'flashlight');
        flashlightBtn.textContent = keyCaptureType === 'flashlight'
            ? 'Press a key...'
            : formatKeyDisplay(saveData.settings.flashlightKey || 'KeyF');
    }
}
function updateDesktopSensitivity() {
    var val = parseInt(document.getElementById('desktop-sensitivity').value);
    saveData.settings.desktopSensitivity = val;
    document.getElementById('desktop-sens-display').textContent = val;
    mouseSens = baseSensDesk * val;
    saveSaveData();
}
function updateMobileSensitivity() {
    var val = parseInt(document.getElementById('mobile-sensitivity').value);
    saveData.settings.mobileSensitivity = val;
    document.getElementById('mobile-sens-display').textContent = val;
    mobileSens = baseSensMob * val;
    saveSaveData();
}
function updatePauseSensitivity() {
    var val = parseInt(document.getElementById('pause-sensitivity').value);
    document.getElementById('pause-sens-d').textContent = val;
    if (isMobile) {
        saveData.settings.mobileSensitivity = val;
        mobileSens = baseSensMob * val;
    } else {
        saveData.settings.desktopSensitivity = val;
        mouseSens = baseSensDesk * val;
    }
    saveSaveData();
}
function updateMusicVolume() {
    var el = document.activeElement;
    var val = parseInt((el && el.id === 'pause-volume' ? el : document.getElementById('music-volume')).value);
    saveData.settings.musicVolume = val;
    musicVolMul = val / 100;
    document.getElementById('music-vol-display').textContent = val;
    saveSaveData();
}
function updateMinimapToggle() {
    saveData.settings.minimapEnabled = document.getElementById('minimap-toggle').checked;
    saveSaveData();
    var vis = saveData.settings.minimapEnabled;
    document.getElementById('minimap').style.display = vis ? 'block' : 'none';
    document.getElementById('minimap-floor').style.display = vis ? 'block' : 'none';
}

// ==========================================
// FOV & MAP PICKER SETTINGS
// ==========================================
function updateFov() {
    var val = parseInt(document.getElementById('fov-set').value);
    saveData.settings.fov = Math.max(50, Math.min(110, val));
    document.getElementById('fov-d').textContent = saveData.settings.fov;
    saveSaveData();
    if (camera) {
        camera.fov = saveData.settings.fov;
        camera.updateProjectionMatrix();
    }
}

function updatePauseFov() {
    var val = parseInt(document.getElementById('pause-fov').value);
    saveData.settings.fov = Math.max(50, Math.min(110, val));
    document.getElementById('pause-fov-d').textContent = saveData.settings.fov;
    saveSaveData();
    if (camera) {
        camera.fov = saveData.settings.fov;
        camera.updateProjectionMatrix();
    }
}

function populateMapPickers() {
    var selects = document.querySelectorAll('.map-picker-select');
    for (var i = 0; i < selects.length; i++) {
        var sel = selects[i];
        var tab = sel.closest ? sel.closest('.tab-content') : null;
        var tabId = tab ? tab.id : 'tab-play';
        var allowed = getTabAllowedMaps(tabId);

        sel.innerHTML = '';
        var auto = document.createElement('option');
        auto.value = 'auto';
        auto.textContent = 'Auto';
        sel.appendChild(auto);
        for (var allowIdx = 0; allowIdx < allowed.length; allowIdx++) {
            var key = allowed[allowIdx];
            if (!MAP_DEFS[key]) continue;
            var opt = document.createElement('option');
            opt.value = key;
            opt.textContent = MAP_DEFS[key].name;
            sel.appendChild(opt);
        }

        var chosen = saveData.settings.selectedMap;
        if (chosen === 'park') chosen = 'forest';
        sel.value = (chosen && allowed.indexOf(chosen) !== -1) ? chosen : 'auto';
    }
}

function updateSelectedMap(val) {
    saveData.settings.selectedMap = val;
    saveSaveData();
    populateMapPickers();
}

function updateMapPickerEnabled() {
    saveData.settings.mapPickerEnabled = document.getElementById('map-picker-enabled').checked;
    saveSaveData();
    applyMapPickerVisibility();
}

function applyMapPickerVisibility() {
    var enabled = saveData.settings.mapPickerEnabled === true;
    var pickers = document.querySelectorAll('.map-picker');
    for (var i = 0; i < pickers.length; i++) {
        pickers[i].style.display = enabled ? 'block' : 'none';
    }
}

// ==========================================
// TEXTURES
// ==========================================
// Probe a small set of remote assets. If any fail, show the asset warning banner.
var _assetsFailed = 0;
var _assetsChecked = 0;
var _assetProbeTotal = 4; // wall, floor, ice powerup, kanye sprite

function _assetProbeDone(failed) {
    _assetsChecked++;
    if (failed) _assetsFailed++;
    if (_assetsChecked >= _assetProbeTotal) {
        if (_assetsFailed > 0) showAssetWarning(_assetsFailed);
    }
}

function showAssetWarning(count) {
    var banner = document.getElementById('asset-warning');
    if (!banner) return;
    banner.querySelector('#asset-warn-count').textContent = count;
    banner.style.display = 'block';
}

function loadTextures(callback) {
    var loaded = 0;
    var failed = 0;

    function checkDone(ok) {
        loaded++;
        if (!ok) failed++;
        if (loaded === 2) callback();
    }

    wallTexture = textureLoader.load(
        'assets/backrooms-wall.jpg',
        function () { checkDone(true);  _assetProbeDone(false); },
        undefined,
        function () { checkDone(false); _assetProbeDone(true);  }
    );
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;

    floorTexture = textureLoader.load(
        'assets/backrooms-floor.jpg',
        function () { checkDone(true);  _assetProbeDone(false); },
        undefined,
        function () { checkDone(false); _assetProbeDone(true);  }
    );
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(36, 36);

    backroomsCeilTexture = textureLoader.load('assets/backrooms-ceiling.jpg');
    backroomsCeilTexture.wrapS = THREE.RepeatWrapping;
    backroomsCeilTexture.wrapT = THREE.RepeatWrapping;
    backroomsCeilTexture.repeat.set(22, 22);

    backroomsL1WallTexture = textureLoader.load('assets/backrooms-l1-wall.jpg');
    backroomsL1WallTexture.wrapS = THREE.RepeatWrapping;
    backroomsL1WallTexture.wrapT = THREE.RepeatWrapping;

    backroomsL1FloorTexture = textureLoader.load('assets/backrooms-l1-floor.jpg');
    backroomsL1FloorTexture.wrapS = THREE.RepeatWrapping;
    backroomsL1FloorTexture.wrapT = THREE.RepeatWrapping;

    backroomsL1CeilTexture = textureLoader.load('assets/backrooms-l1-ceiling.jpg');
    backroomsL1CeilTexture.wrapS = THREE.RepeatWrapping;
    backroomsL1CeilTexture.wrapT = THREE.RepeatWrapping;

    crateTexture = textureLoader.load('assets/crate.jpg');
    crateTexture.wrapS = THREE.RepeatWrapping;
    crateTexture.wrapT = THREE.RepeatWrapping;

    // Probe two extra sprites (not blocking the game start).
    textureLoader.load('assets/ice.png',
        function () { _assetProbeDone(false); }, undefined,
        function () { _assetProbeDone(true);  });
    textureLoader.load('assets/kanye.png',
        function () { _assetProbeDone(false); }, undefined,
        function () { _assetProbeDone(true);  });
}

// ==========================================
// AUDIO SYSTEM
// ==========================================
function getAudioBufferFromCache(url) {
    return cachedAudioBuffers[url] || null;
}

function setCachedAudioBuffer(url, buffer) {
    cachedAudioBuffers[url] = buffer;
    return buffer;
}

// Stops any currently-playing audio/video so a new round begins at the start.
function resetRoundMedia() {
    if (audioSource) {
        try { audioSource.stop(); } catch (e) {}
        audioSource = null;
        audioPlaying = false;
    }
    if (skinAudioSource) {
        try { skinAudioSource.stop(); } catch (e) {}
        skinAudioSource = null;
        skinAudioPlaying = false;
    }
    if (audioCtx && gainNode) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
    if (audioCtx && skinGainNode) skinGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);

    var video = document.getElementById('scp-video');
    if (video) {
        try { video.pause(); } catch (e) {}
        try { video.currentTime = 0; } catch (e) {}
        video.volume = 0;
        video.muted = false;
    }
    audioReady = false;
    skinAudioReady = false;
}

async function initAudio() {
    try {
        // Reuse the existing AudioContext instead of leaking a new one each round.
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (!gainNode) {
            gainNode = audioCtx.createGain();
            gainNode.gain.value = 0;
            gainNode.connect(audioCtx.destination);
        }

        // Every round resets the media loop back to the beginning.
        resetRoundMedia();

        var skinData = SKINS.find(function (s) { return s.id === saveData.selectedSkin; });

        if (skinData && skinData.type === 'video') {
            kanye.usesCustomAudio = true;
            audioReady = false;
            var video = document.getElementById('scp-video');
            if (video && video.src) {
                try { video.currentTime = 0; } catch (e) {}
                video.muted = false;
                video.volume = 0;
                video.play().catch(function () {
                    var playOnce = function () {
                        video.play().catch(function () {});
                        document.removeEventListener('click', playOnce);
                        document.removeEventListener('touchstart', playOnce);
                    };
                    document.addEventListener('click', playOnce);
                    document.addEventListener('touchstart', playOnce);
                });
                skinAudioReady = true;
            }
        } else if (skinData && skinData.type === 'image_audio' && skinData.audioUrl) {
            kanye.usesCustomAudio = true;
            try {
                if (!skinGainNode) {
                    skinGainNode = audioCtx.createGain();
                    skinGainNode.gain.value = 0;
                    skinGainNode.connect(audioCtx.destination);
                }
                skinAudioBuffer = getAudioBufferFromCache(skinData.audioUrl);
                if (!skinAudioBuffer) {
                    var resp = await fetch(skinData.audioUrl);
                    var buf = await resp.arrayBuffer();
                    skinAudioBuffer = await audioCtx.decodeAudioData(buf);
                    setCachedAudioBuffer(skinData.audioUrl, skinAudioBuffer);
                }
                skinAudioReady = true;
            } catch (e) {
                console.log('Custom audio failed, using default:', e);
                kanye.usesCustomAudio = false;
                audioBuffer = getAudioBufferFromCache('assets/olive.wav');
                if (!audioBuffer) {
                    var resp2 = await fetch('assets/olive.wav');
                    var buf2 = await resp2.arrayBuffer();
                    audioBuffer = await audioCtx.decodeAudioData(buf2);
                    setCachedAudioBuffer('assets/olive.wav', audioBuffer);
                }
                audioReady = true;
            }
        } else {
            kanye.usesCustomAudio = false;
            audioBuffer = getAudioBufferFromCache('assets/olive.wav');
            if (!audioBuffer) {
                var resp3 = await fetch('assets/olive.wav');
                var buf3 = await resp3.arrayBuffer();
                audioBuffer = await audioCtx.decodeAudioData(buf3);
                setCachedAudioBuffer('assets/olive.wav', audioBuffer);
            }
            audioReady = true;
        }
    } catch (e) { console.log('Audio init error:', e); }
}

function setAudioVolume(vol) {
    if (!audioCtx) return;

    // Always try to resume a suspended context (browsers auto-suspend until
    // a user gesture; the game starting counts as one).
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (isPaused || !pageVisible) {
        if (gainNode) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        if (skinGainNode) skinGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        var v = document.getElementById('scp-video');
        if (v) v.volume = 0;
        return;
    }

    var skinData = SKINS.find(function (s) { return s.id === saveData.selectedSkin; });

    if (skinData && skinData.type === 'video' && skinAudioReady) {
        var vid = document.getElementById('scp-video');
        if (vid) {
            // Resume playback if autoplay was blocked or resetRoundMedia paused it.
            if (vid.paused && vol > 0) {
                vid.play().catch(function () {});
            }
            vid.volume = Math.min(1, vol * musicVolMul);
        }
        if (gainNode) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        return;
    }

    if (kanye.usesCustomAudio && skinAudioReady) {
        if (!skinAudioPlaying && vol > 0 && skinAudioBuffer) {
            skinAudioSource = audioCtx.createBufferSource();
            skinAudioSource.buffer = skinAudioBuffer;
            skinAudioSource.loop = true;
            skinAudioSource.connect(skinGainNode);
            skinAudioSource.start();
            skinAudioPlaying = true;
        }
        var finalVol = Math.min(1, vol * musicVolMul);
        if (skinGainNode) skinGainNode.gain.setTargetAtTime(finalVol, audioCtx.currentTime, 0.1);
        if (gainNode) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        return;
    }

    if (!audioReady) return;

    if (!audioPlaying && vol > 0) {
        audioSource = audioCtx.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.loop = true;
        audioSource.connect(gainNode);
        audioSource.start();
        audioPlaying = true;
    }
    var fv = Math.min(1, vol * musicVolMul);
    if (gainNode) gainNode.gain.setTargetAtTime(fv, audioCtx.currentTime, 0.1);
}

function stopAudio() {
    if (audioSource) {
        try { audioSource.stop(); } catch (e) {}
        audioSource = null;
        audioPlaying = false;
    }
    if (gainNode) gainNode.gain.value = 0;
    if (skinAudioSource) {
        try { skinAudioSource.stop(); } catch (e) {}
        skinAudioSource = null;
        skinAudioPlaying = false;
    }
    if (skinGainNode) skinGainNode.gain.value = 0;
    var v = document.getElementById('scp-video');
    if (v) {
        try { v.pause(); } catch (e) {}
        try { v.currentTime = 0; } catch (e) {}
        v.volume = 0;
    }
}

function pauseAudio() {
    if (audioCtx) {
        if (gainNode) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        if (skinGainNode) skinGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    }
    var v = document.getElementById('scp-video');
    if (v) { v.volume = 0; try { v.pause(); } catch (e) {} }
}

// ==========================================
// MAZE GENERATION
// ==========================================
function generateMazeData(gridSize, seed) {
    var m = [];
    var x, z;
    for (x = 0; x < gridSize; x++) {
        m[x] = [];
        for (z = 0; z < gridSize; z++) m[x][z] = 1;
    }

    var rng = seed || 1;
    function srand() {
        rng = (rng * 16807) % 2147483647;
        return (rng - 1) / 2147483646;
    }

    if (isForestMap()) {
        // Open Forest interior: no maze walls inside, but a solid perimeter wall
        // keeps the player/AI inside a visible border. Trees/props fill the interior.
        for (x = 0; x < gridSize; x++) {
            for (z = 0; z < gridSize; z++) m[x][z] = 0;
        }
        for (x = 0; x < gridSize; x++) {
            m[x][0] = 1;
            m[x][gridSize - 1] = 1;
        }
        for (z = 0; z < gridSize; z++) {
            m[0][z] = 1;
            m[gridSize - 1][z] = 1;
        }
    } else {
        var stack = [];
        m[1][1] = 0;
        stack.push({ x: 1, z: 1 });

        while (stack.length > 0) {
            var cur = stack[stack.length - 1];
            var dirs = [{ dx: 0, dz: -2 }, { dx: 0, dz: 2 }, { dx: -2, dz: 0 }, { dx: 2, dz: 0 }];
            for (var i = dirs.length - 1; i > 0; i--) {
                var j = Math.floor(srand() * (i + 1));
                var tmp = dirs[i]; dirs[i] = dirs[j]; dirs[j] = tmp;
            }
            var found = false;
            for (var di = 0; di < dirs.length; di++) {
                var d = dirs[di];
                var nx = cur.x + d.dx;
                var nz = cur.z + d.dz;
                if (nx > 0 && nx < gridSize - 1 && nz > 0 && nz < gridSize - 1 && m[nx][nz] === 1) {
                    m[cur.x + d.dx / 2][cur.z + d.dz / 2] = 0;
                    m[nx][nz] = 0;
                    stack.push({ x: nx, z: nz });
                    found = true;
                    break;
                }
            }
            if (!found) stack.pop();
        }

        for (x = 2; x < gridSize - 2; x++) {
            for (z = 2; z < gridSize - 2; z++) {
                if (m[x][z] === 1 && srand() < 0.2) {
                    var floorCount = 0;
                    if (m[x - 1][z] === 0) floorCount++;
                    if (m[x + 1][z] === 0) floorCount++;
                    if (m[x][z - 1] === 0) floorCount++;
                    if (m[x][z + 1] === 0) floorCount++;
                    if (floorCount >= 2) m[x][z] = 0;
                }
            }
        }
    }

    var wc = [];
    for (x = 1; x < gridSize - 1; x++) {
        for (z = 1; z < gridSize - 1; z++) {
            if (m[x][z] === 0) wc.push({ x: x, z: z });
        }
    }
    return { maze: m, walkable: wc };
}

function ensureFloorConnected(m, gridSize, protectedSet, anchorCell) {
    var dirs = [{ dx: -1, dz: 0 }, { dx: 1, dz: 0 }, { dx: 0, dz: -1 }, { dx: 0, dz: 1 }];

    function floodFrom(startX, startZ) {
        var vis = {};
        if (!m[startX] || m[startX][startZ] !== 0) return vis;
        var q = [{ x: startX, z: startZ }];
        vis[startX + ',' + startZ] = true;
        while (q.length > 0) {
            var cur = q.shift();
            for (var i = 0; i < dirs.length; i++) {
                var nx = cur.x + dirs[i].dx;
                var nz = cur.z + dirs[i].dz;
                var nk = nx + ',' + nz;
                if (nx < 1 || nx >= gridSize - 1 || nz < 1 || nz >= gridSize - 1) continue;
                if (vis[nk]) continue;
                if (m[nx][nz] !== 0) continue;
                vis[nk] = true;
                q.push({ x: nx, z: nz });
            }
        }
        return vis;
    }

    var ax = anchorCell ? anchorCell.x : 1;
    var az = anchorCell ? anchorCell.z : 1;
    if (!m[ax] || m[ax][az] !== 0) {
        for (var sx = 1; sx < gridSize - 1; sx++) {
            for (var sz = 1; sz < gridSize - 1; sz++) {
                if (m[sx][sz] === 0 && !protectedSet[sx + ',' + sz]) { ax = sx; az = sz; break; }
            }
            if (m[ax] && m[ax][az] === 0) break;
        }
    }

    for (var pass = 0; pass < 80; pass++) {
        var visited = floodFrom(ax, az);
        var bridged = false;

        for (var wx = 1; wx < gridSize - 1 && !bridged; wx++) {
            for (var wz = 1; wz < gridSize - 1 && !bridged; wz++) {
                if (m[wx][wz] !== 1) continue;
                if (protectedSet[wx + ',' + wz]) continue;
                var touchesVis = false;
                var touchesUnvis = false;
                for (var di = 0; di < dirs.length; di++) {
                    var nx2 = wx + dirs[di].dx;
                    var nz2 = wz + dirs[di].dz;
                    if (nx2 < 1 || nx2 >= gridSize - 1 || nz2 < 1 || nz2 >= gridSize - 1) continue;
                    if (m[nx2][nz2] !== 0) continue;
                    if (isStairShaftCell(nx2, nz2)) continue;
                    if (visited[nx2 + ',' + nz2]) touchesVis = true;
                    else touchesUnvis = true;
                }
                if (touchesVis && touchesUnvis) {
                    m[wx][wz] = 0;
                    bridged = true;
                }
            }
        }

        if (!bridged) {
            // Fill any tiny isolated 1-cell pocket walled off entirely by protected stairwell walls.
            for (var fx = 1; fx < gridSize - 1; fx++) {
                for (var fz = 1; fz < gridSize - 1; fz++) {
                    if (m[fx][fz] === 0 && !isStairShaftCell(fx, fz) && !visited[fx + ',' + fz]) {
                        m[fx][fz] = 1;
                    }
                }
            }
            break;
        }
    }
}

function generateMaze() {
    backroomsStairs = [];
    stairShaftSet = {};
    mazeFloors = [null, null];

    var seed0 = Math.floor(Math.random() * 2147483645) + 1;
    var data0 = generateMazeData(GRID_SIZE, seed0);

    if (!hasSecondFloorActive()) {
        maze = data0.maze;
        mazeFloors[0] = maze;
        walkableCells = [];
        for (var i = 0; i < data0.walkable.length; i++) {
            walkableCells.push({ x: data0.walkable[i].x, z: data0.walkable[i].z, floor: 0 });
        }
        return;
    }

    var seed1 = (seed0 * 48271) % 2147483645 + 1;
    var data1 = generateMazeData(GRID_SIZE, seed1);
    var m0 = data0.maze;
    var m1 = data1.maze;

    var protected0 = {};
    var protected1 = {};
    var targetStairs = GRID_SIZE >= 56 ? 5 : (GRID_SIZE >= 40 ? 4 : 3);
    var cardinalDirs = [
        { dx: 0, dz: 1 },
        { dx: 0, dz: -1 },
        { dx: 1, dz: 0 },
        { dx: -1, dz: 0 }
    ];

    var allStairCandidates = [];
    for (var gx = 4; gx < GRID_SIZE - 4; gx++) {
        for (var gz = 4; gz < GRID_SIZE - 4; gz++) {
            for (var di = 0; di < cardinalDirs.length; di++) {
                var dir = cardinalDirs[di];
                var px = -dir.dz, pz = dir.dx;
                var inBounds = true;
                for (var k = -1; k <= 4; k++) {
                    for (var s = -1; s <= 1; s++) {
                        var cx = gx + dir.dx * k + px * s;
                        var cz = gz + dir.dz * k + pz * s;
                        if (cx < 2 || cx >= GRID_SIZE - 2 || cz < 2 || cz >= GRID_SIZE - 2) {
                            inBounds = false;
                            break;
                        }
                    }
                    if (!inBounds) break;
                }
                if (inBounds) {
                    allStairCandidates.push({ sx: gx, sz: gz, dx: dir.dx, dz: dir.dz });
                }
            }
        }
    }
    shuffle(allStairCandidates);

    var spacingPasses = [11, 8, 6];
    for (var sp = 0; sp < spacingPasses.length && backroomsStairs.length < targetStairs; sp++) {
        var minDist = spacingPasses[sp];
        for (var ci = 0; ci < allStairCandidates.length && backroomsStairs.length < targetStairs; ci++) {
            var cand = allStairCandidates[ci];
            var farEnough = true;
            for (var si = 0; si < backroomsStairs.length; si++) {
                var existing = backroomsStairs[si];
                if (Math.hypot(cand.sx - existing.c0.x, cand.sz - existing.c0.z) < minDist) {
                    farEnough = false;
                    break;
                }
            }
            if (!farEnough) continue;

            // Ensure no overlap with any already-protected stairwell cells.
            var perpX = -cand.dz, perpZ = cand.dx;
            var overlaps = false;
            for (var kk = -1; kk <= 4 && !overlaps; kk++) {
                for (var ss = -1; ss <= 1; ss++) {
                    var tx = cand.sx + cand.dx * kk + perpX * ss;
                    var tz = cand.sz + cand.dz * kk + perpZ * ss;
                    var tk = tx + ',' + tz;
                    if (protected0[tk] || protected1[tk]) { overlaps = true; break; }
                }
            }
            if (overlaps) continue;

            var pre  = { x: cand.sx - cand.dx, z: cand.sz - cand.dz };
            var c0   = { x: cand.sx, z: cand.sz };
            var c1   = { x: cand.sx + cand.dx, z: cand.sz + cand.dz };
            var c2   = { x: cand.sx + cand.dx * 2, z: cand.sz + cand.dz * 2 };
            var c3   = { x: cand.sx + cand.dx * 3, z: cand.sz + cand.dz * 3 };
            var post = { x: cand.sx + cand.dx * 4, z: cand.sz + cand.dz * 4 };

            // Seal side walls along the 2-cell stairwell shaft (c1, c2) on BOTH floors.
            for (var shaftStep = 1; shaftStep <= 2; shaftStep++) {
                var shX = cand.sx + cand.dx * shaftStep;
                var shZ = cand.sz + cand.dz * shaftStep;
                var lx = shX - perpX, lz = shZ - perpZ;
                var rx = shX + perpX, rz = shZ + perpZ;
                m0[lx][lz] = 1; m1[lx][lz] = 1;
                m0[rx][rz] = 1; m1[rx][rz] = 1;
                protected0[lx + ',' + lz] = true; protected1[lx + ',' + lz] = true;
                protected0[rx + ',' + rz] = true; protected1[rx + ',' + rz] = true;

                m0[shX][shZ] = 0; m1[shX][shZ] = 0;
                stairShaftSet[shX + ',' + shZ] = true;
                protected0[shX + ',' + shZ] = true;
                protected1[shX + ',' + shZ] = true;
            }

            // Floor 0 bottom landing & solid back wall under top landing.
            m0[pre.x][pre.z] = 0;
            m0[c0.x][c0.z] = 0;
            m0[c3.x][c3.z] = 1;
            protected0[pre.x + ',' + pre.z] = true;
            protected0[c0.x + ',' + c0.z] = true;
            protected0[c3.x + ',' + c3.z] = true;

            // Floor 1 top landing & solid headwall above bottom landing.
            m1[c0.x][c0.z] = 1;
            m1[c3.x][c3.z] = 0;
            m1[post.x][post.z] = 0;
            protected1[c0.x + ',' + c0.z] = true;
            protected1[c3.x + ',' + c3.z] = true;
            protected1[post.x + ',' + post.z] = true;

            var c0World = gridToWorld(c0.x, c0.z);
            var c3World = gridToWorld(c3.x, c3.z);
            backroomsStairs.push({
                index: backroomsStairs.length,
                c0: c0,
                c1: c1,
                c2: c2,
                c3: c3,
                dx: cand.dx,
                dz: cand.dz,
                originX: c0World.x + cand.dx * (CELL / 2),
                originZ: c0World.z + cand.dz * (CELL / 2),
                bottomWorld: c0World,
                topWorld: c3World
            });
        }
    }

    var anchor0 = backroomsStairs.length > 0 ? backroomsStairs[0].c0 : { x: 1, z: 1 };
    var anchor1 = backroomsStairs.length > 0 ? backroomsStairs[0].c3 : { x: 1, z: 1 };
    ensureFloorConnected(m0, GRID_SIZE, protected0, anchor0);
    ensureFloorConnected(m1, GRID_SIZE, protected1, anchor1);

    maze = m0;
    mazeFloors[0] = m0;
    mazeFloors[1] = m1;

    walkableCells = [];
    for (var x0 = 1; x0 < GRID_SIZE - 1; x0++) {
        for (var z0 = 1; z0 < GRID_SIZE - 1; z0++) {
            if (isStairShaftCell(x0, z0)) continue;
            if (m0[x0][z0] === 0) walkableCells.push({ x: x0, z: z0, floor: 0 });
            if (m1[x0][z0] === 0) walkableCells.push({ x: x0, z: z0, floor: 1 });
        }
    }
}

function getStairAt(wx, wz) {
    if (!hasSecondFloorActive() || backroomsStairs.length === 0) return null;
    for (var i = 0; i < backroomsStairs.length; i++) {
        var st = backroomsStairs[i];
        var relX = wx - st.originX;
        var relZ = wz - st.originZ;
        var along = relX * st.dx + relZ * st.dz;
        if (along >= 0 && along <= CELL * 2) {
            var across = Math.abs(relX * (-st.dz) + relZ * st.dx);
            if (across <= CELL / 2) {
                return st;
            }
        }
    }
    return null;
}

function getStairSurfaceY(st, wx, wz) {
    var relX = wx - st.originX;
    var relZ = wz - st.originZ;
    var along = relX * st.dx + relZ * st.dz;
    var t = Math.max(0, Math.min(1, along / (CELL * 2)));
    return t * SECOND_FLOOR_Y;
}

function getGroundSurfaceAt(wx, wz, currentFootY) {
    if (!hasSecondFloorActive()) return 0;
    var st = getStairAt(wx, wz);
    if (st) return getStairSurfaceY(st, wx, wz);
    return currentFootY >= SECOND_FLOOR_Y * 0.5 ? SECOND_FLOOR_Y : 0;
}

// ==========================================
// COORDINATE HELPERS
// ==========================================
function gridToWorld(gx, gz) {
    return { x: (gx - GRID_SIZE / 2 + 0.5) * CELL, z: (gz - GRID_SIZE / 2 + 0.5) * CELL };
}
function worldToGrid(wx, wz) {
    return { x: Math.floor(wx / CELL + GRID_SIZE / 2), z: Math.floor(wz / CELL + GRID_SIZE / 2) };
}
function endlessWorldToChunk(wx, wz) {
    return { cx: Math.floor(wx / (CHUNK_SIZE * CELL)), cz: Math.floor(wz / (CHUNK_SIZE * CELL)) };
}
function endlessLocalToWorld(lx, lz, cx, cz) {
    return { x: (cx * CHUNK_SIZE + lx + 0.5) * CELL, z: (cz * CHUNK_SIZE + lz + 0.5) * CELL };
}
function endlessWorldToGridGlobal(wx, wz) {
    return { x: Math.floor(wx / CELL), z: Math.floor(wz / CELL) };
}
function endlessGridToWorld(gx, gz) {
    return { x: (gx + 0.5) * CELL, z: (gz + 0.5) * CELL };
}

// ==========================================
// WALKABILITY CHECKS
// ==========================================
function getEndlessCell(wx, wz) {
    var ch = endlessWorldToChunk(wx, wz);
    var key = ch.cx + ',' + ch.cz;
    var chunk = endlessChunks.get(key);
    if (!chunk) return 1;
    var lx = Math.floor(wx / CELL - ch.cx * CHUNK_SIZE);
    var lz = Math.floor(wz / CELL - ch.cz * CHUNK_SIZE);
    if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) return 1;
    return chunk.maze[lx][lz];
}

// playerY: optional current player eye Y; baseYOverride: optional explicit foot height (e.g. nextbot baseY).
function isWalkableWorld(wx, wz, radius, playerY, baseYOverride) {
    if (radius === undefined) radius = 0.35;
    var checks = [
        { x: wx, z: wz },
        { x: wx - radius, z: wz - radius },
        { x: wx + radius, z: wz - radius },
        { x: wx - radius, z: wz + radius },
        { x: wx + radius, z: wz + radius }
    ];

    if (isEndlessMode) {
        for (var i = 0; i < checks.length; i++) {
            if (getEndlessCell(checks[i].x, checks[i].z) !== 0) return false;
        }
        for (var ed = 0; ed < endlessDecorations.length; ed++) {
            var edec = endlessDecorations[ed];
            if (playerY !== undefined && edec.height && playerY > edec.height + 1.55) continue;
            if (Math.hypot(wx - edec.x, wz - edec.z) < edec.radius + radius) return false;
        }
        return true;
    }

    var multi = hasSecondFloorActive();
    var footY = baseYOverride !== undefined
        ? baseYOverride
        : (playerY !== undefined ? playerY - 1.6 : 0);

    if (multi) {
        var centerStair = getStairAt(wx, wz);
        if (centerStair) {
            for (var sci = 0; sci < checks.length; sci++) {
                var sp = checks[sci];
                var sg = worldToGrid(sp.x, sp.z);
                if (sg.x < 0 || sg.x >= GRID_SIZE || sg.z < 0 || sg.z >= GRID_SIZE) return false;
                if (getStairAt(sp.x, sp.z) === centerStair) continue;
                if (sg.x === centerStair.c0.x && sg.z === centerStair.c0.z && footY < 1.35) continue;
                if (sg.x === centerStair.c3.x && sg.z === centerStair.c3.z && footY > SECOND_FLOOR_Y - 1.35) continue;
                return false;
            }
            return true;
        }

        var activeFloor = footY >= SECOND_FLOOR_Y * 0.5 ? 1 : 0;
        var activeMaze = getMazeForFloor(activeFloor);
        for (var mci = 0; mci < checks.length; mci++) {
            var mp = checks[mci];
            var mg = worldToGrid(mp.x, mp.z);
            if (mg.x < 0 || mg.x >= GRID_SIZE || mg.z < 0 || mg.z >= GRID_SIZE) return false;
            var pst = getStairAt(mp.x, mp.z);
            if (pst) {
                if (activeFloor === 0 && mg.x === pst.c1.x && mg.z === pst.c1.z) continue;
                if (activeFloor === 1 && mg.x === pst.c2.x && mg.z === pst.c2.z) continue;
                return false;
            }
            if (!activeMaze[mg.x] || activeMaze[mg.x][mg.z] !== 0) return false;
        }

        for (var mdi = 0; mdi < decorations.length; mdi++) {
            var mdec = decorations[mdi];
            if ((mdec.floor || 0) !== activeFloor) continue;
            var mBaseY = mdec.baseY || 0;
            if (playerY !== undefined && mdec.height && playerY > mBaseY + mdec.height + 1.55) continue;
            if (Math.hypot(wx - mdec.x, wz - mdec.z) < mdec.radius + radius) return false;
        }
        return true;
    }

    for (var ci = 0; ci < checks.length; ci++) {
        var g = worldToGrid(checks[ci].x, checks[ci].z);
        if (g.x < 0 || g.x >= GRID_SIZE || g.z < 0 || g.z >= GRID_SIZE) return false;
        if (!maze[g.x] || maze[g.x][g.z] !== 0) return false;
    }

    for (var di = 0; di < decorations.length; di++) {
        var dec = decorations[di];
        var dBaseY = dec.baseY || 0;
        if (playerY !== undefined && dec.height && playerY > dBaseY + dec.height + 1.55) continue;
        var dist = Math.hypot(wx - dec.x, wz - dec.z);
        if (dist < dec.radius + radius) return false;
    }
    return true;
}

function isWalkableGrid(gx, gz, floor) {
    if (isEndlessMode) {
        var wx = (gx + 0.5) * CELL;
        var wz = (gz + 0.5) * CELL;
        return getEndlessCell(wx, wz) === 0;
    }
    var fl = floor || 0;
    if (gx < 0 || gx >= GRID_SIZE || gz < 0 || gz >= GRID_SIZE) return false;
    if (isStairShaftCell(gx, gz)) return false;
    var flMaze = getMazeForFloor(fl);
    if (!flMaze || !flMaze[gx] || flMaze[gx][gz] !== 0) return false;

    var worldPos = gridToWorld(gx, gz);
    for (var i = 0; i < decorations.length; i++) {
        if ((decorations[i].floor || 0) !== fl) continue;
        if (Math.hypot(worldPos.x - decorations[i].x, worldPos.z - decorations[i].z) < decorations[i].radius + 0.55) {
            return false;
        }
    }
    return true;
}

// ---- Pathfinding-specific walkability ----
function rebuildPathGrid() {
    pathBlockedGrid = [];
    pathBlockedGridFloors = [[], []];
    if (isEndlessMode) return;
    var gx, gz;
    for (gx = 0; gx < GRID_SIZE; gx++) {
        pathBlockedGrid[gx] = [];
        pathBlockedGridFloors[0][gx] = [];
        pathBlockedGridFloors[1][gx] = [];
        for (gz = 0; gz < GRID_SIZE; gz++) {
            pathBlockedGrid[gx][gz] = false;
            pathBlockedGridFloors[0][gx][gz] = false;
            pathBlockedGridFloors[1][gx][gz] = false;
        }
    }

    if (isForestMap()) return;

    var margin = 0.2;
    for (var di = 0; di < decorations.length; di++) {
        var dec = decorations[di];
        if (!dec.blockPath) continue;
        var fl = dec.floor || 0;
        var dg = worldToGrid(dec.x, dec.z);
        var half = Math.ceil((dec.radius + margin) / CELL);
        for (gx = Math.max(0, dg.x - half); gx <= Math.min(GRID_SIZE - 1, dg.x + half); gx++) {
            for (gz = Math.max(0, dg.z - half); gz <= Math.min(GRID_SIZE - 1, dg.z + half); gz++) {
                var wp = gridToWorld(gx, gz);
                if (Math.hypot(wp.x - dec.x, wp.z - dec.z) <= dec.radius + margin) {
                    pathBlockedGridFloors[fl][gx][gz] = true;
                    if (fl === 0) pathBlockedGrid[gx][gz] = true;
                }
            }
        }
    }
}

function isPathWalkableGrid(gx, gz, floor) {
    if (isEndlessMode) {
        var wx = (gx + 0.5) * CELL;
        var wz = (gz + 0.5) * CELL;
        return getEndlessCell(wx, wz) === 0;
    }
    var fl = floor || 0;
    if (gx < 0 || gx >= GRID_SIZE || gz < 0 || gz >= GRID_SIZE) return false;
    var flMaze = getMazeForFloor(fl);
    if (!flMaze || !flMaze[gx] || flMaze[gx][gz] !== 0) return false;
    var pGrid = pathBlockedGridFloors[fl] || pathBlockedGrid;
    if (pGrid && pGrid[gx] && pGrid[gx][gz]) return false;
    return true;
}

function findNearestPathWalkableGrid(startGx, startGz, maxRadius, floor) {
    var fl = floor || 0;
    if (!isStairShaftCell(startGx, startGz) && isPathWalkableGrid(startGx, startGz, fl)) {
        return { x: startGx, z: startGz };
    }
    maxRadius = maxRadius || 3;
    var best = null;
    var bestDist = Infinity;
    for (var r = 1; r <= maxRadius; r++) {
        for (var dx = -r; dx <= r; dx++) {
            for (var dz = -r; dz <= r; dz++) {
                if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
                var gx = startGx + dx;
                var gz = startGz + dz;
                if (isStairShaftCell(gx, gz)) continue;
                if (!isPathWalkableGrid(gx, gz, fl)) continue;
                var d = Math.hypot(dx, dz);
                if (d < bestDist) { bestDist = d; best = { x: gx, z: gz }; }
            }
        }
        if (best) return best;
    }
    return best || { x: startGx, z: startGz };
}

// ==========================================
// BUILD WORLD
// ==========================================
function getMapMats() {
    if (isDarkEscapeMode) {
        var darkKey = 'dark-' + currentMap;
        if (MAP_MATS_CACHE[darkKey]) return MAP_MATS_CACHE[darkKey];

        var dWallMat, dFloorMat, dCeilMat, dFog;
        var dUpperWallMat = null, dUpperFloorMat = null, dUpperCeilMat = null;
        if (currentMap === 'backrooms') {
            dWallMat = markShared(new THREE.MeshLambertMaterial({ map: wallTexture, color: 0x353328 }));
            dFloorMat = markShared(new THREE.MeshLambertMaterial({ map: floorTexture, color: 0x2c2a21 }));
            dCeilMat = markShared(new THREE.MeshLambertMaterial({ map: backroomsCeilTexture, color: 0x20201d }));
            dUpperWallMat = markShared(new THREE.MeshLambertMaterial({ map: backroomsL1WallTexture, color: 0x2e3138 }));
            dUpperFloorMat = markShared(new THREE.MeshLambertMaterial({ map: backroomsL1FloorTexture, color: 0x282b31 }));
            dUpperCeilMat = markShared(new THREE.MeshLambertMaterial({ map: backroomsL1CeilTexture, color: 0x1a1c21 }));
            dFog = 0x030304;
        } else if (currentMap === 'hospital') {
            dWallMat = markShared(new THREE.MeshLambertMaterial({ color: 0x3a3d45 }));
            dFloorMat = markShared(new THREE.MeshLambertMaterial({ color: 0x2e3038 }));
            dCeilMat = markShared(new THREE.MeshLambertMaterial({ color: 0x111219 }));
            dFog = 0x030304;
        } else {
            dWallMat = markShared(new THREE.MeshLambertMaterial({ color: 0x1f2a1f }));
            dFloorMat = markShared(new THREE.MeshLambertMaterial({ map: getForestGroundTexture(), color: 0x232b23 }));
            dCeilMat = null;
            dFog = 0x020408;
        }

        var darkMats = {
            wallMat: dWallMat,
            floorMat: dFloorMat,
            ceilMat: dCeilMat,
            upperWallMat: dUpperWallMat,
            upperFloorMat: dUpperFloorMat,
            upperCeilMat: dUpperCeilMat,
            fogColor: dFog,
            upperFogColor: dFog,
            outdoor: false,
            dark: true
        };
        MAP_MATS_CACHE[darkKey] = darkMats;
        return darkMats;
    }

    if (MAP_MATS_CACHE[currentMap]) return MAP_MATS_CACHE[currentMap];

    var wallMat, floorMat, ceilMat, fogColor, outdoor = false;
    var upperWallMat = null, upperFloorMat = null, upperCeilMat = null, upperFogColor = null;
    if (currentMap === 'backrooms') {
        wallMat = markShared(new THREE.MeshBasicMaterial({ map: wallTexture }));
        floorMat = markShared(new THREE.MeshBasicMaterial({ map: floorTexture }));
        ceilMat = markShared(new THREE.MeshBasicMaterial({ map: backroomsCeilTexture }));
        upperWallMat = markShared(new THREE.MeshBasicMaterial({ map: backroomsL1WallTexture }));
        upperFloorMat = markShared(new THREE.MeshBasicMaterial({ map: backroomsL1FloorTexture }));
        upperCeilMat = markShared(new THREE.MeshBasicMaterial({ map: backroomsL1CeilTexture }));
        fogColor = 0x211e14;
        upperFogColor = 0x1a1e24;
    } else if (isForestMap()) {
        wallMat = markShared(new THREE.MeshBasicMaterial({ color: 0x3f6f3f }));
        floorMat = markShared(new THREE.MeshBasicMaterial({ map: getForestGroundTexture() }));
        ceilMat = null;
        fogColor = 0x10203a;
        outdoor = true;
    } else {
        wallMat = markShared(new THREE.MeshBasicMaterial({ color: 0xd4e6d4 }));
        floorMat = markShared(new THREE.MeshBasicMaterial({ color: 0xeeeeee }));
        ceilMat = markShared(new THREE.MeshBasicMaterial({ color: 0xffffff }));
        fogColor = 0x1a2a1a;
    }

    var mats = {
        wallMat: wallMat,
        floorMat: floorMat,
        ceilMat: ceilMat,
        upperWallMat: upperWallMat,
        upperFloorMat: upperFloorMat,
        upperCeilMat: upperCeilMat,
        fogColor: fogColor,
        upperFogColor: upperFogColor || fogColor,
        outdoor: outdoor
    };
    MAP_MATS_CACHE[currentMap] = mats;
    return mats;
}

// Removes the current world and disposes resources that are not marked as shared/reusable.
function clearScene() {
    if (!scene) return;
    forestSky = null;
    scene.traverse(function (obj) {
        if (!obj.isMesh && !obj.isSprite && !obj.isPoints) return;
        if (obj.geometry && !(obj.geometry.userData && obj.geometry.userData.shared)) obj.geometry.dispose();
        var mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
        for (var i = 0; i < mats.length; i++) {
            var m = mats[i];
            if (m && !(m.userData && m.userData.shared)) m.dispose();
        }
    });
    var children = scene.children.slice();
    for (var i = 0; i < children.length; i++) scene.remove(children[i]);
}

function ensureAmbientLight() {
    if (!worldAmbientLight) worldAmbientLight = new THREE.AmbientLight(0xfff5e0, 0.9);
    worldAmbientLight.intensity = 0.9;
    if (scene.children.indexOf(worldAmbientLight) === -1) scene.add(worldAmbientLight);
}

// Builds a single merged horizontal BufferGeometry plane across grid cells, skipping stairwell holes when skipStairHoles=true.
function buildGridHorizontalMesh(yLevel, facingUp, material, skipStairHoles, uvPerCell) {
    var cellCount = 0;
    for (var cx = 0; cx < GRID_SIZE; cx++) {
        for (var cz = 0; cz < GRID_SIZE; cz++) {
            if (skipStairHoles && isStairShaftCell(cx, cz)) continue;
            cellCount++;
        }
    }
    if (cellCount === 0) return null;

    var positions = new Float32Array(cellCount * 6 * 3);
    var normals   = new Float32Array(cellCount * 6 * 3);
    var uvs       = new Float32Array(cellCount * 6 * 2);
    var ny = facingUp ? 1 : -1;
    var uvScale = uvPerCell || 1;
    var halfWorld = (GRID_SIZE * CELL) / 2;
    var vi = 0;
    var ui = 0;

    function pushVert(px, py, pz, u, v) {
        positions[vi * 3]     = px;
        positions[vi * 3 + 1] = py;
        positions[vi * 3 + 2] = pz;
        normals[vi * 3]       = 0;
        normals[vi * 3 + 1]   = ny;
        normals[vi * 3 + 2]   = 0;
        uvs[ui * 2]           = u;
        uvs[ui * 2 + 1]       = v;
        vi++;
        ui++;
    }

    for (var gx = 0; gx < GRID_SIZE; gx++) {
        for (var gz = 0; gz < GRID_SIZE; gz++) {
            if (skipStairHoles && isStairShaftCell(gx, gz)) continue;
            var x0 = gx * CELL - halfWorld;
            var x1 = x0 + CELL;
            var z0 = gz * CELL - halfWorld;
            var z1 = z0 + CELL;
            var u0 = gx * uvScale, u1 = (gx + 1) * uvScale;
            var v0 = gz * uvScale, v1 = (gz + 1) * uvScale;

            if (facingUp) {
                pushVert(x0, yLevel, z1, u0, v1);
                pushVert(x1, yLevel, z1, u1, v1);
                pushVert(x1, yLevel, z0, u1, v0);

                pushVert(x0, yLevel, z1, u0, v1);
                pushVert(x1, yLevel, z0, u1, v0);
                pushVert(x0, yLevel, z0, u0, v0);
            } else {
                pushVert(x0, yLevel, z0, u0, v0);
                pushVert(x1, yLevel, z0, u1, v0);
                pushVert(x1, yLevel, z1, u1, v1);

                pushVert(x0, yLevel, z0, u0, v0);
                pushVert(x1, yLevel, z1, u1, v1);
                pushVert(x0, yLevel, z1, u0, v1);
            }
        }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    return new THREE.Mesh(geo, material);
}

function buildStaircaseMeshes(dk) {
    var stepMat = dk
        ? new THREE.MeshLambertMaterial({ map: backroomsL1WallTexture, color: 0x353942 })
        : new THREE.MeshBasicMaterial({ map: backroomsL1WallTexture, color: 0x9aa0a8 });
    var treadMat = dk
        ? new THREE.MeshLambertMaterial({ map: backroomsL1FloorTexture, color: 0x3e424c })
        : new THREE.MeshBasicMaterial({ map: backroomsL1FloorTexture, color: 0xb0b5bd });
    var railMat = dk
        ? new THREE.MeshLambertMaterial({ color: 0x2e343d })
        : new THREE.MeshBasicMaterial({ color: 0x5c6470 });
    var safetyMat = dk
        ? new THREE.MeshLambertMaterial({ color: 0x7c6518 })
        : new THREE.MeshBasicMaterial({ color: 0xd4a72c });
    var signMat = dk
        ? new THREE.MeshBasicMaterial({ color: 0x2b6b58 })
        : new THREE.MeshBasicMaterial({ color: 0x3ddc97 });

    var numSteps = 16;
    var totalRun = CELL * 2;
    var stepRun = totalRun / numSteps;
    var stepRise = SECOND_FLOOR_Y / numSteps;
    var slopeAngle = Math.atan2(SECOND_FLOOR_Y, totalRun);
    var railLen = Math.hypot(totalRun, SECOND_FLOOR_Y);

    for (var si = 0; si < backroomsStairs.length; si++) {
        var st = backroomsStairs[si];
        var group = new THREE.Group();

        for (var s = 0; s < numSteps; s++) {
            var h = (s + 1) * stepRise;
            var zCenter = (s + 0.5) * stepRun;
            var riserBox = new THREE.Mesh(new THREE.BoxGeometry(CELL - 0.02, h, stepRun + 0.02), stepMat);
            riserBox.position.set(0, h / 2, zCenter);
            group.add(riserBox);

            var treadCap = new THREE.Mesh(new THREE.BoxGeometry(CELL - 0.02, 0.04, stepRun), treadMat);
            treadCap.position.set(0, h + 0.01, zCenter);
            group.add(treadCap);

            if (s === 0 || s === numSteps - 1) {
                var nosing = new THREE.Mesh(new THREE.BoxGeometry(CELL - 0.14, 0.05, 0.09), safetyMat);
                nosing.position.set(0, h + 0.02, s === 0 ? zCenter - stepRun / 2 + 0.05 : zCenter + stepRun / 2 - 0.05);
                group.add(nosing);
            }
        }

        // Structural slab collar sealing y = WALL_H .. SECOND_FLOOR_Y around the stairwell opening.
        var slabH = SECOND_FLOOR_Y - WALL_H + 0.06;
        var slabCenterY = (WALL_H + SECOND_FLOOR_Y) / 2;

        var leftCollar = new THREE.Mesh(new THREE.BoxGeometry(0.28, slabH, totalRun + 0.4), stepMat);
        leftCollar.position.set(-CELL / 2 + 0.06, slabCenterY, totalRun / 2);
        group.add(leftCollar);

        var rightCollar = new THREE.Mesh(new THREE.BoxGeometry(0.28, slabH, totalRun + 0.4), stepMat);
        rightCollar.position.set(CELL / 2 - 0.06, slabCenterY, totalRun / 2);
        group.add(rightCollar);

        var frontHeader = new THREE.Mesh(new THREE.BoxGeometry(CELL + 0.2, slabH, 0.36), stepMat);
        frontHeader.position.set(0, slabCenterY, -0.06);
        group.add(frontHeader);

        // Glowing exit/level sign on the stairwell header ("LEVEL 1 ↑" indicator bar).
        var signBacking = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.26, 0.08), railMat);
        signBacking.position.set(0, WALL_H - 0.22, -0.24);
        group.add(signBacking);
        var signFace = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.18, 0.03), signMat);
        signFace.position.set(0, WALL_H - 0.22, -0.29);
        group.add(signFace);

        // Flush steel handrails along both side walls.
        for (var side = -1; side <= 1; side += 2) {
            var rx = side * (CELL / 2 - 0.14);
            var rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, railLen, 6), railMat);
            rail.rotation.x = Math.PI / 2 - slopeAngle;
            rail.position.set(rx, SECOND_FLOOR_Y / 2 + 0.95, totalRun / 2);
            group.add(rail);

            for (var p = 0; p <= 4; p++) {
                var frac = p / 4;
                var post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6), railMat);
                post.position.set(rx, frac * SECOND_FLOOR_Y + 0.475, frac * totalRun);
                group.add(post);
            }
        }

        group.position.set(st.originX, 0, st.originZ);
        group.rotation.y = Math.atan2(st.dx, st.dz);
        scene.add(group);
    }
}

function canBlockFloorCellWithoutCut(m, gx, gz, blockedSet) {
    var cDirs = [{ dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 }];
    var openNeighbors = [];
    for (var i = 0; i < cDirs.length; i++) {
        var nx = gx + cDirs[i].dx, nz = gz + cDirs[i].dz;
        if (m[nx] && m[nx][nz] === 0 && !isStairShaftCell(nx, nz) && !blockedSet[nx + ',' + nz]) {
            openNeighbors.push({ x: nx, z: nz });
        }
    }
    if (openNeighbors.length < 2) return false;

    var start = openNeighbors[0];
    var vis = {};
    vis[start.x + ',' + start.z] = true;
    var q = [start];
    while (q.length > 0) {
        var cur = q.shift();
        for (var d = 0; d < 4; d++) {
            var ux = cur.x + cDirs[d].dx, uz = cur.z + cDirs[d].dz;
            if (Math.abs(ux - gx) > 2 || Math.abs(uz - gz) > 2) continue;
            if (ux === gx && uz === gz) continue;
            if (ux < 1 || ux >= GRID_SIZE - 1 || uz < 1 || uz >= GRID_SIZE - 1) continue;
            var uk = ux + ',' + uz;
            if (vis[uk] || blockedSet[uk] || isStairShaftCell(ux, uz)) continue;
            if (!m[ux] || m[ux][uz] !== 0) continue;
            vis[uk] = true;
            q.push({ x: ux, z: uz });
        }
    }
    for (var k = 1; k < openNeighbors.length; k++) {
        if (!vis[openNeighbors[k].x + ',' + openNeighbors[k].z]) return false;
    }
    return true;
}

function addBackroomsLevel1Decorations() {
    var dk = isDarkEscapeMode;
    var baseY = SECOND_FLOOR_Y;
    var m1 = getMazeForFloor(1);
    var blockedSet = {};
    var crateMat = dk
        ? new THREE.MeshLambertMaterial({ map: crateTexture, color: 0x3b352c })
        : new THREE.MeshBasicMaterial({ map: crateTexture });
    var pillarMat = dk
        ? new THREE.MeshLambertMaterial({ map: backroomsL1WallTexture, color: 0x32353d })
        : new THREE.MeshBasicMaterial({ map: backroomsL1WallTexture, color: 0xb6bcc4 });
    var stripeMat = dk
        ? new THREE.MeshLambertMaterial({ color: 0x7c6318 })
        : new THREE.MeshBasicMaterial({ color: 0xd4a528 });
    var pipeMat = dk
        ? new THREE.MeshLambertMaterial({ color: 0x262b33 })
        : new THREE.MeshBasicMaterial({ color: 0x525a66 });
    var puddleMat = dk
        ? new THREE.MeshLambertMaterial({ color: 0x16222c, transparent: true, opacity: 0.72 })
        : new THREE.MeshBasicMaterial({ color: 0x3a4b59, transparent: true, opacity: 0.58 });

    var upperCells = walkableCells.filter(function (c) { return (c.floor || 0) === 1; });
    shuffle(upperCells);
    var propBudget = Math.min(Math.max(18, Math.floor(GRID_SIZE * 0.9)), upperCells.length);
    var placed = [];

    for (var i = 0; i < upperCells.length && placed.length < propBudget; i++) {
        var cell = upperCells[i];
        var nearStair = false;
        for (var si = 0; si < backroomsStairs.length; si++) {
            if (Math.hypot(cell.x - backroomsStairs[si].c3.x, cell.z - backroomsStairs[si].c3.z) < 2.2) {
                nearStair = true;
                break;
            }
        }
        if (nearStair) continue;

        var pos = gridToWorld(cell.x, cell.z);
        var fx = pos.x + (Math.random() - 0.5) * 0.4;
        var fz = pos.z + (Math.random() - 0.5) * 0.4;

        var tooClose = false;
        for (var pi = 0; pi < placed.length; pi++) {
            if (Math.hypot(fx - placed[pi].x, fz - placed[pi].z) < 5.0) { tooClose = true; break; }
        }
        if (tooClose) continue;

        var canBlock = canBlockFloorCellWithoutCut(m1, cell.x, cell.z, blockedSet);
        var roll = canBlock ? Math.random() : 0.85;
        placed.push({ x: fx, z: fz });

        if (roll < 0.50) {
            // Backrooms Level 1 ("Habitable Zone") wooden supply crate — jumpable!
            blockedSet[cell.x + ',' + cell.z] = true;
            var crateH = 0.85;
            var crate = new THREE.Mesh(new THREE.BoxGeometry(0.92, crateH, 0.92), crateMat);
            crate.position.set(fx, baseY + crateH / 2, fz);
            crate.rotation.y = Math.random() * 0.5 - 0.25;
            scene.add(crate);
            decorations.push({
                x: fx, z: fz, baseY: baseY, floor: 1,
                radius: 0.62, height: crateH, jumpable: true, blockPath: true, type: 'crate'
            });
        } else if (roll < 0.78) {
            // Parking-garage structural concrete column with yellow safety band.
            blockedSet[cell.x + ',' + cell.z] = true;
            var colGroup = new THREE.Group();
            var col = new THREE.Mesh(new THREE.BoxGeometry(0.76, SECOND_WALL_H, 0.76), pillarMat);
            col.position.y = SECOND_WALL_H / 2;
            colGroup.add(col);

            var band = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.26, 0.80), stripeMat);
            band.position.y = 0.55;
            colGroup.add(band);

            colGroup.position.set(fx, baseY, fz);
            scene.add(colGroup);
            decorations.push({
                x: fx, z: fz, baseY: baseY, floor: 1,
                radius: 0.55, height: SECOND_WALL_H, jumpable: false, blockPath: true, type: 'pillar'
            });
        } else {
            // Almond-water / condensation puddle + overhead industrial pipe segment (non-blocking!).
            var puddle = new THREE.Mesh(
                new THREE.CircleGeometry(0.55 + Math.random() * 0.45, 14),
                puddleMat
            );
            puddle.rotation.x = -Math.PI / 2;
            puddle.position.set(fx, baseY + 0.025, fz);
            scene.add(puddle);

            var pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, CELL, 8), pipeMat);
            pipe.rotation.z = Math.PI / 2;
            if (Math.random() < 0.5) pipe.rotation.y = Math.PI / 2;
            pipe.position.set(pos.x, baseY + SECOND_WALL_H - 0.16, pos.z);
            scene.add(pipe);
        }
    }
}

function buildWorld() {
    var mats = getMapMats();
    scene.background = new THREE.Color(mats.fogColor);
    var fogNear, fogFar;
    if (isDarkEscapeMode) {
        fogNear = 1.0;
        fogFar = 6.0;
    } else {
        fogNear = mats.outdoor ? 15 : 2;
        fogFar = mats.outdoor ? 140 : 35;
    }
    scene.fog = new THREE.Fog(mats.fogColor, fogNear, fogFar);
    decorations = [];

    var wallCount = 0;
    for (var x = 0; x < GRID_SIZE; x++) {
        for (var z = 0; z < GRID_SIZE; z++) {
            if (maze[x][z] === 1) wallCount++;
        }
    }

    if (wallCount > 0) {
        var walls = new THREE.InstancedMesh(getSharedBox(), mats.wallMat, wallCount);
        walls.instanceMatrix.setUsage(THREE.StaticDrawUsage || 0);
        var dummy = new THREE.Object3D();
        var wi = 0;
        for (var wx = 0; wx < GRID_SIZE; wx++) {
            for (var wz = 0; wz < GRID_SIZE; wz++) {
                if (maze[wx][wz] !== 1) continue;
                var pos = gridToWorld(wx, wz);
                dummy.position.set(pos.x, WALL_H / 2, pos.z);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                walls.setMatrixAt(wi++, dummy.matrix);
            }
        }
        walls.instanceMatrix.needsUpdate = true;
        scene.add(walls);
    }

    if (hasSecondFloorActive() && mazeFloors[1]) {
        // Two-story Backrooms: Level 0 ("The Lobby") below + Level 1 ("Habitable Zone") above,
        // connected through real stairwell cutouts in the acoustic ceiling & concrete slab.
        var f0Floor = buildGridHorizontalMesh(0.01, true, mats.floorMat, false, 1.5);
        if (f0Floor) scene.add(f0Floor);

        var f0Ceil = buildGridHorizontalMesh(WALL_H, false, mats.ceilMat, true, 1.0);
        if (f0Ceil) scene.add(f0Ceil);

        var m1 = mazeFloors[1];
        var wallCountUpper = 0;
        for (var ux = 0; ux < GRID_SIZE; ux++) {
            for (var uz = 0; uz < GRID_SIZE; uz++) {
                if (m1[ux][uz] === 1) wallCountUpper++;
            }
        }
        if (wallCountUpper > 0) {
            var upperWalls = new THREE.InstancedMesh(getSharedBoxUpper(), mats.upperWallMat || mats.wallMat, wallCountUpper);
            upperWalls.instanceMatrix.setUsage(THREE.StaticDrawUsage || 0);
            var dummyU = new THREE.Object3D();
            var uwi = 0;
            for (var wx2 = 0; wx2 < GRID_SIZE; wx2++) {
                for (var wz2 = 0; wz2 < GRID_SIZE; wz2++) {
                    if (m1[wx2][wz2] !== 1) continue;
                    var pos2 = gridToWorld(wx2, wz2);
                    dummyU.position.set(pos2.x, SECOND_FLOOR_Y + SECOND_WALL_H / 2, pos2.z);
                    dummyU.rotation.set(0, 0, 0);
                    dummyU.updateMatrix();
                    upperWalls.setMatrixAt(uwi++, dummyU.matrix);
                }
            }
            upperWalls.instanceMatrix.needsUpdate = true;
            scene.add(upperWalls);
        }

        var f1Floor = buildGridHorizontalMesh(SECOND_FLOOR_Y + 0.01, true, mats.upperFloorMat || mats.floorMat, true, 1.25);
        if (f1Floor) scene.add(f1Floor);

        var f1Ceil = buildGridHorizontalMesh(SECOND_FLOOR_Y + SECOND_WALL_H, false, mats.upperCeilMat || mats.ceilMat, false, 1.0);
        if (f1Ceil) scene.add(f1Ceil);

        buildStaircaseMeshes(isDarkEscapeMode);
        addBackroomsLevel1Decorations();
    } else {
        var floorSize = GRID_SIZE * CELL;
        var floor = new THREE.Mesh(getFloorGeo(floorSize), mats.floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.01;
        scene.add(floor);

        if (!mats.outdoor && mats.ceilMat) {
            var ceiling = new THREE.Mesh(getFloorGeo(floorSize), mats.ceilMat);
            ceiling.rotation.x = Math.PI / 2;
            ceiling.position.y = WALL_H;
            scene.add(ceiling);
        }
    }

    if (currentMap === 'hospital') addHospitalDecorations();
    else if (isForestMap()) addForestDecorations();

    rebuildPathGrid();
    if (mats.outdoor) addForestNightSky();

    ensureAmbientLight();
    // Dark Escape keeps almost no ambient light so the flashlight and the short
    // player glow do the work, but there is enough base light that a wall you
    // are standing against is never a pure black silhouette.
    worldAmbientLight.intensity = isDarkEscapeMode ? 0.16 : 0.9;
}

// ==========================================
// WAREHOUSE DECORATIONS
// ==========================================
// ==========================================
// HOSPITAL DECORATIONS
// ==========================================
function addHospitalDecorations() {
    var dk = isDarkEscapeMode;
    var gurneyMat = dk ? new THREE.MeshLambertMaterial({ color: 0x25272e }) : new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    var sheetMat = dk ? new THREE.MeshLambertMaterial({ color: 0x3a3d45 }) : new THREE.MeshBasicMaterial({ color: 0xffffff });
    var equipMat = dk ? new THREE.MeshLambertMaterial({ color: 0x1f3243 }) : new THREE.MeshBasicMaterial({ color: 0x446688 });
    var bloodMat = dk ? new THREE.MeshLambertMaterial({ color: 0x30080a }) : new THREE.MeshBasicMaterial({ color: 0x8B0000 });
    var wheelchairMat = dk ? new THREE.MeshLambertMaterial({ color: 0x20222a }) : new THREE.MeshBasicMaterial({ color: 0x333333 });

    var shuffled = walkableCells.slice().sort(function () { return Math.random() - 0.5; });
    var decorCount = Math.min(20, shuffled.length);

    for (var i = 0; i < decorCount; i++) {
        var cell = shuffled[i];
        var pos = gridToWorld(cell.x, cell.z);
        var offsetX = (Math.random() - 0.5) * CELL * 0.25;
        var offsetZ = (Math.random() - 0.5) * CELL * 0.25;
        var finalX = pos.x + offsetX;
        var finalZ = pos.z + offsetZ;

        var tooClose = false;
        for (var d = 0; d < decorations.length; d++) {
            if (Math.hypot(finalX - decorations[d].x, finalZ - decorations[d].z) < 4.5) { tooClose = true; break; }
        }
        if (tooClose) continue;

        var typeRoll = Math.random();
        if (typeRoll < 0.35) {
            var gurneyGroup = new THREE.Group();
            var frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 2.2), gurneyMat);
            frame.position.y = 0.7;
            gurneyGroup.add(frame);
            for (var lx = -0.4; lx <= 0.4; lx += 0.8) {
                for (var lz = -0.9; lz <= 0.9; lz += 1.8) {
                    var leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), gurneyMat);
                    leg.position.set(lx, 0.35, lz);
                    gurneyGroup.add(leg);
                }
            }
            var sheet = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 2.0), sheetMat);
            sheet.position.y = 0.85;
            gurneyGroup.add(sheet);
            gurneyGroup.position.set(finalX, 0, finalZ);
            gurneyGroup.rotation.y = Math.random() * Math.PI;
            scene.add(gurneyGroup);
            decorations.push({ x: finalX, z: finalZ, radius: 1.2, height: 0.85, jumpable: true, blockPath: true });
        } else if (typeRoll < 0.55) {
            var stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 1.8, 8), gurneyMat);
            stand.position.set(finalX, 0.9, finalZ);
            scene.add(stand);
            var monitor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.15), equipMat);
            monitor.position.set(finalX, 1.7, finalZ);
            scene.add(monitor);
            decorations.push({ x: finalX, z: finalZ, radius: 0.3, height: 1.8, jumpable: false, blockPath: true });
        } else if (typeRoll < 0.75) {
            var seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.6), wheelchairMat);
            seat.position.set(finalX, 0.5, finalZ);
            scene.add(seat);
            var back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.12), wheelchairMat);
            back.position.set(finalX, 0.85, finalZ - 0.25);
            scene.add(back);
            var wheelMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
            for (var wx = -0.35; wx <= 0.35; wx += 0.7) {
                var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 12), wheelMat);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(finalX + wx, 0.25, finalZ);
                scene.add(wheel);
            }
            decorations.push({ x: finalX, z: finalZ, radius: 0.45, height: 0.85, jumpable: true, blockPath: true });
        } else {
            var stain = new THREE.Mesh(
                new THREE.PlaneGeometry(0.6 + Math.random() * 0.6, 0.6 + Math.random() * 0.6),
                bloodMat
            );
            stain.rotation.x = -Math.PI / 2;
            stain.position.set(finalX, 0.02, finalZ);
            scene.add(stain);
        }
    }
}

// ==========================================
// FOREST DECORATIONS & NIGHT SKY
// ==========================================
var forestSky = null;

function getForestSky() {
    if (forestSky) return forestSky;

    // Bright, dense stars covering the viewable sky. No sprite/moon geometry is used,
    // which removes the transparent "empty circle" that was hiding stars near it.
    var starCount = 900;
    var positions = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount; i++) {
        var theta = Math.random() * Math.PI * 2;
        var phi = Math.random() * 1.25 + 0.12;
        var r = 150;
        positions[i * 3] = Math.cos(phi) * Math.cos(theta) * r;
        positions[i * 3 + 1] = Math.sin(phi) * r;
        positions[i * 3 + 2] = Math.cos(phi) * Math.sin(theta) * r;
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // Not shared: clearScene() disposes these GPU resources when a forest run ends.
    var starMat = new THREE.PointsMaterial({ color: 0xdfe9ff, size: 1.15, sizeAttenuation: false, fog: false });
    var stars = new THREE.Points(starGeo, starMat);
    stars.frustumCulled = false;

    forestSky = { stars: stars };
    return forestSky;
}

function addForestNightSky() {
    // Regenerate the stars each time the forest loads.
    forestSky = null;
    var sky = getForestSky();
    if (scene.children.indexOf(sky.stars) === -1) scene.add(sky.stars);
}

function getSharedLogGeo() {
    if (!SHARED_GEO.log) SHARED_GEO.log = markShared(new THREE.CylinderGeometry(0.32, 0.44, 1, 8));
    return SHARED_GEO.log;
}

function getSharedRockGeo() {
    if (!SHARED_GEO.rock) SHARED_GEO.rock = markShared(new THREE.IcosahedronGeometry(1, 0));
    return SHARED_GEO.rock;
}

function getSharedStumpGeo() {
    if (!SHARED_GEO.stump) SHARED_GEO.stump = markShared(new THREE.CylinderGeometry(0.7, 0.9, 1, 10));
    return SHARED_GEO.stump;
}

function getForestMats() {
    if (!SHARED_MATS.forestBark) {
        SHARED_MATS.forestBark = markShared(new THREE.MeshBasicMaterial({ color: 0x6b4223 }));
        SHARED_MATS.forestBarkDark = markShared(new THREE.MeshBasicMaterial({ color: 0x4a2e18 }));
        SHARED_MATS.forestLeaf = markShared(new THREE.MeshBasicMaterial({ color: 0x2f7d32 }));
        SHARED_MATS.forestLeafLight = markShared(new THREE.MeshBasicMaterial({ color: 0x3f9142 }));
        SHARED_MATS.forestRock = markShared(new THREE.MeshBasicMaterial({ color: 0x6f7378 }));
        SHARED_MATS.forestRockDark = markShared(new THREE.MeshBasicMaterial({ color: 0x4d5054 }));
    }
    return SHARED_MATS;
}

function forestPlacementClear(fx, fz, placed, minDist) {
    for (var i = 0; i < placed.length; i++) {
        if (Math.hypot(placed[i].x - fx, placed[i].z - fz) < minDist) return false;
    }
    return true;
}

function forestPullPosition(cell, placed, minDist) {
    var pos = gridToWorld(cell.x, cell.z);
    for (var attempt = 0; attempt < 3; attempt++) {
        var fx = pos.x + (Math.random() - 0.5) * CELL * 0.7;
        var fz = pos.z + (Math.random() - 0.5) * CELL * 0.7;
        if (forestPlacementClear(fx, fz, placed, minDist)) return { x: fx, z: fz };
    }
    return null;
}

function addFallenTree(x, z, rotY, tall) {
    var mats = getForestMats();
    var height = tall ? 1.55 + Math.random() * 0.45 : 0.62 + Math.random() * 0.18;
    var length = tall ? 4.4 + Math.random() * 1.2 : 3.2 + Math.random() * 1.2;
    var radius = tall ? 1.35 : 1.05;
    var group = new THREE.Group();
    var bark = tall ? mats.forestBarkDark : mats.forestBark;

    var log = new THREE.Mesh(getSharedLogGeo(), bark);
    log.scale.set(0.9 + Math.random() * 0.35, length, 0.9 + Math.random() * 0.35);
    log.rotation.z = Math.PI / 2;
    log.position.y = height / 2;
    group.add(log);

    // Broken branches give the dead tree a bit more silhouette.
    var branchCount = tall ? 3 : 2;
    for (var i = 0; i < branchCount; i++) {
        var branch = new THREE.Mesh(getSharedLogGeo(), mats.forestBarkDark);
        var side = i % 2 === 0 ? 1 : -1;
        branch.scale.set(0.45, 1.0 + Math.random() * 0.8, 0.45);
        branch.position.set(side * (0.3 + Math.random() * 0.25), height / 2 + (i - 1) * 0.2, (Math.random() - 0.5) * length * 0.55);
        branch.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        branch.rotation.x = (Math.random() - 0.5) * 0.5;
        group.add(branch);
    }

    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    scene.add(group);
    decorations.push({ x: x, z: z, radius: radius, height: height, jumpable: !tall, blockPath: true, type: 'fallenTree' });
}

function addForestRock(x, z, rotY, big) {
    var mats = getForestMats();
    var radius = big ? 1.25 : 0.9;
    var height = big ? 2.0 + Math.random() * 0.35 : 0.66 + Math.random() * 0.16;
    var rock = new THREE.Mesh(getSharedRockGeo(), big ? mats.forestRockDark : mats.forestRock);
    rock.scale.set(radius, height, radius * (0.8 + Math.random() * 0.35));
    rock.rotation.y = rotY;
    rock.position.y = height / 2;
    scene.add(rock);
    decorations.push({ x: x, z: z, radius: radius, height: height, jumpable: !big, blockPath: true, type: 'rock' });
}

function addForestStump(x, z, rotY) {
    var mats = getForestMats();
    var height = 0.5 + Math.random() * 0.22;
    var stump = new THREE.Mesh(getSharedStumpGeo(), mats.forestBarkDark);
    stump.scale.set(1, height, 1);
    stump.rotation.y = rotY;
    stump.position.y = height / 2;
    scene.add(stump);

    var cap = new THREE.Mesh(getSharedCircleGeo(), mats.forestBark);
    cap.rotation.x = -Math.PI / 2;
    cap.scale.set(0.62, 0.62, 1);
    cap.position.y = height + 0.01;
    scene.add(cap);
    decorations.push({ x: x, z: z, radius: 0.65, height: height, jumpable: true, blockPath: true, type: 'stump' });
}

function addForestBush(x, z, rotY) {
    var mats = getForestMats();
    var bush = new THREE.Mesh(getSharedSphereGeo(), mats.forestLeafLight);
    bush.scale.set(1.0, 0.75, 1.0);
    bush.position.set(x, 0.42, z);
    bush.rotation.y = rotY;
    scene.add(bush);
    decorations.push({ x: x, z: z, radius: 0.6, height: 0.55, jumpable: true, blockPath: true, type: 'bush' });
}

function addForestDecorations() {
    var shuffled = walkableCells.slice().sort(function () { return Math.random() - 0.5; });

    // Place a healthy number of large props first so they're guaranteed to be visible.
    var propCount = Math.max(40, Math.min(90, Math.floor(GRID_SIZE * 1.25)));
    var propCells = [];
    for (var pi = 0; pi < shuffled.length && propCells.length < propCount; pi++) {
        var propCell = shuffled[pi];
        var pp = gridToWorld(propCell.x, propCell.z);
        if (!forestPlacementClear(pp.x, pp.z, propCells, 5.5)) continue;
        propCells.push({ x: pp.x, z: pp.z, cell: propCell });
    }

    var usedCells = [];
    for (var pc = 0; pc < propCells.length; pc++) {
        var propPos = propCells[pc];
        usedCells.push(propPos.cell);
        var roll = Math.random();
        var rot = Math.random() * Math.PI * 2;
        if (roll < 0.34) addFallenTree(propPos.x, propPos.z, rot, Math.random() < 0.28);
        else if (roll < 0.58) addForestRock(propPos.x, propPos.z, rot, Math.random() < 0.3);
        else if (roll < 0.82) addForestStump(propPos.x, propPos.z, rot);
        else addForestBush(propPos.x, propPos.z, rot);
    }

    // Force a dense perimeter of trees/hedges so the Forest has a visible edge
    // without spawning any solid maze cell blocks.
    var placed = [];
    for (var pz2 = 0; pz2 < propCells.length; pz2++) placed.push(propCells[pz2]);
    var treeCells = [];
    // Dense line of trees just inside the new perimeter wall so the Forest edge
    // is visibly treed while the actual boundary stays solid.
    for (var px = 1; px < GRID_SIZE - 1; px++) {
        for (var pz3 = 1; pz3 < GRID_SIZE - 1; pz3++) {
            var onEdge = (px === 1 || px === GRID_SIZE - 2 || pz3 === 1 || pz3 === GRID_SIZE - 2);
            if (!onEdge) continue;
            if (maze[px] && maze[px][pz3] !== 0) continue;
            if (px % 2 !== 0 && pz3 % 2 !== 0) continue;
            var edgeWorld = gridToWorld(px, pz3);
            if (!forestPlacementClear(edgeWorld.x, edgeWorld.z, placed, 1.15)) continue;
            placed.push({ x: edgeWorld.x, z: edgeWorld.z });
            treeCells.push({ x: edgeWorld.x, z: edgeWorld.z });
            usedCells.push({ x: px, z: pz3 });
        }
    }

    // Now cover the whole map (including the edges) with trees, keeping paths open enough to traverse.
    var treeCount = Math.floor(GRID_SIZE * GRID_SIZE * 0.24);
    treeCount = Math.max(400, Math.min(1100, treeCount));
    for (var i = 0; i < shuffled.length && treeCells.length < treeCount; i++) {
        var cell = shuffled[i];
        if (usedCells.indexOf(cell) !== -1) continue;
        var picked = forestPullPosition(cell, placed, 2.15);
        if (!picked) continue;
        placed.push(picked);
        treeCells.push(picked);
    }

    var mats = getForestMats();
    var trunkMat = mats.forestBark;
    var leafMat = mats.forestLeaf;
    var leafMatLight = mats.forestLeafLight;

    var trees = treeCells;
    var trunkMesh = trees.length > 0 ? new THREE.InstancedMesh(getSharedTrunkGeo(), trunkMat, trees.length) : null;
    var leafMeshA = trees.length > 0 ? new THREE.InstancedMesh(getSharedLeafGeo(), leafMat, trees.length) : null;
    var leafMeshB = trees.length > 0 ? new THREE.InstancedMesh(getSharedLeafGeo(), leafMatLight, trees.length) : null;
    var leafMeshC = trees.length > 0 ? new THREE.InstancedMesh(getSharedLeafGeo(), leafMat, trees.length) : null;
    if (trunkMesh) trunkMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage || 0);
    if (leafMeshA) leafMeshA.instanceMatrix.setUsage(THREE.StaticDrawUsage || 0);
    if (leafMeshB) leafMeshB.instanceMatrix.setUsage(THREE.StaticDrawUsage || 0);
    if (leafMeshC) leafMeshC.instanceMatrix.setUsage(THREE.StaticDrawUsage || 0);

    var dummy = new THREE.Object3D();
    for (var ti = 0; ti < trees.length; ti++) {
        var t = trees[ti];
        var treeHeight = 2.7 + Math.random() * 1.9;
        var canopySpread = 1.25 + Math.random() * 0.6;

        dummy.position.set(t.x, treeHeight / 2, t.z);
        dummy.scale.set(1, treeHeight, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        trunkMesh.setMatrixAt(ti, dummy.matrix);

        // Layered irregular canopy gives the trees a reader-friendly amount of detail.
        dummy.position.set(t.x, treeHeight + 0.7, t.z);
        dummy.scale.set(canopySpread, 1.3, canopySpread);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        leafMeshA.setMatrixAt(ti, dummy.matrix);

        dummy.position.set(t.x, treeHeight + 1.65, t.z);
        dummy.scale.set(canopySpread * 0.76, 1.1, canopySpread * 0.76);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        leafMeshB.setMatrixAt(ti, dummy.matrix);

        dummy.position.set(t.x, treeHeight + 2.3, t.z);
        dummy.scale.set(canopySpread * 0.48, 0.9, canopySpread * 0.48);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        leafMeshC.setMatrixAt(ti, dummy.matrix);

        decorations.push({ x: t.x, z: t.z, radius: 0.72, height: treeHeight, jumpable: false, blockPath: true, type: 'tree' });
    }

    if (trunkMesh) {
        trunkMesh.instanceMatrix.needsUpdate = true;
        leafMeshA.instanceMatrix.needsUpdate = true;
        leafMeshB.instanceMatrix.needsUpdate = true;
        leafMeshC.instanceMatrix.needsUpdate = true;
        scene.add(trunkMesh);
        scene.add(leafMeshA);
        scene.add(leafMeshB);
        scene.add(leafMeshC);
    }
}

// ==========================================
// A* PATHFINDING
// ==========================================
function findPath(startGx, startGz, endGx, endGz, maxIterations, floor) {
    var fl = floor || 0;
    var walkCheck;
    if (isEndlessMode) {
        walkCheck = function (gx, gz) {
            var wx = (gx + 0.5) * CELL;
            var wz = (gz + 0.5) * CELL;
            return getEndlessCell(wx, wz) === 0;
        };
    } else {
        walkCheck = function (gx, gz) {
            if (isStairShaftCell(gx, gz)) return false;
            return isPathWalkableGrid(gx, gz, fl);
        };
    }

    var startSnap = findNearestPathWalkableGrid(startGx, startGz, 3, fl);
    startGx = startSnap.x;
    startGz = startSnap.z;
    var endSnap = findNearestPathWalkableGrid(endGx, endGz, 3, fl);
    endGx = endSnap.x;
    endGz = endSnap.z;
    if (!walkCheck(startGx, startGz) || !walkCheck(endGx, endGz)) return [];

    var keyFn = function (x, z) { return x + ',' + z; };
    var open = [{ x: startGx, z: startGz, g: 0, f: 0 }];
    var closed = new Set();
    var cameFrom = new Map();
    var gScore = new Map();
    gScore.set(keyFn(startGx, startGz), 0);

    var heuristic = function (x, z) { return Math.abs(x - endGx) + Math.abs(z - endGz); };

    maxIterations = maxIterations || 3000;
    var iterations = 0;

    while (open.length > 0 && iterations < maxIterations) {
        iterations++;
        var bestIdx = 0;
        for (var i = 1; i < open.length; i++) {
            if (open[i].f < open[bestIdx].f) bestIdx = i;
        }
        var cur = open.splice(bestIdx, 1)[0];
        var curKey = keyFn(cur.x, cur.z);

        if (cur.x === endGx && cur.z === endGz) {
            var path = [];
            var k = curKey;
            while (cameFrom.has(k)) {
                var parts = k.split(',');
                path.unshift({ x: parseInt(parts[0]), z: parseInt(parts[1]) });
                k = cameFrom.get(k);
            }
            return path;
        }

        closed.add(curKey);
        var neighbors = [
            { x: cur.x + 1, z: cur.z, diag: false }, { x: cur.x - 1, z: cur.z, diag: false },
            { x: cur.x, z: cur.z + 1, diag: false }, { x: cur.x, z: cur.z - 1, diag: false },
            { x: cur.x + 1, z: cur.z + 1, diag: true, c1x: cur.x + 1, c1z: cur.z, c2x: cur.x, c2z: cur.z + 1 },
            { x: cur.x + 1, z: cur.z - 1, diag: true, c1x: cur.x + 1, c1z: cur.z, c2x: cur.x, c2z: cur.z - 1 },
            { x: cur.x - 1, z: cur.z + 1, diag: true, c1x: cur.x - 1, c1z: cur.z, c2x: cur.x, c2z: cur.z + 1 },
            { x: cur.x - 1, z: cur.z - 1, diag: true, c1x: cur.x - 1, c1z: cur.z, c2x: cur.x, c2z: cur.z - 1 }
        ];

        for (var ni = 0; ni < neighbors.length; ni++) {
            var n = neighbors[ni];
            if (!walkCheck(n.x, n.z)) continue;
            if (n.diag && (!walkCheck(n.c1x, n.c1z) || !walkCheck(n.c2x, n.c2z))) continue;
            var nKey = keyFn(n.x, n.z);
            if (closed.has(nKey)) continue;

            var tentativeG = (gScore.get(curKey) || 0) + 1;
            if (tentativeG < (gScore.get(nKey) || Infinity)) {
                cameFrom.set(nKey, curKey);
                gScore.set(nKey, tentativeG);
                var f = tentativeG + heuristic(n.x, n.z);
                var existing = open.find(function (o) { return o.x === n.x && o.z === n.z; });
                if (!existing) open.push({ x: n.x, z: n.z, g: tentativeG, f: f });
                else existing.f = f;
            }
        }
    }
    return [];
}

function isMultiFloorReachable(fromGx, fromGz, fromFloor, toGx, toGz, toFloor) {
    var f0 = fromFloor || 0;
    var f1 = toFloor || 0;
    if (!hasSecondFloorActive() || f0 === f1) {
        if (fromGx === toGx && fromGz === toGz) return true;
        return findPath(fromGx, fromGz, toGx, toGz, 20000, f0).length > 0;
    }
    for (var i = 0; i < backroomsStairs.length; i++) {
        var st = backroomsStairs[i];
        var entry = f0 === 0 ? st.c0 : st.c3;
        var exit  = f0 === 0 ? st.c3 : st.c0;
        var pA = (fromGx === entry.x && fromGz === entry.z)
            ? [entry]
            : findPath(fromGx, fromGz, entry.x, entry.z, 18000, f0);
        if (pA.length === 0) continue;
        var pB = (exit.x === toGx && exit.z === toGz)
            ? [exit]
            : findPath(exit.x, exit.z, toGx, toGz, 18000, f1);
        if (pB.length > 0) return true;
    }
    return false;
}

function smartFindPath(kanyeX, kanyeZ, playerX, playerZ, kanyeFloorOverride) {
    var dist = Math.hypot(kanyeX - playerX, kanyeZ - playerZ);

    if (isEndlessMode) {
        var kGrid = endlessWorldToGridGlobal(kanyeX, kanyeZ);
        var pGrid = endlessWorldToGridGlobal(playerX, playerZ);

        if (dist > 60) {
            var angle = Math.atan2(playerX - kanyeX, playerZ - kanyeZ);
            var midX = kanyeX + Math.sin(angle) * 15;
            var midZ = kanyeZ + Math.cos(angle) * 15;
            var midGrid = endlessWorldToGridGlobal(midX, midZ);
            return findPath(kGrid.x, kGrid.z, midGrid.x, midGrid.z, 700);
        } else if (dist > 30) {
            return findPath(kGrid.x, kGrid.z, pGrid.x, pGrid.z, 4000);
        } else {
            return findPath(kGrid.x, kGrid.z, pGrid.x, pGrid.z, 9000);
        }
    } else {
        var kG = worldToGrid(kanyeX, kanyeZ);
        var pG = worldToGrid(playerX, playerZ);

        if (isForestMap()) {
            return [];
        }

        var maxI = GRID_SIZE >= 40 ? 16000 : (GRID_SIZE > 30 ? 10000 : 6000);

        if (hasSecondFloorActive() && backroomsStairs.length > 0) {
            var pFloor = getPlayerFloor();
            var kFloor = kanyeFloorOverride !== undefined
                ? kanyeFloorOverride
                : ((kanye.baseY || 0) >= SECOND_FLOOR_Y * 0.5 ? 1 : 0);

            var botOnStair = getStairAt(kanyeX, kanyeZ);
            var playerOnStair = getStairAt(playerX, playerZ);

            // If both are inside the exact same stairwell, march directly along the ramp!
            if (botOnStair && playerOnStair === botOnStair) {
                return [];
            }

            // If nextbot is mid-stairwell, finish marching out the target landing without reversing!
            if (botOnStair) {
                if (pFloor === 1) {
                    return [{ x: botOnStair.c2.x, z: botOnStair.c2.z }, { x: botOnStair.c3.x, z: botOnStair.c3.z }];
                }
                return [{ x: botOnStair.c1.x, z: botOnStair.c1.z }, { x: botOnStair.c0.x, z: botOnStair.c0.z }];
            }

            // If player is mid-stairwell, route to that stairwell's landing on kFloor and charge onto the ramp!
            if (playerOnStair) {
                var targetLanding = kFloor === 0 ? playerOnStair.c0 : playerOnStair.c3;
                var rampNext = kFloor === 0
                    ? [{ x: playerOnStair.c1.x, z: playerOnStair.c1.z }, { x: playerOnStair.c2.x, z: playerOnStair.c2.z }]
                    : [{ x: playerOnStair.c2.x, z: playerOnStair.c2.z }, { x: playerOnStair.c1.x, z: playerOnStair.c1.z }];
                var pToStair = (kG.x === targetLanding.x && kG.z === targetLanding.z)
                    ? []
                    : findPath(kG.x, kG.z, targetLanding.x, targetLanding.z, maxI, kFloor);
                return pToStair.concat(rampNext);
            }

            // Cross-floor pursuit: pick shortest stairwell route (Manhattan lower bound + exact A* leg).
            if (kFloor !== pFloor) {
                var bestStair = null;
                var bestScore = Infinity;
                for (var si = 0; si < backroomsStairs.length; si++) {
                    var st = backroomsStairs[si];
                    var ent = kFloor === 0 ? st.c0 : st.c3;
                    var ext = kFloor === 0 ? st.c3 : st.c0;
                    var score = Math.abs(kG.x - ent.x) + Math.abs(kG.z - ent.z) +
                                Math.abs(pG.x - ext.x) + Math.abs(pG.z - ext.z);
                    if (score < bestScore) { bestScore = score; bestStair = st; }
                }
                if (bestStair) {
                    var entryCell = kFloor === 0 ? bestStair.c0 : bestStair.c3;
                    var rampSeq = kFloor === 0
                        ? [{ x: bestStair.c1.x, z: bestStair.c1.z }, { x: bestStair.c2.x, z: bestStair.c2.z }, { x: bestStair.c3.x, z: bestStair.c3.z }]
                        : [{ x: bestStair.c2.x, z: bestStair.c2.z }, { x: bestStair.c1.x, z: bestStair.c1.z }, { x: bestStair.c0.x, z: bestStair.c0.z }];
                    var leg = (kG.x === entryCell.x && kG.z === entryCell.z)
                        ? []
                        : findPath(kG.x, kG.z, entryCell.x, entryCell.z, maxI, kFloor);
                    return leg.concat(rampSeq);
                }
            }

            // Same floor pursuit on active floor `kFloor`.
            var hasMove2F = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD;
            var predX2 = playerX + (hasMove2F ? -Math.sin(player.yaw) * 3 : 0);
            var predZ2 = playerZ + (hasMove2F ? -Math.cos(player.yaw) * 3 : 0);
            var predG2 = worldToGrid(predX2, predZ2);
            var samePath = (!isStairShaftCell(predG2.x, predG2.z))
                ? findPath(kG.x, kG.z, predG2.x, predG2.z, maxI, kFloor)
                : [];
            if (samePath.length === 0) samePath = findPath(kG.x, kG.z, pG.x, pG.z, maxI, kFloor);
            return samePath;
        }

        var hasMovementInput = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD;
        var predX = playerX + (hasMovementInput ? -Math.sin(player.yaw) * 3 : 0);
        var predZ = playerZ + (hasMovementInput ? -Math.cos(player.yaw) * 3 : 0);
        var predGrid = worldToGrid(predX, predZ);

        var path = findPath(kG.x, kG.z, predGrid.x, predGrid.z, maxI, 0);
        if (path.length === 0) path = findPath(kG.x, kG.z, pG.x, pG.z, maxI, 0);
        return path;
    }
}

// ==========================================
// CREATE NEXTBOT SPRITE FROM SKIN
// ==========================================
function createSpriteFromSkin(skinId, callback) {
    var skinData = SKINS.find(function (s) { return s.id === skinId; });
    if (!skinData) skinData = SKINS[0];

    if (skinData.type === 'video' && skinId === saveData.selectedSkin) {
        var video = document.getElementById('scp-video');
        video.src = skinData.videoUrl;
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = false;
        video.volume = 0;
        video.playsInline = true;
        video.play().catch(function () {
            var playOnce = function () {
                video.play().catch(function () {});
                document.removeEventListener('click', playOnce);
                document.removeEventListener('touchstart', playOnce);
            };
            document.addEventListener('click', playOnce);
            document.addEventListener('touchstart', playOnce);
        });

        scpVideoTexture = new THREE.VideoTexture(video);
        scpVideoTexture.minFilter = THREE.NearestFilter;
        scpVideoTexture.magFilter = THREE.NearestFilter;
        var mat = new THREE.SpriteMaterial({ map: scpVideoTexture });
        var sprite = new THREE.Sprite(mat);
        sprite.scale.set(2.5, 2.5, 1);
        callback(sprite, true);
    } else {
        var url = skinData.url || SKINS[0].url;

        function finishSkinSprite(tex) {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            var m = new THREE.SpriteMaterial({ map: tex });
            var sp = new THREE.Sprite(m);
            sp.scale.set(2.5, 2.5, 1);
            callback(sp, false);
        }

        if (TEXTURE_CACHE[url]) {
            finishSkinSprite(TEXTURE_CACHE[url]);
        } else {
            textureLoader.load(url, function (tex) {
                TEXTURE_CACHE[url] = tex;
                finishSkinSprite(tex);
            }, undefined, function () {
                textureLoader.load(SKINS[0].url, function (tex) {
                    TEXTURE_CACHE[url] = tex;
                    finishSkinSprite(tex);
                });
            });
        }
    }
}

function createKanye() {
    var skinData = SKINS.find(function (s) { return s.id === saveData.selectedSkin; });
    createSpriteFromSkin(saveData.selectedSkin, function (sprite, isVideo) {
        kanye.sprite = sprite;
        kanye.usesVideo = isVideo;
        kanye.usesCustomAudio = skinData && skinData.type === 'image_audio';
        kanye.sprite.visible = !noBotMode;
        scene.add(kanye.sprite);
        kanye.sprite.position.set(kanye.x, (kanye.baseY || 0) + 1.25, kanye.z);
    });
}

// ==========================================
// POWERUPS
// ==========================================
function createPowerups(maxCount) {
    for (var pi = 0; pi < powerups.length; pi++) {
        if (powerups[pi].sprite) scene.remove(powerups[pi].sprite);
    }
    powerups.length = 0;

    var twoFloors = hasSecondFloorActive();
    var limit = maxCount !== undefined ? maxCount : (isDarkEscapeMode ? (twoFloors ? 28 : 20) : (twoFloors ? 18 : 12));

    var cells;
    if (isEndlessMode) cells = getEndlessWalkableCellsNear(player.x, player.z, 30);
    else cells = walkableCells.slice();

    var shuffled = shuffle(cells);
    var urls = {
        ice:     'assets/ice.png',
        speed:   'assets/speed.png',
        shield:  'assets/shield.png',
        battery: 'assets/battery-pickup-removebg-preview.png'
    };
    var typePool = isDarkEscapeMode ? DARK_ESCAPE_POWERUP_TYPES : POWERUP_TYPES;

    var placedPositions = [];
    var count = 0;

    shuffle(shuffled);

    for (var i = 0; i < shuffled.length && count < limit; i++) {
        var cell = shuffled[i];
        var fl = isEndlessMode ? 0 : (cell.floor || 0);
        var baseY = getFloorBaseY(fl);
        var pos;
        if (isEndlessMode) pos = { x: cell.wx, z: cell.wz, floor: 0 };
        else {
            if (!isWalkableGrid(cell.x, cell.z, fl)) continue;
            var wp = gridToWorld(cell.x, cell.z);
            pos = { x: wp.x, z: wp.z, floor: fl };
        }

        var tooClose = false;
        for (var p = 0; p < placedPositions.length; p++) {
            if (placedPositions[p].floor === fl &&
                Math.hypot(placedPositions[p].x - pos.x, placedPositions[p].z - pos.z) < MIN_POWERUP_SPACING) {
                tooClose = true; break;
            }
        }
        if (tooClose) continue;

        var type = typePool[count % typePool.length];
        placedPositions.push(pos);
        count++;

        var sprite = new THREE.Sprite(getSpriteMaterial(urls[type], true));
        sprite.scale.set(1.2, 1.2, 1);
        sprite.position.set(pos.x, baseY + 0.8, pos.z);
        scene.add(sprite);
        powerups.push({ type: type, x: pos.x, z: pos.z, baseY: baseY, floor: fl, sprite: sprite, collected: false });
    }
}

// ==========================================
// COINS
// ==========================================
function createCoins() {
    for (var ci = 0; ci < coins.length; ci++) {
        if (coins[ci].sprite) scene.remove(coins[ci].sprite);
    }
    coins.length = 0;
    spawnCoins();
}

function spawnCoins() {
    var cells;
    if (isEndlessMode) cells = getEndlessWalkableCellsNear(player.x, player.z, 25);
    else cells = walkableCells;

    var targetCoins = hasSecondFloorActive() ? 8 : 5;
    var available = cells.filter(function (cell) {
        var px, pz, fl;
        if (isEndlessMode) { px = cell.wx; pz = cell.wz; fl = 0; }
        else {
            fl = cell.floor || 0;
            if (!isWalkableGrid(cell.x, cell.z, fl)) return false;
            var p = gridToWorld(cell.x, cell.z);
            px = p.x; pz = p.z;
        }
        return !coins.some(function (c) {
            return !c.collected && (c.floor || 0) === fl && Math.hypot(c.x - px, c.z - pz) < 2;
        });
    });

    var shuffled = shuffle(available.slice());
    var activeCoins = coins.filter(function (c) { return !c.collected; }).length;
    var toSpawn = targetCoins - activeCoins;

    for (var i = 0; i < toSpawn && i < shuffled.length; i++) {
        var cell = shuffled[i];
        var fl = isEndlessMode ? 0 : (cell.floor || 0);
        var baseY = getFloorBaseY(fl);
        var pos;
        if (isEndlessMode) pos = { x: cell.wx, z: cell.wz };
        else pos = gridToWorld(cell.x, cell.z);

        var coinSprite = new THREE.Sprite(getSpriteMaterial('assets/coin.png', true));
        coinSprite.scale.set(0.8, 0.8, 1);
        coinSprite.position.set(pos.x, baseY + 0.6, pos.z);
        scene.add(coinSprite);
        coins.push({ x: pos.x, z: pos.z, baseY: baseY, floor: fl, sprite: coinSprite, collected: false });
    }
}

function getEndlessWalkableCellsNear(wx, wz, radius) {
    var cells = [];
    var ch = endlessWorldToChunk(wx, wz);
    for (var dx = -1; dx <= 1; dx++) {
        for (var dz = -1; dz <= 1; dz++) {
            var key = (ch.cx + dx) + ',' + (ch.cz + dz);
            var chunk = endlessChunks.get(key);
            if (!chunk) continue;
            for (var ci = 0; ci < chunk.walkable.length; ci++) {
                var c = chunk.walkable[ci];
                var wp = endlessLocalToWorld(c.x, c.z, ch.cx + dx, ch.cz + dz);
                if (Math.hypot(wp.x - wx, wp.z - wz) < radius * CELL) cells.push({ wx: wp.x, wz: wp.z });
            }
        }
    }
    return cells;
}

// ==========================================
// SPAWN ENTITIES (normal/escape mode)
// ==========================================
function spawnEntities() {
    if (walkableCells.length < 10) return;

    var desiredFloor = (hasSecondFloorActive() && testStartFloor === 1) ? 1 : 0;
    var spawnable = walkableCells.filter(function (c) {
        return (c.floor || 0) === desiredFloor && isWalkableGrid(c.x, c.z, c.floor || 0);
    });
    if (spawnable.length < 1) {
        spawnable = walkableCells.filter(function (c) { return isWalkableGrid(c.x, c.z, c.floor || 0); });
    }
    if (spawnable.length < 1) spawnable = walkableCells.slice();

    var chosenPlayerCell = spawnable[Math.floor(Math.random() * spawnable.length)];
    var pFloor = chosenPlayerCell.floor || 0;
    var pPos = gridToWorld(chosenPlayerCell.x, chosenPlayerCell.z);
    player.x = pPos.x;
    player.z = pPos.z;
    player.y = getFloorBaseY(pFloor) + 1.6;
    player.yaw = 0;
    player.pitch = 0;
    player.vy = 0;
    player.onGround = true;
    maxStamina = getMaxStamina();
    stamina = maxStamina;
    resetActiveEffects();

    var shieldId;
    if (isDarkEscapeMode) shieldId = null;
    else if (isEscapeMode) shieldId = 'escape-shield-toggle';
    else if (isChaosMode) shieldId = 'chaos-shield-toggle';
    else shieldId = 'start-shield-toggle';

    var shieldEl = shieldId ? document.getElementById(shieldId) : null;
    if (shieldEl && shieldEl.checked && saveData.coins >= 5) {
        saveData.coins -= 5;
        player.shieldHits = getBaseShieldHits(false);
        document.getElementById('shield-indicator').style.opacity = '1';
        document.getElementById('slot-shield').classList.add('active');
        saveSaveData();
        updateUI();
    }

    var validSpawns = shuffle(walkableCells.filter(function (c) {
        var fl = c.floor || 0;
        if (!isWalkableGrid(c.x, c.z, fl)) return false;
        var p = gridToWorld(c.x, c.z);
        return Math.hypot(p.x - player.x, p.z - player.z) > 20;
    }));

    var kCell = validSpawns[0] || walkableCells[0];
    var kFloor = kCell.floor || 0;
    var kBaseY = getFloorBaseY(kFloor);
    var kPos = gridToWorld(kCell.x, kCell.z);
    kanye.x = kPos.x;
    kanye.z = kPos.z;
    kanye.baseY = kBaseY;
    kanye.y = kBaseY + 1.25;
    kanye.vx = 0;
    kanye.vz = 0;
    kanye.pathTimer = 0;
    kanye.path = [];
    kanye.pathIndex = 0;
    kanye.stuckTimer = 0;
    kanye.frozen = false;
    kanye.frozenTimer = 0;
    kanye.halfSpeed = false;
    kanye.halfSpeedTimer = 0;
    if (kanye.sprite) {
        kanye.sprite.visible = !noBotMode;
        kanye.sprite.position.set(kanye.x, kBaseY + 1.25, kanye.z);
    }

    camera.position.set(player.x, player.y, player.z);
    createPowerups();
    createCoins();
    updateTestBadgeUI();
}

// ==========================================
// PICKUP MESSAGES & ACTIVATE POWERUP
// ==========================================
var pickupMessageTimeout = null;
function showPickupMessage(text, duration) {
    var msg = document.getElementById('pickup-msg');
    if (!msg) return;
    msg.textContent = text;
    msg.style.opacity = '1';
    if (pickupMessageTimeout) clearTimeout(pickupMessageTimeout);
    pickupMessageTimeout = setTimeout(function () { msg.style.opacity = '0'; }, duration || 2000);
}

function activatePowerup(type) {
    var msg = document.getElementById('pickup-msg');
    var upg = saveData.upgrades;
    var chaosBoost = isChaosMode;

    if (type === 'ice') {
        var freezeTime = chaosBoost ? 5 : 3;
        if (upg.ice >= 1) freezeTime += 1;
        if (upg.ice >= 2) freezeTime += 2;

        if (upg.ice >= 3) {
            var halfSpeedTargets = isChaosMode ? chaosNextbots : [kanye];
            for (var hi = 0; hi < halfSpeedTargets.length; hi++) {
                halfSpeedTargets[hi].halfSpeed = true;
                halfSpeedTargets[hi].halfSpeedTimer = 3;
            }
        }

        var freezeTargets = isChaosMode ? chaosNextbots : [kanye];
        for (var fi = 0; fi < freezeTargets.length; fi++) {
            freezeTargets[fi].frozen = true;
            freezeTargets[fi].frozenTimer = freezeTime;
        }

        document.getElementById('freeze-overlay').style.opacity = '1';
        msg.textContent = '❄️ FROZEN FOR ' + freezeTime + ' SECONDS!';
        document.getElementById('slot-ice').classList.add('active');
        setTimeout(function () { document.getElementById('slot-ice').classList.remove('active'); }, freezeTime * 1000);

    } else if (type === 'speed') {
        var duration = chaosBoost ? 15 : 10;
        if (upg.speed >= 1) duration += 3;
        if (upg.speed >= 2) duration += 2;
        if (upg.speed >= 3) {
            player.speedBoost = true;
            player.speedBoostTimer = 5;
        }
        player.infiniteStamina = true;
        player.infiniteStaminaTimer = duration;
        document.getElementById('stamina-bar').classList.add('infinite');
        if (upg.speed >= 3) document.getElementById('stamina-bar').classList.add('boosted');
        msg.textContent = '⚡ INFINITE STAMINA FOR ' + duration + ' SECONDS!';
        document.getElementById('slot-speed').classList.add('active');
        setTimeout(function () { document.getElementById('slot-speed').classList.remove('active'); }, duration * 1000);

    } else if (type === 'shield') {
        var shieldCount = getBaseShieldHits(chaosBoost);
        if (player.shieldHits > 0) {
            msg.textContent = '🛡️ SHIELD ALREADY ACTIVE!';
        } else {
            player.shieldHits = shieldCount;
            document.getElementById('shield-indicator').style.opacity = '1';
            msg.textContent = shieldCount > 1 ? '🛡️ SHIELD ACQUIRED (' + shieldCount + ' hits)!' : '🛡️ SHIELD ACQUIRED!';
            document.getElementById('slot-shield').classList.add('active');
        }

    } else if (type === 'battery') {
        // Battery pickup: restore flashlight charge. Only useful in Dark Escape.
        var battLv = upg.batteryPickup || 0;
        var gain = battLv >= 2 ? 25 : (battLv >= 1 ? 20 : 15);
        var maxBatt = (typeof flashlightMaxBattery !== 'undefined') ? flashlightMaxBattery : 100;
        flashlightBattery = Math.min(maxBatt, flashlightBattery + gain);
        // Turn flashlight back on if it died.
        if (!flashlightOn && flashlightBattery > 0 && isDarkEscapeMode) flashlightOn = true;
        // Lv3: 20% chance of 10s no-drain bonus.
        var noDrainBonus = battLv >= 3 && Math.random() < 0.20;
        if (noDrainBonus) {
            player.flashlightNoDrain = true;
            player.flashlightNoDrainTimer = 10;
            msg.textContent = '🔋 +' + gain + '% BATTERY + NO DRAIN 10s!';
        } else {
            msg.textContent = '🔋 BATTERY +' + gain + '%!';
        }
    }

    msg.style.opacity = '1';
    setTimeout(function () { msg.style.opacity = '0'; }, 2000);
}

// ==========================================
// UPDATE PLAYER
// ==========================================
function updatePlayer(dt) {
    if (isPaused || !pageVisible) return;
    if (!isLocked && !isMobile) return;

    var walkSpeed = 6.0;
    var sprintSpeed = 8.5;

    if (player.speedBoost) {
        player.speedBoostTimer -= dt;
        sprintSpeed = 9.5;
        if (player.speedBoostTimer <= 0) player.speedBoost = false;
    }

    if (player.shieldSpeedBoost) {
        player.shieldSpeedBoostTimer -= dt;
        walkSpeed = Math.max(walkSpeed, 8.4);
        sprintSpeed = Math.max(sprintSpeed, 10.5);
        if (player.shieldSpeedBoostTimer <= 0) player.shieldSpeedBoost = false;
    }

    if (player.infiniteStamina) {
        player.infiniteStaminaTimer -= dt;
        if (player.infiniteStaminaTimer <= 0) {
            player.infiniteStamina = false;
            document.getElementById('stamina-bar').classList.remove('infinite', 'boosted');
        }
    }

    var hasInput = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD ||
        (isMobile && (Math.abs(mobileJoystick.moveX) > 0.1 || Math.abs(mobileJoystick.moveZ) > 0.1));

    // rawSprintHeld is the literal sprint input, even when the player is standing
    // still. It drives the "must release and re-press before sprint re-enables"
    // rule so holding the key/toggle through the cooldown never auto-starts sprint.
    var rawSprintHeld = isSprinting || mobileSprintActive;
    var wantRaw = rawSprintHeld && hasInput;
    var regenRate = getStaminaRegenRate();
    var hasInfStam = player.infiniteStamina || testInfiniteStamina;

    if (hasInfStam) {
        sprintLocked = false;
        sprintNeedsRelease = false;
    }
    if (!hasInfStam && stamina <= 0) {
        sprintLocked = true;
        sprintNeedsRelease = true;
    }
    if (!hasInfStam && sprintLocked && !rawSprintHeld) {
        sprintNeedsRelease = false;
    }
    if (sprintLocked && !hasInfStam && !sprintNeedsRelease &&
        stamina >= maxStamina * 0.15) {
        sprintLocked = false;
    }
    var wantSprint = wantRaw && !sprintLocked && !sprintNeedsRelease;

    if (wantSprint && !hasInfStam) {
        stamina = Math.max(0, stamina - dt * 20);
        if (stamina <= 0 && !hasInfStam) {
            sprintLocked = true;
            sprintNeedsRelease = true;
        }
    } else if (!wantSprint) {
        stamina = Math.min(maxStamina, stamina + dt * regenRate);
    }

    var canSprint = wantSprint && (stamina > 0 || hasInfStam) && !sprintLocked;
    var moveSpeed = canSprint ? sprintSpeed : walkSpeed;

    var stamBarEl = document.getElementById('stamina-bar');
    stamBarEl.style.width =
        (hasInfStam ? 100 : (stamina / maxStamina * 100)) + '%';
    if (sprintLocked && !hasInfStam) {
        stamBarEl.classList.add('exhausted');
    } else {
        stamBarEl.classList.remove('exhausted');
    }

    var forwardX = -Math.sin(player.yaw);
    var forwardZ = -Math.cos(player.yaw);
    var rightX = Math.cos(player.yaw);
    var rightZ = -Math.sin(player.yaw);

    var moveX = 0, moveZ = 0;
    if (keys.KeyW) { moveX += forwardX; moveZ += forwardZ; }
    if (keys.KeyS) { moveX -= forwardX; moveZ -= forwardZ; }
    if (keys.KeyD) { moveX += rightX; moveZ += rightZ; }
    if (keys.KeyA) { moveX -= rightX; moveZ -= rightZ; }

    if (isMobile && mobileJoystick.active) {
        moveX += forwardX * mobileJoystick.moveZ + rightX * mobileJoystick.moveX;
        moveZ += forwardZ * mobileJoystick.moveZ + rightZ * mobileJoystick.moveX;
    }

    var len = Math.hypot(moveX, moveZ);
    if (len > 0) {
        moveX = (moveX / len) * moveSpeed;
        moveZ = (moveZ / len) * moveSpeed;
    }

    var sprintFovActive = canSprint && len > 0;
    var targetFov = (saveData.settings.fov || 75) + (sprintFovActive ? 6 : 0);
    if (Math.abs(camera.fov - targetFov) > 0.01) {
        camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 8);
        if (Math.abs(camera.fov - targetFov) < 0.01) camera.fov = targetFov;
        camera.updateProjectionMatrix();
    }

    var wasGrounded = player.onGround;
    var jumpedThisFrame = false;
    if ((keys.Space || mobileJumpPressed) && player.onGround) {
        player.vy = 6.0;
        player.onGround = false;
        mobileJumpPressed = false;
        jumpedThisFrame = true;
    }

    player.vy -= 18 * dt;

    var prevFootY = player.y - 1.6;
    var newX = player.x + moveX * dt;
    var newZ = player.z + moveZ * dt;
    var newY = player.y + player.vy * dt;

    if (!isWalkableWorld(newX, player.z, 0.35, player.y)) newX = player.x;
    if (!isWalkableWorld(newX, newZ, 0.35, player.y)) newZ = player.z;

    player.x = newX;
    player.z = newZ;

    var groundY = getGroundSurfaceAt(player.x, player.z, prevFootY);
    var groundEyeY = groundY + 1.6;

    var activeDecors = isEndlessMode ? endlessDecorations : decorations;
    var onDecor = false;
    var decorTopY = groundY;

    for (var di = 0; di < activeDecors.length; di++) {
        var dec = activeDecors[di];
        var dBase = dec.baseY || 0;
        if (Math.abs(dBase - groundY) > 1.0) continue;
        if (Math.hypot(player.x - dec.x, player.z - dec.z) < dec.radius + 0.3 && dec.height) {
            var top = dBase + dec.height + 0.1;
            if (player.vy <= 0 && newY <= top + 1.6 && newY > top + 1.3) {
                decorTopY = top;
                onDecor = true;
                break;
            }
        }
    }

    if (onDecor && player.vy <= 0) {
        newY = decorTopY + 1.6;
        player.vy = 0;
        player.onGround = true;
    } else if (newY <= groundEyeY || (wasGrounded && !jumpedThisFrame && newY - groundEyeY < 0.45)) {
        newY = groundEyeY;
        player.vy = 0;
        player.onGround = true;
    }

    var onStairNow = getStairAt(player.x, player.z);
    var ceilLimit = (hasSecondFloorActive() && (onStairNow || groundY >= SECOND_FLOOR_Y * 0.5))
        ? (SECOND_FLOOR_Y + SECOND_WALL_H - 0.3)
        : (WALL_H - 0.3);
    if (newY > ceilLimit) { newY = ceilLimit; player.vy = 0; }

    player.y = newY;

    // Smoothly blend atmosphere between Level 0 ("The Lobby") & Level 1 ("Habitable Zone")
    if (hasSecondFloorActive() && !isDarkEscapeMode && scene && scene.fog) {
        var curMats = getMapMats();
        if (curMats.fogColor !== undefined && curMats.upperFogColor !== undefined) {
            var blendT = Math.max(0, Math.min(1, (player.y - 1.6) / SECOND_FLOOR_Y));
            var r0 = (curMats.fogColor >> 16) & 255, g0 = (curMats.fogColor >> 8) & 255, b0 = curMats.fogColor & 255;
            var r1 = (curMats.upperFogColor >> 16) & 255, g1 = (curMats.upperFogColor >> 8) & 255, b1 = curMats.upperFogColor & 255;
            var rr = Math.round(r0 + (r1 - r0) * blendT);
            var gg = Math.round(g0 + (g1 - g0) * blendT);
            var bb = Math.round(b0 + (b1 - b0) * blendT);
            var blendedHex = (rr << 16) | (gg << 8) | bb;
            scene.fog.color.setHex(blendedHex);
            scene.background.setHex(blendedHex);
        }
    }

    camera.position.set(player.x, player.y, player.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;

    var playerFootNow = player.y - 1.6;
    for (var pi = 0; pi < powerups.length; pi++) {
        var pu = powerups[pi];
        if (!pu.collected &&
            Math.abs((pu.baseY || 0) - playerFootNow) < 1.8 &&
            Math.hypot(pu.x - player.x, pu.z - player.z) < 1.5) {
            if (pu.type === 'shield' && player.shieldHits > 0) {
                var now = Date.now();
                if (!pu.lastWarn || now - pu.lastWarn > 1300) {
                    pu.lastWarn = now;
                    showPickupMessage('🛡️ SHIELD ALREADY ACTIVE!', 1200);
                }
                continue;
            }
            pu.collected = true;
            if (pu.sprite) scene.remove(pu.sprite);
            activatePowerup(pu.type);
            if (isDarkEscapeMode) {
                pu.respawnAt = Date.now() + 9000 + Math.random() * 7000;
            }
        }
    }

    var coinValue = (isDarkEscapeMode && (isDarkEscapeHard || isDarkEscapeExtreme)) ? 2 : (isChaosMode ? 2 : 1);
    var needRespawn = false;
    for (var ci = 0; ci < coins.length; ci++) {
        var coin = coins[ci];
        if (!coin.collected &&
            Math.abs((coin.baseY || 0) - playerFootNow) < 1.8 &&
            Math.hypot(coin.x - player.x, coin.z - player.z) < 1.5) {
            coin.collected = true;
            if (coin.sprite) scene.remove(coin.sprite);
            sessionCoins += coinValue;
            document.getElementById('hud-coins').textContent = '💰 ' + sessionCoins;
            needRespawn = true;

            var pickupMsg = document.getElementById('pickup-msg');
            pickupMsg.textContent = '💰 +' + coinValue;
            pickupMsg.style.opacity = '1';
            setTimeout(function () { pickupMsg.style.opacity = '0'; }, 800);
        }
    }
    if (needRespawn) setTimeout(spawnCoins, 2000);

    if (isDarkEscapeMode) checkDarkEscapeProgress();
    if (isEscapeMode) checkEscapeDoors();
    if (isEndlessMode) {
        updateEndlessChunks();
        checkEndlessDoors();
    }
}

// ==========================================
// SHARED NEXTBOT UPDATE LOGIC
// ==========================================
function unstickNextbot(nb) {
    var nbFloor = hasSecondFloorActive() && (nb.baseY || 0) >= SECOND_FLOOR_Y * 0.5 ? 1 : 0;
    var candidates;
    if (isEndlessMode) candidates = getEndlessWalkableCellsNear(nb.x, nb.z, 14);
    else candidates = walkableCells;

    var bestDist = Infinity;
    var bestPos = null;
    var bestFloor = nbFloor;
    for (var i = 0; i < candidates.length; i++) {
        var cFl = isEndlessMode ? 0 : (candidates[i].floor || 0);
        if (!isEndlessMode && cFl !== nbFloor) continue;
        var p;
        if (isEndlessMode) p = { x: candidates[i].wx, z: candidates[i].wz };
        else p = gridToWorld(candidates[i].x, candidates[i].z);
        var bY = getFloorBaseY(cFl);
        if (!isWalkableWorld(p.x, p.z, 0.35, undefined, bY)) continue;
        var d = Math.hypot(p.x - nb.x, p.z - nb.z);
        if (d < bestDist) {
            bestDist = d;
            bestPos = p;
            bestFloor = cFl;
        }
    }
    if (bestPos) {
        nb.x = bestPos.x;
        nb.z = bestPos.z;
        nb.baseY = getFloorBaseY(bestFloor);
        nb.y = nb.baseY + 1.25;
        nb.vx = 0;
        nb.vz = 0;
        nb.pathTimer = 0;
        nb.path = [];
        nb.pathIndex = 0;
        if (nb.sprite) nb.sprite.position.set(nb.x, nb.baseY + 1.25, nb.z);
    }
}

function updateSingleNextbot(nb, dt) {
    if (!nb.sprite || isPaused || !pageVisible) return undefined;
    if (!nb.stuckTimer) nb.stuckTimer = 0;
    if (nb.baseY === undefined) nb.baseY = 0;

    if (noBotMode) {
        nb.sprite.visible = false;
        return Infinity;
    }
    nb.sprite.visible = true;

    if (!isWalkableWorld(nb.x, nb.z, 0.4, undefined, nb.baseY)) {
        unstickNextbot(nb);
        return Math.hypot(nb.x - player.x, nb.z - player.z);
    }

    if (nb.usesVideo && scpVideoTexture) scpVideoTexture.needsUpdate = true;

    if (nb.frozen) {
        nb.frozenTimer -= dt;
        if (nb.frozenTimer <= 0) {
            nb.frozen = false;
            var anyFrozen = false;
            if (isChaosMode) {
                for (var ci = 0; ci < chaosNextbots.length; ci++) {
                    if (chaosNextbots[ci].frozen) anyFrozen = true;
                }
            } else {
                if (kanye.frozen) anyFrozen = true;
            }
            if (!anyFrozen) document.getElementById('freeze-overlay').style.opacity = '0';
        }
        nb.sprite.material.color.setHex(nb.frozen ? 0x88ccff : 0xffffff);
        return Math.hypot(nb.x - player.x, nb.z - player.z);
    }

    if (nb.halfSpeed) {
        nb.halfSpeedTimer -= dt;
        if (nb.halfSpeedTimer <= 0) nb.halfSpeed = false;
    }

    var extremeSpeed = isDarkEscapeMode && isDarkEscapeExtreme;
    var baseSpeed = extremeSpeed ? 10.2 : 7.5;
    var maxSpeed = nb.halfSpeed ? baseSpeed * 0.6 : baseSpeed;
    var nbFloor = hasSecondFloorActive() && nb.baseY >= SECOND_FLOOR_Y * 0.5 ? 1 : 0;

    nb.pathTimer -= dt;
    if (nb.pathTimer <= 0) {
        nb.pathTimer = extremeSpeed ? 0.22 : (isForestMap() ? 0.35 : 0.3);
        nb.path = smartFindPath(nb.x, nb.z, player.x, player.z, nbFloor);
        nb.pathIndex = 0;
    }

    var targetX = player.x;
    var targetZ = player.z;
    if (nb.path.length > 0) {
        while (nb.pathIndex < nb.path.length) {
            var node = nb.path[nb.pathIndex];
            var nodePos;
            if (isEndlessMode) nodePos = endlessGridToWorld(node.x, node.z);
            else nodePos = gridToWorld(node.x, node.z);

            if (Math.hypot(nodePos.x - nb.x, nodePos.z - nb.z) < 1.5 && nb.pathIndex < nb.path.length - 1) {
                nb.pathIndex++;
            } else {
                targetX = nodePos.x;
                targetZ = nodePos.z;
                break;
            }
        }
    }

    var dx = targetX - nb.x;
    var dz = targetZ - nb.z;
    var dist = Math.hypot(dx, dz);
    if (dist > 0.1) {
        var desiredVx = (dx / dist) * maxSpeed;
        var desiredVz = (dz / dist) * maxSpeed;
        nb.vx += (desiredVx - nb.vx) * 3.5 * dt;
        nb.vz += (desiredVz - nb.vz) * 3.5 * dt;
        var speed = Math.hypot(nb.vx, nb.vz);
        if (speed > maxSpeed) {
            nb.vx = (nb.vx / speed) * maxSpeed;
            nb.vz = (nb.vz / speed) * maxSpeed;
        }
    }

    var onStairBot = getStairAt(nb.x, nb.z);
    if (!onStairBot) {
        var decs = isEndlessMode ? endlessDecorations : decorations;
        for (var di = 0; di < decs.length; di++) {
            var dec = decs[di];
            if (!isEndlessMode && (dec.floor || 0) !== nbFloor) continue;
            var dxD = nb.x - dec.x;
            var dzD = nb.z - dec.z;
            var dd = Math.hypot(dxD, dzD);
            var avoidR = dec.radius + 0.85;
            if (dd < avoidR && dd > 0.001) {
                var perpX = -dzD / dd;
                var perpZ = dxD / dd;
                var dot = nb.vx * perpX + nb.vz * perpZ;
                if (dot < 0) { perpX = -perpX; perpZ = -perpZ; }
                var push = (avoidR - dd) * 8;
                nb.vx += perpX * push;
                nb.vz += perpZ * push;
            }
        }
    }
    var sp2 = Math.hypot(nb.vx, nb.vz);
    if (sp2 > maxSpeed) {
        nb.vx = (nb.vx / sp2) * maxSpeed;
        nb.vz = (nb.vz / sp2) * maxSpeed;
    }

    var prevNbFootY = nb.baseY;
    var newX = nb.x + nb.vx * dt;
    var newZ = nb.z + nb.vz * dt;

    if (!isWalkableWorld(newX, nb.z, 0.4, undefined, prevNbFootY)) { newX = nb.x; nb.vx *= -0.5; }
    if (!isWalkableWorld(nb.x, newZ, 0.4, undefined, prevNbFootY)) { newZ = nb.z; nb.vz *= -0.5; }

    var movement = Math.hypot(newX - nb.x, newZ - nb.z);
    if (movement < 0.01 * dt && Math.hypot(nb.vx, nb.vz) > 0.1) {
        nb.pathTimer = 0;
        var randomAngle = Math.random() * Math.PI * 2;
        nb.vx = Math.cos(randomAngle) * 2;
        nb.vz = Math.sin(randomAngle) * 2;
    }

    if (movement < 0.02 * dt) nb.stuckTimer += dt; else nb.stuckTimer = 0;
    if (nb.stuckTimer > 0.45) {
        unstickNextbot(nb);
        nb.stuckTimer = 0;
        return Math.hypot(nb.x - player.x, nb.z - player.z);
    }

    nb.x = newX;
    nb.z = newZ;
    nb.baseY = getGroundSurfaceAt(nb.x, nb.z, prevNbFootY);
    nb.y = nb.baseY + 1.25;
    nb.sprite.position.set(nb.x, nb.baseY + 1.25, nb.z);

    return Math.hypot(nb.x - player.x, nb.z - player.z);
}

// ==========================================
// HANDLE NEXTBOT CATCHING PLAYER (shield logic)
// ==========================================
function handleNextbotCatch(nb) {
    if (player.shieldHits > 0) {
        player.shieldHits--;

        var freezeOnBlock = 0;
        if (saveData.upgrades.shield >= 1) freezeOnBlock = 1;
        if (saveData.upgrades.shield >= 2) freezeOnBlock = 2;
        if (saveData.upgrades.shield >= 3) freezeOnBlock = 2;

        if (freezeOnBlock > 0) {
            nb.frozen = true;
            nb.frozenTimer = freezeOnBlock;
        }

        if (player.shieldHits <= 0) {
            document.getElementById('shield-indicator').style.opacity = '0';
            document.getElementById('slot-shield').classList.remove('active');
            if (saveData.upgrades.shieldStack >= 3) {
                player.shieldSpeedBoost = true;
                player.shieldSpeedBoostTimer = 5;
            }
        }

        var nbFl = hasSecondFloorActive() && (nb.baseY || 0) >= SECOND_FLOOR_Y * 0.5 ? 1 : 0;
        var bounceDir = Math.atan2(nb.z - player.z, nb.x - player.x);
        nb.x += Math.cos(bounceDir) * 8;
        nb.z += Math.sin(bounceDir) * 8;
        nb.vx = Math.cos(bounceDir) * 10;
        nb.vz = Math.sin(bounceDir) * 10;

        if (!isWalkableWorld(nb.x, nb.z, 0.4, undefined, nb.baseY || 0)) {
            var nearCells;
            if (isEndlessMode) nearCells = getEndlessWalkableCellsNear(nb.x, nb.z, 10);
            else nearCells = walkableCells;

            var bestDist = Infinity;
            var bestPos = null;
            for (var ci = 0; ci < nearCells.length; ci++) {
                if (!isEndlessMode && (nearCells[ci].floor || 0) !== nbFl) continue;
                var wp;
                if (isEndlessMode) wp = { x: nearCells[ci].wx, z: nearCells[ci].wz };
                else wp = gridToWorld(nearCells[ci].x, nearCells[ci].z);
                var dd = Math.hypot(wp.x - nb.x, wp.z - nb.z);
                if (dd < bestDist) { bestDist = dd; bestPos = wp; }
            }
            if (bestPos) {
                nb.x = bestPos.x;
                nb.z = bestPos.z;
                nb.baseY = getFloorBaseY(nbFl);
                nb.y = nb.baseY + 1.25;
            }
        }

        nb.pathTimer = 0;
        var msg = document.getElementById('pickup-msg');
        if (player.shieldHits <= 0 && saveData.upgrades.shieldStack >= 3) {
            msg.textContent = '🛡️ SHIELD BROKEN — SPEED BOOST!';
        } else if (player.shieldHits > 0) {
            msg.textContent = '🛡️ SHIELD BLOCKED! ' + player.shieldHits + ' HIT' + (player.shieldHits > 1 ? 'S' : '') + ' LEFT!';
        } else {
            msg.textContent = '🛡️ SHIELD BLOCKED!';
        }
        msg.style.opacity = '1';
        setTimeout(function () { msg.style.opacity = '0'; }, 2000);
        return false;
    }
    return true;
}

function hasClearLineOfSight(x0, z0, x1, z1, baseY) {
    var fl = (hasSecondFloorActive() && (baseY || 0) >= SECOND_FLOOR_Y * 0.5) ? 1 : 0;
    var flMaze = getMazeForFloor(fl);
    var dist = Math.hypot(x1 - x0, z1 - z0);
    var steps = Math.max(2, Math.ceil(dist / 0.45));
    for (var i = 1; i < steps; i++) {
        var t = i / steps;
        var px = x0 + (x1 - x0) * t;
        var pz = z0 + (z1 - z0) * t;
        if (isEndlessMode) {
            if (getEndlessCell(px, pz) !== 0) return false;
        } else {
            var g = worldToGrid(px, pz);
            if (g.x < 0 || g.x >= GRID_SIZE || g.z < 0 || g.z >= GRID_SIZE) return false;
            if (!flMaze[g.x] || flMaze[g.x][g.z] !== 0) return false;
        }
    }
    return true;
}

// ==========================================
// UPDATE KANYE (normal/escape/endless modes)
// ==========================================
function updateKanye(dt) {
    if (isDarkEscapeMode && darkEscapeWon) return;
    if (noBotMode) {
        if (kanye.sprite) kanye.sprite.visible = false;
        setAudioVolume(0);
        var fearOff = document.getElementById('fear-overlay');
        var warnOff = document.getElementById('warning');
        if (fearOff) fearOff.style.opacity = '0';
        if (warnOff) warnOff.style.opacity = '0';
        return;
    }

    var distToPlayer = updateSingleNextbot(kanye, dt);
    if (distToPlayer === undefined) return;

    var playerFoot = player.y - 1.6;
    var kanyeFoot = kanye.baseY || 0;
    var sameFloor = !hasSecondFloorActive() || Math.abs(playerFoot - kanyeFoot) < 1.8;

    var audioRange = 90;
    var vol = distToPlayer < audioRange ? Math.pow(1 - (distToPlayer / audioRange), 0.35) : 0;
    if (!sameFloor) vol *= 0.42;
    setAudioVolume(vol);

    var fear = document.getElementById('fear-overlay');
    var warn = document.getElementById('warning');
    var lineOfSight = sameFloor && hasClearLineOfSight(kanye.x, kanye.z, player.x, player.z, kanyeFoot);
    updateCloseDanger(fear, warn, sameFloor ? distToPlayer : 999, lineOfSight);

    if (sameFloor && distToPlayer < 1.2) {
        if (handleNextbotCatch(kanye)) killPlayer();
    }
}

function updateCloseDanger(fear, warn, dist, hasLine) {
    if (!fear || !warn) return;

    var visible = dist < 20 && hasLine;
    if (!visible) {
        fear.style.opacity = '0';
        warn.style.opacity = '0';
        return;
    }

    var t = Math.max(0, Math.min(1, 1 - dist / 20));
    fear.style.opacity = String(Math.pow(t, 0.9) * 0.65);

    var warnT = Math.max(0, Math.min(1, (t - 0.30) / 0.40));
    warn.style.opacity = String(warnT);

    if (dist < 3.5) {
        warn.style.color = 'rgb(190,0,28)';
        warn.style.textShadow = '0 0 26px #ff0000, 0 0 8px #7a0000';
    } else {
        var g = Math.round(165 * (1 - t));
        var b = Math.round(145 * (1 - t));
        warn.style.color = 'rgb(255,' + g + ',' + b + ')';
        warn.style.textShadow = '0 0 ' + Math.round(16 + t * 16) + 'px #ff0000';
    }
}

// ==========================================
// MINIMAP & FLOOR LABEL HUD
// ==========================================
function getCurrentFloorLabelText() {
    if (hasSecondFloorActive()) {
        return getPlayerFloor() === 1
            ? '🏭 Backrooms · Level 1 (2F)'
            : '🏢 Backrooms · Level 0 (1F)';
    }
    var mapNames = {
        backrooms: '🏢 Backrooms',
        hospital: '🏥 Hospital',
        forest: '🌳 Forest'
    };
    return mapNames[currentMap] || '';
}

function updateFloorLabelHUD() {
    var floorEl = document.getElementById('minimap-floor');
    if (!floorEl) return;
    if (floorEl.style.display !== 'none') {
        floorEl.textContent = getCurrentFloorLabelText();
    }
}

function updateMinimap() {
    updateFloorLabelHUD();
    if (isDarkEscapeMode || isEscapeMode || isEndlessMode || isChaosMode) return;

    var canvas = document.getElementById('minimap-canvas');
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var scale = w / GRID_SIZE;
    var pFloor = getPlayerFloor();
    var activeMaze = getMazeForFloor(pFloor);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = pFloor === 1 ? '#4d5563' : '#4a4536';
    for (var x = 0; x < GRID_SIZE; x++) {
        for (var z = 0; z < GRID_SIZE; z++) {
            if (activeMaze[x] && activeMaze[x][z] === 1) ctx.fillRect(x * scale, z * scale, scale, scale);
        }
    }

    // Highlight stairwell shafts & landings on multi-floor Backrooms!
    if (hasSecondFloorActive()) {
        for (var si = 0; si < backroomsStairs.length; si++) {
            var st = backroomsStairs[si];
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(st.c1.x * scale, st.c1.z * scale, scale, scale);
            ctx.fillRect(st.c2.x * scale, st.c2.z * scale, scale, scale);
            var land = pFloor === 1 ? st.c3 : st.c0;
            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.fillRect(land.x * scale, land.z * scale, scale, scale);
        }
    }

    for (var pi = 0; pi < powerups.length; pi++) {
        var pu = powerups[pi];
        if (pu.collected || (pu.floor || 0) !== pFloor) continue;
        var px = (pu.x / CELL + GRID_SIZE / 2) * scale;
        var pz = (pu.z / CELL + GRID_SIZE / 2) * scale;
        ctx.fillStyle = pu.type === 'ice' ? '#88ccff' : pu.type === 'speed' ? '#ffcc00' : '#44ff44';
        ctx.beginPath();
        ctx.arc(px, pz, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    for (var ci = 0; ci < coins.length; ci++) {
        var co = coins[ci];
        if (co.collected || (co.floor || 0) !== pFloor) continue;
        var cx = (co.x / CELL + GRID_SIZE / 2) * scale;
        var cz = (co.z / CELL + GRID_SIZE / 2) * scale;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(cx, cz, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    var playerMapX = (player.x / CELL + GRID_SIZE / 2) * scale;
    var playerMapZ = (player.z / CELL + GRID_SIZE / 2) * scale;
    ctx.fillStyle = '#4f4';
    ctx.beginPath();
    ctx.arc(playerMapX, playerMapZ, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4f4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerMapX, playerMapZ);
    ctx.lineTo(playerMapX - Math.sin(player.yaw) * 14, playerMapZ - Math.cos(player.yaw) * 14);
    ctx.stroke();

    if (!noBotMode) {
        var kFloor = hasSecondFloorActive() && (kanye.baseY || 0) >= SECOND_FLOOR_Y * 0.5 ? 1 : 0;
        var kanyeMapX = (kanye.x / CELL + GRID_SIZE / 2) * scale;
        var kanyeMapZ = (kanye.z / CELL + GRID_SIZE / 2) * scale;
        if (kFloor === pFloor) {
            ctx.fillStyle = kanye.frozen ? '#88ccff' : '#f44';
            ctx.beginPath();
            ctx.arc(kanyeMapX, kanyeMapZ, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = kanye.frozen ? 'rgba(136,204,255,0.65)' : 'rgba(255,80,80,0.65)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(kanyeMapX, kanyeMapZ, 4.5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// ==========================================
// TIMER
// ==========================================
function updateTimer() {
    var elapsed = getElapsedTime();
    var mins = Math.floor(elapsed / 60);
    var secs = Math.floor(elapsed % 60);
    document.getElementById('timer').textContent = mins + ':' + secs.toString().padStart(2, '0');

    if (isChaosMode) {
        document.getElementById('chaos-timer-display').textContent =
            '🔥 ' + mins + ':' + secs.toString().padStart(2, '0') + ' 🔥';
    }
}

// ==========================================
// DEATH
// ==========================================
function killPlayer() {
    if (isDead) return;
    isDead = true;

    var elapsed = getElapsedTime();
    var mins = Math.floor(elapsed / 60);
    var secs = Math.floor(elapsed % 60);

    if (!sessionUsedTestMode && !isDarkEscapeMode && !isEndlessMode && !isChaosMode) {
        saveData.highscores.push(elapsed);
        saveData.highscores.sort(function (a, b) { return b - a; });
        saveData.highscores = saveData.highscores.slice(0, 3);
    }

    if (!sessionUsedTestMode && isChaosMode && elapsed > (saveData.chaosRecord || 0)) saveData.chaosRecord = elapsed;

    saveData.coins += sessionCoins;
    saveSaveData();

    var skinData = SKINS.find(function (s) { return s.id === saveData.selectedSkin; });
    var deathMsg = 'Caught...';
    if (skinData) {
        if (skinData.id === 'scp_wish') deathMsg = 'SCP Wish I New found you...';
        else if (skinData.id === 'hamood') deathMsg = 'Hamood Habibi got you...';
        else deathMsg = skinData.name + ' caught you...';
    }

    document.getElementById('death-msg').textContent = deathMsg;
    document.getElementById('survival-time').textContent = 'Survived: ' + mins + ':' + secs.toString().padStart(2, '0');
    document.getElementById('coins-earned').textContent = '+' + sessionCoins + ' coins';
    document.getElementById('death-screen').style.display = 'flex';

    stopAudio();
    if (!isMobile) document.exitPointerLock();
}

// ==========================================
// PAUSE
// ==========================================
function togglePause() {
    if (!gameStarted || isDead) return;
    if (isDarkEscapeMode && darkEscapeWon) return;
    isPaused = !isPaused;
    document.getElementById('pause-screen').style.display = isPaused ? 'flex' : 'none';

    if (isPaused) {
        lastPauseStart = Date.now();
        var currentSens = isMobile ? saveData.settings.mobileSensitivity : saveData.settings.desktopSensitivity;
        document.getElementById('pause-sensitivity').value = currentSens;
        document.getElementById('pause-sensitivity').max = 20;
        document.getElementById('pause-sens-d').textContent = currentSens;
        document.getElementById('pause-volume').value = saveData.settings.musicVolume;
        document.getElementById('pause-fov').value = saveData.settings.fov || 75;
        document.getElementById('pause-fov-d').textContent = saveData.settings.fov || 75;
        pauseAudio();
        if (!isMobile) document.exitPointerLock();
    } else {
        if (lastPauseStart > 0) { pausedTime += Date.now() - lastPauseStart; lastPauseStart = 0; }
        if (!isMobile) renderer.domElement.requestPointerLock();
    }
}

function resumeGame() {
    isPaused = false;
    document.getElementById('pause-screen').style.display = 'none';
    if (lastPauseStart > 0) { pausedTime += Date.now() - lastPauseStart; lastPauseStart = 0; }
    if (!isMobile) renderer.domElement.requestPointerLock();
}

function quitGame() {
    sessionCoins = 0;
    returnToMenu();
}

function returnToMenu() {
    gameStarted = false;
    isPaused = false;
    isDead = false;
    isEscapeMode = false;
    isEndlessMode = false;
    isChaosMode = false;
    GRID_SIZE = baseGridSize;

    resetDarkEscapeState();

    stopAudio();
    if (!isMobile) document.exitPointerLock();

    document.getElementById('death-screen').style.display = 'none';
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('escape-hud').style.display = 'none';
    document.getElementById('endless-hud').style.display = 'none';
    document.getElementById('chaos-hud').style.display = 'none';

    var floorEl = document.getElementById('minimap-floor');
    if (floorEl) floorEl.classList.remove('standalone');
    if (saveData.settings.minimapEnabled !== false) {
        document.getElementById('minimap').style.display = 'block';
        if (floorEl) floorEl.style.display = 'block';
    } else if (floorEl) {
        floorEl.style.display = 'none';
    }

    updateTestBadgeUI();
    clearScene();
    chaosNextbots = [];
    endlessChunks.clear();
    endlessChunkMeshes.clear();
    endlessLRU.length = 0;
    endlessDoorsList = [];
    endlessDecorations = [];
    endlessDoorsFound = 0;

    updateUI();
}

// ==========================================
// DOOR MESH BUILDER (shared: escape + endless)
// ==========================================
function getDoorMaterials() {
    if (!SHARED_MATS.doorFrame) {
        SHARED_MATS.doorFrame = markShared(new THREE.MeshBasicMaterial({ color: 0x3d2817 }));
        SHARED_MATS.doorPanel = markShared(new THREE.MeshBasicMaterial({ color: 0x5c3a21 }));
        SHARED_MATS.doorKnob = markShared(new THREE.MeshBasicMaterial({ color: 0xb8860b }));
    }
    return { frame: SHARED_MATS.doorFrame, door: SHARED_MATS.doorPanel, knob: SHARED_MATS.doorKnob };
}

function createDoorMesh(worldX, worldZ, direction, glowColor, atFace, baseY) {
    var doorGroup = new THREE.Group();
    var doorM = getDoorMaterials();
    var frameMat = doorM.frame;
    var doorMat = doorM.door;
    var knobMat = doorM.knob;
    var yOffset = baseY || 0;

    var doorX = worldX, doorZ = worldZ, rotY = 0;

    if (atFace) {
        if (direction === 'east' || direction === 'west') rotY = Math.PI / 2;
    } else {
        if (direction === 'east') { doorX = worldX - CELL / 2 + 0.3; rotY = Math.PI / 2; }
        else if (direction === 'west') { doorX = worldX + CELL / 2 - 0.3; rotY = Math.PI / 2; }
        else if (direction === 'south') { doorZ = worldZ - CELL / 2 + 0.3; }
        else if (direction === 'north') { doorZ = worldZ + CELL / 2 - 0.3; }
    }

    var frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 0.3), frameMat);
    frameLeft.position.set(-0.55, 1.4, 0);
    doorGroup.add(frameLeft);

    var frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 0.3), frameMat);
    frameRight.position.set(0.55, 1.4, 0);
    doorGroup.add(frameRight);

    var frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.15, 0.3), frameMat);
    frameTop.position.set(0, 2.75, 0);
    doorGroup.add(frameTop);

    var doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.5, 0.15), doorMat);
    doorPanel.position.set(0, 1.3, 0.25);
    doorGroup.add(doorPanel);

    var doorknob = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), knobMat);
    doorknob.position.set(0.35, 1.1, 0.38);
    doorGroup.add(doorknob);

    var knobPlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.02), knobMat);
    knobPlate.position.set(0.35, 1.1, 0.34);
    doorGroup.add(knobPlate);

    var glow = new THREE.PointLight(glowColor || 0x44ff44, 1.5, 10);
    glow.position.set(0, 1.5, 0.6);
    doorGroup.add(glow);

    if (glowColor !== undefined && glowColor !== null) {
        var doorGlowMat = new THREE.SpriteMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.55,
            depthWrite: false
        });
        var doorGlow = new THREE.Sprite(doorGlowMat);
        doorGlow.scale.set(2.4, 2.4, 1);
        doorGlow.position.set(0, 1.35, 0.5);
        doorGroup.add(doorGlow);
    }

    doorGroup.position.set(doorX, yOffset, doorZ);
    doorGroup.rotation.y = rotY;

    return doorGroup;
}

// ==========================================
// INIT
// ==========================================
function applyGameVersion() {
    var vEl = document.getElementById('game-version');
    var vBadgeEl = document.getElementById('game-version-badge');
    var clVer = document.getElementById('changelog-version');
    var title = document.querySelector('title');
    if (vEl) vEl.textContent = GAME_VERSION;
    if (vBadgeEl) vBadgeEl.title = 'Build ' + GAME_BUILD_CACHE.replace('v', 'cache-');
    if (clVer) clVer.textContent = 'v' + GAME_VERSION;
    if (title) title.textContent = 'Olive Delights v' + GAME_VERSION;
}

function init() {
    detectMobile();
    loadSaveData();
    forceInputMode = saveData.settings.inputMode || 'auto';
    detectMobile();
    applyGameVersion();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x1a1a1a, 2, 30);

    camera = new THREE.PerspectiveCamera(saveData.settings.fov || 75, window.innerWidth / window.innerHeight, 0.1, 200);

    renderer = new THREE.WebGLRenderer({ antialias: false, stencil: false, powerPreference: 'low-power' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    document.body.appendChild(renderer.domElement);

    var minimapCanvas = document.getElementById('minimap-canvas');
    minimapCanvas.width = 160;
    minimapCanvas.height = 160;

    loadTextures(function () {
        generateMaze();
        buildWorld();
        createKanye();
    });

    document.addEventListener('keydown', function (e) {
        if (keyCaptureType) {
            e.preventDefault();
            e.stopPropagation();
            if (e.code === 'Escape') {
                cancelKeyCapture();
                return;
            }
            if (e.repeat) return;
            if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
                showPickupMessage('⚠️ That key is reserved!', 1500);
                return;
            }
            finishKeyCapture(e.code);
            return;
        }

        // Secret "olive" key sequence opens/closes the Developer & No-Bot Test Menu!
        if (!e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && e.key && e.key.length === 1) {
            var activeTag = document.activeElement && document.activeElement.tagName;
            if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
                secretKeyBuffer = (secretKeyBuffer + e.key.toLowerCase()).slice(-8);
                if (secretKeyBuffer.slice(-5) === 'olive') {
                    secretKeyBuffer = '';
                    e.preventDefault();
                    toggleSecretTestMenu();
                    return;
                }
            }
        }

        if (secretModalOpen) {
            if (e.code === 'Escape') {
                e.preventDefault();
                closeSecretTestMenu();
            }
            return;
        }

        keys[e.code] = true;
        if (e.code === sprintKeyCode) {
            if (saveData.settings.sprintMode === 'toggle') {
                if (!e.repeat) isSprinting = !isSprinting;
            } else {
                isSprinting = true;
            }
        }
        if (e.code === 'Space') e.preventDefault();
        if (e.code === flashlightKeyCode && gameStarted && !isDead && !isPaused) {
            e.preventDefault();
            toggleFlashlight();
        }
        if (e.code === 'Escape' && gameStarted && !isDead) {
            e.preventDefault();
            togglePause();
        }
    });
    document.addEventListener('keyup', function (e) {
        if (keyCaptureType) return;
        keys[e.code] = false;
        if (e.code === sprintKeyCode && saveData.settings.sprintMode !== 'toggle') {
            isSprinting = false;
        }
    });

    document.addEventListener('mousemove', function (e) {
        if (!isLocked || !gameStarted || isDead || isPaused) return;
        player.yaw -= e.movementX * mouseSens;
        player.pitch -= e.movementY * mouseSens;
        player.pitch = Math.max(-1.4, Math.min(1.4, player.pitch));
    });

    document.addEventListener('pointerlockchange', function () {
        isLocked = document.pointerLockElement === renderer.domElement;
    });

    renderer.domElement.addEventListener('click', function () {
        if (gameStarted && !isDead && !isPaused && !isMobile) renderer.domElement.requestPointerLock();
    });

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    if (isMobile) setupMobileControls();

    renderCH();
    buildCHShapes();
    buildCHColors();
}

// ==========================================
// MOBILE CONTROLS
// ==========================================
var mobileControlsSetUp = false;
function setupMobileControls() {
    if (mobileControlsSetUp) return;
    mobileControlsSetUp = true;
    var joystick = document.getElementById('joystick-move');
    var knob = document.getElementById('joystick-knob');
    var btnJump = document.getElementById('btn-jump');
    var btnSprint = document.getElementById('btn-sprint');
    var btnFlashlight = document.getElementById('btn-flashlight');
    var btnPause = document.getElementById('btn-pause');

    var joystickTouchId = null;

    joystick.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (joystickTouchId !== null) return;
        var touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        var rect = joystick.getBoundingClientRect();
        mobileJoystick.startX = rect.left + rect.width / 2;
        mobileJoystick.startY = rect.top + rect.height / 2;
        mobileJoystick.active = true;
    }, { passive: false });

    joystick.addEventListener('touchmove', function (e) {
        e.preventDefault();
        for (var ti = 0; ti < e.changedTouches.length; ti++) {
            var touch = e.changedTouches[ti];
            if (touch.identifier === joystickTouchId) {
                var dx = touch.clientX - mobileJoystick.startX;
                var dy = touch.clientY - mobileJoystick.startY;
                var dist = Math.hypot(dx, dy);
                var maxDist = joystick.offsetWidth / 2 - knob.offsetWidth / 2;

                var clampedX = dx, clampedY = dy;
                if (dist > maxDist) {
                    clampedX = (dx / dist) * maxDist;
                    clampedY = (dy / dist) * maxDist;
                }
                knob.style.transform = 'translate(calc(-50% + ' + clampedX + 'px), calc(-50% + ' + clampedY + 'px))';
                mobileJoystick.moveX = clampedX / maxDist;
                mobileJoystick.moveZ = -clampedY / maxDist;
            }
        }
    }, { passive: false });

    joystick.addEventListener('touchend', function (e) {
        for (var ti = 0; ti < e.changedTouches.length; ti++) {
            if (e.changedTouches[ti].identifier === joystickTouchId) {
                joystickTouchId = null;
                mobileJoystick.active = false;
                mobileJoystick.moveX = 0;
                mobileJoystick.moveZ = 0;
                knob.style.transform = 'translate(-50%, -50%)';
            }
        }
    });

    joystick.addEventListener('touchcancel', function () {
        joystickTouchId = null;
        mobileJoystick.active = false;
        mobileJoystick.moveX = 0;
        mobileJoystick.moveZ = 0;
        knob.style.transform = 'translate(-50%, -50%)';
    });

    btnJump.addEventListener('touchstart', function (e) { e.preventDefault(); mobileJumpPressed = true; }, { passive: false });
    btnJump.addEventListener('touchend', function (e) { e.preventDefault(); mobileJumpPressed = false; }, { passive: false });

    btnSprint.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (saveData.settings.sprintMode === 'toggle') {
            mobileSprintActive = !mobileSprintActive;
        } else {
            mobileSprintActive = true;
        }
        btnSprint.classList.toggle('active', mobileSprintActive);
    }, { passive: false });
    btnSprint.addEventListener('touchend', function (e) {
        e.preventDefault();
        if (saveData.settings.sprintMode !== 'toggle') {
            mobileSprintActive = false;
            btnSprint.classList.remove('active');
        }
    }, { passive: false });

    if (btnFlashlight) {
        btnFlashlight.addEventListener('touchstart', function (e) {
            e.preventDefault();
            if (gameStarted && !isDead && !isPaused) toggleFlashlight();
            btnFlashlight.classList.toggle('active', flashlightOn);
        }, { passive: false });
        btnFlashlight.classList.toggle('active', flashlightOn);
    }

    btnPause.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (gameStarted && !isDead) togglePause();
    }, { passive: false });

    var lookTouchId = null;

    renderer.domElement.addEventListener('touchstart', function (e) {
        if (!gameStarted || isDead || isPaused) return;
        for (var ti = 0; ti < e.changedTouches.length; ti++) {
            var touch = e.changedTouches[ti];
            var touchX = touch.clientX, touchY = touch.clientY;
            var controlElements = [joystick, btnJump, btnSprint, btnFlashlight, btnPause];
            var rects = controlElements.map(function (el) { return el.getBoundingClientRect(); });
            var onControl = rects.some(function (r) {
                return touchX >= r.left && touchX <= r.right && touchY >= r.top && touchY <= r.bottom;
            });
            if (!onControl && lookTouchId === null) {
                lookTouchId = touch.identifier;
                mobileLook.startX = touch.clientX;
                mobileLook.startY = touch.clientY;
                mobileLook.active = true;
            }
        }
    }, { passive: true });

    renderer.domElement.addEventListener('touchmove', function (e) {
        if (!gameStarted || isDead || isPaused) return;
        for (var ti = 0; ti < e.changedTouches.length; ti++) {
            var touch = e.changedTouches[ti];
            if (touch.identifier === lookTouchId) {
                var dx = touch.clientX - mobileLook.startX;
                var dy = touch.clientY - mobileLook.startY;
                player.yaw -= dx * mobileSens;
                player.pitch -= dy * mobileSens;
                player.pitch = Math.max(-1.4, Math.min(1.4, player.pitch));
                mobileLook.startX = touch.clientX;
                mobileLook.startY = touch.clientY;
            }
        }
    }, { passive: true });

    renderer.domElement.addEventListener('touchend', function (e) {
        for (var ti = 0; ti < e.changedTouches.length; ti++) {
            if (e.changedTouches[ti].identifier === lookTouchId) {
                lookTouchId = null;
                mobileLook.active = false;
            }
        }
    });

    renderer.domElement.addEventListener('touchcancel', function () {
        lookTouchId = null;
        mobileLook.active = false;
    });
}

// ==========================================
// GAME LOOP
// ==========================================
var lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);
    var dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    if (gameStarted && !isDead && !isPaused && pageVisible &&
        !(isDarkEscapeMode && darkEscapeWon)) {
        updatePlayer(dt);

        if (isDarkEscapeMode) updateDarkEscape(dt);
        if (isChaosMode) updateChaosNextbots(dt);
        else if (!isDarkEscapeMode) updateKanye(dt);

        updateMinimap();
        updateTimer();
    }

    renderer.render(scene, camera);
}

// ==========================================
// RESTART GAME (dispatches per mode)
// ==========================================
function restartGame() {
    isDead = false;
    isPaused = false;
    clearScene();
    chaosNextbots = [];
    endlessChunks.clear();
    endlessChunkMeshes.clear();
    endlessLRU.length = 0;
    endlessDoorsList = [];
    endlessDecorations = [];

    if (isDarkEscapeMode) {
        restartDarkEscape();

    } else if (isChaosMode) {
        currentMap = resolveSelectedMap();
        GRID_SIZE = getMapSize();
        document.getElementById('chaos-hud').style.display = 'block';
        document.getElementById('minimap').style.display = 'none';
        var chFloorEl = document.getElementById('minimap-floor');
        if (chFloorEl) {
            if (currentMap === 'backrooms' && isBackroomsSecondFloorEnabled()) {
                chFloorEl.classList.add('standalone');
                chFloorEl.style.display = 'block';
            } else {
                chFloorEl.classList.remove('standalone');
                chFloorEl.style.display = 'none';
            }
        }

        generateMaze();
        buildWorld();
        rebuildPathGrid();
        if (walkableCells.length < 10) return;

        var wantFl = (hasSecondFloorActive() && testStartFloor === 1) ? 1 : 0;
        var pPool = walkableCells.filter(function (c) {
            return (c.floor || 0) === wantFl && isWalkableGrid(c.x, c.z, c.floor || 0);
        });
        if (pPool.length < 1) pPool = walkableCells.slice();
        var pCell = pPool[Math.floor(Math.random() * pPool.length)];
        var pPos = gridToWorld(pCell.x, pCell.z);
        player.x = pPos.x; player.z = pPos.z; player.y = getFloorBaseY(pCell.floor || 0) + 1.6;
        player.yaw = 0; player.pitch = 0; player.vy = 0; player.onGround = true;
        resetActiveEffects();

        var skins = pickChaosSkins();
        var usedPositions = [{ x: player.x, z: player.z, floor: pCell.floor || 0 }];

        for (var i = 0; i < 3; i++) {
            var nb = {
                x: 0, z: 0, y: 1.25, baseY: 0, vx: 0, vz: 0, sprite: null,
                pathTimer: Math.random() * 0.3, path: [], pathIndex: 0,
                frozen: false, frozenTimer: 0, halfSpeed: false, halfSpeedTimer: 0,
                usesVideo: false, usesCustomAudio: false, skinId: skins[i], stuckTimer: 0
            };

            var validSpawns = shuffle(walkableCells.filter(function (c) {
                var fl = c.floor || 0;
                if (!isWalkableGrid(c.x, c.z, fl)) return false;
                var p = gridToWorld(c.x, c.z);
                for (var ui = 0; ui < usedPositions.length; ui++) {
                    if (Math.hypot(p.x - usedPositions[ui].x, p.z - usedPositions[ui].z) < 15) return false;
                }
                return true;
            }));

            var kCell = validSpawns[0] || walkableCells[Math.floor(Math.random() * walkableCells.length)];
            var kPos = gridToWorld(kCell.x, kCell.z);
            var kFl = kCell.floor || 0;
            nb.x = kPos.x; nb.z = kPos.z;
            nb.baseY = getFloorBaseY(kFl);
            nb.y = nb.baseY + 1.25;
            usedPositions.push({ x: nb.x, z: nb.z, floor: kFl });
            chaosNextbots.push(nb);

            (function (nbRef, skinId) {
                createSpriteFromSkin(skinId, function (sprite, isVideo) {
                    nbRef.sprite = sprite;
                    nbRef.usesVideo = isVideo;
                    nbRef.sprite.visible = !noBotMode;
                    scene.add(nbRef.sprite);
                    nbRef.sprite.position.set(nbRef.x, nbRef.baseY + 1.25, nbRef.z);
                });
            })(nb, skins[i]);
        }

        var skinNames = skins.map(function (id) {
            var s = SKINS.find(function (x) { return x.id === id; });
            return s ? s.name : id;
        });
        document.getElementById('chaos-chasers').textContent = noBotMode ? '🧪 Peaceful Test (No Bots)' : skinNames.join(' | ');

        camera.position.set(player.x, player.y, player.z);
        createPowerups();
        createCoins();

    } else if (isEndlessMode) {
        document.getElementById('endless-hud').style.display = 'block';
        document.getElementById('endless-score').textContent = 'Doors: 0';
        document.getElementById('endless-door-indicator').textContent = '🚪 Explore to find doors...';
        document.getElementById('minimap').style.display = 'none';
        document.getElementById('minimap-floor').style.display = 'none';

        currentMap = forceMapNextRun ? resolveSelectedMap() : ['backrooms', 'hospital'][Math.floor(Math.random() * 2)];
        var mats = getMapMats();
        scene.background = new THREE.Color(mats.fogColor);
        scene.fog = new THREE.Fog(mats.fogColor, 2, 35);
        ensureAmbientLight();

        player.x = 2 * CELL; player.z = 2 * CELL; player.y = 1.6;
        player.yaw = 0; player.pitch = 0; player.vy = 0; player.onGround = true;
        resetActiveEffects();
        endlessDoorsFound = 0;

        updateEndlessChunks();
        ensurePlayerWalkable();
        spawnKanyeEndless();
        createKanye();
        createPowerups();
        createCoins();
        camera.position.set(player.x, player.y, player.z);

    } else if (isEscapeMode) {
        escapeRound = 1;
        currentMap = resolveSelectedMap();
        GRID_SIZE = getMapSize();
        document.getElementById('escape-hud').style.display = 'block';
        document.getElementById('escape-round').textContent = 'Round: 1';
        document.getElementById('escape-door-indicator').textContent = '🚪 FIND AN EXIT!';
        document.getElementById('minimap').style.display = 'none';
        var escFloorEl = document.getElementById('minimap-floor');
        if (escFloorEl) {
            if (currentMap === 'backrooms' && isBackroomsSecondFloorEnabled()) {
                escFloorEl.classList.add('standalone');
                escFloorEl.style.display = 'block';
            } else {
                escFloorEl.classList.remove('standalone');
                escFloorEl.style.display = 'none';
            }
        }

        generateMaze();
        buildWorld();
        rebuildPathGrid();
        createKanye();
        spawnEntities();
        createEscapeDoors();

    } else {
        currentMap = resolveSelectedMap();
        GRID_SIZE = getMapSize();
        document.getElementById('escape-hud').style.display = 'none';
        document.getElementById('endless-hud').style.display = 'none';
        document.getElementById('chaos-hud').style.display = 'none';

        var normFloorEl = document.getElementById('minimap-floor');
        if (saveData.settings.minimapEnabled !== false) {
            document.getElementById('minimap').style.display = 'block';
            if (normFloorEl) {
                normFloorEl.classList.remove('standalone');
                normFloorEl.style.display = 'block';
            }
        } else if (normFloorEl) {
            if (currentMap === 'backrooms' && isBackroomsSecondFloorEnabled()) {
                normFloorEl.classList.add('standalone');
                normFloorEl.style.display = 'block';
            } else {
                normFloorEl.classList.remove('standalone');
                normFloorEl.style.display = 'none';
            }
        }

        generateMaze();
        buildWorld();
        rebuildPathGrid();
        createKanye();
        spawnEntities();
    }

    isDead = false;
    stamina = maxStamina = getMaxStamina();
    startTime = Date.now();
    pausedTime = 0;
    lastPauseStart = 0;
    sessionCoins = 0;
    updateTestBadgeUI();

    document.getElementById('hud-coins').textContent = '💰 0';
    document.getElementById('death-screen').style.display = 'none';
    document.getElementById('fear-overlay').style.opacity = '0';
    document.getElementById('warning').style.opacity = '0';
    document.getElementById('freeze-overlay').style.opacity = '0';
    document.getElementById('shield-indicator').style.opacity = '0';
    document.getElementById('stamina-bar').classList.remove('infinite', 'boosted', 'exhausted');
    document.querySelectorAll('.powerup-slot').forEach(function (s) { s.classList.remove('active'); });

    resetSprintState();

    initAudio();
    if (!isMobile) renderer.domElement.requestPointerLock();
}

// ==========================================
// LAUNCH
// ==========================================
init();
requestAnimationFrame(animate);
