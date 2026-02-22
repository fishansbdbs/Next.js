// Darkstopia RPG logic

const team = [
  { name: 'Healer', maxHP: 80, hp: 80, attack: 0, level: 1, xp: 0, xpNext: 50, statuses: [] },
  { name: 'Rogue', maxHP: 70, hp: 70, attack: 15, level: 1, xp: 0, xpNext: 50, statuses: [] },
  { name: 'Mage', maxHP: 60, hp: 60, attack: 12, level: 1, xp: 0, xpNext: 50, statuses: [] },
  { name: 'Warrior', maxHP: 100, hp: 100, attack: 10, level: 1, xp: 0, xpNext: 50, statuses: [] }
];

let enemies = [];
let wave = 0;
let ap = 4;
let tap = 0;
let inventory = [];
let gold = 0;
let paused = true;

const biomes = [
  { start: 1, end: 10, name: 'Forest', class: 'biome-forest', enemies: ['Goblin Grunt','Goblin Scout','Goblin Brute'], boss: 'Goblin King' },
  { start: 11, end: 20, name: 'Graveyard', class: 'biome-graveyard', enemies: ['Zombie Walker','Zombie Mage','Zombie Stalker'], boss: 'Zombie Lord' },
  { start: 21, end: 30, name: 'Volcano', class: 'biome-volcano', enemies: ['Flame Wraith','Lava Imp','Ember Titan'], boss: 'Volcano Titan' }
];

function getBiome(num) {
  return biomes.find(b => num >= b.start && num <= b.end) || biomes[biomes.length - 1];
}

function log(msg) {
  const div = document.getElementById('log');
  div.innerHTML += msg + '<br>';
  div.scrollTop = div.scrollHeight;
}

function showPopup(text) {
  const div = document.getElementById('popup');
  div.textContent = text;
  setTimeout(() => { if (div.textContent === text) div.textContent = ''; }, 2000);
}

function statusIcon(type) {
  if (type === 'Burn') return '🔥';
  if (type === 'Poison') return '☠️';
  if (type === 'Freeze') return '❄️';
  return '';
}

function processStatuses(unit) {
  let skip = false;
  unit.statuses = unit.statuses.filter(s => {
    if (s.type === 'Burn' || s.type === 'Poison') {
      const dmg = s.type === 'Burn' ? 5 : 3;
      unit.hp -= dmg;
      log(`${unit.name} suffers ${dmg} from ${s.type}`);
    }
    if (s.type === 'Freeze') skip = true;
    s.duration--;
    return s.duration > 0;
  });
  return skip;
}

function gainXP(amount) {
  team.forEach(c => {
    c.xp += amount;
    while (c.xp >= c.xpNext) {
      c.xp -= c.xpNext;
      c.level++;
      c.maxHP += 10;
      c.hp = c.maxHP;
      c.attack += 2;
      c.xpNext = Math.floor(c.xpNext * 1.5);
      log(`${c.name} reached level ${c.level}!`);
    }
  });
}

function addItem(name) {
  const it = inventory.find(i => i.name === name);
  if (it) it.qty++; else inventory.push({ name, qty: 1 });
}

function updateInventoryUI() {
  const inv = document.getElementById('inventoryItems');
  inv.innerHTML = '';
  inventory.forEach((it, idx) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.textContent = `${it.name} x${it.qty}`;
    div.onclick = () => useItem(idx);
    inv.appendChild(div);
  });
}

function useItem(index) {
  const it = inventory[index];
  if (!it) return;
  if (it.name === 'Potion') {
    const target = team.reduce((a,b)=> (a.hp/a.maxHP < b.hp/b.maxHP ? a:b));
    target.hp = Math.min(target.maxHP, target.hp + 30);
    log(`Used Potion on ${target.name}`);
  }
  it.qty--;
  if (it.qty <= 0) inventory.splice(index,1);
  updateInventoryUI();
  updateUI();
}

function openInventory() {
  updateInventoryUI();
  document.getElementById('inventory').style.display = 'flex';
}
function closeInventory() { document.getElementById('inventory').style.display = 'none'; }

