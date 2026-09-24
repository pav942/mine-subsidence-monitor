import { Outlet, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../api/client'
import { LayoutDashboard, Map, LineChart, Bell, TrendingDown, Mountain } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/map', label: 'GIS Map', icon: Map },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/fukuzono', label: 'Failure Prediction', icon: TrendingDown },
  { to: '/alerts', label: 'Alerts', icon: Bell },
]

function Layout() {
  const [backendUp, setBackendUp] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        await api.get('/health')
        setBackendUp(true)
      } catch {
        setBackendUp(false)
      }
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-base text-text font-sans">
      <header className="border-b border-border bg-panel px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mountain size={24} className="text-data" />
          <div>
            <div className="text-xs text-muted">PS 26025</div>
            <div className="text-lg font-semibold text-white">Mine Subsidence Monitor</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${backendUp ? 'bg-safe' : 'bg-critical'}`} />
          <span className="font-mono text-muted">
            {backendUp ? 'System Online' : 'Backend Unreachable'}
          </span>
        </div>
      </header>

      <nav className="border-b border-border bg-panel px-6 flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                  isActive
                    ? 'border-data text-white'
                    : 'border-transparent text-muted hover:text-text'
                }`
              }
            >
              <Icon size={15} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout