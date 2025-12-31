import { Link, useLocation } from 'react-router-dom'
import { 
  FileText, 
  Radio, 
  Database, 
  FolderKanban, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { useState } from 'react'

const navigation = [
  { name: 'Requests', href: '/', icon: FileText },
  { name: 'Subscriptions', href: '/subscriptions', icon: Radio },
  { name: 'JetStream', href: '/jetstream', icon: Database },
  { name: 'KV Store', href: '/kv', icon: FolderKanban },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn(
      "flex h-full flex-col bg-card border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4 justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              N
            </div>
            <span className="text-lg font-semibold">NATS Manager</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
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
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            <div>Version 1.0.0</div>
            <div className="mt-1">React + TypeScript</div>
          </div>
        </div>
      )}
    </div>
  )
}
