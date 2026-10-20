import { useCallback, useEffect, useRef, useState } from 'react'
import './SseDemo.css'

type ReceivedEvent = {
  id: number
  data: string
  at: string
}

export function SseDemo() {
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<ReceivedEvent[]>([])
  const [latestId, setLatestId] = useState<number | null>(null)
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null)
  const [isTriggering, setIsTriggering] = useState(false)
  const nextIdRef = useRef(1)

  useEffect(() => {
    const source = new EventSource('/api/sse/stream')

    source.onopen = () => setConnected(true)
    source.onerror = () => setConnected(false)
    source.onmessage = (event) => {
      const id = nextIdRef.current
      nextIdRef.current += 1
      setEvents((prev) => [
        { id, data: event.data, at: new Date().toLocaleTimeString() },
        ...prev,
      ].slice(0, 20))
      setLatestId(id)
      window.setTimeout(() => {
        setLatestId((current) => (current === id ? null : current))
      }, 1800)
    }

    return () => {
      source.close()
      setConnected(false)
    }
  }, [])

  const trigger = useCallback(async () => {
    setTriggerStatus(null)
    setIsTriggering(true)
    try {
      const response = await fetch('/api/sse/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Hello from UI at ${new Date().toISOString()}` }),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const body = (await response.json()) as { delivered: number; message: string }
      setTriggerStatus(`Delivered to ${body.delivered} client${body.delivered === 1 ? '' : 's'}`)
    } catch (err) {
      setTriggerStatus(err instanceof Error ? err.message : 'Trigger failed')
    } finally {
      setIsTriggering(false)
    }
  }, [])

  return (
    <div className="sse-page">
      <main className="sse-card">
        <header className="sse-header">
          <div className="sse-title-row">
            <span className="sse-badge">Code learning</span>
            <h1>Server-Sent Events</h1>
            <p className="sse-subtitle">
              Long-lived stream on <code>GET /api/sse/stream</code>, push via{' '}
              <code>POST /api/sse/trigger</code>.
            </p>
          </div>

          <div
            className={`sse-connection ${connected ? 'is-live' : 'is-down'}`}
            role="status"
            aria-live="polite"
          >
            <span className="sse-connection-dot" aria-hidden />
            {connected ? 'Live' : 'Reconnecting…'}
          </div>
        </header>

        <section className="sse-actions">
          <button
            type="button"
            className="sse-trigger"
            onClick={trigger}
            disabled={!connected || isTriggering}
          >
            {isTriggering ? 'Sending…' : 'Send event'}
          </button>
          {triggerStatus ? (
            <p className={`sse-feedback ${triggerStatus.includes('Delivered') ? 'ok' : 'err'}`}>
              {triggerStatus}
            </p>
          ) : (
            <p className="sse-feedback muted">Events appear in the feed below.</p>
          )}
        </section>

        <section className="sse-feed" aria-labelledby="feed-heading">
          <div className="sse-feed-head">
            <h2 id="feed-heading">Event feed</h2>
            <span className="sse-count">{events.length}</span>
          </div>

          {events.length === 0 ? (
            <div className="sse-empty">
              <div className="sse-empty-icon" aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <p>Waiting for the first event.</p>
              <p className="sse-empty-hint">Hit <strong>Send event</strong> or call the trigger API.</p>
            </div>
          ) : (
            <ul className="sse-events">
              {events.map((item) => (
                <li key={item.id} className={item.id === latestId ? 'is-new' : undefined}>
                  <time dateTime={item.at}>{item.at}</time>
                  <code>{item.data}</code>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
