import { useState } from 'react'

type Character = {
  name: string
  role: 'Mage' | 'Healer' | 'DamageDealer' | 'Rogue'
  health: number
  maxHealth: number
  attack: number
}

type Enemy = {
  name: string
  health: number
  maxHealth: number
  attack: number
}

function generateEnemy(wave: number): Enemy {
  return {
    name: `Enemy Wave ${wave}`,
    health: 50 + wave * 10,
    maxHealth: 50 + wave * 10,
    attack: 5 + wave * 2,
  }
}

export default function RPGGame() {
  const [wave, setWave] = useState(1)
  const [enemy, setEnemy] = useState<Enemy>(() => generateEnemy(1))
  const [log, setLog] = useState<string[]>([])
  const [characters, setCharacters] = useState<Character[]>([
    { name: 'Gandalf', role: 'Mage', health: 60, maxHealth: 60, attack: 12 },
    { name: 'Acolyte', role: 'Healer', health: 55, maxHealth: 55, attack: 4 },
    { name: 'Warrior', role: 'DamageDealer', health: 70, maxHealth: 70, attack: 10 },
    { name: 'Shadow', role: 'Rogue', health: 50, maxHealth: 50, attack: 8 },
  ])

  const aliveCharacters = characters.filter(c => c.health > 0)
  const gameOver = aliveCharacters.length === 0

  function appendLog(entry: string) {
    setLog(l => [...l, entry])
  }

  function handleTurn() {
    if (gameOver) return

    let currentEnemy = { ...enemy }
    const updatedChars = [...characters]

    // players act
    for (const char of updatedChars) {
      if (char.health <= 0) continue
      if (char.role === 'Healer') {
        const target = updatedChars.reduce(
          (low, c) => (c.health > 0 && c.health < (low?.health ?? Infinity) ? c : low),
          undefined as Character | undefined
        )
        if (target && target.health < target.maxHealth) {
          const heal = 6
          target.health = Math.min(target.health + heal, target.maxHealth)
          appendLog(`${char.name} heals ${target.name} for ${heal}`)
          continue
        }
      }
      currentEnemy.health -= char.attack
      appendLog(`${char.name} hits ${currentEnemy.name} for ${char.attack}`)
      if (currentEnemy.health <= 0) {
        appendLog(`${currentEnemy.name} defeated!`)
        break
      }
    }

    // update characters after player phase
    setCharacters(updatedChars)

    if (currentEnemy.health > 0) {
      const targets = updatedChars.filter(c => c.health > 0)
      const target = targets[Math.floor(Math.random() * targets.length)]
      target.health -= currentEnemy.attack
      appendLog(`${currentEnemy.name} hits ${target.name} for ${currentEnemy.attack}`)
      if (target.health <= 0) {
        appendLog(`${target.name} has fallen!`)
      }
      setCharacters([...updatedChars])
      setEnemy(currentEnemy)
    } else {
      const nextWave = wave + 1
      appendLog(`--- Wave ${nextWave} begins ---`)
      setWave(nextWave)
      setEnemy(generateEnemy(nextWave))
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Text RPG</h1>
      <p>Wave: {wave}</p>
      <h2>Party</h2>
      <ul>
        {characters.map(char => (
          <li key={char.name}>
            {char.name} ({char.role}) - {Math.max(char.health, 0)}/{char.maxHealth}
          </li>
        ))}
      </ul>
      <h2>Enemy</h2>
      <p>
        {enemy.name} - {Math.max(enemy.health, 0)}/{enemy.maxHealth} HP, Attack {enemy.attack}
      </p>
      <button onClick={handleTurn} disabled={gameOver} style={{ marginTop: '10px' }}>
        Next Turn
      </button>
      {gameOver && <p>Game Over</p>}
      <pre style={{ whiteSpace: 'pre-wrap' }}>{log.join('\n')}</pre>
    </div>
  )
}
