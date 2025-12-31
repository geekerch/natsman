import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Select } from '../ui/select'
import { api } from '../../services/api'
import type { NatsProfile } from '../../types'

export function Header() {
  const [profiles, setProfiles] = useState<NatsProfile[]>([])
  const [activeProfile, setActiveProfile] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadProfiles()
    checkConnection()
  }, [])

  const loadProfiles = async () => {
    try {
      const [profileList, active] = await Promise.all([
        api.getNatsProfiles(),
        api.getActiveNatsProfile()
      ])
      setProfiles(profileList)
      setActiveProfile(active)
    } catch (error) {
      console.error('Failed to load profiles:', error)
    }
  }

  const checkConnection = async () => {
    try {
      await api.getNatsConfig()
      setIsConnected(true)
    } catch (error) {
      setIsConnected(false)
    }
  }

  const handleProfileChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profileName = e.target.value
    if (isConnected) {
      return // Cannot change profile while connected
    }
    try {
      await api.activateNatsProfile(profileName)
      setActiveProfile(profileName)
    } catch (error) {
      console.error('Failed to activate profile:', error)
    }
  }

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      await api.getNatsConfig()
      setIsConnected(true)
    } catch (error) {
      console.error('Connection failed:', error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      // TODO: Add disconnect API
      setIsConnected(false)
    } catch (error) {
      console.error('Disconnect failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-16 items-center justify-between border-b px-6 bg-background">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Profile:</span>
          <Select 
            className="w-[180px] h-9"
            value={activeProfile} 
            onChange={handleProfileChange}
            disabled={isConnected}
          >
            <option value="">Select profile</option>
            {profiles.map((profile) => (
              <option key={profile.name} value={profile.name}>
                {profile.name}
              </option>
            ))}
          </Select>
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
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isLoading || !activeProfile}
      >
        {isLoading ? 'Loading...' : isConnected ? 'Disconnect' : 'Connect'}
      </Button>
    </div>
  )
}
