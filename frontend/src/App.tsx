import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
  service: string
  timestamp: string
}

/** Minimal shell — design explorations land after all backend work. */
function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Health check failed (${res.status})`)
        }
        return (await res.json()) as HealthResponse
      })
      .then(setHealth)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Health check failed')
      })
  }, [])

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">Quote Depot</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Backend-first scaffold. Design work is deferred until the API is complete.
      </p>
      {error && <p className="mt-4 text-red-700">API: {error}</p>}
      {health && (
        <p className="mt-4 text-sm">
          API health: {health.status} ({health.service})
        </p>
      )}
    </main>
  )
}

export default App
