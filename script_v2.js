// Cleaned game script with settings and fixed nuke logic

let ROWS = 21;
let COLS = 25;
const MAX_BOMBS = 3;
const WALL = 1, SOFT_WALL = 2, FLOOR = 3;

const audioTracks = ['Roi.mp3'];
let music = null;
const playerSfx = new Audio('sound player deploy bom.mp3');
const placeBombSfx = new Audio('deploybomb.mp3');
const explosionSfx = new Audio('explosion.mp3');
const deadSfx = new Audio('dead.mp3');
const gameOverSfx = new Audio('game over.mp3');

// Cheat mode variables
let cheatUnlimitedNuke = false;
let cheatInvincible = false;
let cheatUnlimitedBomb = false;

let map = [];
let player = { x: 1, y: 1, lives: 3, score: 0, range: 2, nukes: 0, maxBombs: MAX_BOMBS, name: 'Player' };
let level = 1;
let bombs = [];
let explosions = [];
let lastNukeTime = 0;
const nukeCooldown = 15000;
let enemies = [];
let powerups = [];
let gameOver = false;
let gameInterval = null;
let enemyInterval = null;
let nukeAwardedThisLevel = false;

// settings and localization
const settings = {
  music: (localStorage.getItem('bomber_music') !== 'false'),
  effects: (localStorage.getItem('bomber_effects') !== 'false'),
  lang: localStorage.getItem('bomber_lang') || 'id'
};

const locales = {
  id: {
    play: 'Main',
    ranking: 'Peringkat',
    setting: 'Pengaturan',
    credits: 'Pembuat',
    nameLabel: 'Nama Pemain:',
    nukeObtained: 'Nuke per-level didapat!',
    gameTitle: 'BOMBERMAN'
  },
  en: {
    play: 'Play',
    ranking: 'Ranking',
    setting: 'Settings',
    credits: 'Credits',
    nameLabel: 'Player Name:',
    nukeObtained: 'Per-level nuke obtained!',
    gameTitle: 'BOMBERMAN'
  }
};

function applyLanguage() {
  const L = locales[settings.lang] || locales.id;
  const startBtn = document.getElementById('start-btn');
  const rankBtn = document.getElementById('rank-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const creditsBtn = document.getElementById('credits-btn');
  const settingsTitle = document.getElementById('settings-title');
  const lblMusic = document.getElementById('lbl-music');
  const lblEffects = document.getElementById('lbl-effects');
  const lblLang = document.getElementById('lbl-lang');
  const nameLabel = document.querySelector('.menu-input label');
  const mainTitle = document.querySelector('.main-title');

  if (startBtn) startBtn.textContent = L.play;
  if (rankBtn) rankBtn.textContent = L.ranking;
  if (settingsBtn) settingsBtn.textContent = L.setting;
  if (creditsBtn) creditsBtn.textContent = L.credits;
  if (settingsTitle) settingsTitle.textContent = L.setting;
  if (lblMusic) lblMusic.textContent = 'Musik:';
  if (lblEffects) lblEffects.textContent = 'Effect:';
  if (lblLang) lblLang.textContent = 'Bahasa:';
  if (nameLabel) nameLabel.textContent = L.nameLabel;
  if (mainTitle) mainTitle.textContent = L.gameTitle;
}

function initMap() {
  map = Array.from({length: ROWS}, (_, y) => Array.from({length: COLS}, (_, x) => {
    if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) return WALL;
    if (x % 2 === 0 && y % 2 === 0) return WALL;
    if ((x <= 4 && y <= 4) || (x >= COLS - 5 && y >= ROWS - 5)) return FLOOR;
    return Math.random() < 0.4 ? SOFT_WALL : FLOOR;
  }));
}

