import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { SecondarySidebar } from '../components/SecondarySidebar'
import { api } from '../services/api'
import type { StreamInfo } from '../types'
import { Trash2, RefreshCw } from 'lucide-react'

export default function JetStreamPage() {
  const [activeTab, setActiveTab] = useState('streams')
  const [streams, setStreams] = useState<string[]>([])
  const [selectedStream, setSelectedStream] = useState<string>('')
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null)
  const [showCreateStreamDialog, setShowCreateStreamDialog] = useState(false)
  const [showDeleteStreamDialog, setShowDeleteStreamDialog] = useState(false)
  const [showCreateConsumerDialog, setShowCreateConsumerDialog] = useState(false)
  const [showMessagesDialog, setShowMessagesDialog] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  const [newStream, setNewStream] = useState({
    name: '',
    subjects: '',
    storage: 'file',
    replicas: 1
  })

  const [newConsumer, setNewConsumer] = useState({
    stream: '',
    name: '',
    deliverPolicy: 'all',
    ackPolicy: 'explicit'
  })

  const [consumers, setConsumers] = useState<string[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [currentStreamForMessages, setCurrentStreamForMessages] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<any>(null)

  useEffect(() => {
    loadStreams()
  }, [])

  useEffect(() => {
    if (selectedStream) {
      loadStreamInfo(selectedStream)
      if (activeTab === 'consumers') {
        loadConsumers(selectedStream)
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

  const loadConsumers = async (streamName: string) => {
    try {
      const consumerList = await api.listConsumers(streamName)
      setConsumers(consumerList)
    } catch (error) {
      console.error('Failed to load consumers:', error)
      setConsumers([])
    }
  }

  const loadMessages = async (streamName: string) => {
    try {
      const result = await api.getStreamMessages(streamName, true)
      setMessages(result.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
      setMessages([])
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
      loadStreams()
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
      loadStreams()
    } catch (error) {
      console.error('Failed to delete stream:', error)
    }
  }

  const handleCreateConsumer = async () => {
    if (!newConsumer.stream || !newConsumer.name) return
    
    try {
      await api.createConsumer({
        stream_name: newConsumer.stream,
        consumer_name: newConsumer.name,
        deliver_policy: newConsumer.deliverPolicy,
        ack_policy: newConsumer.ackPolicy,
        config: { url: '', creds_path: '' }
      })
      
      setShowCreateConsumerDialog(false)
      setNewConsumer({ stream: '', name: '', deliverPolicy: 'all', ackPolicy: 'explicit' })
      if (selectedStream) {
        loadConsumers(selectedStream)
      }
    } catch (error) {
      console.error('Failed to create consumer:', error)
    }
  }

  const handleDeleteConsumer = async (streamName: string, consumerName: string) => {
    try {
      await api.deleteConsumer(streamName, consumerName)
      loadConsumers(streamName)
    } catch (error) {
      console.error('Failed to delete consumer:', error)
    }
  }

  const handleViewMessages = async (streamName: string) => {
    setCurrentStreamForMessages(streamName)
    setShowMessagesDialog(true)
    await loadMessages(streamName)
  }

  return (
    <>
      <div className="flex h-full">
        <SecondarySidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Streams</h2>
              <Button size="sm" onClick={() => setShowCreateStreamDialog(true)}>
                Create
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-2">
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
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewMessages(selectedStream)}
                    >
                      View Messages
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => setShowDeleteStreamDialog(true)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-0">
              {!selectedStream ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a stream to view details
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="flex-shrink-0">
                    <TabsTrigger value="streams">Info</TabsTrigger>
                    <TabsTrigger value="consumers">Consumers</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="streams" className="flex-1 overflow-y-auto min-h-0 mt-4">
                    {streamInfo ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Storage</div>
                            <div className="text-lg">{streamInfo.storage}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Replicas</div>
                            <div className="text-lg">{streamInfo.replicas}</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-2">Subjects</div>
                          <div className="flex flex-wrap gap-2">
                            {streamInfo.subjects && streamInfo.subjects.length > 0 ? (
                              streamInfo.subjects.map((subject, idx) => (
                                <span key={idx} className="px-2 py-1 bg-muted rounded text-sm font-mono">
                                  {subject}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No subjects</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Loading...
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="consumers" className="flex-1 overflow-y-auto min-h-0 mt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">Consumers</h3>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setNewConsumer({ ...newConsumer, stream: selectedStream })
                            setShowCreateConsumerDialog(true)
                          }}
                        >
                          Create Consumer
                        </Button>
                      </div>
                      
                      {consumers.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          No consumers found
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {consumers.map((consumer) => (
                            <div
                              key={consumer}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                            >
                              <span className="text-sm font-mono">{consumer}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteConsumer(selectedStream, consumer)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Stream Dialog */}
      <Dialog open={showCreateStreamDialog} onOpenChange={setShowCreateStreamDialog}>
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
            <Button variant="outline" onClick={() => setShowCreateStreamDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStream}>Create</Button>
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

      {/* Create Consumer Dialog */}
      <Dialog open={showCreateConsumerDialog} onOpenChange={setShowCreateConsumerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Consumer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Stream</label>
              <Input
                disabled
                value={newConsumer.stream}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Consumer Name</label>
              <Input
                placeholder="consumer-name"
                value={newConsumer.name}
                onChange={(e) => setNewConsumer({ ...newConsumer, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Deliver Policy</label>
              <Select
                value={newConsumer.deliverPolicy}
                onChange={(e) => setNewConsumer({ ...newConsumer, deliverPolicy: e.target.value })}
              >
                <option value="all">All</option>
                <option value="last">Last</option>
                <option value="new">New</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Ack Policy</label>
              <Select
                value={newConsumer.ackPolicy}
                onChange={(e) => setNewConsumer({ ...newConsumer, ackPolicy: e.target.value })}
              >
                <option value="explicit">Explicit</option>
                <option value="none">None</option>
                <option value="all">All</option>
              </Select>
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

      {/* Stream Messages Dialog */}
      <Dialog open={showMessagesDialog} onOpenChange={setShowMessagesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Stream Messages: {currentStreamForMessages}</DialogTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadMessages(currentStreamForMessages)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex gap-4 h-[60vh]">
            <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
              <div className="bg-muted px-3 py-2 border-b">
                <h4 className="text-sm font-medium">Messages ({messages.length})</h4>
              </div>
              <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No messages found
                  </div>
                ) : (
                  <div className="divide-y">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 cursor-pointer hover:bg-accent ${
                          selectedMessage === msg ? 'bg-accent' : ''
                        }`}
                        onClick={() => setSelectedMessage(msg)}
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Seq: {msg.sequence}</span>
                          <span>•</span>
                          <span>{new Date(msg.time).toLocaleString()}</span>
                        </div>
                        <div className="text-sm font-mono mt-1 truncate">{msg.subject}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {selectedMessage && (
              <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
                <div className="bg-muted px-3 py-2 border-b">
                  <h4 className="text-sm font-medium">Message Details</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Subject</div>
                    <div className="text-sm font-mono mt-1">{selectedMessage.subject}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Sequence</div>
                    <div className="text-sm mt-1">{selectedMessage.sequence}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Time</div>
                    <div className="text-sm mt-1">{new Date(selectedMessage.time).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Data</div>
                    <pre className="text-xs font-mono mt-1 p-2 bg-muted rounded overflow-x-auto">
                      {typeof selectedMessage.data === 'string' 
                        ? selectedMessage.data 
                        : JSON.stringify(selectedMessage.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
