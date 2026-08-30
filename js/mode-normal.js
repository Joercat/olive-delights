"use strict";
// ==========================================
// NORMAL ("PLAY") MODE
// ==========================================
function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameStarted = true;
    isEscapeMode = false;
    isEndlessMode = false;
    isChaosMode = false;
    startTime = Date.now();
    pausedTime = 0;
    lastPauseStart = 0;
    stamina = maxStamina = getMaxStamina();
    sessionCoins = 0;

    document.getElementById('hud-coins').textContent = '💰 0';
    currentMap = ['backrooms', 'warehouse', 'hospital'][Math.floor(Math.random() * 3)];
    GRID_SIZE = baseGridSize;

    if (saveData.settings.minimapEnabled !== false) {
        document.getElementById('minimap').style.display = 'block';
        document.getElementById('minimap-floor').style.display = 'block';
    }
    document.getElementById('escape-hud').style.display = 'none';
    document.getElementById('endless-hud').style.display = 'none';
    document.getElementById('chaos-hud').style.display = 'none';

    while (scene.children.length > 0) scene.remove(scene.children[0]);
    generateMaze();
    buildWorld();
    createKanye();
    spawnEntities();
    initAudio();
    if (!isMobile) renderer.domElement.requestPointerLock();
}