function initGame() {
  player.x = 1; player.y = 1; player.lives = 3; player.score = 0;
  player.range = Math.max(2, 1 + Math.floor(level / 2));
  player.nukes = 0;
  player.maxBombs = MAX_BOMBS;
  player.name = document.getElementById('input-name')?.value || 'Player';
  nukeAwardedThisLevel = false;

  bombs = []; explosions = []; enemies = []; powerups = []; gameOver = false;
  initMap(); spawnEnemies(2 + level); render(); updateUI();

  clearInterval(gameInterval); clearInterval(enemyInterval);
  gameInterval = setInterval(updateBombs, 500);
  enemyInterval = setInterval(moveEnemies, Math.max(250, 900 - level * 100));

  if (settings.music) playRandomSong(); else stopMusic();
}

function spawnEnemies(count) {
  if (level >= 2) {
    let bossAttempts = 0; let bossX, bossY;
    do { bossX = Math.floor(Math.random() * COLS); bossY = Math.floor(Math.random() * ROWS); bossAttempts++; }
    while (((map[bossY] && map[bossY][bossX]) !== FLOOR) && bossAttempts < 300);
    if (map[bossY] && map[bossY][bossX] === FLOOR) enemies.push({x: bossX, y: bossY, alive: true, boss: true, hp: 3});
  }
  for (let i=0;i<count;i++){
    let attempts=0, ex,ey;
    do { ex = Math.floor(Math.random()*COLS); ey = Math.floor(Math.random()*ROWS); attempts++; }
    while (((map[ey] && map[ey][ex]) !== FLOOR) && attempts < 300);
    if (map[ey] && map[ey][ex] === FLOOR) enemies.push({x:ex,y:ey,alive:true});
  }
}

function render() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';
  const cellSize = Math.max(20, Math.floor(Math.min(720 / COLS, 540 / ROWS)));
  board.style.gridTemplateColumns = `repeat(${COLS}, ${cellSize}px)`;
  board.style.gridTemplateRows = `repeat(${ROWS}, ${cellSize}px)`;
  for (let y=0;y<ROWS;y++){
    for (let x=0;x<COLS;x++){
      const cell = document.createElement('div');
      cell.className='cell';
      const type = map[y][x];
      const enemy = enemies.find(e=>e.x===x&&e.y===y&&(e.alive || (e.deathTimer && e.deathTimer > 0)));
      if (enemy) {
        if (enemy.alive) {
          cell.classList.add(enemy.boss? 'boss':'enemy');
        } else if (enemy.deathTimer) {
          cell.classList.add('enemy-dead');
          cell.style.opacity = `${enemy.deathTimer / 5}`;
        }
      }
      if (explosions.find(e=>e.x===x&&e.y===y)) cell.classList.add('explosion');
      if (bombs.find(b=>b.x===x&&b.y===y)) cell.classList.add('bomb');
      const p = powerups.find(pu=>pu.x===x&&pu.y===y);
      if (p) {
        cell.classList.add('powerup', p.type);
        if (p.type === 'bomb'){
          cell.style.backgroundImage = "url('BOMB+.png')";
          cell.style.backgroundSize = 'contain';
          cell.style.backgroundRepeat = 'no-repeat';
          cell.style.backgroundPosition = 'center';
        }
      }
      if (player.x===x && player.y===y) cell.classList.add('player');
      if (type===WALL) cell.classList.add('wall'); else if (type===SOFT_WALL) cell.classList.add('soft-wall'); else cell.classList.add('floor');
      cell.style.width = cellSize+'px'; cell.style.height = cellSize+'px';
      board.appendChild(cell);
    }
  }
}

function showMessage(msg, duration=1500){ const ex=document.querySelector('.game-message'); if(ex) ex.remove(); const d=document.createElement('div'); d.className='game-message'; d.textContent=msg; document.querySelector('.game-container').appendChild(d); setTimeout(()=>d.remove(),duration); }

function stopMusic(){ if (music){ music.pause(); music.currentTime=0; music=null; } }
function playSfx(audio, volume=1, rate=1){ if (!settings.effects) return; if (!audio) return; try{ audio.pause(); audio.currentTime=0; audio.volume=volume; audio.playbackRate = rate || 1; audio.play(); }catch(e){} }
function playRandomSong(){ stopMusic(); if (!settings.music) return; const track = audioTracks[Math.floor(Math.random()*audioTracks.length)]; music = new Audio(track); music.loop=true; music.volume=0.5; music.play().catch(()=>{}); }

