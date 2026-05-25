let ROWS = 15;
let COLS = 17;
const BASE_ROWS = 15;
const BASE_COLS = 17;
const MAX_BOMBS = 3; // limit bombs on field

const WALL = 1;
const SOFT_WALL = 2;
const FLOOR = 3;

const audioTracks = ['Roi.mp3'];
let music = null;
const placeBombSfx = new Audio('deploybomb.mp3');
const explosionSfx = new Audio('explosion.mp3');

let map = [];
let player = { x: 1, y: 1, lives: 3, score: 0, range: 2, nukes: 0, name: 'Player' };
let level = 1;
let bombs = [];
let explosions = [];
let lastNukeTime = 0;
const nukeCooldown = 15000; // 15 seconds
let enemies = [];
let powerups = [];
let gameOver = false;
let gameInterval = null;
let enemyInterval = null;
let nukeAwardedThisLevel = false;

function initMap() {
    map = [];
    for (let y = 0; y < ROWS; y++) {
        map[y] = [];
        for (let x = 0; x < COLS; x++) {
            if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
                map[y][x] = WALL;
            } else if (x % 2 === 0 && y % 2 === 0) {
                map[y][x] = WALL;
            } else if ((x <= 4 && y <= 4) || (x >= COLS - 5 && y >= ROWS - 5)) {
                map[y][x] = FLOOR;
            } else if (Math.random() < 0.4) {
                map[y][x] = SOFT_WALL;
            } else {
                map[y][x] = FLOOR;
            }
        }
    }
}
function initGame() {
    player.x = 1;
    player.y = 1;
    player.lives = 3;
    player.score = 0;
    player.range = Math.max(2, 1 + Math.floor(level / 2));
    player.nukes = 0; // nukes disabled at start until player obtains one
    player.name = document.getElementById('input-name') ? document.getElementById('input-name').value || 'Player' : 'Player';
    nukeAwardedThisLevel = false;

    map = [];
    bombs = [];
    explosions = [];
    enemies = [];
    powerups = [];
    gameOver = false;

    initMap();
    spawnEnemies(2 + level);
    render();
    updateUI();

    if (gameInterval) clearInterval(gameInterval);
    if (enemyInterval) clearInterval(enemyInterval);

    gameInterval = setInterval(updateBombs, 500);
    const enemySpeed = Math.max(250, 900 - level * 100);
    enemyInterval = setInterval(moveEnemies, enemySpeed);

    playRandomSong();
    let nukeGranted = false; // ensure only 1 nuke per level when soft-wall destroyed
}

function spawnEnemies(count) {
    // spawn one boss on later levels
    if (level >= 2) {
        let bossX, bossY;
        player.nukes = 0; // nukes disabled at start until player obtains one
        nukeGranted = false;
        do {
            bossX = Math.floor(Math.random() * COLS);
            bossY = Math.floor(Math.random() * ROWS);
            bossAttempts++;
        } while (((map[bossY] && map[bossY][bossX]) !== FLOOR) || (((bossX < 5 && bossY < 5) || (bossX > COLS - 6 && bossY > ROWS - 6)) && bossAttempts < 200));
        if (map[bossY] && map[bossY][bossX] === FLOOR) {
            enemies.push({ x: bossX, y: bossY, alive: true, boss: true, hp: 3 });
        }
    }

    for (let i = 0; i < count; i++) {
        let ex, ey;
        let attempts = 0;
        do {
            ex = Math.floor(Math.random() * COLS);
            ey = Math.floor(Math.random() * ROWS);
            attempts++;
        } while (((map[ey] && map[ey][ex]) !== FLOOR) || enemies.some(e => e.x === ex && e.y === ey) || (((ex < 5 && ey < 5) || (ex > COLS - 6 && ey > ROWS - 6)) && attempts < 200));
        if (map[ey] && map[ey][ex] === FLOOR && !enemies.some(e => e.x === ex && e.y === ey)) enemies.push({ x: ex, y: ey, alive: true });
    }
}
                    if (roll < 0.5) {
                        // grant the per-level nuke only once per level when destroying a soft wall
                        if (!nukeGranted) {
                            player.nukes = 1;
                            nukeGranted = true;
                            showMessage('Nuke per-level didapat!');
                        } else {
                            player.score += 20;
                        }
                    } else if (roll < 0.65) {
    
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            // reset per-level nuke state
            nukeGranted = false;
            player.nukes = 0;
            
            // Render enemies and boss
            const enemy = enemies.find(e => e.x === x && e.y === y && e.alive);
            if (enemy) {
                cell.classList.add(enemy.boss ? 'boss' : 'enemy');
            }
            
            // Render explosions
            const explosion = explosions.find(e => e.x === x && e.y === y);
            if (explosion) {
                cell.classList.add('explosion');
            }
            
            // Render bombs
            const bomb = bombs.find(b => b.x === x && b.y === y);
            if (bomb && !explosion) {
                cell.classList.add('bomb');
            }
            
            // Render powerups
            const powerup = powerups.find(p => p.x === x && p.y === y);
            if (powerup) {
                cell.classList.add('powerup', powerup.type);
            }
            
            // Render player
            if (player.x === x && player.y === y) {
                cell.classList.add('player');
            }
            
            // Render walls
            if (type === WALL) {
                cell.classList.add('wall');
            } else if (type === SOFT_WALL) {
                cell.classList.add('soft-wall');
            } else {
                cell.classList.add('floor');
            }
            
            cell.style.width = cellSize + 'px';
            cell.style.height = cellSize + 'px';
            board.appendChild(cell);
        }
    }
}

