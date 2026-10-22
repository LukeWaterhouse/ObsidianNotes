import { useState } from 'react'
import { BufferDemo } from './features/buffer/BufferDemo'
import { SseDemo } from './features/sse/SseDemo'
import './App.css'

type Example = 'sse' | 'buffer'

function App() {
  const [example, setExample] = useState<Example>('buffer')

  return (
    <>
      <nav className="app-nav" aria-label="Examples">
        <button
          type="button"
          className={example === 'sse' ? 'active' : undefined}
          onClick={() => setExample('sse')}
        >
          SSE
        </button>
        <button
          type="button"
          className={example === 'buffer' ? 'active' : undefined}
          onClick={() => setExample('buffer')}
        >
          Bounded buffer
        </button>
      </nav>
      {example === 'sse' ? <SseDemo /> : <BufferDemo />}
    </>
  )
}

export default App
