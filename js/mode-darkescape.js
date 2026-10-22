"use strict";
// ==========================================
// DARK ESCAPE MODE
// A pitch-black Backrooms/Hospital escape. Find 3 keys (image asset) to unlock a
// single exit door. The flashlight is the only reliable light source.
// ==========================================

var darkEscapeDoor = null;
var darkEscapeKeys = [];

var flashlightMaxBattery = 100;
var darkEscapeElapsed = 0;
var flashlightYaw = 0;
var flashlightPitch = 0;
var flashlightAimSwayTime = 0;
var flashlightMoveAmt = 0;
var flashlightLastX = 0;
var flashlightLastZ = 0;
var flashlightFlickerCooldown = 4;
var flashlightFlickerRemaining = 0;
var flashlightFlickerStrength = 0.5;
var flashlightBreakActive = false;
var flashlightBreakRemaining = 0;
var flashlightBreakWasOn = false;
var flashlightBreakTimes = [];
var flashlightBreaksUsed = 0;
var flashlightBreakPending = false;
var flashlightLight = null;
var flashlightLightTarget = null;
var flashlightBodyGlow = null;

var DARK_ESCAPE_POWERUP_URLS = {
    ice:     'assets/ice.png',
    speed:   'assets/speed.png',
    shield:  'assets/shield.png',
    battery: 'assets/battery-pickup-removebg-preview.png'
};
var DARK_ESCAPE_KEY_URL = 'key.png?v=27c';

function startDarkEscapeMode(difficulty) {
    prepareRunSession();
    document.getElementById('start-screen').classList.add('hidden');
    gameStarted = true;
    isDead = false;
    isPaused = false;
    isDarkEscapeMode = true;
    isDarkEscapeHard = difficulty === 'hard';
    isDarkEscapeExtreme = difficulty === 'extreme';
    isEscapeMode = false;
    isEndlessMode = false;
    isChaosMode = false;
    startTime = Date.now();
    pausedTime = 0;
    lastPauseStart = 0;
    stamina = maxStamina = getMaxStamina();
    sessionCoins = 0;
    resetSprintState();
    darkEscapeKeys = [];
    darkEscapeKeysFound = 0;
    darkEscapeDoor = null;
    flashlightOn = true;
    var lifeLvStart = saveData.upgrades.flashlightLife || 0;
    var lifeBonusStart = lifeLvStart >= 3 ? 0.35 : (lifeLvStart >= 2 ? 0.20 : (lifeLvStart >= 1 ? 0.15 : 0));
    flashlightMaxBattery = Math.round(100 * (1 + lifeBonusStart));
    flashlightBattery = flashlightMaxBattery;
    darkEscapeWon = false;
    darkEscapeElapsed = 0;
    flashlightYaw = 0;
    flashlightPitch = 0;
    flashlightAimSwayTime = 0;
    flashlightMoveAmt = 0;
    flashlightLastX = 0;
    flashlightLastZ = 0;
    flashlightFlickerCooldown = 3 + Math.random() * 4;
    flashlightFlickerRemaining = 0;
    flashlightBreakPending = false;
    flashlightBreakTimes = [];
    flashlightBreaksUsed = 0;
    flashlightBreakActive = false;
    flashlightBreakRemaining = 0;
    flashlightBreakWasOn = false;

    document.getElementById('hud-coins').textContent = '💰 0';
    document.getElementById('minimap').style.display = 'none';
    document.getElementById('escape-hud').style.display = 'none';
    document.getElementById('endless-hud').style.display = 'none';
    document.getElementById('chaos-hud').style.display = 'none';
    document.getElementById('darkescape-hud').style.display = 'block';
    document.getElementById('win-screen').style.display = 'none';
    updateTestBadgeUI();

    document.getElementById('darkescape-mode').textContent =
        isDarkEscapeExtreme ? '🔥 EXTREME' : isDarkEscapeHard ? '😈 HARD' : '🟢 EASY';
    document.getElementById('darkescape-heading').textContent =
        isDarkEscapeExtreme ? 'No light. No meter. Survive.' :
        isDarkEscapeHard ? 'Find 3 keys...' : 'Find 3 keys...';
    document.getElementById('darkescape-keys').textContent = '🔑 0 / 3';
    document.getElementById('darkescape-battery').textContent = '🔋 100%';
    document.getElementById('darkescape-battery-wrap').style.display = isDarkEscapeHard ? 'block' : 'none';
    document.getElementById('darkescape-door-indicator').textContent = '🔑 FIND 3 KEYS TO ESCAPE';
    document.getElementById('darkescape-door-indicator').classList.remove('nearby');
    document.getElementById('darkescape-controls').textContent =
        '🔦 Toggle: ' + formatKeyDisplay(flashlightKeyCode) +
        ' (or mobile 🔦) · Sprints: ' + (saveData.settings.sprintMode === 'toggle' ? 'toggle' : 'hold') +
        ' · change keys in Settings';

    currentMap = resolveSelectedMap();
    GRID_SIZE = getMapSize();

    if (hasSecondFloorActive()) {
        document.getElementById('minimap-floor').style.display = 'block';
        document.getElementById('minimap-floor').classList.add('standalone');
    } else {
        document.getElementById('minimap-floor').classList.remove('standalone');
        document.getElementById('minimap-floor').style.display = 'none';
    }

    clearScene();
    generateMaze();
    buildWorld();
    createKanye();
    spawnEntities();
    spawnDarkEscapeKeys();
    createFlashlightSpot();
    updateFlashlightAim(0);
    setupFlashlightBreaks();
    initAudio();
    applyFlashlightVisuals();
    syncMobileControlsDOM();
    safeRequestPointerLock();
}