function showMainMenu(){ document.getElementById('main-menu').classList.remove('hidden'); }
function hideMainMenu(){ document.getElementById('main-menu').classList.add('hidden'); }

function canMove(x,y){ if (x<0||x>=COLS||y<0||y>=ROWS) return false; if (map[y][x]===WALL||map[y][x]===SOFT_WALL) return false; if (bombs.some(b=>b.x===x&&b.y===y)) return false; return true; }
function movePlayer(dx,dy){
  if (gameOver) return;
  const nx = player.x + dx, ny = player.y + dy;
  if (!canMove(nx,ny)) return;
  player.x = nx; player.y = ny;
  const pi = powerups.findIndex(p=>p.x===nx&&p.y===ny);
  if (pi !== -1){
    const pu = powerups.splice(pi,1)[0];
    if (pu.type === 'health'){
      player.lives++; showMessage('Obat didapat! Nyawa +1');
    } else if (pu.type === 'nuke'){
      player.nukes = 1; showMessage(locales[settings.lang].nukeObtained);
    } else if (pu.type === 'bomb'){
      player.maxBombs = (player.maxBombs || MAX_BOMBS) + 1;
      showMessage('Stack bom bertambah!');
    } else {
      player.score += 50;
    }
    updateUI();
  }
  if (enemies.some(e=>e.x===nx&&e.y===ny&&e.alive)) playerHit();
  render();
}

function placeBomb(){
  if (gameOver) return;
  if (bombs.some(b=>b.x===player.x&&b.y===player.y)){ showMessage('Bomb already here!'); return; }
  const maxAllowed = cheatUnlimitedBomb ? 999 : (player.maxBombs || MAX_BOMBS);
  if (bombs.length >= maxAllowed){ showMessage(`Max ${maxAllowed} bombs at once`); return; }
  bombs.push({x:player.x,y:player.y,timer:5,range:player.range||2});
  player.score+=5; updateUI(); playSfx(playerSfx, 0.4); setTimeout(() => playSfx(placeBombSfx, 0.45), 150); render();
}


function updateBombs(){ bombs = bombs.filter(b=>{ b.timer--; if (b.timer<=0){ explodeBomb(b); return false; } return true; }); render(); }

function explodeBomb(bomb){
  playSfx(explosionSfx,0.7);
  const dirs = [ {dx:0,dy:0}, {dx:1,dy:0}, {dx:-1,dy:0}, {dx:0,dy:1}, {dx:0,dy:-1} ];
  dirs.forEach(dir => {
    for (let i=0;i<=bomb.range;i++){
      if (i===0 && (dir.dx!==0||dir.dy!==0)) continue;
      const ex = bomb.x + dir.dx * i, ey = bomb.y + dir.dy * i;
      if (ex<0||ex>=COLS||ey<0||ey>=ROWS) break;
      if (map[ey][ex] === WALL) break;
      explosions.push({x:ex,y:ey,timer:2});

      if (map[ey][ex] === SOFT_WALL){
        map[ey][ex] = FLOOR;
        player.score += 10;
        const roll = Math.random();
        if (roll < 0.45){
          const hasNuke = powerups.some(p=>p.type==='nuke');
          if (!player.nukes && !hasNuke && !nukeAwardedThisLevel){
            powerups.push({x:ex,y:ey,type:'nuke'});
            nukeAwardedThisLevel = true;
          } else {
            player.score += 20;
          }
        } else if (roll < 0.6){
          powerups.push({x:ex,y:ey,type:'bomb'});
        } else if (roll < 0.75){
          powerups.push({x:ex,y:ey,type:'health'});
        } else if (roll < 0.9){
          powerups.push({x:ex,y:ey,type:'score'});
        }
        break;
      }
    }
  });
    // check player hit
  if (!cheatInvincible && explosions.some(e=>e.x===player.x&&e.y===player.y)) playerHit();

  // check enemies
  enemies.forEach(enemy => {
    if (explosions.some(e=>e.x===enemy.x&&e.y===enemy.y)){
      if (enemy.boss){
        enemy.hp -= 1;
        showMessage('Bos terkena ledakan!');
        // boss hit: heavier/deeper sound
        playSfx(deadSfx, 0.9, 0.85);
        if (enemy.hp <= 0){ enemy.alive = false; enemy.deathTimer = 5; player.score += 500; playSfx(deadSfx, 1.0, 0.75); }
      } else {
        enemy.alive = false;
        enemy.deathTimer = 5;
        player.score += 100;
        // enemy death: higher pitch
        playSfx(deadSfx, 1.0, 1.25);
        if (Math.random() < 0.25) powerups.push({x:enemy.x,y:enemy.y,type:'health'});
      }
      updateUI();
    }
  });

  setTimeout(()=>{ explosions = []; render(); }, 500);
}

