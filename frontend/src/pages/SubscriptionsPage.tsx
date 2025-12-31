import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { subscriptionsApi, api } from '../services/api'
import type { Subscription, SubscriptionMessage } from '../types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { SecondarySidebar } from '../components/SecondarySidebar'

export function SubscriptionsPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [messages, setMessages] = useState<SubscriptionMessage[]>([])
  const [newSubject, setNewSubject] = useState('')
  const [loading, setLoading] = useState(false)

  const loadSubscriptions = useCallback(async () => {
    if (!isConnected) return
    try {
      const subs = await subscriptionsApi.list()
      setSubscriptions(subs)
    } catch (error: any) {
      console.error('Failed to load subscriptions:', error)
    }
  }, [isConnected])

  const loadMessages = useCallback(async (subject: string) => {
    try {
      const msgs = await subscriptionsApi.getMessages(subject)
      setMessages(msgs)
    } catch (error: any) {
      console.error('Failed to load messages:', error)
    }
  }, [])

  const checkConnection = useCallback(async () => {
    try {
      await api.getNatsConfig()
      setIsConnected(true)
    } catch {
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  useEffect(() => {
    if (!selectedSubject || !isConnected) return

    loadMessages(selectedSubject)
    const interval = setInterval(() => {
      loadMessages(selectedSubject)
    }, 2000)

    return () => clearInterval(interval)
  }, [selectedSubject, isConnected, loadMessages])

  const handleSubscribe = async () => {
    if (!newSubject.trim()) {
      alert('Please enter a subject to subscribe')
      return
    }

    setLoading(true)
    try {
      await subscriptionsApi.subscribe(newSubject.trim())
      setNewSubject('')
      await loadSubscriptions()
    } catch (error: any) {
      alert(`Subscription failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async (subject: string) => {
    if (!confirm(`Unsubscribe from "${subject}"?`)) return
    
    try {
      await subscriptionsApi.unsubscribe(subject)
      if (selectedSubject === subject) {
        setSelectedSubject(null)
        setMessages([])
      }
      await loadSubscriptions()
    } catch (error: any) {
      alert(`Unsubscribe failed: ${error.message}`)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const formatPayload = (payload: string) => {
    try {
      const parsed = JSON.parse(payload)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return payload
    }
  }

  return (
    <div className="flex h-full">
      <SecondarySidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-4">Subscriptions</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
              <Input
                placeholder="Subject (e.g., events.test)"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                disabled={!isConnected || loading}
              />
              <Button
                size="sm"
                onClick={handleSubscribe}
                disabled={!isConnected || loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Subscribe
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {subscriptions.length} active subscription{subscriptions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

          <div className="flex-1 overflow-y-auto">
            {subscriptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No active subscriptions
                <div className="text-xs mt-1">Enter a subject above to subscribe</div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.subject}
                    className={`
                      flex items-center justify-between p-3 rounded-lg cursor-pointer
                      transition-colors group
                      ${selectedSubject === sub.subject
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                      }
                    `}
                    onClick={() => setSelectedSubject(sub.subject)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{sub.subject}</div>
                      <div className="text-xs text-muted-foreground">
                        {sub.message_count || 0} message{sub.message_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnsubscribe(sub.subject)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SecondarySidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedSubject ? (
          <>
            <div className="border-b p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedSubject}</h2>
                <p className="text-sm text-muted-foreground">
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMessages(selectedSubject)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Message #{idx + 1}</span>
                      <span className="text-muted-foreground">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    {msg.reply_to && (
                      <div className="text-sm text-muted-foreground">
                        Reply to: <code className="text-xs">{msg.reply_to}</code>
                      </div>
                    )}
                    <div className="bg-muted rounded p-3 overflow-x-auto">
                      <pre className="text-sm">{formatPayload(msg.payload)}</pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a subscription to view messages
          </div>
        )}
      </div>
    </div>
  )
}
