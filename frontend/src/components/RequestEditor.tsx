import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select } from './ui/select'
import { Button } from './ui/button'
import { Send, Plus, Trash2 } from 'lucide-react'
import type { Template, SendReqResult, Variable } from '../types'
import { api } from '../services/api'

interface RequestEditorProps {
  templatePath: string
  onSave: () => void
}

export function RequestEditor({ templatePath, onSave }: RequestEditorProps) {
  const [template, setTemplate] = useState<Template>({
    mode: 'request',
    subject: '',
    payload: '',
    variables: {}
  })
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState<SendReqResult | null>(null)
  const [activeTab, setActiveTab] = useState<'config' | 'variables'>('config')

  useEffect(() => {
    if (templatePath) {
      loadTemplate()
    } else {
      setTemplate({
        mode: 'request',
        subject: '',
        payload: '',
        variables: {}
      })
      setResponse(null)
    }
  }, [templatePath])

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const data = await api.getTemplate(templatePath)
      setTemplate({
        ...data,
        variables: data.variables || {}
      })
    } catch (error) {
      console.error('Failed to load template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      console.log('Saving template:', templatePath, template)
      await api.saveTemplate(templatePath, template)
      onSave()
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template: ' + (error as Error).message)
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

  const addVariable = () => {
    const newVarName = `var${Object.keys(template.variables || {}).length + 1}`
    setTemplate({
      ...template,
      variables: {
        ...(template.variables || {}),
        [newVarName]: { type: 'static', value: '' }
      }
    })
  }

  const updateVariable = (key: string, variable: Variable) => {
    setTemplate({
      ...template,
      variables: {
        ...(template.variables || {}),
        [key]: variable
      }
    })
  }

  const deleteVariable = (key: string) => {
    const newVars = { ...(template.variables || {}) }
    delete newVars[key]
    setTemplate({
      ...template,
      variables: newVars
    })
  }

  const renameVariable = (oldKey: string, newKey: string) => {
    if (oldKey === newKey || !newKey) return
    
    const newVars = { ...(template.variables || {}) }
    newVars[newKey] = newVars[oldKey]
    delete newVars[oldKey]
    
    setTemplate({
      ...template,
      variables: newVars
    })
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
          <div className="flex items-center justify-between">
            <div className="flex gap-4 border-b">
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'config'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('config')}
              >
                Configuration
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'variables'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('variables')}
              >
                Variables ({Object.keys(template.variables || {}).length})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === 'config' ? (
            <>
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
                <div className="text-xs text-muted-foreground mt-1">
                  Use {"{{.variableName}}"} to reference variables
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button onClick={handleSend} disabled={sending || !template.subject}>
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Define variables to use in subject and payload with {"{{.name}}"} syntax
                </div>
                <Button size="sm" onClick={addVariable}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Variable
                </Button>
              </div>

              {Object.keys(template.variables || {}).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No variables defined. Click "Add Variable" to create one.
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(template.variables || {}).map(([key, variable]) => (
                    <div key={key} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Variable Name
                          </label>
                          <Input
                            value={key}
                            onChange={(e) => renameVariable(key, e.target.value)}
                            placeholder="variableName"
                            className="mt-1"
                          />
                        </div>
                        <div className="w-32">
                          <label className="text-xs font-medium text-muted-foreground">
                            Type
                          </label>
                          <Select
                            value={variable.type}
                            onChange={(e) =>
                              updateVariable(key, { ...variable, type: e.target.value as 'static' | 'env' | 'dynamic' })
                            }
                            className="mt-1"
                          >
                            <option value="static">Static</option>
                            <option value="dynamic">Dynamic (JS)</option>
                          </Select>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteVariable(key)}
                          className="mt-5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          {variable.type === 'static' ? 'Value' : 'JavaScript Code'}
                        </label>
                        {variable.type === 'static' ? (
                          <Input
                            value={variable.value}
                            onChange={(e) =>
                              updateVariable(key, { ...variable, value: e.target.value })
                            }
                            placeholder="Enter value"
                            className="mt-1"
                          />
                        ) : (
                          <Textarea
                            value={variable.value}
                            onChange={(e) =>
                              updateVariable(key, { ...variable, value: e.target.value })
                            }
                            placeholder="return new Date().toISOString()"
                            rows={3}
                            className="mt-1 font-mono text-sm"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave}>Save Variables</Button>
              </div>
            </div>
          )}
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
