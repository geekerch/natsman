import { Link, useLocation } from 'react-router-dom'
import { 
  FileText, 
  Radio, 
  Database, 
  FolderKanban, 
  Settings 
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navigation = [
  { name: 'Requests', href: '/', icon: FileText },
  { name: 'Pub/Sub', href: '/pubsub', icon: Radio },
  { name: 'JetStream', href: '/jetstream', icon: Database },
  { name: 'KV Store', href: '/kv', icon: FolderKanban },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            N
          </div>
          <span className="text-lg font-semibold">NATS Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <div>Version 1.0.0</div>
          <div className="mt-1">React + TypeScript</div>
        </div>
      </div>
    </div>
  )
}
