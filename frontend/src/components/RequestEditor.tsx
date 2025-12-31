import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select } from './ui/select'
import { Button } from './ui/button'
import { Send, Globe, Code } from 'lucide-react'
import { GlobalVariablesModal } from './GlobalVariablesModal'
import { ExtensionsModal } from './ExtensionsModal'
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
    payload: ''
  })
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState<SendReqResult | null>(null)
  const [localVars, setLocalVars] = useState<Record<string, Variable>>({})
  const [showGlobals, setShowGlobals] = useState(false)
  const [showExtensions, setShowExtensions] = useState(false)

  useEffect(() => {
    if (templatePath) {
      loadTemplate()
    } else {
      setTemplate({
        mode: 'request',
        subject: '',
        payload: ''
      })
      setLocalVars({})
      setResponse(null)
    }
  }, [templatePath])

  // Phase 1: Auto-extract variables from template
  useEffect(() => {
    if (template.subject || template.payload) {
      extractVariables()
    } else {
      setLocalVars({})
    }
  }, [template.subject, template.payload])

  const extractVariables = async () => {
    try {
      const content = `${template.subject}\n${template.payload}`
      const varNames = await api.parseVariables(content)
      
      // Preserve existing variable configurations
      const newVars: Record<string, Variable> = {}
      varNames.forEach((name: string) => {
        newVars[name] = localVars[name] || { type: 'static', value: '' }
      })
      
      setLocalVars(newVars)
    } catch (error) {
      console.error('Failed to extract variables:', error)
    }
  }

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
        variables: localVars,
        config: { url: '', creds_path: '' }
      })
      setResponse(result)
    } catch (error: any) {
      console.error('Failed to send request:', error)
      setResponse({
        reply: error.message || 'Request failed',
        status: 'error',
        elapsed: '0ms'
      })
    } finally {
      setSending(false)
    }
  }

  const updateLocalVar = (name: string, variable: Variable) => {
    setLocalVars(prev => ({
      ...prev,
      [name]: variable
    }))
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
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Configuration Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Configuration</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowGlobals(true)}
              >
                <Globe className="mr-2 h-4 w-4" />
                Globals
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowExtensions(true)}
              >
                <Code className="mr-2 h-4 w-4" />
                Extensions
              </Button>
            </div>
          </div>
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
            <p className="text-xs text-muted-foreground mt-1">
              Use {"{{.variableName}}"} syntax to define variables
            </p>
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

      {/* Phase 2: Local Variables Card */}
      {Object.keys(localVars).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Local Variables <span className="text-sm text-muted-foreground">({Object.keys(localVars).length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(localVars).map(([name, variable]) => (
                <div key={name} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground">Variable Name</label>
                      <div className="text-sm font-mono font-semibold mt-1">{"{{." + name + "}}"}</div>
                    </div>
                    <div className="w-40">
                      <label className="text-xs font-medium text-muted-foreground">Type</label>
                      <Select
                        value={variable.type}
                        onChange={(e) => updateLocalVar(name, { ...variable, type: e.target.value as Variable['type'] })}
                        className="mt-1 text-sm"
                      >
                        <option value="static">Static</option>
                        <option value="env">Environment</option>
                        <option value="dynamic">Dynamic (JS)</option>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      {variable.type === 'dynamic' ? 'JavaScript Code' : variable.type === 'env' ? 'Environment Variable' : 'Value'}
                    </label>
                    {variable.type === 'dynamic' ? (
                      <Textarea
                        value={variable.value}
                        onChange={(e) => updateLocalVar(name, { ...variable, value: e.target.value })}
                        placeholder="return new Date().toISOString()"
                        rows={3}
                        className="mt-1 font-mono text-sm"
                      />
                    ) : (
                      <Input
                        value={variable.value}
                        onChange={(e) => updateLocalVar(name, { ...variable, value: e.target.value })}
                        placeholder={variable.type === 'env' ? 'ENV_VAR_NAME' : 'Enter value'}
                        className="mt-1 text-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Card */}
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

      {/* Modals */}
      <GlobalVariablesModal 
        isOpen={showGlobals} 
        onClose={() => setShowGlobals(false)} 
      />
      <ExtensionsModal 
        isOpen={showExtensions} 
        onClose={() => setShowExtensions(false)} 
      />
    </div>
  )
}
