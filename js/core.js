"use strict";
// ==========================================
// SAVE DATA
// ==========================================
var saveData = {
    coins: 0,
    highscores: [],
    escapeRecord: 0,
    endlessRecord: 0,
    chaosRecord: 0,
    ownedSkins: ['default'],
    selectedSkin: 'default',
    upgrades: { ice: 0, speed: 0, shield: 0, staminaCap: 0, staminaRegen: 0 },
    settings: {
        sprintKey: 'ShiftLeft',
        desktopSensitivity: 5,
        mobileSensitivity: 8,
        inputMode: 'auto',
        musicVolume: 100,
        minimapEnabled: true,
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
            if (saveData.endlessRecord === undefined) saveData.endlessRecord = 0;
            if (saveData.chaosRecord === undefined) saveData.chaosRecord = 0;
            if (saveData.upgrades.staminaCap === undefined) saveData.upgrades.staminaCap = 0;
            if (saveData.upgrades.staminaRegen === undefined) saveData.upgrades.staminaRegen = 0;
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
    { id: 'default', name: 'Classic Kanye', url: 'https://joercat.github.io/kanye.png', cost: 0, type: 'image' },
    { id: 'kanye2', name: 'Weird Kanye', url: 'https://joercat.github.io/kanye2.png', cost: 50, type: 'image' },
    { id: 'kanye3', name: 'Anime Kanye', url: 'https://joercat.github.io/kanye3.png', cost: 45, type: 'image' },
    { id: 'kanye4', name: 'Christmas Kanye', url: 'https://joercat.github.io/kanye4.png', cost: 55, type: 'image' },
    { id: 'kanye5', name: 'Fih', url: 'https://joercat.github.io/kanye5.png', cost: 50, type: 'image' },
    { id: 'kanye6', name: 'Obunga', url: 'https://joercat.github.io/knaye6.png', cost: 50, type: 'image' },
    { id: 'scp_wish', name: 'SCP Wish I New', url: 'scp.png', cost: 60, type: 'video', videoUrl: 'scp.mp4', desc: 'Terrifying SCP' },
    { id: 'hamood', name: 'Hamood Habibi', url: 'hamood.png', cost: 55, type: 'image_audio', audioUrl: 'hamood.mp3', desc: 'Hamood Habibi!' }
];

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
    infiniteStamina: false,
    infiniteStaminaTimer: 0,
    speedBoost: false,
    speedBoostTimer: 0
};

var kanye = {
    x: 0, z: 0, y: 1.25,
    vx: 0, vz: 0,
    sprite: null,
    pathTimer: 0,
    path: [],
    pathIndex: 0,
    frozen: false, frozenTimer: 0,
    halfSpeed: false, halfSpeedTimer: 0,
    usesVideo: false,
    usesCustomAudio: false
};

var chaosNextbots = [];

var powerups = [];
var coins = [];
var POWERUP_TYPES = ['ice', 'speed', 'shield'];
var MIN_POWERUP_SPACING = 8;

var keys = {};
var isLocked = false;
var stamina = 100;
var maxStamina = 100;
var isSprinting = false;

var audioCtx, audioBuffer, audioSource, gainNode;
var audioReady = false;
var audioPlaying = false;

var CELL = 4;
var GRID_SIZE = 25;
var WALL_H = 3.5;
var maze = [];
var walkableCells = [];
var decorations = [];
var currentMap = 'backrooms';
var textureLoader = new THREE.TextureLoader();