function showMessage(msg, duration = 1500) {
    const existing = document.querySelector('.game-message');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'game-message';
    div.textContent = msg;
    document.querySelector('.game-container').appendChild(div);
    setTimeout(() => div.remove(), duration);
}

function stopMusic() {
    if (music) {
        music.pause();
        music.currentTime = 0;
        music = null;
    }
}

function playSfx(audio, volume = 1) {
    if (!audio) return;
    try {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = volume;
        audio.play();
    } catch (e) {
        // ignore browser autoplay restrictions
    }
}

function playRandomSong() {
    stopMusic();
    const track = audioTracks[Math.floor(Math.random() * audioTracks.length)];
    music = new Audio(track);
    music.loop = true;
    music.volume = 0.5;
    music.play().catch(() => {
        // play may be blocked until user interacts
    });
}

function showMainMenu() {
    document.getElementById('main-menu').classList.remove('hidden');
}

function hideMainMenu() {
    document.getElementById('main-menu').classList.add('hidden');
}

function canMove(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
    if (map[y][x] === WALL || map[y][x] === SOFT_WALL) return false;
    if (bombs.some(b => b.x === x && b.y === y)) return false;
    return true;
}

function movePlayer(dx, dy) {
    if (gameOver) return;
    
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    if (canMove(newX, newY)) {
        player.x = newX;
        player.y = newY;
        
        // Check powerup
        const powerupIndex = powerups.findIndex(p => p.x === newX && p.y === newY);
        if (powerupIndex !== -1) {
            const powerup = powerups[powerupIndex];
            powerups.splice(powerupIndex, 1);
            if (powerup.type === 'health') {
                player.lives++;
                showMessage('Obat didapat! Nyawa +1');
            } else if (powerup.type === 'nuke') {
                player.nukes = 1;
                showMessage('Nuke didapat!');
            } else {
                player.score += 50;
            }
            updateUI();
        }
        
        // Check if player hit by enemy
        if (enemies.some(e => e.x === newX && e.y === newY && e.alive)) {
            playerHit();
        }
        
        render();
    }
}

function placeBomb() {
    if (gameOver) return;
    if (bombs.some(b => b.x === player.x && b.y === player.y)) {
        showMessage('Bomb already here!');
        return;
    }
    if (bombs.length >= MAX_BOMBS) {
        showMessage(`Max ${MAX_BOMBS} bombs at once`);
        return;
    }
    bombs.push({
        x: player.x,
        y: player.y,
        timer: 5,
        range: player.range || 2
    });
    player.score += 5;
    updateUI();
    playSfx(placeBombSfx, 0.45);
    render();
}

function updateBombs() {
    bombs = bombs.filter(bomb => {
        bomb.timer--;
        
        if (bomb.timer <= 0) {
            explodeBomb(bomb);
            return false;
        }
        return true;
    });
    
    render();
}

