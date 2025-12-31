import { useState } from 'react'
import { TemplateTree } from '../components/TemplateTree'
import { RequestEditor } from '../components/RequestEditor'

export default function RequestsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const handleSelectTemplate = (path: string) => {
    setSelectedTemplate(path)
  }

  const handleCreateFile = (parentPath: string) => {
    // TODO: Implement file creation dialog
    console.log('Create file in:', parentPath)
  }

  const handleCreateFolder = (parentPath: string) => {
    // TODO: Implement folder creation dialog
    console.log('Create folder in:', parentPath)
  }

  const handleDeleteItem = (path: string) => {
    // TODO: Implement delete confirmation
    console.log('Delete:', path)
  }

  const handleSave = () => {
    console.log('Template saved')
  }

  return (
    <div className="flex h-full">
      <div className="w-64 border-r">
        <TemplateTree
          onSelectTemplate={handleSelectTemplate}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onDeleteItem={handleDeleteItem}
        />
      </div>
      <div className="flex-1 overflow-auto">
        <RequestEditor
          templatePath={selectedTemplate}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