function checkLevelComplete(){ if (!enemies.some(e=>e.alive)){ level++; player.range=(player.range||2)+1; nukeAwardedThisLevel=false; initMap(); bombs=[]; explosions=[]; enemies=[]; spawnEnemies(2+level); clearInterval(enemyInterval); enemyInterval = setInterval(moveEnemies, Math.max(200,900-level*120)); updateUI(); render(); } }

function moveEnemies(){ 
  if (gameOver) return; 
  enemies.forEach(enemy=>{ 
    if (enemy.deathTimer !== undefined) {
      enemy.deathTimer--;
      if (enemy.deathTimer <= 0) return;
    }
    if (!enemy.alive) return; 
    const dirs=[{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}]; 
    const valid=dirs.filter(d=>{ 
      const nx=enemy.x+d.dx, ny=enemy.y+d.dy; 
      return nx>=0&&nx<COLS&&ny>=0&&ny<ROWS && map[ny][nx]!==WALL && map[ny][nx]!==SOFT_WALL && !bombs.some(b=>b.x===nx&&b.y===ny); 
    }); 
    if (valid.length>0){ 
      const d=valid[Math.floor(Math.random()*valid.length)]; 
      enemy.x+=d.dx; 
      enemy.y+=d.dy; 
    } 
    if (enemy.x===player.x&&enemy.y===player.y) playerHit(); 
  }); 
  enemies = enemies.filter(e => e.deathTimer === undefined || e.deathTimer > 0);
  render(); 
  checkLevelComplete(); 
}

function playerHit(){
  // Check cheat: invincible
  if (cheatInvincible) {
    showMessage('Invincible! ✓');
    return;
  }
  
  player.lives--;
  updateUI();
  // play death sfx on player hit
  playSfx(deadSfx, 1.0, 1.0);
  if (player.lives<=0) showGameOver(); else { player.x=1; player.y=1; }
  render();
}


function showGameOver(){
  gameOver = true;
  playSfx(gameOverSfx, 1.0);
  stopMusic();
  const overlay = document.createElement('div');
  overlay.className = 'game-over';
  overlay.innerHTML = `
    <h2>GAME OVER</h2>
    <p>Skor Akhir: ${player.score}</p>
    <br>
    <button id="save-score">Simpan Skor</button>
    <button id="play-again">Main Lagi</button>
    <button id="back-menu">Kembali ke Menu</button>
  `;
  document.getElementById('main-menu')?.classList.add('hidden');
  document.getElementById('ranking')?.classList.add('hidden');
  document.body.appendChild(overlay);
  overlay.querySelector('#play-again')?.addEventListener('click',()=>{ overlay.remove(); showMainMenu(); });
  overlay.querySelector('#save-score')?.addEventListener('click',()=>{ saveRanking(); overlay.remove(); showRanking(); });
  overlay.querySelector('#back-menu')?.addEventListener('click',()=>{ overlay.remove(); showMainMenu(); });
}

function updateUI(){ document.getElementById('score').textContent=player.score; document.getElementById('lives').textContent=player.lives; document.getElementById('level').textContent=level; document.getElementById('nukes').textContent=player.nukes||0; document.getElementById('player-name').textContent=player.name||'Player'; }

