"use strict";
// ==========================================
// CHAOS MODE (3 nextbots at once)
// ==========================================
function pickChaosSkins() {
    var owned = saveData.ownedSkins.slice();
    var selected = saveData.selectedSkin;
    var result = [selected];

    var others = owned.filter(function (s) { return s !== selected; });
    others.sort(function () { return Math.random() - 0.5; });

    if (owned.length <= 1) {
        result = [selected, selected, selected];
    } else if (owned.length === 2) {
        var useOther = Math.random() < 0.5 ? 2 : 1;
        for (var i = 0; i < 2; i++) {
            if (useOther > 0 && others.length > 0) { result.push(others[0]); useOther--; }
            else result.push(selected);
        }
    } else {
        result.push(others[0] || selected);
        result.push(others[1] || others[0] || selected);
    }
    return result;
}

function startChaosMode() {
    prepareRunSession();
    document.getElementById('start-screen').classList.add('hidden');
    gameStarted = true;
    isDead = false;
    isPaused = false;
    isChaosMode = true;
    isEscapeMode = false;
    isEndlessMode = false;
    startTime = Date.now();
    pausedTime = 0;
    lastPauseStart = 0;
    stamina = maxStamina = getMaxStamina();
    sessionCoins = 0;
    resetSprintState();

    document.getElementById('hud-coins').textContent = '💰 0';
    currentMap = resolveSelectedMap();
    GRID_SIZE = getMapSize();

    document.getElementById('minimap').style.display = 'none';
    if (hasSecondFloorActive()) {
        document.getElementById('minimap-floor').style.display = 'block';
        document.getElementById('minimap-floor').classList.add('standalone');
    } else {
        document.getElementById('minimap-floor').classList.remove('standalone');
        document.getElementById('minimap-floor').style.display = 'none';
    }
    document.getElementById('escape-hud').style.display = 'none';
    document.getElementById('endless-hud').style.display = 'none';
    document.getElementById('chaos-hud').style.display = 'block';
    updateTestBadgeUI();
    syncMobileControlsDOM();

    clearScene();
    generateMaze();
    buildWorld();

    if (walkableCells.length < 10) return;

    var desiredFloor = hasSecondFloorActive() ? (testStartFloor === 1 ? 1 : 0) : 0;
    var spawnPool = walkableCells.filter(function (c) {
        return (c.floor || 0) === desiredFloor && isWalkableGrid(c.x, c.z, c.floor || 0);
    });
    if (spawnPool.length < 1) spawnPool = walkableCells.slice();
    var pCell = spawnPool[Math.floor(Math.random() * spawnPool.length)];
    var pPos = gridToWorld(pCell.x, pCell.z);
    var pBaseY = getFloorBaseY(pCell.floor || 0);
    player.x = pPos.x;
    player.z = pPos.z;
    player.y = pBaseY + 1.6;
    player.yaw = 0;
    player.pitch = 0;
    player.vy = 0;
    player.onGround = true;
    resetActiveEffects();

    var shieldEl = document.getElementById('chaos-shield-toggle');
    if (shieldEl && shieldEl.checked && saveData.coins >= 5) {
        saveData.coins -= 5;
        player.shieldHits = getBaseShieldHits(true);
        document.getElementById('shield-indicator').style.opacity = '1';
        document.getElementById('slot-shield').classList.add('active');
        saveSaveData();
        updateUI();
    }

    var skins = pickChaosSkins();
    chaosNextbots = [];
    var usedPositions = [{ x: player.x, z: player.z, baseY: pBaseY }];

    for (var i = 0; i < 3; i++) {
        var nb = {
            x: 0, z: 0, y: 1.25, baseY: 0, vx: 0, vz: 0, sprite: null,
            pathTimer: Math.random() * 0.3, path: [], pathIndex: 0,
            frozen: false, frozenTimer: 0, halfSpeed: false, halfSpeedTimer: 0,
            usesVideo: false, usesCustomAudio: false, skinId: skins[i], stuckTimer: 0
        };

        var validSpawns = walkableCells.filter(function (c) {
            var cf = c.floor || 0;
            if (!isWalkableGrid(c.x, c.z, cf)) return false;
            var p = gridToWorld(c.x, c.z);
            var cy = getFloorBaseY(cf);
            for (var ui = 0; ui < usedPositions.length; ui++) {
                var d = Math.hypot(p.x - usedPositions[ui].x, cy - usedPositions[ui].baseY, p.z - usedPositions[ui].z);
                if (d < 15) return false;
            }
            return true;
        });
        shuffle(validSpawns);

        var kCell = validSpawns[0] || walkableCells[Math.floor(Math.random() * walkableCells.length)];
        var kPos = gridToWorld(kCell.x, kCell.z);
        var kBaseY = getFloorBaseY(kCell.floor || 0);
        nb.x = kPos.x;
        nb.z = kPos.z;
        nb.baseY = kBaseY;
        nb.y = kBaseY + 1.25;
        usedPositions.push({ x: nb.x, z: nb.z, baseY: kBaseY });
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
    initAudio();
    safeRequestPointerLock();
}

function updateChaosNextbots(dt) {
    var fear = document.getElementById('fear-overlay');
    var warn = document.getElementById('warning');

    if (noBotMode) {
        for (var hi = 0; hi < chaosNextbots.length; hi++) {
            if (chaosNextbots[hi].sprite) chaosNextbots[hi].sprite.visible = false;
        }
        setAudioVolume(0);
        if (fear) fear.style.opacity = '0';
        if (warn) warn.style.opacity = '0';
        return;
    }

    var closestDist = Infinity;
    var closestAudioDist = Infinity;
    var anyLineOfSight = false;
    var pFootY = player.y - 1.6;

    for (var i = 0; i < chaosNextbots.length; i++) {
        var nb = chaosNextbots[i];
        if (nb.sprite && !nb.sprite.visible) nb.sprite.visible = true;
        var distToPlayer = updateSingleNextbot(nb, dt);
        if (distToPlayer === undefined) continue;

        var sameHeight = Math.abs((nb.baseY || 0) - pFootY) < 1.6;
        var audioDist = sameHeight ? distToPlayer : distToPlayer + 22;
        if (audioDist < closestAudioDist) closestAudioDist = audioDist;

        if (sameHeight) {
            if (distToPlayer < closestDist) closestDist = distToPlayer;
            if (hasClearLineOfSight(nb.x, nb.z, player.x, player.z, nb.baseY)) anyLineOfSight = true;

            var d2d = Math.hypot(nb.x - player.x, nb.z - player.z);
            if (d2d < 1.2) {
                if (handleNextbotCatch(nb)) { killPlayer(); return; }
            }
        }
    }

    var audioRange = 70;
    var vol = closestAudioDist < audioRange ? Math.pow(1 - (closestAudioDist / audioRange), 0.5) : 0;
    setAudioVolume(vol);

    updateCloseDanger(fear, warn, closestDist, anyLineOfSight);
}