const shopItems = [
  { name: 'Potion', cost: 30, action: () => addItem('Potion') },
  { name: '+10 Max HP (team)', cost: 50, action: () => team.forEach(c => { c.maxHP += 10; c.hp += 10; }) },
  { name: '+2 Attack (team)', cost: 50, action: () => team.forEach(c => { c.attack += 2; }) }
];

function openShop() {
  const div = document.getElementById('shopItems');
  div.innerHTML = '';
  shopItems.forEach((it, idx) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item';
    itemDiv.textContent = `${it.name} - ${it.cost}g`;
    itemDiv.onclick = () => {
      if (gold >= it.cost) {
        gold -= it.cost;
        it.action();
        openShop();
      }
    };
    div.appendChild(itemDiv);
  });
  document.getElementById('shopScreen').style.display = 'flex';
  updateUI();
}
function closeShop() {
  document.getElementById('shopScreen').style.display = 'none';
  nextWave();
}

function saveGame() {
  const data = { team, inventory, gold, wave };
  localStorage.setItem('darkstopiaSave', JSON.stringify(data));
  showPopup('Saved');
}

function loadGame() {
  const data = JSON.parse(localStorage.getItem('darkstopiaSave') || 'null');
  if (!data) return;
  wave = data.wave;
  gold = data.gold;
  inventory = data.inventory;
  data.team.forEach((s,i)=>{ team[i]=s; });
}

function startGame() {
  paused = false;
  document.getElementById('titleScreen').style.display = 'none';
  nextWave();
}

function createEnemies() {
  wave++;
  const biome = getBiome(wave);
  const count = wave % 10 === 0 ? 1 : 1 + Math.floor(Math.random()*2);
  enemies = [];
  for(let i=0;i<count;i++){
    let name = biome.enemies[Math.floor(Math.random()*biome.enemies.length)];
    let hp = 50 + wave*20;
    let dmg = 5 + wave*2;
    if (wave % 10 === 0) { name = biome.boss; hp*=2; dmg*=1.5; showPopup('Boss Wave!'); }
    enemies.push({ name, maxHP: hp, hp: hp, damage: dmg, statuses: [] });
  }
  document.body.className = biome.class;
  if (wave === biome.start) showPopup(`Entering: ${biome.name}`);
}

function updateUI() {
  const enemyPanel = document.getElementById('enemyPanel');
  enemyPanel.innerHTML = '';
  enemies.forEach((e, idx) => {
    const div = document.createElement('div');
    div.className = 'enemy';
    div.innerHTML = `<div>${e.name} ${e.statuses.map(s=>`<span class='status-icon' title='${s.type}'>${statusIcon(s.type)}</span>`).join('')}</div>`+
      `<div class="hp-bar" style="width:${(e.hp/e.maxHP)*100}%"></div>`+
      `<div>${e.hp} / ${e.maxHP}</div>`;
    enemyPanel.appendChild(div);
  });

  const teamPanel = document.getElementById('teamPanel');
  teamPanel.innerHTML = '';
  team.forEach((c, idx) => {
    const div = document.createElement('div');
    div.className = 'character';
    const disabled = ap <= 0 || enemies.length === 0 || c.hp <= 0;
    div.innerHTML = `<div>${c.name} Lv${c.level} ${c.statuses.map(s=>`<span class='status-icon' title='${s.type}'>${statusIcon(s.type)}</span>`).join('')}</div>`+
      `<div class="hp-bar" style="width:${(c.hp/c.maxHP)*100}%"></div>`+
      `<div>${c.hp} / ${c.maxHP}</div>`+
      `<button ${disabled?'disabled':''} onclick="useSkill(${idx})">Use Skill</button>`;
    teamPanel.appendChild(div);
  });
  document.getElementById('ap').textContent = ap;
  document.getElementById('tap').textContent = tap;
  document.getElementById('teamMoveBtn').disabled = tap < 3;
  document.getElementById('waveNum').textContent = wave;
  document.getElementById('biomeName').textContent = getBiome(wave).name;
  document.getElementById('gold').textContent = gold;
}

function dealDamage(target, amount) {
  target.hp -= amount;
  if (target.hp < 0) target.hp = 0;
}

function dealAoE(amount) {
  enemies.forEach(e => dealDamage(e, amount));
}