function createFlashlightSpot() {
    if (flashlightLight) {
        scene.remove(flashlightLight);
        flashLightTargetRemove();
        flashlightLight = null;
        flashlightLightTarget = null;
    }
    if (flashlightBodyGlow) {
        scene.remove(flashlightBodyGlow);
        flashlightBodyGlow = null;
    }
    if (!isDarkEscapeMode) return;
    flashlightLight = new THREE.SpotLight(0xfff6dc, 11.0, 30, Math.PI / 5.5, 0.80, 2.0);
    flashlightLightTarget = new THREE.Object3D();
    scene.add(flashlightLight);
    scene.add(flashlightLightTarget);
    flashlightLight.target = flashlightLightTarget;
    flashlightLight.position.set(player.x, player.y + 0.1, player.z);
    flashlightLightTarget.position.set(player.x, player.y, player.z - 12);
    flashlightLightTarget.updateMatrixWorld();
    flashlightBodyGlow = new THREE.PointLight(0xb5cbe5, 3.6, 8.5, 2);
    flashlightBodyGlow.position.set(player.x, player.y - 0.05, player.z);
    scene.add(flashlightBodyGlow);
}

function flashLightTargetRemove() {
    if (flashlightLightTarget && scene) scene.remove(flashlightLightTarget);
    if (flashlightBodyGlow && scene) scene.remove(flashlightBodyGlow);
}

function setupFlashlightBreaks() {
    flashlightBreakTimes = [];
    flashlightBreaksUsed = 0;
    flashlightBreakActive = false;
    flashlightBreakRemaining = 0;
    flashlightBreakPending = false;

    if (isDarkEscapeExtreme) {
        for (var i = 0; i < 2; i++) {
            if (Math.random() < 0.10) {
                flashlightBreakTimes.push(6 + Math.random() * 58);
            }
        }
        flashlightBreakTimes.sort(function (a, b) { return a - b; });
    }
}

function triggerFlashlightBreak() {
    flashlightBreakActive = true;
    flashlightBreakRemaining = 10 + Math.random() * 20;
    flashlightBreakPending = false;
    flashlightBreakWasOn = flashlightOn;
    flashlightOn = false;
    flashlightBreaksUsed++;
    showPickupMessage('⚠️ FLASHLIGHT IS BROKEN!', 2200);
}

