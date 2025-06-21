diff --git a//dev/null b/pages/rpg.tsx
index 0000000000000000000000000000000000000000..931217d6bf7467f03d111202b3779b28442fd514 100644
--- a//dev/null
+++ b/pages/rpg.tsx
@@ -0,0 +1,573 @@
+import { useEffect, useState } from 'react'
+import styles from '../styles/RPG.module.css'
+import { bosses } from '../lib/bosses'
+
+// status effects applied to characters or enemies
+export type StatusEffect = {
+  name: string
+  turns: number
+}
+
+// equipment definitions
+export type EquipmentType = 'Staff' | 'Sword' | 'Dagger' | 'Armor'
+const equipmentStats: Record<EquipmentType, { attack?: number; health?: number }> = {
+  Staff: { attack: 6 },
+  Sword: { attack: 5 },
+  Dagger: { attack: 4 },
+  Armor: { health: 15 },
+}
+
+type Character = {
+  name: string
+  role: 'Mage' | 'Healer' | 'DamageDealer' | 'Rogue'
+  health: number
+  maxHealth: number
+  baseMaxHealth: number
+  attack: number
+  baseAttack: number
+  avatar?: string
+  status?: StatusEffect | null
+  specialUsed?: boolean
+  weapon?: EquipmentType
+  armor?: EquipmentType
+}
+
+type Enemy = {
+  name: string
+  health: number
+  maxHealth: number
+  attack: number
+  status?: StatusEffect | null
+  bossId?: number
+  turnCount?: number
+  shielded?: boolean
+  healed?: boolean
+  revived?: boolean
+}
+
+function generateEnemy(wave: number): Enemy {
+  if (wave % 15 === 0 && wave / 15 <= bosses.length) {
+    const boss = bosses[wave / 15 - 1]
+    return {
+      name: boss.name,
+      health: boss.health,
+      maxHealth: boss.health,
+      attack: boss.attack,
+      status: null,
+      bossId: boss.id,
+      turnCount: 0,
+    }
+  }
+  return {
+    name: `Enemy Wave ${wave}`,
+    health: 50 + wave * 10,
+    maxHealth: 50 + wave * 10,
+    attack: 5 + wave * 2,
+    status: null,
+  }
+}
+
+const loreScenes = [
+  'Long ago, the realm of Eldoria was forged from crystal and flame.',
+  'Legends speak of the Starfall, a cataclysm that birthed monsters.',
+  'Ancient heroes sealed a dark dragon beneath the mountains.',
+]
+
+type Screen = 'title' | 'customize' | 'lore' | 'fade' | 'game'
+
+export default function RPGGame() {
+  const [screen, setScreen] = useState<Screen>('title')
+  const [nextScreen, setNextScreen] = useState<Screen>('game')
+  const [lore, setLore] = useState('')
+  const [wave, setWave] = useState(1)
+  const [enemy, setEnemy] = useState<Enemy>(() => generateEnemy(1))
+  const [log, setLog] = useState<string[]>([])
+  const [inventory, setInventory] = useState<Record<EquipmentType, boolean>>({
+    Staff: false,
+    Sword: false,
+    Dagger: false,
+    Armor: false,
+  })
+  const [characters, setCharacters] = useState<Character[]>([
+    {
+      name: 'Gandalf',
+      role: 'Mage',
+      health: 60,
+      maxHealth: 60,
+      baseMaxHealth: 60,
+      attack: 12,
+      baseAttack: 12,
+      specialUsed: false,
+    },
+    {
+      name: 'Acolyte',
+      role: 'Healer',
+      health: 55,
+      maxHealth: 55,
+      baseMaxHealth: 55,
+      attack: 4,
+      baseAttack: 4,
+      specialUsed: false,
+    },
+    {
+      name: 'Warrior',
+      role: 'DamageDealer',
+      health: 70,
+      maxHealth: 70,
+      baseMaxHealth: 70,
+      attack: 10,
+      baseAttack: 10,
+      specialUsed: false,
+    },
+    {
+      name: 'Shadow',
+      role: 'Rogue',
+      health: 50,
+      maxHealth: 50,
+      baseMaxHealth: 50,
+      attack: 8,
+      baseAttack: 8,
+      specialUsed: false,
+    },
+  ])
+
+  const aliveCharacters = characters.filter(c => c.health > 0)
+  const gameOver = aliveCharacters.length === 0
+
+  function appendLog(entry: string) {
+    setLog(l => [...l, entry])
+  }
+
+  function handleAvatarChange(index: number, files: FileList | null) {
+    const file = files?.[0]
+    if (!file || file.type !== 'image/png') return
+    const reader = new FileReader()
+    reader.onload = () => {
+      const result = reader.result
+      if (typeof result === 'string') {
+        setCharacters(chars => {
+          const updated = [...chars]
+          updated[index] = { ...updated[index], avatar: result }
+          return updated
+        })
+      }
+    }
+    reader.readAsDataURL(file)
+  }
+
+  function equipItem(index: number, slot: 'weapon' | 'armor', value: EquipmentType | '') {
+    setCharacters(chars => {
+      const updated = [...chars]
+      const c = { ...updated[index] }
+      if (slot === 'weapon') c.weapon = value || undefined
+      else c.armor = value || undefined
+      const weaponBonus = c.weapon ? equipmentStats[c.weapon].attack ?? 0 : 0
+      const armorBonus = c.armor ? equipmentStats[c.armor].health ?? 0 : 0
+      c.attack = c.baseAttack + weaponBonus
+      c.maxHealth = c.baseMaxHealth + armorBonus
+      if (c.health > c.maxHealth) c.health = c.maxHealth
+      updated[index] = c
+      return updated
+    })
+  }
+
+  function handleSpecial(index: number) {
+    if (gameOver) return
+    const char = characters[index]
+    if (char.health <= 0 || char.specialUsed) return
+
+    let updatedEnemy = { ...enemy }
+    let updatedChars = [...characters]
+
+    switch (char.role) {
+      case 'Mage':
+        updatedEnemy.health -= 20
+        if (updatedEnemy.bossId !== 2) {
+          updatedEnemy.status = { name: 'Burn', turns: 3 }
+        } else {
+          appendLog('The Dragon Mage is immune to burn!')
+        }
+        appendLog(`${char.name} casts Fireball!`)
+        break
+      case 'Healer':
+        updatedChars = updatedChars.map(c => ({
+          ...c,
+          health: Math.min(c.health + 10, c.maxHealth),
+        }))
+        appendLog(`${char.name} performs Group Heal!`)
+        break
+      case 'DamageDealer':
+        updatedEnemy.health -= 25
+        appendLog(`${char.name} uses Power Strike!`)
+        break
+      case 'Rogue':
+        updatedEnemy.health -= 15
+        if (updatedEnemy.bossId !== 2) {
+          updatedEnemy.status = { name: 'Poison', turns: 3 }
+        }
+        appendLog(`${char.name} executes Sneak Attack!`)
+        break
+    }
+
+    updatedChars[index] = { ...char, specialUsed: true }
+    setCharacters(updatedChars)
+    updatedEnemy.shielded = false
+    setEnemy(updatedEnemy)
+  }
+
+  function randomDrop(): EquipmentType {
+    const drops: EquipmentType[] = ['Staff', 'Sword', 'Dagger', 'Armor']
+    return drops[Math.floor(Math.random() * drops.length)]
+  }
+
+  function handleTurn() {
+    if (gameOver) return
+
+    let currentEnemy = { ...enemy }
+    const updatedChars = [...characters]
+
+    // resolve status effects
+    for (const char of updatedChars) {
+      if (char.health > 0 && char.status) {
+        char.health -= 3
+        appendLog(`${char.name} suffers ${char.status.name} damage`)
+        char.status.turns -= 1
+        if (char.status.turns <= 0) char.status = null
+      }
+    }
+
+    if (currentEnemy.status) {
+      const effect = currentEnemy.status
+      const dmg = effect.name === 'Burn' ? 5 : 3
+      currentEnemy.health -= dmg
+      appendLog(`${currentEnemy.name} takes ${dmg} ${effect.name.toLowerCase()} damage`)
+      effect.turns -= 1
+      if (effect.turns <= 0) currentEnemy.status = null
+    }
+
+    currentEnemy.turnCount = (currentEnemy.turnCount ?? 0) + 1
+
+    switch (currentEnemy.bossId) {
+      case 1:
+        currentEnemy.health = Math.min(currentEnemy.health + 5, currentEnemy.maxHealth)
+        appendLog('Goblin King regenerates health!')
+        break
+      case 4:
+        if (!currentEnemy.healed && currentEnemy.health < currentEnemy.maxHealth * 0.3) {
+          currentEnemy.healed = true
+          currentEnemy.health = Math.min(currentEnemy.health + 30, currentEnemy.maxHealth)
+          appendLog('King Fish restores its vitality!')
+        }
+        break
+    }
+
+    if (currentEnemy.health <= 0) {
+      if (currentEnemy.bossId === 5 && !currentEnemy.revived) {
+        currentEnemy.revived = true
+        currentEnemy.health = Math.floor(currentEnemy.maxHealth / 2)
+        appendLog('The Lich Lord rises again!')
+      } else {
+        appendLog(`${currentEnemy.name} defeated!`)
+        const drop = randomDrop()
+        setInventory(inv => ({ ...inv, [drop]: true }))
+        appendLog(`${currentEnemy.name} dropped a ${drop}!`)
+        const nextWave = wave + 1
+        appendLog(`--- Wave ${nextWave} begins ---`)
+        setWave(nextWave)
+        setEnemy(generateEnemy(nextWave))
+        setCharacters(
+          updatedChars.map(c => ({ ...c, status: null, specialUsed: false }))
+        )
+        if (nextWave % 15 === 0 && nextWave / 15 <= bosses.length) {
+          const info = bosses[nextWave / 15 - 1]
+          setLore(info.lore)
+          setNextScreen('game')
+          setScreen('lore')
+        }
+        return
+      }
+    }
+
+    // players act
+    for (const char of updatedChars) {
+      if (char.health <= 0) continue
+      if (char.role === 'Healer') {
+        const target = updatedChars.reduce(
+          (low, c) => (c.health > 0 && c.health < (low?.health ?? Infinity) ? c : low),
+          undefined as Character | undefined
+        )
+        if (target && target.health < target.maxHealth) {
+          const heal = 6
+          target.health = Math.min(target.health + heal, target.maxHealth)
+          appendLog(`${char.name} heals ${target.name} for ${heal}`)
+          continue
+        }
+      }
+      let damage = char.attack
+      if (currentEnemy.shielded) {
+        damage = Math.floor(damage / 2)
+      }
+      currentEnemy.health -= damage
+      appendLog(`${char.name} hits ${currentEnemy.name} for ${damage}`)
+      if (currentEnemy.bossId === 3 && Math.random() < 0.3) {
+        char.health -= 5
+        appendLog('Dark Knight counters the attack!')
+      }
+      if (currentEnemy.health <= 0) {
+        appendLog(`${currentEnemy.name} defeated!`)
+        break
+      }
+    }
+
+    setCharacters(updatedChars)
+
+    if (currentEnemy.health > 0) {
+      const targets = updatedChars.filter(c => c.health > 0)
+
+      switch (currentEnemy.bossId) {
+        case 1:
+          for (const c of targets) c.health -= 2
+          appendLog('Goblin King orders a goblin swarm!')
+          break
+        case 2:
+          if (Math.random() < 0.3) {
+            for (const c of targets) {
+              c.status = { name: 'Burn', turns: 2 }
+            }
+            appendLog('Dragon Mage unleashes Fire Breath!')
+          }
+          break
+        case 3:
+          if (currentEnemy.turnCount && currentEnemy.turnCount % 3 === 0) {
+            const victim = targets.reduce(
+              (low, c) =>
+                c.health < (low?.health ?? Infinity) ? c : low,
+              undefined as Character | undefined
+            )
+            if (victim) {
+              victim.health -= currentEnemy.attack + 8
+              appendLog('Dark Knight uses Dark Slash!')
+              setCharacters([...updatedChars])
+              setEnemy(currentEnemy)
+              return
+            }
+          }
+          break
+        case 4:
+          if (Math.random() < 0.25) {
+            currentEnemy.shielded = true
+            appendLog('King Fish raises a Water Shield!')
+          }
+          break
+        case 5:
+          if (Math.random() < 0.2) {
+            for (const c of targets) {
+              c.status = { name: 'Poison', turns: 2 }
+            }
+            appendLog('Lich Lord casts Curse!')
+          }
+          break
+      }
+
+      const target = targets[Math.floor(Math.random() * targets.length)]
+      target.health -= currentEnemy.attack
+      appendLog(`${currentEnemy.name} hits ${target.name} for ${currentEnemy.attack}`)
+      if (Math.random() < 0.3) {
+        target.status = { name: 'Poison', turns: 2 }
+        appendLog(`${target.name} is poisoned!`)
+      }
+      if (target.health <= 0) {
+        appendLog(`${target.name} has fallen!`)
+      }
+      setCharacters([...updatedChars])
+      setEnemy(currentEnemy)
+    } else {
+      const drop = randomDrop()
+      setInventory(inv => ({ ...inv, [drop]: true }))
+      appendLog(`${currentEnemy.name} dropped a ${drop}!`)
+      const nextWave = wave + 1
+      appendLog(`--- Wave ${nextWave} begins ---`)
+      setWave(nextWave)
+      setEnemy(generateEnemy(nextWave))
+      setCharacters(updatedChars.map(c => ({ ...c, status: null, specialUsed: false })))
+      if (nextWave % 15 === 0 && nextWave / 15 <= bosses.length) {
+        const info = bosses[nextWave / 15 - 1]
+        setLore(info.lore)
+        setNextScreen('game')
+        setScreen('lore')
+      }
+    }
+  }
+
+  function startAdventure() {
+    setLore(loreScenes[Math.floor(Math.random() * loreScenes.length)])
+    setNextScreen('fade')
+    setScreen('lore')
+  }
+
+  useEffect(() => {
+    if (screen === 'fade') {
+      const id = setTimeout(() => setScreen('game'), 1000)
+      return () => clearTimeout(id)
+    }
+  }, [screen])
+
+  if (screen === 'title') {
+    return (
+      <div className={styles.screen}>
+        <h1 className={styles.title}>Epic Text RPG</h1>
+        <button className={styles.turn} onClick={() => setScreen('customize')}>
+          Start Game
+        </button>
+      </div>
+    )
+  }
+
+  if (screen === 'lore') {
+    return (
+      <div className={styles.screen}>
+        <p>{lore}</p>
+        <button className={styles.turn} onClick={() => setScreen(nextScreen)}>
+          Continue
+        </button>
+      </div>
+    )
+  }
+
+  if (screen === 'fade') {
+    return <div className={styles.fade} />
+  }
+
+  if (screen === 'customize') {
+    return (
+      <div className={styles.game}>
+        <h1 className={styles.title}>Team Builder</h1>
+        <div className={styles.party}>
+          {characters.map((char, idx) => (
+            <div key={char.name} className={styles.card}>
+              {char.avatar && (
+                <img src={char.avatar} alt={char.name} className={styles.avatar} />
+              )}
+              <strong>{char.name}</strong>
+              <div>{char.role}</div>
+              <div>
+                Weapon:
+                <select
+                  value={char.weapon ?? ''}
+                  onChange={e => equipItem(idx, 'weapon', e.target.value as EquipmentType)}
+                >
+                  <option value=''>None</option>
+                  {inventory.Staff && <option value='Staff'>Staff</option>}
+                  {inventory.Sword && <option value='Sword'>Sword</option>}
+                  {inventory.Dagger && <option value='Dagger'>Dagger</option>}
+                </select>
+              </div>
+              <div>
+                Armor:
+                <select
+                  value={char.armor ?? ''}
+                  onChange={e => equipItem(idx, 'armor', e.target.value as EquipmentType)}
+                >
+                  <option value=''>None</option>
+                  {inventory.Armor && <option value='Armor'>Armor</option>}
+                </select>
+              </div>
+              <input
+                type='file'
+                accept='image/png'
+                className={styles.upload}
+                onChange={e => handleAvatarChange(idx, e.target.files)}
+              />
+            </div>
+          ))}
+        </div>
+        <button
+          className={styles.turn}
+          onClick={() => (lore ? setScreen('game') : startAdventure())}
+        >
+          {lore ? 'Return to Game' : 'Begin Adventure'}
+        </button>
+      </div>
+    )
+  }
+
+  // game screen
+  return (
+    <div className={styles.game}>
+      <h1 className={styles.title}>Text RPG</h1>
+      <p>Wave: {wave}</p>
+
+      <h2>Party</h2>
+      <div className={styles.party}>
+        {characters.map((char, idx) => (
+          <div key={char.name} className={styles.card}>
+            {char.avatar && (
+              <img src={char.avatar} alt={char.name} className={styles.avatar} />
+            )}
+            <strong>{char.name}</strong>
+            <div>{char.role}</div>
+            <div>ATK {char.attack}</div>
+            <div className={styles.healthBar}>
+              <div
+                className={styles.healthFill}
+                style={{ width: `${(Math.max(char.health, 0) / char.maxHealth) * 100}%` }}
+              />
+            </div>
+            <div>
+              {Math.max(char.health, 0)}/{char.maxHealth} HP
+            </div>
+            {char.status && (
+              <div className={styles.status}>
+                {char.status.name} ({char.status.turns})
+              </div>
+            )}
+            <button
+              className={styles.special}
+              onClick={() => handleSpecial(idx)}
+              disabled={char.specialUsed || char.health <= 0}
+            >
+              Special
+            </button>
+            <input
+              type='file'
+              accept='image/png'
+              className={styles.upload}
+              onChange={e => handleAvatarChange(idx, e.target.files)}
+            />
+          </div>
+        ))}
+      </div>
+
+      <h2>Enemy</h2>
+      <div className={styles.enemy}>
+        <div className={styles.card}>
+          <strong>{enemy.name}</strong>
+          <div>Attack {enemy.attack}</div>
+          <div className={styles.healthBar}>
+            <div
+              className={styles.enemyHealthFill}
+              style={{ width: `${(Math.max(enemy.health, 0) / enemy.maxHealth) * 100}%` }}
+            />
+          </div>
+          <div>
+            {Math.max(enemy.health, 0)}/{enemy.maxHealth} HP
+          </div>
+          {enemy.status && (
+            <div className={styles.status}>
+              {enemy.status.name} ({enemy.status.turns})
+            </div>
+          )}
+        </div>
+      </div>
+
+      <button onClick={handleTurn} disabled={gameOver} className={styles.turn}>
+        Next Turn
+      </button>
+      <button onClick={() => setScreen('customize')} className={styles.turn}>
+        Customize Team
+      </button>
+      {gameOver && <p>Game Over</p>}
+      <div className={styles.log}>{log.join('\n')}</div>
+    </div>
+  )
+}
