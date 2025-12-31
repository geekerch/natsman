import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select } from './ui/select'
import { Button } from './ui/button'
import { Send } from 'lucide-react'
import type { Template, SendReqResult } from '../types'
import { api } from '../services/api'

interface RequestEditorProps {
  templatePath: string
  onSave: () => void
}

export function RequestEditor({ templatePath, onSave }: RequestEditorProps) {
  const [template, setTemplate] = useState<Template>({
    mode: 'request',
    subject: '',
    payload: ''
  })
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState<SendReqResult | null>(null)

  useEffect(() => {
    if (templatePath) {
      loadTemplate()
    }
  }, [templatePath])

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const data = await api.getTemplate(templatePath)
      setTemplate(data)
    } catch (error) {
      console.error('Failed to load template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await api.saveTemplate(templatePath, template)
      onSave()
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const handleSend = async () => {
    setSending(true)
    setResponse(null)
    try {
      const result = await api.sendRequest({
        mode: template.mode,
        subject: template.subject,
        body: template.payload,
        variables: template.variables || {},
        config: { url: '', creds_path: '' }
      })
      setResponse(result)
    } catch (error: any) {
      console.error('Failed to send request:', error)
      setResponse({
        reply: '',
        status: 'error',
        elapsed: '0ms'
      })
    } finally {
      setSending(false)
    }
  }

  if (!templatePath) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a template to start editing
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Request Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="text-sm font-medium">Mode</label>
              <Select
                value={template.mode}
                onChange={(e) => setTemplate({ ...template, mode: e.target.value })}
              >
                <option value="request">Request/Reply</option>
                <option value="pubsub">Publish</option>
                <option value="jetstream">JetStream</option>
              </Select>
            </div>
            <div className="col-span-3">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={template.subject}
                onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                placeholder="service.action.{{.id}}"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Payload</label>
            <Textarea
              value={template.payload}
              onChange={(e) => setTemplate({ ...template, payload: e.target.value })}
              placeholder='{"action": "{{.action}}", "data": "{{.data}}"}'
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={handleSend} disabled={sending || !template.subject}>
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Response</CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <span className={`font-medium ${response.status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                  {response.status}
                </span>
                <span className="text-muted-foreground">{response.elapsed}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
              {response.reply || 'No response data'}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