function updateFlashlightBreak(dt) {
    if (flashlightBreakActive) {
        flashlightBreakRemaining -= dt;
        if (flashlightBreakRemaining <= 0) {
            flashlightBreakActive = false;
            flashlightBreakRemaining = 0;
            flashlightBreakPending = false;
            if (flashlightBreakWasOn && flashlightBattery > 0) flashlightOn = true;
            if (flashlightBreakTimes.length > 0) {
                flashlightBreakTimes[0] = darkEscapeElapsed + 7 + Math.random() * 20;
                flashlightBreakTimes.sort(function (a, b) { return a - b; });
            }
            showPickupMessage('🔦 FLASHLIGHT BACK ON!', 1600);
        }
        return;
    }

    if (flashlightBreakTimes.length === 0) return;
    var next = flashlightBreakTimes[0];
    var untilBreak = next - darkEscapeElapsed;
    if (untilBreak <= 2.6) {
        flashlightBreakPending = true;
    }
    if (darkEscapeElapsed >= next) {
        flashlightBreakTimes.shift();
        triggerFlashlightBreak();
    }
}

function updateFlashlightAim(dt) {
    var yawTarget = player.yaw;
    var pitchTarget = player.pitch;
    flashlightYaw += angleDelta(flashlightYaw, yawTarget) * Math.min(1, dt * 14);
    flashlightPitch += (pitchTarget - flashlightPitch) * Math.min(1, dt * 14);
    flashlightAimSwayTime += dt * (1 + flashlightMoveAmt * 0.45);

    var dx = player.x - flashlightLastX;
    var dz = player.z - flashlightLastZ;
    var speed = Math.hypot(dx, dz) / Math.max(dt, 0.001);
    flashlightMoveAmt += (Math.min(2.4, speed * 0.045) - flashlightMoveAmt) * Math.min(1, dt * 6);
    flashlightLastX = player.x;
    flashlightLastZ = player.z;

    if (flashlightLight) {
        flashlightLight.position.set(player.x, player.y + 0.1, player.z);
        var fwdX = -Math.sin(flashlightYaw);
        var fwdZ = -Math.cos(flashlightYaw);
        var fwdY = Math.sin(flashlightPitch);
        var reach = 11;
        var drop = 2.0;
        flashlightLightTarget.position.set(
            player.x + fwdX * reach,
            player.y + fwdY * reach - drop,
            player.z + fwdZ * reach
        );
        flashlightLightTarget.updateMatrixWorld();
    }
    if (flashlightBodyGlow) {
        flashlightBodyGlow.position.set(player.x, player.y - 0.05, player.z);
    }
}

function angleDelta(from, to) {
    var d = (to - from) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
}

function updateFlashlightFlicker(dt) {
    if (flashlightBreakActive) return;
    if (flashlightBreakPending) {
        flashlightFlickerRemaining = 0.08;
        flashlightFlickerStrength = 1.0;
        flashlightFlickerCooldown = 0;
        return;
    }
    flashlightFlickerCooldown -= dt;
    if (flashlightFlickerCooldown <= 0) {
        flashlightFlickerRemaining = 0.14 + Math.random() * 0.5;
        flashlightFlickerStrength = 0.35 + Math.random() * 0.5;
        flashlightFlickerCooldown = 3.2 + Math.random() * 6.5;
    }
    if (flashlightFlickerRemaining > 0) flashlightFlickerRemaining -= dt;
}

function respawnDarkEscapePowerup(pu) {
    var shuffled = shuffle(walkableCells.slice());
    var pFootY = player.y - 1.6;
    for (var i = 0; i < shuffled.length; i++) {
        var cell = shuffled[i];
        var cf = cell.floor || 0;
        if (!isWalkableGrid(cell.x, cell.z, cf)) continue;
        var pos = gridToWorld(cell.x, cell.z);
        var baseY = getFloorBaseY(cf);
        if (Math.hypot(pos.x - player.x, baseY - pFootY, pos.z - player.z) < 9) continue;
        var tooClose = false;
        for (var pi = 0; pi < powerups.length; pi++) {
            var other = powerups[pi];
            if (other === pu || other.collected) continue;
            if (Math.hypot(other.x - pos.x, (other.baseY || 0) - baseY, other.z - pos.z) < MIN_POWERUP_SPACING) {
                tooClose = true;
                break;
            }
        }
        if (tooClose) continue;

        var type = DARK_ESCAPE_POWERUP_TYPES[Math.floor(Math.random() * DARK_ESCAPE_POWERUP_TYPES.length)];
        pu.type = type;
        pu.x = pos.x;
        pu.z = pos.z;
        pu.floor = cf;
        pu.baseY = baseY;
        pu.collected = false;
        pu.respawnAt = null;
        pu.sprite = new THREE.Sprite(getSpriteMaterial(DARK_ESCAPE_POWERUP_URLS[type], true));
        pu.sprite.scale.set(1.2, 1.2, 1);
        pu.sprite.position.set(pos.x, baseY + 0.8, pos.z);
        scene.add(pu.sprite);
        return;
    }
    pu.respawnAt = Date.now() + 5000;
}