function toggleCheat(cheatType) {
  const cheatNames = {
    'unlimited_nuke': { flag: 'cheatUnlimitedNuke', label: 'Unlimited Nuke Mode' },
    'invincible': { flag: 'cheatInvincible', label: 'Invincible Mode' },
    'unlimited_bomb': { flag: 'cheatUnlimitedBomb', label: 'Unlimited Bomb Mode' }
  };
  
  if (cheatNames[cheatType]) {
    const current = eval(cheatNames[cheatType].flag);
    eval(`${cheatNames[cheatType].flag} = !${cheatNames[cheatType].flag}`);
    const newState = eval(cheatNames[cheatType].flag);
    const status = newState ? '✓ ON' : '✗ OFF';
    showMessage(`${cheatNames[cheatType].label} ${status}`, 2000);
  }
}

document.addEventListener('keydown',(e)=>{ 
  // Check for cheat codes
  if (e.ctrlKey && !gameOver) {
    if (e.key === '1') { e.preventDefault(); toggleCheat('unlimited_nuke'); return; }
    if (e.key === '2') { e.preventDefault(); toggleCheat('invincible'); return; }
    if (e.key === '3') { e.preventDefault(); toggleCheat('unlimited_bomb'); return; }
  }
  
  // Prevent page scroll on Page Up/Down
  if (e.key === 'PageUp' || e.key === 'PageDown') {
    e.preventDefault();
    return;
  }
  
  if (gameOver) return; 
  switch(e.key){ 
    case 'ArrowUp': case 'w': case 'W': movePlayer(0,-1); break; 
    case 'ArrowDown': case 's': case 'S': movePlayer(0,1); break; 
    case 'ArrowLeft': case 'a': case 'A': movePlayer(-1,0); break; 
    case 'ArrowRight': case 'd': case 'D': movePlayer(1,0); break; 
    case 'e': case 'E': placeBomb(); break; 
    case 'r': case 'R': level=1; initGame(); break; 
    case 'n': case 'N': useNuke(); break; 
  } 
});