function useSkill(index) {
  if (ap <= 0 || paused) return;
  const c = team[index];
  if (c.hp <= 0) return;
  ap--; tap++;
  if (c.name === 'Healer') {
    const target = team.reduce((a,b)=> (a.hp/a.maxHP < b.hp/b.maxHP ? a:b));
    const amt = 20 + c.level * 2;
    target.hp = Math.min(target.maxHP, target.hp + amt);
    log(`${c.name} heals ${target.name} for ${amt}`);
  } else if (c.name === 'Mage') {
    const dmg = c.attack;
    dealAoE(dmg);
    enemies.forEach(e=>e.statuses.push({type:'Burn',duration:3}));
    log(`${c.name} casts Fireball for ${dmg}`);
  } else if (c.name === 'Rogue') {
    let dmg = c.attack;
    if (Math.random()<0.3){ dmg*=2; log('Critical hit!'); }
    const target = enemies[Math.floor(Math.random()*enemies.length)];
    dealDamage(target, dmg);
    target.statuses.push({type:'Poison',duration:3});
    log(`${c.name} strikes ${target.name} for ${dmg}`);
  } else if (c.name === 'Warrior') {
    const target = enemies[Math.floor(Math.random()*enemies.length)];
    dealDamage(target, c.attack);
    target.statuses.push({type:'Freeze',duration:1});
    log(`${c.name} slashes ${target.name} for ${c.attack}`);
  }
  checkEnemyDefeated();
  if (ap === 0 && enemies.length>0) enemyTurn();
  updateUI();
}

function checkEnemyDefeated() {
  enemies = enemies.filter(e => e.hp > 0);
  if (enemies.length === 0) {
    log('Wave cleared!');
    showPopup('Wave Cleared!');
    grantLoot();
    openShop();
  }
}

function grantLoot() {
  const goldGain = 20 + wave * 5;
  gold += goldGain;
  log(`Gained ${goldGain} gold`);
  if (Math.random() < 0.5) { addItem('Potion'); log('Found a Potion'); }
  gainXP(20 + wave * 10);
}

function enemyTurn() {
  enemies.forEach(e => {
    if (processStatuses(e)) { log(`${e.name} is frozen!`); return; }
    const living = team.filter(c => c.hp > 0);
    if (living.length === 0) return;
    const target = living[Math.floor(Math.random()*living.length)];
    dealDamage(target, e.damage);
    log(`${e.name} hits ${target.name} for ${e.damage}`);
    if (target.hp <= 0) log(`${target.name} is down!`);
  });
  ap = 4;
  tap = Math.min(tap,3);
  team.forEach(c=>processStatuses(c));
  updateUI();
}

function teamMove() {
  if (tap < 3 || paused) return;
  dealAoE(30);
  tap = 0;
  log('Team Move unleashed!');
  checkEnemyDefeated();
  if (ap === 0 && enemies.length>0) enemyTurn();
  updateUI();
}

function nextWave() {
  team.forEach(c=>{ c.hp = Math.min(c.maxHP, c.hp + 10); });
  createEnemies();
  ap = 4; tap = 0;
  document.getElementById('nextWaveBtn').disabled = true;
  document.getElementById('nextWaveBtn').textContent = 'Next Wave';
  log(`Wave ${wave} begins!`);
  updateUI();
}

// Overlay buttons

document.getElementById('inventoryBtn').addEventListener('click', openInventory);
document.getElementById('closeInventoryBtn').addEventListener('click', closeInventory);
document.getElementById('teamMoveBtn').addEventListener('click', teamMove);
document.getElementById('nextWaveBtn').addEventListener('click', nextWave);
document.getElementById('pauseBtn').addEventListener('click', ()=>{
  paused = true; document.getElementById('pauseScreen').style.display='flex';
});
document.getElementById('resumeBtn').addEventListener('click', ()=>{
  paused = false; document.getElementById('pauseScreen').style.display='none';
});
document.getElementById('saveBtn').addEventListener('click', saveGame);
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('loadBtn').addEventListener('click', ()=>{ loadGame(); startGame(); });
document.getElementById('closeShopBtn').addEventListener('click', closeShop);

updateUI();