function placeKey(px, pz, floor) {
    var baseY = getFloorBaseY(floor || 0);
    var sp = new THREE.Sprite(getSpriteMaterial(DARK_ESCAPE_KEY_URL, true));
    sp.scale.set(1.1, 1.1, 1);
    sp.position.set(px, baseY + 0.9, pz);
    scene.add(sp);
    darkEscapeKeys.push({ x: px, z: pz, floor: floor || 0, baseY: baseY, sprite: sp, collected: false });
}

function spawnOneKey(avoidPositions, preferredFloor) {
    var spacingLevels = [15, 8, 4];
    var pFootY = player.y - 1.6;
    for (var pass = 0; pass < spacingLevels.length; pass++) {
        var minSpacing = spacingLevels[pass];
        var minPlayer  = pass >= 2 ? 8 : 14;
        var pool = walkableCells.filter(function (c) {
            return preferredFloor === undefined || preferredFloor === null || (c.floor || 0) === preferredFloor;
        });
        if (pool.length < 1) pool = walkableCells.slice();
        var shuffled = shuffle(pool);
        for (var k = 0; k < shuffled.length; k++) {
            var cell = shuffled[k];
            var cf = cell.floor || 0;
            if (!isWalkableGrid(cell.x, cell.z, cf)) continue;
            var pos = gridToWorld(cell.x, cell.z);
            var baseY = getFloorBaseY(cf);
            if (Math.hypot(pos.x - player.x, baseY - pFootY, pos.z - player.z) < minPlayer) continue;
            var tooClose = false;
            for (var ai = 0; ai < avoidPositions.length; ai++) {
                var avY = avoidPositions[ai].baseY || 0;
                if (Math.hypot(avoidPositions[ai].x - pos.x, avY - baseY, avoidPositions[ai].z - pos.z) < minSpacing) {
                    tooClose = true; break;
                }
            }
            if (tooClose) continue;
            placeKey(pos.x, pos.z, cf);
            return;
        }
    }
    var all = shuffle(walkableCells.slice());
    for (var li = 0; li < all.length; li++) {
        var c = all[li];
        var lcf = c.floor || 0;
        if (!isWalkableGrid(c.x, c.z, lcf)) continue;
        var lp = gridToWorld(c.x, c.z);
        var lby = getFloorBaseY(lcf);
        var dup = false;
        for (var di = 0; di < avoidPositions.length; di++) {
            if (avoidPositions[di].x === lp.x && avoidPositions[di].z === lp.z && (avoidPositions[di].baseY || 0) === lby) {
                dup = true; break;
            }
        }
        if (!dup) { placeKey(lp.x, lp.z, lcf); return; }
    }
}

function spawnDarkEscapeKeys() {
    for (var i = 0; i < darkEscapeKeys.length; i++) {
        if (darkEscapeKeys[i].sprite) scene.remove(darkEscapeKeys[i].sprite);
    }
    darkEscapeKeys = [];
    if (walkableCells.length < 6) return;

    var pBaseY = player.y - 1.6;
    if (isDarkEscapeExtreme) {
        spawnOneKey([{ x: player.x, z: player.z, baseY: pBaseY }], 0);
    } else {
        var avoid = [{ x: player.x, z: player.z, baseY: pBaseY }];
        // Spread keys across both floors when Backrooms 2nd Floor is enabled!
        var floorPlan = hasSecondFloorActive() ? [0, 1, null] : [0, 0, 0];
        for (var n = 0; n < 3; n++) {
            spawnOneKey(avoid, floorPlan[n]);
            if (darkEscapeKeys.length > n) {
                var last = darkEscapeKeys[darkEscapeKeys.length - 1];
                avoid.push({ x: last.x, z: last.z, baseY: last.baseY || 0 });
            }
        }
    }
}

