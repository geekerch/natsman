import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { api } from '../services/api'
import type { NatsProfile } from '../types'

export default function SettingsPage() {
  const [profiles, setProfiles] = useState<NatsProfile[]>([])
  const [activeProfile, setActiveProfile] = useState<string>('')
  const [selectedProfile, setSelectedProfile] = useState<NatsProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    creds_path: ''
  })

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const profileList = await api.getNatsProfiles()
      const active = await api.getActiveNatsProfile()
      setProfiles(profileList)
      setActiveProfile(active)
    } catch (error) {
      console.error('Failed to load profiles:', error)
    }
  }

  const handleSelectProfile = (profile: NatsProfile) => {
    setSelectedProfile(profile)
    setFormData({
      name: profile.name,
      url: profile.url,
      creds_path: profile.creds_path
    })
    setIsEditing(false)
  }

  const handleNewProfile = () => {
    setSelectedProfile(null)
    setFormData({
      name: '',
      url: 'nats://localhost:4222',
      creds_path: ''
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.url) return
    
    try {
      await api.saveNatsProfile(formData)
      loadProfiles()
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save profile:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedProfile || !confirm(`Delete profile "${selectedProfile.name}"?`)) return
    
    try {
      await api.deleteNatsProfile(selectedProfile.name)
      setSelectedProfile(null)
      setFormData({ name: '', url: '', creds_path: '' })
      loadProfiles()
    } catch (error) {
      console.error('Failed to delete profile:', error)
    }
  }

  const handleActivate = async () => {
    if (!selectedProfile) return
    
    try {
      await api.activateNatsProfile(selectedProfile.name)
      loadProfiles()
    } catch (error) {
      console.error('Failed to activate profile:', error)
    }
  }

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="w-80">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">NATS Profiles</CardTitle>
              <Button size="sm" onClick={handleNewProfile}>
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {profiles.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No profiles found
              </div>
            ) : (
              <div className="space-y-1">
                {profiles.map((profile) => (
                  <div
                    key={profile.name}
                    className={`p-3 rounded cursor-pointer hover:bg-accent ${
                      selectedProfile?.name === profile.name ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleSelectProfile(profile)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{profile.name}</span>
                      {activeProfile === profile.name && (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {profile.url}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {selectedProfile ? `Profile: ${selectedProfile.name}` : 'New Profile'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedProfile === null && !isEditing ? (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              Select a profile or create a new one
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="text-sm font-medium">Profile Name</label>
                <Input
                  placeholder="default"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">NATS URL</label>
                <Input
                  placeholder="nats://localhost:4222"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Credentials Path (Optional)</label>
                <Input
                  placeholder="/path/to/nats.creds"
                  value={formData.creds_path}
                  onChange={(e) => setFormData({ ...formData, creds_path: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave}>Save</Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false)
                        if (selectedProfile) {
                          handleSelectProfile(selectedProfile)
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setIsEditing(true)}>Edit</Button>
                    {selectedProfile && activeProfile !== selectedProfile.name && (
                      <Button variant="outline" onClick={handleActivate}>
                        Set Active
                      </Button>
                    )}
                    {selectedProfile && (
                      <Button variant="destructive" onClick={handleDelete}>
                        Delete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