var CHUNK_SIZE = 25;
var endlessChunks = new Map();
var endlessChunkMeshes = new Map();
var endlessLRU = [];
var endlessLoadRadius = 2;
var endlessUnloadRadius = 4;
var MAX_CACHED_CHUNKS = 30;
var endlessDoorsList = [];
var endlessDecorations = [];

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
    document.getElementById('fullscreen-btn').textContent =
        document.fullscreenElement ? 'Exit Fullscreen' : 'Enter Fullscreen';
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
            div.innerHTML += '<button class="menu-btn small" onclick="buySkin(\'' + skin.id + '\')">' + skin.cost + ' 💰</button>';
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
        staminaRegen: 'stamina-regen-upgrades'
    };
    var upgradeTypes = ['ice', 'speed', 'shield', 'staminaCap', 'staminaRegen'];
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
                div.innerHTML += '<button class="menu-btn small" onclick="buyUpgrade(\'' + type + '\',' + upg.level + ')">' + upg.cost + ' 💰</button>';
            } else {
                div.innerHTML += '<span style="color:#666;">LOCKED</span>';
            }
            container.appendChild(div);
        });
    });

    document.getElementById('sprint-key-select').value = saveData.settings.sprintKey;
    document.getElementById('desktop-sensitivity').value = saveData.settings.desktopSensitivity;
    document.getElementById('desktop-sens-display').textContent = saveData.settings.desktopSensitivity;
    document.getElementById('mobile-sensitivity').value = saveData.settings.mobileSensitivity;
    document.getElementById('mobile-sens-display').textContent = saveData.settings.mobileSensitivity;
    document.getElementById('music-volume').value = saveData.settings.musicVolume;
    document.getElementById('music-vol-display').textContent = saveData.settings.musicVolume;
    document.getElementById('minimap-toggle').checked = saveData.settings.minimapEnabled !== false;

    document.getElementById('ch-size').value = saveData.settings.crosshair.size;
    document.getElementById('ch-size-d').textContent = saveData.settings.crosshair.size;
    document.getElementById('ch-opacity').value = saveData.settings.crosshair.opacity;
    document.getElementById('ch-opa-d').textContent = saveData.settings.crosshair.opacity + '%';
    document.getElementById('ch-thick').value = saveData.settings.crosshair.thickness;
    document.getElementById('ch-thk-d').textContent = saveData.settings.crosshair.thickness;

    document.getElementById('mode-desktop').classList.toggle('active', saveData.settings.inputMode === 'desktop');
    document.getElementById('mode-mobile').classList.toggle('active', saveData.settings.inputMode === 'mobile');

    sprintKeyCode = saveData.settings.sprintKey;
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
function buySkin(skinId) {
    var skin = SKINS.find(function (s) { return s.id === skinId; });
    if (skin && saveData.coins >= skin.cost && !saveData.ownedSkins.includes(skinId)) {
        saveData.coins -= skin.cost;
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
    if (upg && saveData.coins >= upg.cost && currentLevel === level - 1) {
        saveData.coins -= upg.cost;
        saveData.upgrades[type] = level;
        saveSaveData();
        updateUI();
        maxStamina = getMaxStamina();
    }
}

// ==========================================
// SETTINGS FUNCTIONS
// ==========================================
function updateSprintKey() {
    saveData.settings.sprintKey = document.getElementById('sprint-key-select').value;
    sprintKeyCode = saveData.settings.sprintKey;
    saveSaveData();
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
// TEXTURES
// ==========================================
function loadTextures(callback) {
    var loaded = 0;
    var checkDone = function () { loaded++; if (loaded === 2) callback(); };

    wallTexture = textureLoader.load('https://joercat.github.io/wall.png', checkDone, undefined, checkDone);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;

    floorTexture = textureLoader.load('https://joercat.github.io/floor.jpg', checkDone, undefined, checkDone);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(50, 50);
}

// ==========================================
// AUDIO SYSTEM
// ==========================================
async function initAudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(audioCtx.destination);

        var skinData = SKINS.find(function (s) { return s.id === saveData.selectedSkin; });

        if (skinData && skinData.type === 'video') {
            kanye.usesCustomAudio = true;
            audioReady = false;
            var video = document.getElementById('scp-video');
            if (video && video.src) {
                video.muted = false;
                video.volume = 0;
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
                var resp = await fetch(skinData.audioUrl);
                var buf = await resp.arrayBuffer();
                skinAudioBuffer = await audioCtx.decodeAudioData(buf);
                skinAudioReady = true;
            } catch (e) {
                console.log('Custom audio failed, using default:', e);
                kanye.usesCustomAudio = false;
                var resp2 = await fetch('https://joercat.github.io/olive.wav');
                var buf2 = await resp2.arrayBuffer();
                audioBuffer = await audioCtx.decodeAudioData(buf2);
                audioReady = true;
            }
        } else {
            kanye.usesCustomAudio = false;
            var resp3 = await fetch('https://joercat.github.io/olive.wav');
            var buf3 = await resp3.arrayBuffer();
            audioBuffer = await audioCtx.decodeAudioData(buf3);
            audioReady = true;
        }
    } catch (e) { console.log('Audio init error:', e); }
}

function setAudioVolume(vol) {
    if (!audioCtx) return;

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
        if (vid) vid.volume = Math.min(1, vol * musicVolMul);
        if (gainNode) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        return;
    }

    if (kanye.usesCustomAudio && skinAudioReady) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
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
    if (audioCtx.state === 'suspended') audioCtx.resume();

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
    if (v) { v.pause(); v.volume = 0; }
}

