import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { api } from '../services/api'
import type { StreamInfo } from '../types'

export default function JetStreamPage() {
  const [streams, setStreams] = useState<string[]>([])
  const [selectedStream, setSelectedStream] = useState<string>('')
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const [newStream, setNewStream] = useState({
    name: '',
    subjects: '',
    storage: 'file',
    replicas: 1
  })

  useEffect(() => {
    loadStreams()
  }, [])

  useEffect(() => {
    if (selectedStream) {
      loadStreamInfo(selectedStream)
    }
  }, [selectedStream])

  const loadStreams = async () => {
    try {
      const streamList = await api.listStreams()
      setStreams(streamList)
    } catch (error) {
      console.error('Failed to load streams:', error)
    }
  }

  const loadStreamInfo = async (name: string) => {
    try {
      const info = await api.getStreamInfo(name)
      setStreamInfo(info)
    } catch (error) {
      console.error('Failed to load stream info:', error)
    }
  }

  const handleCreateStream = async () => {
    if (!newStream.name || !newStream.subjects) return
    
    try {
      await api.createStream({
        name: newStream.name,
        subjects: newStream.subjects.split(',').map(s => s.trim()),
        storage: newStream.storage,
        replicas: newStream.replicas,
        config: { url: '', creds_path: '' }
      })
      
      setShowCreateDialog(false)
      setNewStream({ name: '', subjects: '', storage: 'file', replicas: 1 })
      loadStreams()
    } catch (error) {
      console.error('Failed to create stream:', error)
    }
  }

  const handleDeleteStream = async () => {
    if (!selectedStream) return
    
    try {
      await api.deleteStream(selectedStream)
      setShowDeleteDialog(false)
      setSelectedStream('')
      setStreamInfo(null)
      loadStreams()
    } catch (error) {
      console.error('Failed to delete stream:', error)
    }
  }

  return (
    <>
      <div className="flex h-full gap-4 p-4">
        <div className="w-80">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Streams</CardTitle>
                <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                  Create
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {streams.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No streams found
                </div>
              ) : (
                <div className="space-y-1">
                  {streams.map((stream) => (
                    <div
                      key={stream}
                      className={`p-2 rounded cursor-pointer hover:bg-accent ${
                        selectedStream === stream ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedStream(stream)}
                    >
                      <span className="text-sm font-mono">{stream}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {selectedStream ? `Stream: ${selectedStream}` : 'Select a stream'}
              </CardTitle>
              {selectedStream && (
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedStream ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Select a stream to view details
              </div>
            ) : streamInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Storage</div>
                    <div className="text-lg">{streamInfo.config.storage}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Replicas</div>
                    <div className="text-lg">{streamInfo.config.replicas}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Messages</div>
                    <div className="text-lg">{streamInfo.state.messages}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Consumers</div>
                    <div className="text-lg">{streamInfo.state.consumer_count}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Bytes</div>
                    <div className="text-lg">{streamInfo.state.bytes}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">First Seq</div>
                    <div className="text-lg">{streamInfo.state.first_seq}</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Subjects</div>
                  <div className="flex flex-wrap gap-2">
                    {streamInfo.config.subjects?.map((subject, idx) => (
                      <span key={idx} className="px-2 py-1 bg-muted rounded text-sm font-mono">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Loading...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Stream Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Stream</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="stream-name"
                value={newStream.name}
                onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subjects (comma-separated)</label>
              <Input
                placeholder="events.*, logs.>"
                value={newStream.subjects}
                onChange={(e) => setNewStream({ ...newStream, subjects: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Storage</label>
                <Select
                  value={newStream.storage}
                  onChange={(e) => setNewStream({ ...newStream, storage: e.target.value })}
                >
                  <option value="file">File</option>
                  <option value="memory">Memory</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Replicas</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={newStream.replicas}
                  onChange={(e) => setNewStream({ ...newStream, replicas: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStream}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stream</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">Are you sure you want to delete this stream?</p>
            <p className="text-sm text-muted-foreground mt-2">{selectedStream}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStream}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
