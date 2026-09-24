import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Prototype auth only — no real credential check yet.
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-xs text-muted font-mono mb-2">
            PROBLEM STATEMENT 26025
          </div>
          <h1 className="text-2xl font-semibold text-text">
            Mine Subsidence Monitor
          </h1>
          <p className="text-sm text-muted mt-2">
            Sign in to view live subsidence risk data
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-panel border border-border rounded-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-xs text-muted mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-base border border-border rounded-sm px-3 py-2 text-sm text-text focus:outline-none focus:border-data"
              placeholder="operator"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-base border border-border rounded-sm px-3 py-2 text-sm text-text focus:outline-none focus:border-data"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-data text-base font-medium rounded-sm py-2 text-sm hover:opacity-90 transition-opacity"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-4">
          Prototype login — any credentials will proceed
        </p>
      </div>
    </div>
  )
}

export default Login