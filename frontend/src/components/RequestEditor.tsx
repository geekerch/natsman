import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select } from './ui/select'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
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
  const [activeTab, setActiveTab] = useState<'request' | 'variables'>('request')

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
      setActiveTab('request')
    }
  }, [templatePath])

  // Auto-extract variables from template
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

  const varCount = Object.keys(localVars).length

  return (
    <Card className="flex-1 overflow-hidden flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Request Editor</CardTitle>
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
      <CardContent className="flex-1 overflow-y-auto p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'request' | 'variables')} className="h-full flex flex-col">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="request" className="flex-1">Request</TabsTrigger>
            <TabsTrigger value="variables" className="flex-1">
              Variables
              {varCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
                  {varCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="request" className="m-0 space-y-4">
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
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {"{{.variableName}}"} syntax to define variables
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button onClick={handleSave}>Save</Button>
                <Button onClick={handleSend} disabled={sending || !template.subject}>
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="variables" className="m-0">
              <VariablesTab 
                variables={localVars} 
                onUpdate={updateLocalVar}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>

      {/* Response Card */}
      {response && (
        <div className="p-4 pt-0">
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
        </div>
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
    </Card>
  )
}

interface VariablesTabProps {
  variables: Record<string, Variable>
  onUpdate: (name: string, variable: Variable) => void
}

function VariablesTab({ variables, onUpdate }: VariablesTabProps) {
  const varCount = Object.keys(variables).length

  if (varCount === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No variables detected. Use {"{{.variableName}}"} syntax in Subject or Payload.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Local Variables</span>
        <span className="text-muted-foreground">{varCount} variable{varCount !== 1 ? 's' : ''}</span>
      </div>
      
      {Object.entries(variables).map(([name, variable]) => (
        <VariableItem
          key={name}
          name={name}
          variable={variable}
          onUpdate={(v) => onUpdate(name, v)}
        />
      ))}
    </div>
  )
}

interface VariableItemProps {
  name: string
  variable: Variable
  onUpdate: (variable: Variable) => void
}

const BUILTIN_FUNCTIONS = [
  { value: 'timestamp()', label: 'Timestamp (Seconds)' },
  { value: 'timestampMs()', label: 'Timestamp (MS)' },
  { value: 'uuid()', label: 'UUID' },
  { value: 'now()', label: 'ISO 8601 Date' },
  { value: 'randomInt(1, 100)', label: 'Random Int' },
]

function VariableItem({ name, variable, onUpdate }: VariableItemProps) {
  const [testResult, setTestResult] = useState<string>('')
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    if (!variable.value) return
    
    setTesting(true)
    setTestResult('')
    try {
      const result = await api.testDynamicVariable(variable.value)
      setTestResult(`✓ Result: ${result}`)
    } catch (error: any) {
      setTestResult(`✗ Error: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  const insertSnippet = (snippet: string) => {
    onUpdate({ ...variable, value: snippet })
  }

  return (
    <div className="border rounded-lg p-3 space-y-2.5 bg-card">
      {/* Header Row */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs font-medium text-muted-foreground mb-1">Variable Name</div>
          <div className="text-sm font-mono font-semibold">{"{{." + name + "}}"}</div>
        </div>
        <div className="w-40">
          <div className="text-xs font-medium text-muted-foreground mb-1">Type</div>
          <Select
            value={variable.type}
            onChange={(e) => onUpdate({ ...variable, type: e.target.value as Variable['type'] })}
            className="text-sm"
          >
            <option value="static">Static</option>
            <option value="dynamic">Dynamic (JS)</option>
            <option value="env">Environment</option>
          </Select>
        </div>
      </div>
      
      {/* Value Row */}
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {variable.type === 'dynamic' ? 'JavaScript Code' : variable.type === 'env' ? 'Environment Variable' : 'Value'}
        </div>
        {variable.type === 'dynamic' ? (
          <div className="space-y-2">
            <Textarea
              value={variable.value}
              onChange={(e) => onUpdate({ ...variable, value: e.target.value })}
              placeholder="e.g. timestamp() or uuid()"
              rows={2}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    insertSnippet(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="text-xs flex-1"
              >
                <option value="">Insert Snippet...</option>
                {BUILTIN_FUNCTIONS.map(fn => (
                  <option key={fn.value} value={fn.value}>{fn.label}</option>
                ))}
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={handleTest}
                disabled={testing || !variable.value}
              >
                {testing ? 'Testing...' : 'Test'}
              </Button>
            </div>
            {testResult && (
              <div className={`text-xs p-2 rounded ${
                testResult.startsWith('✓') 
                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' 
                  : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
              }`}>
                {testResult}
              </div>
            )}
          </div>
        ) : (
          <Input
            value={variable.value}
            onChange={(e) => onUpdate({ ...variable, value: e.target.value })}
            placeholder={variable.type === 'env' ? 'ENV_VAR_NAME' : `Enter value for ${name}...`}
            className="text-sm"
          />
        )}
      </div>
    </div>
  )
}