window.addEventListener('load',()=>{
  // wire menu buttons with debug logs
  const startBtn = document.getElementById('start-btn');
  const rankBtn = document.getElementById('rank-btn');
  const closeRank = document.getElementById('close-rank');
  const menuRank = document.getElementById('menu-rank');
  const settingsBtnEl = document.getElementById('settings-btn');
  const closeSettings = document.getElementById('close-settings');
  const creditsBtnEl = document.getElementById('credits-btn');
  const closeCredits = document.getElementById('close-credits');
  const menuCredits = document.getElementById('menu-credits');

  if (startBtn) startBtn.addEventListener('click',(e)=>{
    e.preventDefault();
    const input = document.getElementById('input-name');
    let name = input?.value?.trim();
    if (!name){ name = 'Player'; if (input) input.value = name; showMessage('Nama kosong — menggunakan "Player"'); }
    showMessage('Memulai permainan...');
    console.log('Start clicked — name:', name);
    hideMainMenu(); level=1; initGame();
  });
  if (rankBtn) rankBtn.addEventListener('click',(e)=>{ e && e.preventDefault && e.preventDefault(); console.log('Rank clicked'); showRanking(); });
  if (closeRank) closeRank.addEventListener('click',(e)=>{ e && e.preventDefault && e.preventDefault(); document.getElementById('ranking').classList.add('hidden'); console.log('Close ranking'); });
  if (menuRank) menuRank.addEventListener('click',(e)=>{ e && e.preventDefault && e.preventDefault(); document.getElementById('ranking').classList.add('hidden'); showMainMenu(); console.log('Menu rank clicked'); });

  if (settingsBtnEl) settingsBtnEl.addEventListener('click',(e)=>{ e.preventDefault(); console.log('Settings clicked'); document.getElementById('main-menu').classList.add('hidden'); document.getElementById('settings').classList.remove('hidden'); });
  if (closeSettings) closeSettings.addEventListener('click',(e)=>{ e && e.preventDefault && e.preventDefault(); document.getElementById('settings').classList.add('hidden'); showMainMenu(); console.log('Close settings'); });

  if (creditsBtnEl) creditsBtnEl.addEventListener('click',(e)=>{ e.preventDefault(); console.log('Credits clicked'); document.getElementById('main-menu').classList.add('hidden'); document.getElementById('credits').classList.remove('hidden'); });
  if (closeCredits) closeCredits.addEventListener('click',(e)=>{ e && e.preventDefault && e.preventDefault(); document.getElementById('credits').classList.add('hidden'); showMainMenu(); console.log('Close credits'); });
  if (menuCredits) menuCredits.addEventListener('click',(e)=>{ e && e.preventDefault && e.preventDefault(); document.getElementById('credits').classList.add('hidden'); showMainMenu(); console.log('Menu credits clicked'); });

  console.log('Menu handlers wired');

  // settings controls
  const musicSel = document.getElementById('music-select');
  const effectSel = document.getElementById('effect-select');
  const langSel = document.getElementById('lang-select');
  if (musicSel) { musicSel.value = settings.music? 'on':'off'; musicSel.addEventListener('change',()=>{ settings.music = musicSel.value==='on'; localStorage.setItem('bomber_music', settings.music); if (settings.music) playRandomSong(); else stopMusic(); }); }
  if (effectSel) { effectSel.value = settings.effects? 'on':'off'; effectSel.addEventListener('change',()=>{ settings.effects = effectSel.value==='on'; localStorage.setItem('bomber_effects', settings.effects); }); }
  if (langSel) { langSel.value = settings.lang; langSel.addEventListener('change',()=>{ settings.lang = langSel.value; localStorage.setItem('bomber_lang', settings.lang); applyLanguage(); }); }

  // apply language and show menu
  applyLanguage();
  showMainMenu();
});

function getRankings(){ try{return JSON.parse(localStorage.getItem('bomberman_ranks')||'[]'); }catch(e){return [];} }
function saveRanking(){ const name = player.name || document.getElementById('input-name')?.value || 'Player'; const ranks = getRankings(); ranks.push({name,score:player.score}); ranks.sort((a,b)=>b.score-a.score); localStorage.setItem('bomberman_ranks', JSON.stringify(ranks.slice(0,10))); }
function showRanking(){ const ranks=getRankings(); const list=document.getElementById('ranking-list'); list.innerHTML=''; ranks.forEach(r=>{ const li=document.createElement('li'); li.textContent=`${r.name} — ${r.score}`; list.appendChild(li); }); document.getElementById('ranking').classList.remove('hidden'); }

function useNuke(){
  if (gameOver) return;
  
  // Check cheat: unlimited nuke
  if (!cheatUnlimitedNuke) {
    if (!player.nukes||player.nukes<=0){ showMessage('No nukes available'); return; }
    const now=Date.now(); const since= now - (lastNukeTime||0);
    if (since < nukeCooldown){ const remain=Math.ceil((nukeCooldown-since)/1000); showMessage(`Nuke on cooldown: ${remain}s`); return; }
    player.nukes--;
  } else {
    lastNukeTime = Date.now();
  }
  
  lastNukeTime=Date.now(); if (settings.effects) playSfx(explosionSfx,1.0);
  for (let y=0;y<ROWS;y++){ for (let x=0;x<COLS;x++){ if (map[y][x]===SOFT_WALL){ map[y][x]=FLOOR; player.score+=10; } explosions.push({x,y,timer:4}); } }
  enemies.forEach(enemy=>{ if (enemy.alive){ enemy.alive=false; player.score+=100; // play pitch-differentiated death sfx
      if (enemy.boss) playSfx(deadSfx, 1.0, 0.75); else playSfx(deadSfx, 1.0, 1.25);
    }});
  updateUI(); render(); setTimeout(()=>{ explosions=[]; render(); checkLevelComplete(); },1200);
}
