import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { api } from '../services/api'

interface ExtensionsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ExtensionsModal({ isOpen, onClose }: ExtensionsModalProps) {
  const [extensions, setExtensions] = useState<string[]>([])
  const [enabled, setEnabled] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadExtensions()
    }
  }, [isOpen])

  const loadExtensions = async () => {
    setLoading(true)
    try {
      const allExts = await api.listExtensions()
      const enabledExts = await api.getEnabledExtensions()
      setExtensions(allExts)
      setEnabled(enabledExts)
    } catch (error) {
      console.error('Failed to load extensions:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExtension = (ext: string) => {
    setEnabled(prev =>
      prev.includes(ext)
        ? prev.filter(e => e !== ext)
        : [...prev, ext]
    )
  }

  const handleSave = async () => {
    try {
      await api.saveEnabledExtensions(enabled)
      onClose()
    } catch (error) {
      console.error('Failed to save extensions:', error)
      alert('Failed to save extensions: ' + (error as Error).message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 bg-white dark:bg-gray-900 border rounded-lg shadow-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">JavaScript Extensions</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Select JavaScript files to extend variable functionality. Place .js files in the <code className="px-1 py-0.5 bg-muted rounded text-xs">extensions/</code> directory.
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Loading...
              </div>
            ) : extensions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
                No extensions found in extensions/ directory
              </div>
            ) : (
              extensions.map((ext) => (
                <label
                  key={ext}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={enabled.includes(ext)}
                    onChange={() => toggleExtension(ext)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-mono flex-1">{ext}</span>
                  {enabled.includes(ext) && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      Enabled
                    </span>
                  )}
                </label>
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
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
