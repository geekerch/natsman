import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { SecondarySidebar } from '../components/SecondarySidebar'
import { api } from '../services/api'
import type { StreamInfo, StreamMessage } from '../types'
import { Trash2, RefreshCw, Plus } from 'lucide-react'

export default function JetStreamPageNew() {
  const [activeTab, setActiveTab] = useState('streams')
  const [streams, setStreams] = useState<string[]>([])
  const [selectedStream, setSelectedStream] = useState<string>('')
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null)
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  // Dialogs
  const [showCreateStreamDialog, setShowCreateStreamDialog] = useState(false)
  const [showDeleteStreamDialog, setShowDeleteStreamDialog] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [showCreateConsumerDialog, setShowCreateConsumerDialog] = useState(false)
  
  // Form states
  const [newStream, setNewStream] = useState({
    name: '',
    subjects: '',
    storage: 'file',
    replicas: 1
  })
  
  const [publishForm, setPublishForm] = useState({
    subject: '',
    body: ''
  })
  
  const [newConsumer, setNewConsumer] = useState({
    name: '',
    deliver_policy: 'all',
    ack_policy: 'explicit',
    filter_subject: ''
  })

  useEffect(() => {
    loadStreams()
  }, [])

  useEffect(() => {
    if (selectedStream) {
      loadStreamInfo(selectedStream)
      if (activeTab === 'messages') {
        loadMessages(selectedStream)
      }
    }
  }, [selectedStream, activeTab])

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

  const loadMessages = async (streamName: string, refresh: boolean = false) => {
    try {
      const result = await api.getStreamMessages(streamName, refresh)
      setMessages(result.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
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
      
      setShowCreateStreamDialog(false)
      setNewStream({ name: '', subjects: '', storage: 'file', replicas: 1 })
      await loadStreams()
    } catch (error) {
      console.error('Failed to create stream:', error)
    }
  }

  const handleDeleteStream = async () => {
    if (!selectedStream) return
    
    try {
      await api.deleteStream(selectedStream)
      setShowDeleteStreamDialog(false)
      setSelectedStream('')
      setStreamInfo(null)
      await loadStreams()
    } catch (error) {
      console.error('Failed to delete stream:', error)
    }
  }

  const handlePublish = async () => {
    if (!publishForm.subject || !publishForm.body) return
    
    try {
      await api.publishToJetStream({
        subject: publishForm.subject,
        body: publishForm.body,
        config: { url: '', creds_path: '' }
      })
      
      setShowPublishDialog(false)
      setPublishForm({ subject: '', body: '' })
      if (selectedStream) {
        await loadMessages(selectedStream, true)
      }
    } catch (error) {
      console.error('Failed to publish:', error)
    }
  }

  const handleCreateConsumer = async () => {
    if (!selectedStream || !newConsumer.name) return
    
    try {
      await api.createConsumer({
        stream_name: selectedStream,
        name: newConsumer.name,
        deliver_policy: newConsumer.deliver_policy,
        ack_policy: newConsumer.ack_policy,
        filter_subject: newConsumer.filter_subject,
        config: { url: '', creds_path: '' }
      })
      
      setShowCreateConsumerDialog(false)
      setNewConsumer({ name: '', deliver_policy: 'all', ack_policy: 'explicit', filter_subject: '' })
      await loadStreamInfo(selectedStream)
    } catch (error) {
      console.error('Failed to create consumer:', error)
    }
  }

  return (
    <div className="flex h-full">
      <SecondarySidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Streams</h2>
            <Button size="sm" onClick={() => setShowCreateStreamDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {streams.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No streams found
              </div>
            ) : (
              <div className="space-y-1">
                {streams.map((stream) => (
                  <div
                    key={stream}
                    className={`p-2 rounded cursor-pointer hover:bg-accent transition-colors ${
                      selectedStream === stream ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedStream(stream)}
                  >
                    <span className="text-sm font-mono">{stream}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SecondarySidebar>

      <div className="flex-1 overflow-hidden p-4">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {selectedStream ? `Stream: ${selectedStream}` : 'Select a stream'}
              </CardTitle>
              {selectedStream && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowPublishDialog(true)}>
                    Publish
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => setShowDeleteStreamDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden min-h-0 p-0">
            {!selectedStream ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a stream to view details
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="mx-4 mt-2">
                  <TabsTrigger value="streams">Stream Info</TabsTrigger>
                  <TabsTrigger value="consumers">Consumers</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>
                
                <TabsContent value="streams" className="flex-1 overflow-y-auto px-4 mt-4">
                  {streamInfo && (
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
                  )}
                </TabsContent>
                
                <TabsContent value="consumers" className="flex-1 overflow-y-auto px-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium">
                      Consumers ({streamInfo?.state.consumer_count || 0})
                    </h3>
                    <Button size="sm" onClick={() => setShowCreateConsumerDialog(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Create Consumer
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Consumer list will be implemented
                  </div>
                </TabsContent>
                
                <TabsContent value="messages" className="flex-1 overflow-y-auto px-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium">
                      Messages ({messages.length})
                    </h3>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => loadMessages(selectedStream, true)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  {messages.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No messages found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((msg) => (
                        <Card key={msg.sequence}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Seq: {msg.sequence}</span>
                              <span className="text-xs text-muted-foreground">{msg.time}</span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xs text-muted-foreground mb-1">
                              Subject: {msg.subject}
                            </div>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                              {msg.data}
                            </pre>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Stream Dialog */}
      <Dialog open={showCreateStreamDialog} onOpenChange={setShowCreateStreamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Stream</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="stream-name"
                value={newStream.name}
                onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Subjects (comma-separated)</Label>
              <Input
                placeholder="events.*, logs.>"
                value={newStream.subjects}
                onChange={(e) => setNewStream({ ...newStream, subjects: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Storage</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newStream.storage}
                  onChange={(e) => setNewStream({ ...newStream, storage: e.target.value })}
                >
                  <option value="file">File</option>
                  <option value="memory">Memory</option>
                </select>
              </div>
              <div>
                <Label>Replicas</Label>
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
            <Button variant="outline" onClick={() => setShowCreateStreamDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStream}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Subject</Label>
              <Input
                placeholder="subject.name"
                value={publishForm.subject}
                onChange={(e) => setPublishForm({ ...publishForm, subject: e.target.value })}
              />
            </div>
            <div>
              <Label>Message Body</Label>
              <Textarea
                placeholder="Message content..."
                rows={6}
                value={publishForm.body}
                onChange={(e) => setPublishForm({ ...publishForm, body: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Consumer Dialog */}
      <Dialog open={showCreateConsumerDialog} onOpenChange={setShowCreateConsumerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Consumer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="consumer-name"
                value={newConsumer.name}
                onChange={(e) => setNewConsumer({ ...newConsumer, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Deliver Policy</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newConsumer.deliver_policy}
                onChange={(e) => setNewConsumer({ ...newConsumer, deliver_policy: e.target.value })}
              >
                <option value="all">All</option>
                <option value="last">Last</option>
                <option value="new">New</option>
              </select>
            </div>
            <div>
              <Label>Ack Policy</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newConsumer.ack_policy}
                onChange={(e) => setNewConsumer({ ...newConsumer, ack_policy: e.target.value })}
              >
                <option value="explicit">Explicit</option>
                <option value="none">None</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
              <Label>Filter Subject (Optional)</Label>
              <Input
                placeholder="events.user.*"
                value={newConsumer.filter_subject}
                onChange={(e) => setNewConsumer({ ...newConsumer, filter_subject: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateConsumerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConsumer}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteStreamDialog} onOpenChange={setShowDeleteStreamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stream</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">Are you sure you want to delete this stream?</p>
            <p className="text-sm text-muted-foreground mt-2">{selectedStream}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteStreamDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStream}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
