import { useCallback, useEffect, useState } from 'react'
import './BufferDemo.css'

type BufferSnapshot = {
  capacity: number
  size: number
  items: string[]
}

type TakeResponse = BufferSnapshot & {
  item: string
}

export function BufferDemo() {
  const [snapshot, setSnapshot] = useState<BufferSnapshot | null>(null)
  const [value, setValue] = useState('item')
  const [pendingPuts, setPendingPuts] = useState(0)
  const [pendingTakes, setPendingTakes] = useState(0)
  const [lastTaken, setLastTaken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const applySnapshot = useCallback((data: BufferSnapshot) => {
    setSnapshot({
      capacity: data.capacity,
      size: data.size,
      items: data.items ?? [],
    })
  }, [])

  const refresh = useCallback(async () => {
    const response = await fetch('/api/buffer')
    if (!response.ok) {
      throw new Error(`GET /api/buffer → HTTP ${response.status}`)
    }
    applySnapshot((await response.json()) as BufferSnapshot)
  }, [applySnapshot])

  useEffect(() => {
    refresh().catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load buffer')
    })
  }, [refresh])

  const put = useCallback(async () => {
    setError(null)
    setPendingPuts((n) => n + 1)
    try {
      const response = await fetch('/api/buffer/put', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value.trim() || `item-${Date.now()}` }),
      })
      if (!response.ok) {
        throw new Error(`POST /api/buffer/put → HTTP ${response.status}`)
      }
      applySnapshot((await response.json()) as BufferSnapshot)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Put failed')
    } finally {
      setPendingPuts((n) => n - 1)
    }
  }, [applySnapshot, value])

  const take = useCallback(async () => {
    setError(null)
    setPendingTakes((n) => n + 1)
    try {
      const response = await fetch('/api/buffer/take', { method: 'POST' })
      if (!response.ok) {
        throw new Error(`POST /api/buffer/take → HTTP ${response.status}`)
      }
      const body = (await response.json()) as TakeResponse
      setLastTaken(body.item)
      applySnapshot(body)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Take failed')
    } finally {
      setPendingTakes((n) => n - 1)
    }
  }, [applySnapshot])

  const capacity = snapshot?.capacity ?? 3
  const size = snapshot?.size ?? 0
  const items = snapshot?.items ?? []
  const slots = Array.from({ length: capacity }, (_, i) => items[i] ?? null)

  const putWaiting = pendingPuts > 0 && size >= capacity
  const takeWaiting = pendingTakes > 0 && size === 0
  const takeDisabled = size === 0 && pendingTakes >= 1
  const putDisabled = size >= capacity && pendingPuts >= 1

  return (
    <div className="demo-page">
      <main className="demo-card">
        <header className="demo-header">
          <div>
            <span className="demo-badge">Code learning</span>
            <h1>Bounded buffer</h1>
            <p className="demo-subtitle">
              Monitor-based queue (capacity {capacity}). <code>Put</code> blocks when full;{' '}
              <code>Take</code> blocks when empty.
            </p>
          </div>
          <div className="demo-stat" aria-live="polite">
            <span className="demo-stat-value">
              {size}/{capacity}
            </span>
            <span className="demo-stat-label">in buffer</span>
          </div>
        </header>

        <section className="buffer-slots" aria-label="Buffer slots">
          {slots.map((item, index) => (
            <div
              key={index}
              className={`buffer-slot ${item ? 'filled' : 'empty'}`}
            >
              <span className="buffer-slot-index">{index + 1}</span>
              {item ? <code>{item}</code> : <span className="buffer-slot-placeholder">empty</span>}
            </div>
          ))}
        </section>

        <section className="buffer-actions">
          <label className="buffer-field">
            Value to put
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="item"
            />
          </label>
          <div className="buffer-buttons">
            <button
              type="button"
              className="demo-btn primary"
              onClick={() => void put()}
              disabled={putDisabled}
              title={putDisabled ? 'One Put is already waiting on a full buffer' : undefined}
            >
              Put{pendingPuts > 0 ? ` (${pendingPuts}…)` : ''}
            </button>
            <button
              type="button"
              className="demo-btn secondary"
              onClick={() => void take()}
              disabled={takeDisabled}
              title={takeDisabled ? 'One Take is already waiting on an empty buffer' : undefined}
            >
              Take{pendingTakes > 0 ? ` (${pendingTakes}…)` : ''}
            </button>
            <button type="button" className="demo-btn ghost" onClick={() => void refresh()}>
              Refresh
            </button>
          </div>
        </section>

        <section className="buffer-activity" aria-live="polite">
          {putWaiting ? (
            <p className="activity wait">Put waiting — buffer full (HTTP request blocked on server)</p>
          ) : null}
          {takeWaiting ? (
            <p className="activity wait">Take waiting — buffer empty (HTTP request blocked on server)</p>
          ) : null}
          {pendingPuts > 0 && !putWaiting ? (
            <p className="activity">Put in flight…</p>
          ) : null}
          {lastTaken ? (
            <p className="activity ok">
              Last taken: <code>{lastTaken}</code>
            </p>
          ) : null}
          {error ? <p className="activity err">{error}</p> : null}
          {!putWaiting && !takeWaiting && !error && pendingPuts === 0 && pendingTakes === 0 ? (
            <p className="activity muted">
              Fill all {capacity} slots, then Put once more to see a blocked producer. With the buffer
              empty, Take once to see a blocked consumer (only one blocking call at a time).
            </p>
          ) : null}
        </section>
      </main>
    </div>
  )
}
