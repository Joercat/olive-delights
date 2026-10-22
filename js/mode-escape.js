"use strict";
// ==========================================
// ESCAPE MODE (2 verified reachable doors per round)
// ==========================================
function startEscapeMode() {
    prepareRunSession();
    document.getElementById('start-screen').classList.add('hidden');
    gameStarted = true;
    isDead = false;
    isPaused = false;
    isEscapeMode = true;
    isEndlessMode = false;
    isChaosMode = false;
    escapeRound = 1;
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
    document.getElementById('escape-hud').style.display = 'block';
    document.getElementById('endless-hud').style.display = 'none';
    document.getElementById('chaos-hud').style.display = 'none';
    document.getElementById('escape-round').textContent = 'Round: ' + escapeRound;
    document.getElementById('escape-door-indicator').textContent = '🚪 FIND AN EXIT!';
    document.getElementById('escape-door-indicator').classList.remove('nearby');
    updateTestBadgeUI();
    syncMobileControlsDOM();

    clearScene();
    generateMaze();
    buildWorld();
    createKanye();
    spawnEntities();
    createEscapeDoors();
    initAudio();
    safeRequestPointerLock();
}

function collectFloorDoorCandidates(floor, pFloor, pSnap) {
    var floorMaze = getMazeForFloor(floor);
    var floorY = getFloorBaseY(floor);
    var pY = player.y - 1.6;
    var candidates = [];
    if (!floorMaze) return candidates;

    for (var x = 2; x < GRID_SIZE - 2; x++) {
        for (var z = 2; z < GRID_SIZE - 2; z++) {
            if (isStairShaftCell(x, z)) continue;
            if (floorMaze[x][z] === 1) {
                var adjacentDirs = [
                    { wx: x - 1, wz: z, dir: 'east' },
                    { wx: x + 1, wz: z, dir: 'west' },
                    { wx: x, wz: z - 1, dir: 'south' },
                    { wx: x, wz: z + 1, dir: 'north' }
                ];
                for (var ai = 0; ai < adjacentDirs.length; ai++) {
                    var adj = adjacentDirs[ai];
                    if (adj.wx >= 0 && adj.wx < GRID_SIZE && adj.wz >= 0 && adj.wz < GRID_SIZE &&
                        !isStairShaftCell(adj.wx, adj.wz) &&
                        isPathWalkableGrid(adj.wx, adj.wz, floor)) {

                        var openSides = 0;
                        var approach = [
                            { dx: -1, dz: 0 }, { dx: 1, dz: 0 },
                            { dx: 0, dz: -1 }, { dx: 0, dz: 1 }
                        ];
                        for (var ap = 0; ap < approach.length; ap++) {
                            if (isPathWalkableGrid(adj.wx + approach[ap].dx, adj.wz + approach[ap].dz, floor)) openSides++;
                        }
                        if (openSides < 2) continue;

                        var doorPos = gridToWorld(x, z);
                        var dist3d = Math.hypot(doorPos.x - player.x, floorY - pY, doorPos.z - player.z);
                        if (dist3d < 25) continue;

                        if (isMultiFloorReachable(pSnap.x, pSnap.z, pFloor, adj.wx, adj.wz, floor)) {
                            candidates.push({ x: x, z: z, adjX: adj.wx, adjZ: adj.wz, dir: adj.dir, floor: floor });
                        }
                    }
                }
            }
        }
    }
    return candidates;
}