function explodeBomb(bomb) {
    playSfx(explosionSfx, 0.7);
    const directions = [
        { dx: 0, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
    ];
    
    directions.forEach(dir => {
        for (let i = 0; i <= bomb.range; i++) {
            if (i === 0 && (dir.dx !== 0 || dir.dy !== 0)) continue;
            
            const ex = bomb.x + dir.dx * i;
            const ey = bomb.y + dir.dy * i;
            
            if (ex < 0 || ex >= COLS || ey < 0 || ey >= ROWS) break;
            if (map[ey][ex] === WALL) break;
            
            explosions.push({ x: ex, y: ey, timer: 2 });
            
            if (map[ey][ex] === SOFT_WALL) {
                map[ey][ex] = FLOOR;
                player.score += 10;
                const roll = Math.random();
                if (roll < 0.5) {
                    const hasNukePowerup = powerups.some(p => p.type === 'nuke');
                    if (!player.nukes && !hasNukePowerup && !nukeAwardedThisLevel) {
                        powerups.push({ x: ex, y: ey, type: 'nuke' });
                        nukeAwardedThisLevel = true;
                    } else {
                        player.score += 20;
                    }
                } else if (roll < 0.65) {
                    powerups.push({ x: ex, y: ey, type: 'health' });
                } else if (roll < 0.8) {
                    powerups.push({ x: ex, y: ey, type: 'score' });
                }
                break;
            }
        }
    });
    
    // Check Jika player terkena ledakan
    if (explosions.some(e => e.x === player.x && e.y === player.y)) {
        playerHit();
    }
    
    // Check if enemies are in explosion
    enemies.forEach(enemy => {
        if (explosions.some(e => e.x === enemy.x && e.y === enemy.y)) {
            if (enemy.boss) {
                enemy.hp -= 1;
                showMessage('Bos terkena ledakan!');
                if (enemy.hp <= 0) {
                    enemy.alive = false;
                    player.score += 500;
                }
            } else {
                enemy.alive = false;
                player.score += 100;
                if (Math.random() < 0.25) {
                    powerups.push({ x: enemy.x, y: enemy.y, type: 'health' });
                }
            }
            updateUI();
        }
    });
    
    setTimeout(() => {
        explosions = [];
        render();
    }, 500);
}

function checkLevelComplete() {
    const anyAlive = enemies.some(e => e.alive);
    if (!anyAlive) {
        // level up
        level++;
        player.range = (player.range || 2) + 1; // increase radius
        nukeAwardedThisLevel = false;
        // regenerate map and replace enemy set for next level
        initMap();
        bombs = [];
        explosions = [];
        enemies = [];
        spawnEnemies(2 + level);
        // increase enemy speed
        if (enemyInterval) clearInterval(enemyInterval);
        const enemySpeed = Math.max(200, 900 - level * 120);
        enemyInterval = setInterval(moveEnemies, enemySpeed);
        updateUI();
        render();
    }
}

function moveEnemies() {
    if (gameOver) return;
    
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];
        
        const validDirs = directions.filter(dir => {
            const nx = enemy.x + dir.dx;
            const ny = enemy.y + dir.dy;
            return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS &&
                   map[ny][nx] !== WALL && map[ny][nx] !== SOFT_WALL &&
                   !bombs.some(b => b.x === nx && b.y === ny);
        });
        
        if (validDirs.length > 0) {
            const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
            enemy.x += dir.dx;
            enemy.y += dir.dy;
        }
        
        if (enemy.x === player.x && enemy.y === player.y) {
            playerHit();
        }
    });
    
    render();
    checkLevelComplete();
}

function playerHit() {
    player.lives--;
    updateUI();
    
    if (player.lives <= 0) {
        showGameOver();
    } else {
        // Reset position
        player.x = 1;
        player.y = 1;
    }
    
    render();
}

function showGameOver() {
    gameOver = true;
    stopMusic();

    const overlay = document.createElement('div');
    overlay.className = 'game-over';
    overlay.innerHTML = `
        <h2>GAME OVER</h2>
        <p>Skor Akhir: ${player.score}</p>
        <br>
        <button id="save-score">Simpan Skor</button>
        <button id="play-again">Main Lagi</button>
    `;
    
    // ensure menus are hidden so overlay receives clicks
    const mm = document.getElementById('main-menu'); if (mm) mm.classList.add('hidden');
    const rk = document.getElementById('ranking'); if (rk) rk.classList.add('hidden');

    // append to body so it floats above everything
    document.body.appendChild(overlay);

    // attach listeners using overlay scope to avoid timing issues
    const playBtn = overlay.querySelector('#play-again');
    const saveBtn = overlay.querySelector('#save-score');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            overlay.remove();
            showMainMenu();
        });
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveRanking();
            overlay.remove();
            showRanking();
        });
    }
}

