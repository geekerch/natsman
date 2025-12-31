import { useState } from 'react'
import { TemplateTree } from '../components/TemplateTree'
import { RequestEditor } from '../components/RequestEditor'

export default function RequestsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSelectTemplate = (path: string) => {
    setSelectedTemplate(path)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="flex h-full">
      <div className="w-64 border-r">
        <TemplateTree
          key={refreshKey}
          onSelectTemplate={handleSelectTemplate}
          onRefresh={handleRefresh}
        />
      </div>
      <div className="flex-1 overflow-auto">
        <RequestEditor
          templatePath={selectedTemplate}
          onSave={handleRefresh}
        />
      </div>
    </div>
  )
}