function spawnDarkEscapeDoor() {
    if (darkEscapeDoor) return;

    var pFloor = getPlayerFloor();
    var pFootY = player.y - 1.6;
    var pGrid = worldToGrid(player.x, player.z);
    var pSnap = findNearestPathWalkableGrid(pGrid.x, pGrid.z, 3, pFloor);
    var floors = hasSecondFloorActive() ? [0, 1] : [0];
    var candidates = [];

    for (var fi = 0; fi < floors.length; fi++) {
        var fl = floors[fi];
        var flMaze = getMazeForFloor(fl);
        var flBaseY = getFloorBaseY(fl);
        if (!flMaze) continue;

        for (var x = 2; x < GRID_SIZE - 2; x++) {
            for (var z = 2; z < GRID_SIZE - 2; z++) {
                if (isStairShaftCell(x, z)) continue;
                if (flMaze[x][z] !== 1) continue;
                var adjDirs = [
                    { wx: x - 1, wz: z, dir: 'east' },
                    { wx: x + 1, wz: z, dir: 'west' },
                    { wx: x, wz: z - 1, dir: 'south' },
                    { wx: x, wz: z + 1, dir: 'north' }
                ];
                for (var ai = 0; ai < adjDirs.length; ai++) {
                    var adj = adjDirs[ai];
                    if (adj.wx < 0 || adj.wx >= GRID_SIZE || adj.wz < 0 || adj.wz >= GRID_SIZE) continue;
                    if (isStairShaftCell(adj.wx, adj.wz)) continue;
                    if (!isPathWalkableGrid(adj.wx, adj.wz, fl)) continue;

                    var openSides = 0;
                    var approach = [{ dx: -1, dz: 0 }, { dx: 1, dz: 0 }, { dx: 0, dz: -1 }, { dx: 0, dz: 1 }];
                    for (var ap = 0; ap < approach.length; ap++) {
                        if (isPathWalkableGrid(adj.wx + approach[ap].dx, adj.wz + approach[ap].dz, fl)) openSides++;
                    }
                    if (openSides < 2) continue;

                    var doorPos = gridToWorld(x, z);
                    if (Math.hypot(doorPos.x - player.x, flBaseY - pFootY, doorPos.z - player.z) < 25) continue;

                    if (isMultiFloorReachable(pSnap.x, pSnap.z, pFloor, adj.wx, adj.wz, fl)) {
                        candidates.push({ x: x, z: z, adjX: adj.wx, adjZ: adj.wz, dir: adj.dir, floor: fl });
                    }
                }
            }
        }
    }

    if (candidates.length === 0) {
        var fMaze = getMazeForFloor(pFloor);
        for (var fx = 1; fx < GRID_SIZE - 1; fx++) {
            for (var fz = 1; fz < GRID_SIZE - 1; fz++) {
                if (isStairShaftCell(fx, fz)) continue;
                if (fMaze[fx][fz] !== 1) continue;
                var fallbackAdj = [
                    { wx: fx - 1, wz: fz, dir: 'east' },
                    { wx: fx + 1, wz: fz, dir: 'west' },
                    { wx: fx, wz: fz - 1, dir: 'south' },
                    { wx: fx, wz: fz + 1, dir: 'north' }
                ];
                for (var fa = 0; fa < fallbackAdj.length; fa++) {
                    var faA = fallbackAdj[fa];
                    if (faA.wx < 0 || faA.wx >= GRID_SIZE || faA.wz < 0 || faA.wz >= GRID_SIZE) continue;
                    if (isStairShaftCell(faA.wx, faA.wz)) continue;
                    if (isPathWalkableGrid(faA.wx, faA.wz, pFloor) &&
                        isMultiFloorReachable(pSnap.x, pSnap.z, pFloor, faA.wx, faA.wz, pFloor)) {
                        candidates.push({ x: fx, z: fz, adjX: faA.wx, adjZ: faA.wz, dir: faA.dir, floor: pFloor });
                        break;
                    }
                }
                if (candidates.length > 0) break;
            }
            if (candidates.length > 0) break;
        }
    }
    if (candidates.length === 0) return;
    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    var wallWorldPos = gridToWorld(pick.x, pick.z);
    var adjWorldPos  = gridToWorld(pick.adjX, pick.adjZ);
    var baseY = getFloorBaseY(pick.floor || 0);
    var faceX = (wallWorldPos.x + adjWorldPos.x) / 2;
    var faceZ = (wallWorldPos.z + adjWorldPos.z) / 2;
    var mesh = createDoorMesh(faceX, faceZ, pick.dir, 0x00e5ff, true, baseY);
    scene.add(mesh);
    darkEscapeDoor = {
        mesh: mesh,
        x: adjWorldPos.x,
        z: adjWorldPos.z,
        gridX: pick.x,
        gridZ: pick.z,
        floor: pick.floor || 0,
        baseY: baseY
    };
    showPickupMessage('🗝️ ALL KEYS FOUND! FIND THE DOOR!', 2600);
}