function createEscapeDoors() {
    for (var di = 0; di < escapeDoors.length; di++) {
        if (escapeDoors[di].mesh) scene.remove(escapeDoors[di].mesh);
    }
    escapeDoors = [];

    var pFloor = getPlayerFloor();
    var pGrid = worldToGrid(player.x, player.z);
    var pSnap = findNearestPathWalkableGrid(pGrid.x, pGrid.z, 3, pFloor);

    var doorsToCreate = [];
    if (hasSecondFloorActive()) {
        // Place one exit on Level 0 (Floor 1) and one exit on Level 1 (Floor 2)!
        var candsF0 = shuffle(collectFloorDoorCandidates(0, pFloor, pSnap));
        var candsF1 = shuffle(collectFloorDoorCandidates(1, pFloor, pSnap));
        if (candsF0.length > 0 && candsF1.length > 0) {
            doorsToCreate = [candsF0[0], candsF1[0]];
        } else {
            var combined = shuffle(candsF0.concat(candsF1));
            if (combined.length >= 2) doorsToCreate = [combined[0], combined[1]];
            else if (combined.length === 1) doorsToCreate = [combined[0]];
        }
    } else {
        var candidates = shuffle(collectFloorDoorCandidates(0, pFloor, pSnap));
        if (candidates.length < 1) return;
        var door1 = candidates[0];
        var d1Pos = gridToWorld(door1.x, door1.z);
        var door2 = null;

        for (var i = 1; i < candidates.length; i++) {
            var d2Pos = gridToWorld(candidates[i].x, candidates[i].z);
            if (Math.hypot(d2Pos.x - d1Pos.x, d2Pos.z - d1Pos.z) > 30) { door2 = candidates[i]; break; }
        }
        if (!door2) {
            for (var j = 1; j < candidates.length; j++) {
                var d2Pos2 = gridToWorld(candidates[j].x, candidates[j].z);
                if (Math.hypot(d2Pos2.x - d1Pos.x, d2Pos2.z - d1Pos.z) > 15) { door2 = candidates[j]; break; }
            }
        }
        if (!door2 && candidates.length >= 2) door2 = candidates[1];
        doorsToCreate = door2 ? [door1, door2] : [door1];
    }

    for (var di2 = 0; di2 < doorsToCreate.length; di2++) {
        var dd = doorsToCreate[di2];
        var wallWorldPos = gridToWorld(dd.x, dd.z);
        var adjWorldPos = gridToWorld(dd.adjX, dd.adjZ);
        var baseY = getFloorBaseY(dd.floor || 0);
        var faceX = (wallWorldPos.x + adjWorldPos.x) / 2;
        var faceZ = (wallWorldPos.z + adjWorldPos.z) / 2;
        var mesh = createDoorMesh(faceX, faceZ, dd.dir, 0x44ff44, true, baseY);
        scene.add(mesh);
        escapeDoors.push({
            mesh: mesh,
            x: adjWorldPos.x,
            z: adjWorldPos.z,
            faceX: faceX,
            faceZ: faceZ,
            gridX: dd.x,
            gridZ: dd.z,
            floor: dd.floor || 0,
            baseY: baseY
        });
    }
}

function checkEscapeDoors() {
    if (!isEscapeMode) return;

    var nearestDist = Infinity;
    var pFootY = player.y - 1.6;
    for (var i = 0; i < escapeDoors.length; i++) {
        var door = escapeDoors[i];
        var dy = Math.abs(pFootY - (door.baseY || 0));
        var distFace = Math.hypot(door.faceX - player.x, door.faceZ - player.z);
        var distAdj = Math.hypot(door.x - player.x, door.z - player.z);
        var dist3d = Math.hypot(distFace, dy * 1.8);
        if (dist3d < nearestDist) nearestDist = dist3d;
        if (dy < 1.5 && distAdj < 2.6 && distFace < 2.2) { winEscapeRound(); return; }
    }

    var indicator = document.getElementById('escape-door-indicator');
    if (nearestDist < 15) {
        indicator.textContent = '🚪 EXIT NEARBY!';
        indicator.classList.add('nearby');
    } else {
        indicator.textContent = '🚪 FIND AN EXIT!';
        indicator.classList.remove('nearby');
    }
}

function winEscapeRound() {
    escapeRound++;
    sessionCoins += 3;
    document.getElementById('hud-coins').textContent = '💰 ' + sessionCoins;

    if (!sessionUsedTestMode && escapeRound - 1 > saveData.escapeRecord) {
        saveData.escapeRecord = escapeRound - 1;
        saveSaveData();
    }

    var msg = document.getElementById('pickup-msg');
    msg.textContent = '🚪 ESCAPED! +3💰 Round ' + escapeRound;
    msg.style.opacity = '1';
    setTimeout(function () { msg.style.opacity = '0'; }, 2000);

    document.getElementById('escape-round').textContent = 'Round: ' + escapeRound;

    initAudio();
    clearScene();
    currentMap = resolveSelectedMap();
    GRID_SIZE = getMapSize();
    if (hasSecondFloorActive()) {
        document.getElementById('minimap-floor').style.display = 'block';
        document.getElementById('minimap-floor').classList.add('standalone');
    } else {
        document.getElementById('minimap-floor').classList.remove('standalone');
        document.getElementById('minimap-floor').style.display = 'none';
    }
    generateMaze();
    buildWorld();
    createKanye();
    spawnEntities();
    createEscapeDoors();
}