function updateUI() {
    document.getElementById('score').textContent = player.score;
    document.getElementById('lives').textContent = player.lives;
    document.getElementById('level').textContent = level;
    document.getElementById('nukes').textContent = player.nukes || 0;
    document.getElementById('player-name').textContent = player.name || 'Player';
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            movePlayer(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            movePlayer(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            movePlayer(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            movePlayer(1, 0);
            break;
        case 'e': // space
        case 'E':
            placeBomb();
            break;
        case 'r':
        case 'R':
            level = 1;
            initGame();
            break;
        case 'n':
        case 'N':
            useNuke();
            break;
    }
});

// Start game when page loads
window.addEventListener('load', () => {
    // wire up menu buttons
    document.getElementById('start-btn').addEventListener('click', () => {
        hideMainMenu();
        level = 1;
        initGame();
    });
    document.getElementById('rank-btn').addEventListener('click', () => {
        showRanking();
    });
    document.getElementById('close-rank').addEventListener('click', () => {
        document.getElementById('ranking').classList.add('hidden');
    });
    document.getElementById('menu-rank').addEventListener('click', () => {
        document.getElementById('ranking').classList.add('hidden');
        showMainMenu();
    });
    // new menu buttons
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('settings').classList.remove('hidden');
    });
    const closeSettings = document.getElementById('close-settings');
    if (closeSettings) closeSettings.addEventListener('click', () => {
        document.getElementById('settings').classList.add('hidden');
        showMainMenu();
    });
    const creditsBtn = document.getElementById('credits-btn');
    if (creditsBtn) creditsBtn.addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('credits').classList.remove('hidden');
    });
    const closeCredits = document.getElementById('close-credits');
    if (closeCredits) closeCredits.addEventListener('click', () => {
        document.getElementById('credits').classList.add('hidden');
        showMainMenu();
    });
    const menuCredits = document.getElementById('menu-credits');
    if (menuCredits) menuCredits.addEventListener('click', () => {
        document.getElementById('credits').classList.add('hidden');
        showMainMenu();
    });

    // show main menu on load
    showMainMenu();
});

// Ranking storage
function getRankings() {
    try {
        return JSON.parse(localStorage.getItem('bomberman_ranks') || '[]');
    } catch (e) {
        return [];
    }
}

function saveRanking() {
    const name = player.name || (document.getElementById('input-name') ? document.getElementById('input-name').value : 'Player');
    const ranks = getRankings();
    ranks.push({ name: name, score: player.score });
    ranks.sort((a, b) => b.score - a.score);
    localStorage.setItem('bomberman_ranks', JSON.stringify(ranks.slice(0, 10)));
}

function showRanking() {
    const ranks = getRankings();
    const list = document.getElementById('ranking-list');
    list.innerHTML = '';
    ranks.forEach(r => {
        const li = document.createElement('li');
        li.textContent = `${r.name} — ${r.score}`;
        list.appendChild(li);
    });
    document.getElementById('ranking').classList.remove('hidden');
}

// Special nuke skill: clears soft walls and kills all enemies on map
function useNuke() {
    if (gameOver) return;
    if (!player.nukes || player.nukes <= 0) {
        showMessage('No nukes available');
        return;
    }
    const now = Date.now();
    const since = now - (lastNukeTime || 0);
    if (since < nukeCooldown) {
        const remain = Math.ceil((nukeCooldown - since) / 1000);
        showMessage(`Nuke on cooldown: ${remain}s`);
        return;
    }
    player.nukes--;
    lastNukeTime = Date.now();
    // play nuke sound and create explosions across the map (larger/longer)
    playSfx(explosionSfx, 1.0);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (map[y][x] === SOFT_WALL) {
                map[y][x] = FLOOR;
                player.score += 10;
            }
            explosions.push({ x, y, timer: 4 });
        }
    }
    // kill all enemies
    enemies.forEach(enemy => { if (enemy.alive) { enemy.alive = false; player.score += 100; } });
    updateUI();
    render();
    setTimeout(() => { explosions = []; render(); checkLevelComplete(); }, 1200);
}