function checkDarkEscapeProgress() {
    var pFootY = player.y - 1.6;
    for (var i = 0; i < darkEscapeKeys.length; i++) {
        var key = darkEscapeKeys[i];
        if (key.collected) continue;
        if (Math.abs((key.baseY || 0) - pFootY) < 1.6 && Math.hypot(key.x - player.x, key.z - player.z) < 1.6) {
            key.collected = true;
            if (key.sprite) scene.remove(key.sprite);
            darkEscapeKeysFound++;
            document.getElementById('darkescape-keys').textContent = '🔑 ' + darkEscapeKeysFound + ' / 3';
            if (darkEscapeKeysFound >= 3) {
                showPickupMessage('🗝️ ALL KEYS FOUND! FIND THE DOOR!', 2600);
                spawnDarkEscapeDoor();
            } else {
                showPickupMessage('🔑 KEY FOUND! ' + darkEscapeKeysFound + '/3', 1800);
                if (isDarkEscapeExtreme) {
                    var avoidList = [{ x: player.x, z: player.z, baseY: pFootY }];
                    for (var ki2 = 0; ki2 < darkEscapeKeys.length; ki2++) {
                        avoidList.push({
                            x: darkEscapeKeys[ki2].x,
                            z: darkEscapeKeys[ki2].z,
                            baseY: darkEscapeKeys[ki2].baseY || 0
                        });
                    }
                    var nextFloor = hasSecondFloorActive() ? (darkEscapeKeysFound % 2 === 1 ? 1 : null) : 0;
                    spawnOneKey(avoidList, nextFloor);
                }
            }
        }
    }

    if (darkEscapeKeysFound >= 3 && !darkEscapeDoor) spawnDarkEscapeDoor();

    if (darkEscapeDoor && darkEscapeKeysFound >= 3) {
        var dist = Math.hypot(darkEscapeDoor.x - player.x, darkEscapeDoor.z - player.z);
        var dy = Math.abs((darkEscapeDoor.baseY || 0) - pFootY);
        if (dy < 1.5 && dist < 2.5) {
            winDarkEscape();
        }
    }
}

