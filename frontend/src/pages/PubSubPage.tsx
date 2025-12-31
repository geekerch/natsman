import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Trash2 } from 'lucide-react'
import { api } from '../services/api'
import type { SubscriptionMessage } from '../types'

export default function PubSubPage() {
  const [subscriptions, setSubscriptions] = useState<string[]>([])
  const [selectedSub, setSelectedSub] = useState<string>('')
  const [messages, setMessages] = useState<SubscriptionMessage[]>([])
  const [newSubject, setNewSubject] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSubscriptions()
    const interval = setInterval(loadSubscriptions, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedSub) {
      loadMessages(selectedSub)
      const interval = setInterval(() => loadMessages(selectedSub), 1000)
      return () => clearInterval(interval)
    }
  }, [selectedSub])

  const loadSubscriptions = async () => {
    try {
      const subs = await api.getActiveSubscriptions()
      setSubscriptions(subs)
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
    }
  }

  const loadMessages = async (subject: string) => {
    try {
      const msgs = await api.getSubscriptionMessages(subject)
      setMessages(msgs)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleSubscribe = async () => {
    if (!newSubject) return
    
    setLoading(true)
    try {
      await api.subscribe({
        subject: newSubject,
        config: { url: '', creds_path: '' }
      })
      setNewSubject('')
      loadSubscriptions()
    } catch (error) {
      console.error('Failed to subscribe:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async (subject: string) => {
    try {
      await api.unsubscribe(subject)
      if (selectedSub === subject) {
        setSelectedSub('')
        setMessages([])
      }
      loadSubscriptions()
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
    }
  }

  const handleClearMessages = async () => {
    if (!selectedSub) return
    
    try {
      await api.clearSubscriptionMessages(selectedSub)
      setMessages([])
    } catch (error) {
      console.error('Failed to clear messages:', error)
    }
  }

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="w-80 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">New Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Subject pattern (e.g., events.*)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
            />
            <Button 
              className="w-full" 
              onClick={handleSubscribe}
              disabled={loading || !newSubject}
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {subscriptions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No active subscriptions
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {subscriptions.map((sub) => (
                  <div
                    key={sub}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent ${
                      selectedSub === sub ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedSub(sub)}
                  >
                    <span className="text-sm font-mono truncate">{sub}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnsubscribe(sub)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {selectedSub ? `Messages: ${selectedSub}` : 'Select a subscription'}
            </CardTitle>
            {selectedSub && (
              <Button size="sm" variant="outline" onClick={handleClearMessages}>
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {!selectedSub ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a subscription to view messages
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No messages received yet
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {msg.subject}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {msg.timestamp}
                    </span>
                  </div>
                  <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                    {msg.data}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
