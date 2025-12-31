import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { SecondarySidebar } from '../components/SecondarySidebar'
import { api } from '../services/api'
import type { KVEntry } from '../types'

export default function KVStorePage() {
  const [buckets, setBuckets] = useState<string[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string>('')
  const [keys, setKeys] = useState<string[]>([])
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [keyEntry, setKeyEntry] = useState<KVEntry | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  const [showCreateBucket, setShowCreateBucket] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')
  const [newBucketHistory, setNewBucketHistory] = useState(1)
  
  const [showPutKey, setShowPutKey] = useState(false)
  const [putKeyName, setPutKeyName] = useState('')
  const [putKeyValue, setPutKeyValue] = useState('')

  useEffect(() => {
    loadBuckets()
  }, [])

  useEffect(() => {
    if (selectedBucket) {
      loadKeys(selectedBucket)
    }
  }, [selectedBucket])

  useEffect(() => {
    if (selectedBucket && selectedKey) {
      loadKeyValue(selectedBucket, selectedKey)
    }
  }, [selectedBucket, selectedKey])

  const loadBuckets = async () => {
    try {
      const bucketList = await api.listKVBuckets()
      setBuckets(bucketList)
    } catch (error) {
      console.error('Failed to load buckets:', error)
    }
  }

  const loadKeys = async (bucket: string) => {
    try {
      const keyList = await api.getKVKeys(bucket)
      setKeys(keyList)
    } catch (error) {
      console.error('Failed to load keys:', error)
    }
  }

  const loadKeyValue = async (bucket: string, key: string) => {
    try {
      const entry = await api.getKVValue(bucket, key)
      setKeyEntry(entry)
    } catch (error) {
      console.error('Failed to load key value:', error)
    }
  }

  const handleCreateBucket = async () => {
    if (!newBucketName) return
    
    try {
      await api.createKVBucket(newBucketName, newBucketHistory)
      setShowCreateBucket(false)
      setNewBucketName('')
      setNewBucketHistory(1)
      loadBuckets()
    } catch (error) {
      console.error('Failed to create bucket:', error)
    }
  }

  const handleDeleteBucket = async () => {
    if (!selectedBucket || !confirm(`Delete bucket "${selectedBucket}"?`)) return
    
    try {
      await api.deleteKVBucket(selectedBucket)
      setSelectedBucket('')
      setKeys([])
      loadBuckets()
    } catch (error) {
      console.error('Failed to delete bucket:', error)
    }
  }

  const handlePutKey = async () => {
    if (!selectedBucket || !putKeyName || !putKeyValue) return
    
    try {
      await api.putKVValue(selectedBucket, putKeyName, putKeyValue)
      setShowPutKey(false)
      setPutKeyName('')
      setPutKeyValue('')
      loadKeys(selectedBucket)
    } catch (error) {
      console.error('Failed to put key:', error)
    }
  }

  const handleDeleteKey = async () => {
    if (!selectedBucket || !selectedKey || !confirm(`Delete key "${selectedKey}"?`)) return
    
    try {
      await api.deleteKVValue(selectedBucket, selectedKey)
      setSelectedKey('')
      setKeyEntry(null)
      loadKeys(selectedBucket)
    } catch (error) {
      console.error('Failed to delete key:', error)
    }
  }

  return (
    <>
      <div className="flex h-full">
        <SecondarySidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div className="flex flex-col h-full">
            {/* Buckets Section */}
            <div className="flex flex-col border-b">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Buckets</h2>
                <Button size="sm" onClick={() => setShowCreateBucket(true)}>
                  Create
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto px-2 py-2">
                {buckets.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No buckets found
                  </div>
                ) : (
                  <div className="space-y-1">
                    {buckets.map((bucket) => (
                      <div
                        key={bucket}
                        className={`p-2 rounded cursor-pointer hover:bg-accent ${
                          selectedBucket === bucket ? 'bg-accent' : ''
                        }`}
                        onClick={() => {
                          setSelectedBucket(bucket)
                          setSelectedKey('')
                          setKeyEntry(null)
                        }}
                      >
                        <span className="text-sm font-mono">{bucket}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Keys Section */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Keys</h2>
                {selectedBucket && (
                  <Button size="sm" onClick={() => setShowPutKey(true)}>
                    Put
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                {!selectedBucket ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Select a bucket
                  </div>
                ) : keys.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No keys found
                  </div>
                ) : (
                  <div className="space-y-1">
                    {keys.map((key) => (
                      <div
                        key={key}
                        className={`p-2 rounded cursor-pointer hover:bg-accent ${
                          selectedKey === key ? 'bg-accent' : ''
                        }`}
                        onClick={() => setSelectedKey(key)}
                      >
                        <span className="text-sm font-mono truncate block">{key}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </SecondarySidebar>

        <div className="flex-1 overflow-hidden p-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {selectedKey ? `Key: ${selectedKey}` : 'Select a key'}
                </CardTitle>
                <div className="flex gap-2">
                  {selectedBucket && (
                    <Button size="sm" variant="outline" onClick={handleDeleteBucket}>
                      Delete Bucket
                    </Button>
                  )}
                  {selectedKey && (
                    <Button size="sm" variant="destructive" onClick={handleDeleteKey}>
                      Delete Key
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-0">
              {!selectedKey ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a key to view value
                </div>
              ) : keyEntry ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Revision</div>
                      <div className="text-lg">{keyEntry.revision}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Operation</div>
                      <div className="text-lg">{keyEntry.operation}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Created</div>
                      <div className="text-sm">{keyEntry.created}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Value</div>
                    <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                      {keyEntry.value}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Bucket Dialog */}
      <Dialog open={showCreateBucket} onOpenChange={setShowCreateBucket}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Bucket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Bucket Name</label>
              <Input
                placeholder="my-bucket"
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max History Per Key</label>
              <Input
                type="number"
                min="1"
                value={newBucketHistory}
                onChange={(e) => setNewBucketHistory(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBucket(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBucket}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Put Key Dialog */}
      <Dialog open={showPutKey} onOpenChange={setShowPutKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Put Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Key</label>
              <Input
                placeholder="key-name"
                value={putKeyName}
                onChange={(e) => setPutKeyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Value</label>
              <Textarea
                placeholder="value"
                rows={6}
                value={putKeyValue}
                onChange={(e) => setPutKeyValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPutKey(false)}>
              Cancel
            </Button>
            <Button onClick={handlePutKey}>Put</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