function updateDarkEscape(dt) {
    if (!gameStarted || isDead || isPaused || !pageVisible) return;

    darkEscapeElapsed += dt;
    updateFlashlightAim(dt);
    updateFlashlightFlicker(dt);
    updateFlashlightBreak(dt);

    if (player.flashlightNoDrain) {
        player.flashlightNoDrainTimer -= dt;
        if (player.flashlightNoDrainTimer <= 0) player.flashlightNoDrain = false;
    }
    if ((isDarkEscapeHard || isDarkEscapeExtreme) && flashlightOn && !flashlightBreakActive && !player.flashlightNoDrain) {
        flashlightBattery = Math.max(0, flashlightBattery - dt * 0.848);
        if (flashlightBattery <= 0) {
            flashlightBattery = 0;
            flashlightOn = false;
            showPickupMessage('🔋 FLASHLIGHT DEAD!', 2200);
        }
    }

    if (isDarkEscapeMode) {
        for (var pi = 0; pi < powerups.length; pi++) {
            var pu = powerups[pi];
            if (pu.collected && pu.respawnAt && Date.now() >= pu.respawnAt) {
                respawnDarkEscapePowerup(pu);
            }
        }
    }

    applyFlashlightVisuals();

    var indicator = document.getElementById('darkescape-door-indicator');
    var pFootY = player.y - 1.6;
    if (darkEscapeKeysFound < 3) {
        // Still hunting keys
    } else if (darkEscapeDoor) {
        var dist = Math.hypot(
            darkEscapeDoor.x - player.x,
            ((darkEscapeDoor.baseY || 0) - pFootY) * 1.8,
            darkEscapeDoor.z - player.z
        );
        if (isDarkEscapeHard || isDarkEscapeExtreme) {
            indicator.textContent = '🚪 FIND AN EXIT!';
            indicator.classList.remove('nearby');
        } else if (dist < 15) {
            indicator.textContent = '🚪 EXIT NEARBY!';
            indicator.classList.add('nearby');
        } else {
            indicator.textContent = '🚪 FIND AN EXIT!';
            indicator.classList.remove('nearby');
        }
    } else {
        indicator.textContent = '🚪 FIND AN EXIT!';
        indicator.classList.remove('nearby');
    }

    if (!darkEscapeWon) {
        var fear = document.getElementById('fear-overlay');
        var warn = document.getElementById('warning');

        if (noBotMode) {
            if (kanye.sprite) kanye.sprite.visible = false;
            setAudioVolume(0);
            if (fear) fear.style.opacity = '0';
            if (warn) warn.style.opacity = '0';
            return;
        }
        if (kanye.sprite && !kanye.sprite.visible) kanye.sprite.visible = true;

        var deToDist = updateSingleNextbot(kanye, dt);
        if (deToDist !== undefined) {
            var sameHeight = Math.abs((kanye.baseY || 0) - pFootY) < 1.6;
            var audioDist = sameHeight ? deToDist : deToDist + 22;
            var audioRange = 90;
            var vol = audioDist < audioRange ? Math.pow(1 - (audioDist / audioRange), 0.35) : 0;
            setAudioVolume(vol);

            var deLos = sameHeight && hasClearLineOfSight(kanye.x, kanye.z, player.x, player.z, kanye.baseY);
            updateCloseDanger(fear, warn, sameHeight ? deToDist : Infinity, deLos);

            var d2d = Math.hypot(kanye.x - player.x, kanye.z - player.z);
            if (sameHeight && d2d < 1.2) {
                if (handleNextbotCatch(kanye)) killPlayer();
            }
        }
    }
}

function applyFlashlightVisuals() {
    var overlay = document.getElementById('darkness-overlay');
    var vision = document.getElementById('flashlight-vision');
    if (!overlay) return;

    var active = flashlightOn && flashlightBattery > 0 && !flashlightBreakActive;
    var visible = active;
    var flickering = active && (flashlightFlickerRemaining > 0 || flashlightBreakPending);

    overlay.style.setProperty('--fx', '50%');
    overlay.style.setProperty('--fy', '50%');
    if (vision) {
        vision.style.setProperty('--fx', '50%');
        vision.style.setProperty('--fy', '50%');
    }

    if (visible) {
        overlay.classList.add('flashlight-on');
        overlay.classList.remove('flashlight-off');
        if (vision) {
            vision.classList.add('flashlight-on');
            vision.classList.remove('flashlight-off');
            var visionGlow = flickering ? 0.30 + Math.random() * 0.08 : 0.40;
            vision.style.opacity = String(visionGlow);
            var flickerDark = flickering ? 0.05 + Math.random() * 0.08 : 0;
            overlay.style.opacity = String(0.42 + flickerDark);
        } else {
            var noVisionFlicker = flickering ? 0.10 + Math.random() * 0.10 : 0;
            overlay.style.opacity = String(0.52 + noVisionFlicker);
        }
    } else {
        overlay.classList.remove('flashlight-on');
        overlay.classList.add('flashlight-off');
        if (vision) {
            vision.classList.remove('flashlight-on');
            vision.classList.add('flashlight-off');
            vision.style.opacity = String(0.36 + Math.random() * 0.03);
        }
        overlay.style.opacity = '0.66';
    }

    var batteryText = document.getElementById('darkescape-battery');
    if (batteryText && isDarkEscapeHard) {
        var battPct = flashlightMaxBattery > 0 ? Math.round(flashlightBattery / flashlightMaxBattery * 100) : 0;
        batteryText.textContent = '🔋 ' + battPct + '%';
    }

    if (scene && scene.fog) {
        if (visible) {
            var far = flickering ? 18 + Math.random() * 4 : 24;
            scene.fog.near = 1.0;
            scene.fog.far = far;
        } else {
            scene.fog.near = 0.5;
            scene.fog.far = 10.5;
        }
    }

    if (flashlightLight) {
        flashlightLight.intensity = visible ? (flickering ? 7.6 + Math.random() * 1.0 : 10.5) : 0;
    }
    if (flashlightBodyGlow) {
        flashlightBodyGlow.intensity = visible ? 0.70 : 3.6;
    }
}

