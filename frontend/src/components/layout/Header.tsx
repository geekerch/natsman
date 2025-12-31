import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { api } from '../../services/api'

export function Header() {
  const [profile, setProfile] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const activeProfile = await api.getActiveNatsProfile()
      setProfile(activeProfile || 'default')
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      // Test connection by fetching config
      await api.getNatsConfig()
      setIsConnected(true)
    } catch (error) {
      console.error('Connection failed:', error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-16 items-center justify-between border-b px-6 bg-background">
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <span className="text-muted-foreground">Profile:</span>{' '}
          <span className="font-medium">{profile || 'Loading...'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <Button 
        size="sm" 
        onClick={handleConnect}
        disabled={isLoading}
      >
        {isLoading ? 'Connecting...' : isConnected ? 'Reconnect' : 'Connect'}
      </Button>
    </div>
  )
}
