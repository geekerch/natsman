import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Textarea } from './ui/textarea'
import { Plus, Trash2, Play } from 'lucide-react'
import type { Variable, GlobalsProfile } from '../types'
import { api } from '../services/api'

interface GlobalVariablesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalVariablesModal({ isOpen, onClose }: GlobalVariablesModalProps) {
  const [profiles, setProfiles] = useState<GlobalsProfile[]>([])
  const [activeProfile, setActiveProfile] = useState<string>('')
  const [currentVars, setCurrentVars] = useState<Record<string, Variable>>({})
  const [loading, setLoading] = useState(false)
  const [showNewProfileInput, setShowNewProfileInput] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadProfiles()
    }
  }, [isOpen])

  const loadProfiles = async () => {
    setLoading(true)
    try {
      const profileList = await api.getGlobalsProfiles()
      const active = await api.getActiveGlobalsProfile()
      
      setProfiles(profileList)
      setActiveProfile(active)
      
      if (active) {
        const profile = profileList.find(p => p.name === active)
        if (profile) {
          setCurrentVars(profile.variables || {})
        }
      }
    } catch (error) {
      console.error('Failed to load globals profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (profileName: string) => {
    setActiveProfile(profileName)
    const profile = profiles.find(p => p.name === profileName)
    if (profile) {
      setCurrentVars(profile.variables || {})
    }
  }

  const addVariable = () => {
    const newKey = `var${Object.keys(currentVars).length + 1}`
    setCurrentVars(prev => ({
      ...prev,
      [newKey]: { type: 'static', value: '' }
    }))
  }

  const updateVariable = (oldKey: string, newKey: string, variable: Variable) => {
    const newVars = { ...currentVars }
    
    if (oldKey !== newKey) {
      delete newVars[oldKey]
    }
    
    newVars[newKey] = variable
    setCurrentVars(newVars)
  }

  const deleteVariable = (key: string) => {
    const newVars = { ...currentVars }
    delete newVars[key]
    setCurrentVars(newVars)
  }

  const handleSave = async () => {
    try {
      await api.saveGlobalsProfile({
        name: activeProfile,
        variables: currentVars
      })
      onClose()
    } catch (error) {
      console.error('Failed to save globals profile:', error)
      alert('Failed to save: ' + (error as Error).message)
    }
  }

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      alert('Please enter a profile name')
      return
    }
    
    if (profiles.some(p => p.name === newProfileName)) {
      alert('Profile already exists')
      return
    }
    
    try {
      await api.saveGlobalsProfile({
        name: newProfileName,
        variables: {}
      })
      
      await loadProfiles()
      setActiveProfile(newProfileName)
      setCurrentVars({})
      setNewProfileName('')
      setShowNewProfileInput(false)
    } catch (error) {
      console.error('Failed to create profile:', error)
      alert('Failed to create profile: ' + (error as Error).message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="relative z-50 bg-white dark:bg-gray-900 border rounded-lg shadow-lg w-full max-w-3xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Global Variables</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Profile Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Environment Profile</label>
            <div className="flex gap-2">
              <Select
                value={activeProfile}
                onChange={(e) => handleProfileChange(e.target.value)}
                disabled={loading}
                className="flex-1"
              >
                {profiles.map(profile => (
                  <option key={profile.name} value={profile.name}>
                    {profile.name}
                  </option>
                ))}
              </Select>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowNewProfileInput(!showNewProfileInput)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {showNewProfileInput && (
              <div className="flex gap-2">
                <Input
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="dev, staging, prod..."
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                />
                <Button size="sm" onClick={handleCreateProfile}>
                  Create
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setShowNewProfileInput(false)
                    setNewProfileName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Separate profiles for different environments (dev, staging, production)
            </p>
          </div>

          {/* Variables List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Variables</h3>
              <Button size="sm" onClick={addVariable}>
                <Plus className="mr-2 h-4 w-4" />
                Add Variable
              </Button>
            </div>

            {Object.keys(currentVars).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
                No variables defined. Click "Add Variable" to create one.
              </div>
            ) : (
              Object.entries(currentVars).map(([key, variable]) => (
                <VariableItem
                  key={key}
                  varKey={key}
                  variable={variable}
                  onUpdate={(newKey, newVar) => updateVariable(key, newKey, newVar)}
                  onDelete={() => deleteVariable(key)}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  )
}

interface VariableItemProps {
  varKey: string
  variable: Variable
  onUpdate: (key: string, variable: Variable) => void
  onDelete: () => void
}

function VariableItem({ varKey, variable, onUpdate, onDelete }: VariableItemProps) {
  const [key, setKey] = useState(varKey)
  const [testResult, setTestResult] = useState<string>('')
  const [testing, setTesting] = useState(false)

  const builtinSnippets = [
    { label: 'UUID', code: 'return uuid()' },
    { label: 'Timestamp', code: 'return timestamp()' },
    { label: 'Timestamp (ms)', code: 'return timestampMs()' },
    { label: 'Now (ISO)', code: 'return now()' },
    { label: 'Random Int (1-100)', code: 'return randomInt(1, 100)' },
  ]

  const handleTest = async () => {
    if (variable.type !== 'dynamic') return
    
    setTesting(true)
    setTestResult('')
    
    try {
      const result = await api.testDynamicVariable(variable.value)
      setTestResult(result)
    } catch (error) {
      setTestResult('Error: ' + (error as Error).message)
    } finally {
      setTesting(false)
    }
  }

  const insertSnippet = (code: string) => {
    onUpdate(key, { ...variable, value: code })
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground">Variable Name</label>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onBlur={() => onUpdate(key, variable)}
            placeholder="variableName"
            className="mt-1 font-mono"
          />
        </div>
        <div className="w-40">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <Select
            value={variable.type}
            onChange={(e) => onUpdate(key, { ...variable, type: e.target.value as Variable['type'] })}
            className="mt-1"
          >
            <option value="static">Static</option>
            <option value="env">Environment</option>
            <option value="dynamic">Dynamic (JS)</option>
          </Select>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="mt-5"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-muted-foreground">
            {variable.type === 'dynamic' ? 'JavaScript Code' : variable.type === 'env' ? 'Environment Variable' : 'Value'}
          </label>
          {variable.type === 'dynamic' && (
            <div className="flex gap-1">
              <Select
                value=""
                onChange={(e) => e.target.value && insertSnippet(e.target.value)}
                className="text-xs h-6 w-32"
              >
                <option value="">Snippets...</option>
                {builtinSnippets.map((snippet, i) => (
                  <option key={i} value={snippet.code}>
                    {snippet.label}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={handleTest}
                disabled={testing}
                className="h-6 px-2"
              >
                <Play className="h-3 w-3 mr-1" />
                Test
              </Button>
            </div>
          )}
        </div>
        {variable.type === 'dynamic' ? (
          <>
            <Textarea
              value={variable.value}
              onChange={(e) => onUpdate(key, { ...variable, value: e.target.value })}
              placeholder="return new Date().toISOString()"
              rows={3}
              className="mt-1 font-mono text-sm"
            />
            {testResult && (
              <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                <div className="text-muted-foreground mb-1">Result:</div>
                <div>{testResult}</div>
              </div>
            )}
          </>
        ) : (
          <Input
            value={variable.value}
            onChange={(e) => onUpdate(key, { ...variable, value: e.target.value })}
            placeholder={variable.type === 'env' ? 'ENV_VAR_NAME' : 'Enter value'}
            className="mt-1"
          />
        )}
      </div>
    </div>
  )
}