function winDarkEscape() {
    if (darkEscapeWon) return;
    darkEscapeWon = true;
    var reward = isDarkEscapeExtreme ? 5 : (isDarkEscapeHard ? 20 : 10);
    sessionCoins += reward;

    if (!sessionUsedTestMode) {
        saveData.coins += sessionCoins;
        saveSaveData();
    }

    stopAudio();
    document.getElementById('coins-earned').textContent = '+' + sessionCoins + ' coins';
    document.getElementById('win-coins').textContent = '+' + sessionCoins + ' coins' + (sessionUsedTestMode ? ' (Test Mode)' : '');
    document.getElementById('win-msg').textContent = isDarkEscapeExtreme
        ? 'EXTREME MODE complete! You escaped the pure dark!'
        : isDarkEscapeHard
            ? 'HARD MODE complete! You escaped the darkness!'
            : 'You found all 3 keys and escaped!';
    document.getElementById('win-screen').style.display = 'flex';
    mouseDragLook.active = false;
    if (!isMobile) safeExitPointerLock();
    syncMobileControlsDOM();
}

function toggleFlashlight() {
    if (!isDarkEscapeMode || isDead || isPaused || darkEscapeWon) return;
    if (flashlightBreakActive) {
        showPickupMessage('⚠️ FLASHLIGHT IS BROKEN!', 1500);
        return;
    }
    if (flashlightOn) {
        flashlightOn = false;
    } else {
        if ((isDarkEscapeHard || isDarkEscapeExtreme) && flashlightBattery <= 0) {
            showPickupMessage('🔋 FLASHLIGHT IS DEAD!', 1600);
            return;
        }
        flashlightOn = true;
    }
    applyFlashlightVisuals();
}

function resetDarkEscapeState() {
    isDarkEscapeMode = false;
    isDarkEscapeHard = false;
    isDarkEscapeExtreme = false;
    darkEscapeKeys = [];
    darkEscapeKeysFound = 0;
    darkEscapeDoor = null;
    flashlightOn = true;
    flashlightBattery = 100;
    darkEscapeWon = false;
    darkEscapeElapsed = 0;
    flashlightYaw = 0;
    flashlightPitch = 0;
    flashlightMoveAmt = 0;
    flashlightBreakActive = false;
    flashlightBreakRemaining = 0;
    flashlightBreakWasOn = false;
    flashlightBreakTimes = [];
    flashlightBreaksUsed = 0;
    flashlightBreakPending = false;
    flashlightFlickerRemaining = 0;
    flashlightFlickerCooldown = 4;
    if (flashlightLight && scene) {
        scene.remove(flashlightLight);
    }
    flashLightTargetRemove();
    flashlightLight = null;
    flashlightLightTarget = null;
    flashlightBodyGlow = null;

    if (document.getElementById('darkescape-hud')) {
        document.getElementById('darkescape-hud').style.display = 'none';
    }
    if (document.getElementById('win-screen')) {
        document.getElementById('win-screen').style.display = 'none';
    }
    if (document.getElementById('darkness-overlay')) {
        var doOverlay = document.getElementById('darkness-overlay');
        doOverlay.style.opacity = '0';
        doOverlay.classList.remove('flashlight-on', 'flashlight-off');
    }
    if (document.getElementById('flashlight-vision')) {
        var glOverlay = document.getElementById('flashlight-vision');
        glOverlay.style.opacity = '0';
        glOverlay.classList.remove('flashlight-on', 'flashlight-off');
    }
}

function restartDarkEscape() {
    var diff = isDarkEscapeExtreme ? 'extreme' : (isDarkEscapeHard ? 'hard' : 'easy');
    if (sessionUsedTestMode) launchingSecretTestRun = true;
    startDarkEscapeMode(diff);
}