function pauseAudio() {
    if (gainNode) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    if (skinGainNode) skinGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    var v = document.getElementById('scp-video');
    if (v) v.volume = 0;
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

    if (currentMap === 'warehouse') {
        for (x = 1; x < gridSize - 1; x++) {
            for (z = 1; z < gridSize - 1; z++) m[x][z] = 0;
        }
        for (x = 3; x < gridSize - 3; x += 4) {
            for (z = 3; z < gridSize - 3; z += 4) {
                if (srand() < 0.35) {
                    m[x][z] = 1;
                    if (srand() < 0.3 && x + 1 < gridSize - 2) m[x + 1][z] = 1;
                    if (srand() < 0.3 && z + 1 < gridSize - 2) m[x][z + 1] = 1;
                }
            }
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

function generateMaze() {
    var data = generateMazeData(GRID_SIZE, Math.floor(Math.random() * 2147483646) + 1);
    maze = data.maze;
    walkableCells = data.walkable;
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

function isWalkableWorld(wx, wz, radius) {
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
            if (Math.hypot(wx - edec.x, wz - edec.z) < edec.radius + radius) return false;
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
        var dist = Math.hypot(wx - dec.x, wz - dec.z);
        var canJumpOver = dec.height && dec.height < 1.0 && player.y > 2.0;
        if (dist < dec.radius + radius && !canJumpOver) return false;
    }
    return true;
}

function isWalkableGrid(gx, gz) {
    if (isEndlessMode) {
        var wx = (gx + 0.5) * CELL;
        var wz = (gz + 0.5) * CELL;
        return getEndlessCell(wx, wz) === 0;
    }
    if (gx < 0 || gx >= GRID_SIZE || gz < 0 || gz >= GRID_SIZE) return false;
    if (!maze[gx] || maze[gx][gz] !== 0) return false;

    var worldPos = gridToWorld(gx, gz);
    for (var i = 0; i < decorations.length; i++) {
        if (Math.hypot(worldPos.x - decorations[i].x, worldPos.z - decorations[i].z) < decorations[i].radius + 1.0) {
            return false;
        }
    }
    return true;
}

// ==========================================
// BUILD WORLD
// ==========================================
function getMapMats() {
    var wallMat, floorMat, ceilMat, fogColor;
    if (currentMap === 'backrooms') {
        wallMat = new THREE.MeshBasicMaterial({ map: wallTexture });
        floorMat = new THREE.MeshBasicMaterial({ map: floorTexture });
        ceilMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
        fogColor = 0x1a1a1a;
    } else if (currentMap === 'warehouse') {
        wallMat = new THREE.MeshBasicMaterial({ color: 0x4a4a4a });
        floorMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
        ceilMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        fogColor = 0x0a0a0a;
    } else {
        wallMat = new THREE.MeshBasicMaterial({ color: 0xd4e6d4 });
        floorMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
        ceilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        fogColor = 0x1a2a1a;
    }
    return { wallMat: wallMat, floorMat: floorMat, ceilMat: ceilMat, fogColor: fogColor };
}

function buildWorld() {
    var mats = getMapMats();
    scene.background = new THREE.Color(mats.fogColor);
    scene.fog = new THREE.Fog(mats.fogColor, 2, 35);
    decorations = [];

    for (var x = 0; x < GRID_SIZE; x++) {
        for (var z = 0; z < GRID_SIZE; z++) {
            if (maze[x][z] === 1) {
                var pos = gridToWorld(x, z);
                var wall = new THREE.Mesh(new THREE.BoxGeometry(CELL, WALL_H, CELL), mats.wallMat);
                wall.position.set(pos.x, WALL_H / 2, pos.z);
                scene.add(wall);
            }
        }
    }

    var floorGeo = new THREE.PlaneGeometry(GRID_SIZE * CELL, GRID_SIZE * CELL);
    var floor = new THREE.Mesh(floorGeo, mats.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    scene.add(floor);

    var ceiling = new THREE.Mesh(floorGeo.clone(), mats.ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = WALL_H;
    scene.add(ceiling);

    if (currentMap === 'warehouse') addWarehouseDecorations();
    else if (currentMap === 'hospital') addHospitalDecorations();

    scene.add(new THREE.AmbientLight(0xfff5e0, 0.9));
}

// ==========================================
// WAREHOUSE DECORATIONS
// ==========================================
function addWarehouseDecorations() {
    var crateMat = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    var barrelMat = new THREE.MeshBasicMaterial({ color: 0x2255aa });

    var shuffled = walkableCells.slice().sort(function () { return Math.random() - 0.5; });
    var decorCount = Math.min(25, shuffled.length);

    for (var i = 0; i < decorCount; i++) {
        var cell = shuffled[i];
        var pos = gridToWorld(cell.x, cell.z);
        var offsetX = (Math.random() - 0.5) * CELL * 0.3;
        var offsetZ = (Math.random() - 0.5) * CELL * 0.3;
        var finalX = pos.x + offsetX;
        var finalZ = pos.z + offsetZ;

        var tooClose = false;
        for (var d = 0; d < decorations.length; d++) {
            if (Math.hypot(finalX - decorations[d].x, finalZ - decorations[d].z) < 4.0) { tooClose = true; break; }
        }
        if (tooClose) continue;

        if (Math.random() < 0.6) {
            var stackHeight = Math.floor(Math.random() * 3) + 1;
            for (var j = 0; j < stackHeight; j++) {
                var crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), crateMat);
                crate.position.set(finalX, 0.5 + j * 1.0, finalZ);
                scene.add(crate);
            }
            decorations.push({ x: finalX, z: finalZ, radius: 0.7, height: stackHeight * 1.0 });
        } else {
            var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.4, 12), barrelMat);
            barrel.position.set(finalX, 0.7, finalZ);
            scene.add(barrel);
            decorations.push({ x: finalX, z: finalZ, radius: 0.55, height: 1.4 });
        }
    }
}

// ==========================================
// HOSPITAL DECORATIONS
// ==========================================
function addHospitalDecorations() {
    var gurneyMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    var sheetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var equipMat = new THREE.MeshBasicMaterial({ color: 0x446688 });
    var bloodMat = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
    var wheelchairMat = new THREE.MeshBasicMaterial({ color: 0x333333 });

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
            decorations.push({ x: finalX, z: finalZ, radius: 1.2, height: 0.85 });
        } else if (typeRoll < 0.55) {
            var stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 1.8, 8), gurneyMat);
            stand.position.set(finalX, 0.9, finalZ);
            scene.add(stand);
            var monitor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.15), equipMat);
            monitor.position.set(finalX, 1.7, finalZ);
            scene.add(monitor);
            decorations.push({ x: finalX, z: finalZ, radius: 0.3, height: 1.8 });
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
            decorations.push({ x: finalX, z: finalZ, radius: 0.45, height: 0.85 });
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
// A* PATHFINDING
// ==========================================
function findPath(startGx, startGz, endGx, endGz, maxIterations) {
    var walkCheck;
    if (isEndlessMode) {
        walkCheck = function (gx, gz) {
            var wx = (gx + 0.5) * CELL;
            var wz = (gz + 0.5) * CELL;
            return getEndlessCell(wx, wz) === 0;
        };
    } else {
        walkCheck = isWalkableGrid;
    }

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
            { x: cur.x + 1, z: cur.z }, { x: cur.x - 1, z: cur.z },
            { x: cur.x, z: cur.z + 1 }, { x: cur.x, z: cur.z - 1 }
        ];

        for (var ni = 0; ni < neighbors.length; ni++) {
            var n = neighbors[ni];
            if (!walkCheck(n.x, n.z)) continue;
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

function smartFindPath(kanyeX, kanyeZ, playerX, playerZ) {
    var dist = Math.hypot(kanyeX - playerX, kanyeZ - playerZ);

    if (isEndlessMode) {
        var kGrid = endlessWorldToGridGlobal(kanyeX, kanyeZ);
        var pGrid = endlessWorldToGridGlobal(playerX, playerZ);

        if (dist > 60) {
            var angle = Math.atan2(playerX - kanyeX, playerZ - kanyeZ);
            var midX = kanyeX + Math.sin(angle) * 15;
            var midZ = kanyeZ + Math.cos(angle) * 15;
            var midGrid = endlessWorldToGridGlobal(midX, midZ);
            return findPath(kGrid.x, kGrid.z, midGrid.x, midGrid.z, 500);
        } else if (dist > 30) {
            return findPath(kGrid.x, kGrid.z, pGrid.x, pGrid.z, 2000);
        } else {
            return findPath(kGrid.x, kGrid.z, pGrid.x, pGrid.z, 5000);
        }
    } else {
        var kG = worldToGrid(kanyeX, kanyeZ);
        var pG = worldToGrid(playerX, playerZ);
        var maxI = GRID_SIZE > 30 ? 8000 : 3000;

        var hasMovementInput = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD;
        var predX = playerX + (hasMovementInput ? -Math.sin(player.yaw) * 3 : 0);
        var predZ = playerZ + (hasMovementInput ? -Math.cos(player.yaw) * 3 : 0);
        var predGrid = worldToGrid(predX, predZ);

        var path = findPath(kG.x, kG.z, predGrid.x, predGrid.z, maxI);
        if (path.length === 0) path = findPath(kG.x, kG.z, pG.x, pG.z, maxI);
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
        textureLoader.load(url, function (tex) {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            var m = new THREE.SpriteMaterial({ map: tex });
            var sp = new THREE.Sprite(m);
            sp.scale.set(2.5, 2.5, 1);
            callback(sp, false);
        }, undefined, function () {
            textureLoader.load(SKINS[0].url, function (tex) {
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                var m = new THREE.SpriteMaterial({ map: tex });
                var sp = new THREE.Sprite(m);
                sp.scale.set(2.5, 2.5, 1);
                callback(sp, false);
            });
        });
    }
}

function createKanye() {
    var skinData = SKINS.find(function (s) { return s.id === saveData.selectedSkin; });
    createSpriteFromSkin(saveData.selectedSkin, function (sprite, isVideo) {
        kanye.sprite = sprite;
        kanye.usesVideo = isVideo;
        kanye.usesCustomAudio = skinData && skinData.type === 'image_audio';
        scene.add(kanye.sprite);
        kanye.sprite.position.set(kanye.x, 1.25, kanye.z);
    });
}

// ==========================================
// POWERUPS
// ==========================================
function createPowerups() {
    for (var pi = 0; pi < powerups.length; pi++) {
        if (powerups[pi].sprite) scene.remove(powerups[pi].sprite);
    }
    powerups.length = 0;

    var cells;
    if (isEndlessMode) cells = getEndlessWalkableCellsNear(player.x, player.z, 30);
    else cells = walkableCells.slice();

    var shuffled = cells.sort(function () { return Math.random() - 0.5; });
    var urls = {
        ice: 'https://joercat.github.io/ice.png',
        speed: 'https://joercat.github.io/speed.png',
        shield: 'https://joercat.github.io/shield.png'
    };

    var placedPositions = [];
    var count = 0;

    for (var i = 0; i < shuffled.length && count < 12; i++) {
        var cell = shuffled[i];
        var pos;
        if (isEndlessMode) pos = { x: cell.wx, z: cell.wz };
        else pos = gridToWorld(cell.x, cell.z);

        var tooClose = false;
        for (var p = 0; p < placedPositions.length; p++) {
            if (Math.hypot(placedPositions[p].x - pos.x, placedPositions[p].z - pos.z) < MIN_POWERUP_SPACING) {
                tooClose = true; break;
            }
        }
        if (tooClose) continue;

        var type = POWERUP_TYPES[count % 3];
        placedPositions.push(pos);
        count++;

        (function (powerupType, px, pz) {
            textureLoader.load(urls[powerupType], function (tex) {
                tex.magFilter = THREE.NearestFilter;
                var mat = new THREE.SpriteMaterial({ map: tex });
                var sprite = new THREE.Sprite(mat);
                sprite.scale.set(1.2, 1.2, 1);
                sprite.position.set(px, 0.8, pz);
                scene.add(sprite);
                powerups.push({ type: powerupType, x: px, z: pz, sprite: sprite, collected: false });
            });
        })(type, pos.x, pos.z);
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

    var available = cells.filter(function (cell) {
        var px, pz;
        if (isEndlessMode) { px = cell.wx; pz = cell.wz; }
        else { var p = gridToWorld(cell.x, cell.z); px = p.x; pz = p.z; }
        return !coins.some(function (c) { return !c.collected && Math.hypot(c.x - px, c.z - pz) < 2; });
    });

    var shuffled = available.sort(function () { return Math.random() - 0.5; });
    var activeCoins = coins.filter(function (c) { return !c.collected; }).length;
    var toSpawn = 5 - activeCoins;

    for (var i = 0; i < toSpawn && i < shuffled.length; i++) {
        var cell = shuffled[i];
        var pos;
        if (isEndlessMode) pos = { x: cell.wx, z: cell.wz };
        else pos = gridToWorld(cell.x, cell.z);

        (function (px, pz) {
            textureLoader.load('https://joercat.github.io/coin.png', function (tex) {
                tex.magFilter = THREE.NearestFilter;
                var mat = new THREE.SpriteMaterial({ map: tex });
                var sprite = new THREE.Sprite(mat);
                sprite.scale.set(0.8, 0.8, 1);
                sprite.position.set(px, 0.6, pz);
                scene.add(sprite);
                coins.push({ x: px, z: pz, sprite: sprite, collected: false });
            });
        })(pos.x, pos.z);
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

    var pIdx = Math.floor(Math.random() * walkableCells.length);
    var pPos = gridToWorld(walkableCells[pIdx].x, walkableCells[pIdx].z);
    player.x = pPos.x;
    player.z = pPos.z;
    player.y = 1.6;
    player.yaw = 0;
    player.pitch = 0;
    player.vy = 0;
    player.onGround = true;
    maxStamina = getMaxStamina();
    stamina = maxStamina;
    resetActiveEffects();

    var shieldId;
    if (isEscapeMode) shieldId = 'escape-shield-toggle';
    else if (isChaosMode) shieldId = 'chaos-shield-toggle';
    else shieldId = 'start-shield-toggle';

    var shieldEl = document.getElementById(shieldId);
    if (shieldEl && shieldEl.checked && saveData.coins >= 5) {
        saveData.coins -= 5;
        player.shieldHits = saveData.upgrades.shield >= 3 ? 2 : 1;
        document.getElementById('shield-indicator').style.opacity = '1';
        document.getElementById('slot-shield').classList.add('active');
        saveSaveData();
        updateUI();
    }

    var validSpawns = walkableCells.filter(function (c) {
        var p = gridToWorld(c.x, c.z);
        return Math.hypot(p.x - player.x, p.z - player.z) > 20;
    }).sort(function () { return Math.random() - 0.5; });

    var kCell = validSpawns[0] || walkableCells[0];
    var kPos = gridToWorld(kCell.x, kCell.z);
    kanye.x = kPos.x;
    kanye.z = kPos.z;
    kanye.vx = 0;
    kanye.vz = 0;
    kanye.pathTimer = 0;
    kanye.path = [];
    kanye.frozen = false;
    kanye.halfSpeed = false;
    if (kanye.sprite) kanye.sprite.position.set(kanye.x, 1.25, kanye.z);

    camera.position.set(player.x, player.y, player.z);
    createPowerups();
    createCoins();
}

// ==========================================
// ACTIVATE POWERUP
// ==========================================
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
        var shieldCount = chaosBoost ? 2 : (upg.shield >= 3 ? 2 : 1);
        if (player.shieldHits > 0) {
            msg.textContent = '🛡️ SHIELD ALREADY ACTIVE!';
        } else {
            player.shieldHits = shieldCount;
            document.getElementById('shield-indicator').style.opacity = '1';
            msg.textContent = shieldCount > 1 ? '🛡️ DOUBLE SHIELD ACQUIRED!' : '🛡️ SHIELD ACQUIRED!';
            document.getElementById('slot-shield').classList.add('active');
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

    if (player.infiniteStamina) {
        player.infiniteStaminaTimer -= dt;
        if (player.infiniteStaminaTimer <= 0) {
            player.infiniteStamina = false;
            document.getElementById('stamina-bar').classList.remove('infinite', 'boosted');
        }
    }

    var hasInput = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD ||
        (isMobile && (Math.abs(mobileJoystick.moveX) > 0.1 || Math.abs(mobileJoystick.moveZ) > 0.1));

    var wantSprint = (isSprinting || mobileSprintActive) && hasInput;
    var regenRate = getStaminaRegenRate();

    if (wantSprint && !player.infiniteStamina) {
        if (stamina > 0) stamina = Math.max(0, stamina - dt * 20);
    } else if (!wantSprint) {
        stamina = Math.min(maxStamina, stamina + dt * regenRate);
    }

    var canSprint = wantSprint && (stamina > 0 || player.infiniteStamina);
    var moveSpeed = canSprint ? sprintSpeed : walkSpeed;

    document.getElementById('stamina-bar').style.width =
        (player.infiniteStamina ? 100 : (stamina / maxStamina * 100)) + '%';

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

    if ((keys.Space || mobileJumpPressed) && player.onGround) {
        player.vy = 6.0;
        player.onGround = false;
        mobileJumpPressed = false;
    }

    player.vy -= 18 * dt;

    var newX = player.x + moveX * dt;
    var newZ = player.z + moveZ * dt;
    var newY = player.y + player.vy * dt;

    if (!isWalkableWorld(newX, player.z, 0.35)) newX = player.x;
    if (!isWalkableWorld(newX, newZ, 0.35)) newZ = player.z;

    player.x = newX;
    player.z = newZ;

    var activeDecors = isEndlessMode ? endlessDecorations : decorations;
    var onDecor = false;
    var decorTopY = 0;

    for (var di = 0; di < activeDecors.length; di++) {
        var dec = activeDecors[di];
        if (Math.hypot(player.x - dec.x, player.z - dec.z) < dec.radius + 0.3 && dec.height) {
            var top = dec.height + 0.1;
            if (player.vy <= 0 && newY <= top + 1.6 && newY > top + 0.5) {
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
    } else if (newY < 1.6) {
        newY = 1.6;
        player.vy = 0;
        player.onGround = true;
    }
    if (newY > WALL_H - 0.3) { newY = WALL_H - 0.3; player.vy = 0; }

    player.y = newY;

    camera.position.set(player.x, player.y, player.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;

    for (var pi = 0; pi < powerups.length; pi++) {
        var pu = powerups[pi];
        if (!pu.collected && Math.hypot(pu.x - player.x, pu.z - player.z) < 1.5) {
            pu.collected = true;
            if (pu.sprite) scene.remove(pu.sprite);
            activatePowerup(pu.type);
        }
    }

    var coinValue = isChaosMode ? 2 : 1;
    var needRespawn = false;
    for (var ci = 0; ci < coins.length; ci++) {
        var coin = coins[ci];
        if (!coin.collected && Math.hypot(coin.x - player.x, coin.z - player.z) < 1.5) {
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

    if (isEscapeMode) checkEscapeDoors();
    if (isEndlessMode) {
        updateEndlessChunks();
        checkEndlessDoors();
    }
}

// ==========================================
// SHARED NEXTBOT UPDATE LOGIC
// ==========================================
function updateSingleNextbot(nb, dt) {
    if (!nb.sprite || isPaused || !pageVisible) return undefined;

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

    var baseSpeed = currentMap === 'warehouse' ? 8.5 : 7.5;
    var maxSpeed = nb.halfSpeed ? baseSpeed * 0.6 : baseSpeed;

    nb.pathTimer -= dt;
    if (nb.pathTimer <= 0) {
        nb.pathTimer = 0.3;
        nb.path = smartFindPath(nb.x, nb.z, player.x, player.z);
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

    var newX = nb.x + nb.vx * dt;
    var newZ = nb.z + nb.vz * dt;

    if (!isWalkableWorld(newX, nb.z, 0.4)) { newX = nb.x; nb.vx *= -0.5; }
    if (!isWalkableWorld(nb.x, newZ, 0.4)) { newZ = nb.z; nb.vz *= -0.5; }

    var movement = Math.hypot(newX - nb.x, newZ - nb.z);
    if (movement < 0.01 * dt && Math.hypot(nb.vx, nb.vz) > 0.1) {
        nb.pathTimer = 0;
        var randomAngle = Math.random() * Math.PI * 2;
        nb.vx = Math.cos(randomAngle) * 2;
        nb.vz = Math.sin(randomAngle) * 2;
    }

    nb.x = newX;
    nb.z = newZ;
    nb.sprite.position.set(nb.x, 1.25, nb.z);

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
        }

        var bounceDir = Math.atan2(nb.z - player.z, nb.x - player.x);
        nb.x += Math.cos(bounceDir) * 8;
        nb.z += Math.sin(bounceDir) * 8;
        nb.vx = Math.cos(bounceDir) * 10;
        nb.vz = Math.sin(bounceDir) * 10;

        if (!isWalkableWorld(nb.x, nb.z, 0.4)) {
            var nearCells;
            if (isEndlessMode) nearCells = getEndlessWalkableCellsNear(nb.x, nb.z, 10);
            else nearCells = walkableCells;

            var bestDist = Infinity;
            var bestPos = null;
            for (var ci = 0; ci < nearCells.length; ci++) {
                var wp;
                if (isEndlessMode) wp = { x: nearCells[ci].wx, z: nearCells[ci].wz };
                else wp = gridToWorld(nearCells[ci].x, nearCells[ci].z);
                var dd = Math.hypot(wp.x - nb.x, wp.z - nb.z);
                if (dd < bestDist) { bestDist = dd; bestPos = wp; }
            }
            if (bestPos) { nb.x = bestPos.x; nb.z = bestPos.z; }
        }

        nb.pathTimer = 0;
        var msg = document.getElementById('pickup-msg');
        msg.textContent = player.shieldHits > 0 ? '🛡️ SHIELD BLOCKED! 1 HIT LEFT!' : '🛡️ SHIELD BLOCKED!';
        msg.style.opacity = '1';
        setTimeout(function () { msg.style.opacity = '0'; }, 2000);
        return false;
    }
    return true;
}

// ==========================================
// UPDATE KANYE (normal/escape/endless modes)
// ==========================================
function updateKanye(dt) {
    var distToPlayer = updateSingleNextbot(kanye, dt);
    if (distToPlayer === undefined) return;

    var audioRange = 70;
    var vol = distToPlayer < audioRange ? Math.pow(1 - (distToPlayer / audioRange), 0.5) : 0;
    setAudioVolume(vol);

    var fear = document.getElementById('fear-overlay');
    var warn = document.getElementById('warning');
    if (distToPlayer < 20) {
        fear.style.opacity = (1 - distToPlayer / 20) * 0.6;
        warn.style.opacity = distToPlayer < 10 ? 1 : 0;
    } else {
        fear.style.opacity = 0;
        warn.style.opacity = 0;
    }

    if (distToPlayer < 1.2) {
        if (handleNextbotCatch(kanye)) killPlayer();
    }
}

// ==========================================
// MINIMAP
// ==========================================
function updateMinimap() {
    if (isEscapeMode || isEndlessMode || isChaosMode) return;

    var canvas = document.getElementById('minimap-canvas');
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var scale = w / GRID_SIZE;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#444';
    for (var x = 0; x < GRID_SIZE; x++) {
        for (var z = 0; z < GRID_SIZE; z++) {
            if (maze[x] && maze[x][z] === 1) ctx.fillRect(x * scale, z * scale, scale, scale);
        }
    }

    for (var pi = 0; pi < powerups.length; pi++) {
        var pu = powerups[pi];
        if (pu.collected) continue;
        var px = (pu.x / CELL + GRID_SIZE / 2) * scale;
        var pz = (pu.z / CELL + GRID_SIZE / 2) * scale;
        ctx.fillStyle = pu.type === 'ice' ? '#88ccff' : pu.type === 'speed' ? '#ffcc00' : '#44ff44';
        ctx.beginPath();
        ctx.arc(px, pz, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    for (var ci = 0; ci < coins.length; ci++) {
        var co = coins[ci];
        if (co.collected) continue;
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

    var kanyeMapX = (kanye.x / CELL + GRID_SIZE / 2) * scale;
    var kanyeMapZ = (kanye.z / CELL + GRID_SIZE / 2) * scale;
    ctx.fillStyle = kanye.frozen ? '#88ccff' : '#f44';
    ctx.beginPath();
    ctx.arc(kanyeMapX, kanyeMapZ, 5, 0, Math.PI * 2);
    ctx.fill();

    var mapNames = { backrooms: '🏢 Backrooms', warehouse: '📦 Warehouse', hospital: '🏥 Hospital' };
    document.getElementById('minimap-floor').textContent = mapNames[currentMap] || '';
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

    if (!isEndlessMode && !isChaosMode) {
        saveData.highscores.push(elapsed);
        saveData.highscores.sort(function (a, b) { return b - a; });
        saveData.highscores = saveData.highscores.slice(0, 3);
    }

    if (isChaosMode && elapsed > (saveData.chaosRecord || 0)) saveData.chaosRecord = elapsed;

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
    isPaused = !isPaused;
    document.getElementById('pause-screen').style.display = isPaused ? 'flex' : 'none';

    if (isPaused) {
        lastPauseStart = Date.now();
        var currentSens = isMobile ? saveData.settings.mobileSensitivity : saveData.settings.desktopSensitivity;
        document.getElementById('pause-sensitivity').value = currentSens;
        document.getElementById('pause-sensitivity').max = 20;
        document.getElementById('pause-sens-d').textContent = currentSens;
        document.getElementById('pause-volume').value = saveData.settings.musicVolume;
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

    stopAudio();
    if (!isMobile) document.exitPointerLock();

    document.getElementById('death-screen').style.display = 'none';
    document.getElementById('pause-screen').style.display = 'none';
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('escape-hud').style.display = 'none';
    document.getElementById('endless-hud').style.display = 'none';
    document.getElementById('chaos-hud').style.display = 'none';

    if (saveData.settings.minimapEnabled !== false) {
        document.getElementById('minimap').style.display = 'block';
        document.getElementById('minimap-floor').style.display = 'block';
    }

    for (var i = 0; i < chaosNextbots.length; i++) {
        if (chaosNextbots[i].sprite) scene.remove(chaosNextbots[i].sprite);
    }
    chaosNextbots = [];

    endlessChunkMeshes.forEach(function (meshes) { meshes.forEach(function (m) { scene.remove(m); }); });
    endlessChunks.clear();
    endlessChunkMeshes.clear();
    endlessLRU.length = 0;
    endlessDoorsList = [];
    endlessDecorations = [];

    updateUI();
}

// ==========================================
// DOOR MESH BUILDER (shared: escape + endless)
// ==========================================
function createDoorMesh(worldX, worldZ, direction, glowColor) {
    var doorGroup = new THREE.Group();
    var frameMat = new THREE.MeshBasicMaterial({ color: 0x3d2817 });
    var doorMat = new THREE.MeshBasicMaterial({ color: 0x5c3a21 });
    var knobMat = new THREE.MeshBasicMaterial({ color: 0xb8860b });

    var doorX = worldX, doorZ = worldZ, rotY = 0;

    if (direction === 'east') { doorX = worldX - CELL / 2 + 0.3; rotY = Math.PI / 2; }
    else if (direction === 'west') { doorX = worldX + CELL / 2 - 0.3; rotY = Math.PI / 2; }
    else if (direction === 'south') { doorZ = worldZ - CELL / 2 + 0.3; }
    else if (direction === 'north') { doorZ = worldZ + CELL / 2 - 0.3; }

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

    doorGroup.position.set(doorX, 0, doorZ);
    doorGroup.rotation.y = rotY;

    return doorGroup;
}

// ==========================================
// INIT
// ==========================================
function init() {
    detectMobile();
    loadSaveData();
    forceInputMode = saveData.settings.inputMode || 'auto';
    detectMobile();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x1a1a1a, 2, 30);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
        keys[e.code] = true;
        if (e.code === sprintKeyCode) isSprinting = true;
        if (e.code === 'Space') e.preventDefault();
        if (e.code === 'Escape' && gameStarted && !isDead) {
            e.preventDefault();
            togglePause();
        }
    });
    document.addEventListener('keyup', function (e) {
        keys[e.code] = false;
        if (e.code === sprintKeyCode) isSprinting = false;
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
function setupMobileControls() {
    var joystick = document.getElementById('joystick-move');
    var knob = document.getElementById('joystick-knob');
    var btnJump = document.getElementById('btn-jump');
    var btnSprint = document.getElementById('btn-sprint');
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
        mobileSprintActive = !mobileSprintActive;
        btnSprint.classList.toggle('active', mobileSprintActive);
    }, { passive: false });

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
            var controlElements = [joystick, btnJump, btnSprint, btnPause];
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

    if (gameStarted && !isDead && !isPaused && pageVisible) {
        updatePlayer(dt);

        if (isChaosMode) updateChaosNextbots(dt);
        else updateKanye(dt);

        updateMinimap();
        updateTimer();
    }

    renderer.render(scene, camera);
}

// ==========================================
// RESTART GAME (dispatches per mode)
// ==========================================
function restartGame() {
    while (scene.children.length > 0) scene.remove(scene.children[0]);

    for (var ci = 0; ci < chaosNextbots.length; ci++) {
        if (chaosNextbots[ci].sprite) scene.remove(chaosNextbots[ci].sprite);
    }
    chaosNextbots = [];

    endlessChunkMeshes.forEach(function (meshes) { meshes.forEach(function (m) { scene.remove(m); }); });
    endlessChunks.clear();
    endlessChunkMeshes.clear();
    endlessLRU.length = 0;
    endlessDoorsList = [];
    endlessDecorations = [];

    if (isChaosMode) {
        currentMap = ['backrooms', 'warehouse', 'hospital'][Math.floor(Math.random() * 3)];
        GRID_SIZE = baseGridSize;
        document.getElementById('chaos-hud').style.display = 'block';
        document.getElementById('minimap').style.display = 'none';
        document.getElementById('minimap-floor').style.display = 'none';

        generateMaze();
        buildWorld();
        if (walkableCells.length < 10) return;

        var pIdx = Math.floor(Math.random() * walkableCells.length);
        var pPos = gridToWorld(walkableCells[pIdx].x, walkableCells[pIdx].z);
        player.x = pPos.x; player.z = pPos.z; player.y = 1.6;
        player.yaw = 0; player.pitch = 0; player.vy = 0; player.onGround = true;
        resetActiveEffects();

        var skins = pickChaosSkins();
        var usedPositions = [{ x: player.x, z: player.z }];

        for (var i = 0; i < 3; i++) {
            var nb = {
                x: 0, z: 0, y: 1.25, vx: 0, vz: 0, sprite: null,
                pathTimer: Math.random() * 0.3, path: [], pathIndex: 0,
                frozen: false, frozenTimer: 0, halfSpeed: false, halfSpeedTimer: 0,
                usesVideo: false, usesCustomAudio: false, skinId: skins[i]
            };

            var validSpawns = walkableCells.filter(function (c) {
                var p = gridToWorld(c.x, c.z);
                var farEnough = true;
                for (var ui = 0; ui < usedPositions.length; ui++) {
                    if (Math.hypot(p.x - usedPositions[ui].x, p.z - usedPositions[ui].z) < 15) { farEnough = false; break; }
                }
                return farEnough;
            }).sort(function () { return Math.random() - 0.5; });

            var kCell = validSpawns[0] || walkableCells[Math.floor(Math.random() * walkableCells.length)];
            var kPos = gridToWorld(kCell.x, kCell.z);
            nb.x = kPos.x; nb.z = kPos.z;
            usedPositions.push({ x: nb.x, z: nb.z });
            chaosNextbots.push(nb);

            (function (nbRef, skinId) {
                createSpriteFromSkin(skinId, function (sprite, isVideo) {
                    nbRef.sprite = sprite;
                    nbRef.usesVideo = isVideo;
                    scene.add(nbRef.sprite);
                    nbRef.sprite.position.set(nbRef.x, 1.25, nbRef.z);
                });
            })(nb, skins[i]);
        }

        var skinNames = skins.map(function (id) {
            var s = SKINS.find(function (x) { return x.id === id; });
            return s ? s.name : id;
        });
        document.getElementById('chaos-chasers').textContent = skinNames.join(' | ');

        camera.position.set(player.x, player.y, player.z);
        createPowerups();
        createCoins();

    } else if (isEndlessMode) {
        document.getElementById('endless-hud').style.display = 'block';
        document.getElementById('endless-score').textContent = 'Doors: 0';
        document.getElementById('endless-door-indicator').textContent = '🚪 Explore to find doors...';
        document.getElementById('minimap').style.display = 'none';
        document.getElementById('minimap-floor').style.display = 'none';

        currentMap = ['backrooms', 'hospital'][Math.floor(Math.random() * 2)];
        var mats = getMapMats();
        scene.background = new THREE.Color(mats.fogColor);
        scene.fog = new THREE.Fog(mats.fogColor, 2, 35);
        scene.add(new THREE.AmbientLight(0xfff5e0, 0.9));

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
        GRID_SIZE = baseGridSize * 2;
        document.getElementById('escape-hud').style.display = 'block';
        document.getElementById('escape-round').textContent = 'Round: 1';
        document.getElementById('escape-door-indicator').textContent = '🚪 FIND AN EXIT!';
        document.getElementById('minimap').style.display = 'none';
        document.getElementById('minimap-floor').style.display = 'none';

        currentMap = ['backrooms', 'hospital'][Math.floor(Math.random() * 2)];
        generateMaze();
        buildWorld();
        createKanye();
        spawnEntities();
        createEscapeDoors();

    } else {
        GRID_SIZE = baseGridSize;
        document.getElementById('escape-hud').style.display = 'none';
        document.getElementById('endless-hud').style.display = 'none';
        document.getElementById('chaos-hud').style.display = 'none';

        if (saveData.settings.minimapEnabled !== false) {
            document.getElementById('minimap').style.display = 'block';
            document.getElementById('minimap-floor').style.display = 'block';
        }

        currentMap = ['backrooms', 'warehouse', 'hospital'][Math.floor(Math.random() * 3)];
        generateMaze();
        buildWorld();
        createKanye();
        spawnEntities();
    }

    isDead = false;
    stamina = maxStamina = getMaxStamina();
    startTime = Date.now();
    pausedTime = 0;
    lastPauseStart = 0;
    sessionCoins = 0;

    document.getElementById('hud-coins').textContent = '💰 0';
    document.getElementById('death-screen').style.display = 'none';
    document.getElementById('fear-overlay').style.opacity = '0';
    document.getElementById('warning').style.opacity = '0';
    document.getElementById('freeze-overlay').style.opacity = '0';
    document.getElementById('shield-indicator').style.opacity = '0';
    document.getElementById('stamina-bar').classList.remove('infinite', 'boosted');
    document.querySelectorAll('.powerup-slot').forEach(function (s) { s.classList.remove('active'); });

    mobileSprintActive = false;
    var sprintBtn = document.getElementById('btn-sprint');
    if (sprintBtn) sprintBtn.classList.remove('active');

    initAudio();
    if (!isMobile) renderer.domElement.requestPointerLock();
}

// ==========================================
// LAUNCH
// ==========================================
init();
requestAnimationFrame(animate);
