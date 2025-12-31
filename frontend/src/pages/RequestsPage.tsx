import { useState, useRef } from 'react'
import { Button } from '../components/ui/button'
import { FileText, FolderPlus } from 'lucide-react'
import { TemplateTree } from '../components/TemplateTree'
import { RequestEditor } from '../components/RequestEditor'
import { SecondarySidebar } from '../components/SecondarySidebar'
import type { TemplateTreeRef } from '../components/TemplateTree'

export default function RequestsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const treeRef = useRef<TemplateTreeRef>(null)

  const handleSelectTemplate = (path: string) => {
    setSelectedTemplate(path)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="flex h-full">
      <SecondarySidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Templates</h2>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => treeRef.current?.showCreateFile()}
                title="New File"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => treeRef.current?.showCreateFolder()}
                title="New Folder"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TemplateTree
              ref={treeRef}
              key={refreshKey}
              onSelectTemplate={handleSelectTemplate}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </SecondarySidebar>
      
      <div className="flex-1 flex items-center justify-center p-4">
        {!selectedTemplate ? (
          <div className="text-muted-foreground">
            Select a template to edit
          </div>
        ) : (
          <RequestEditor
            templatePath={selectedTemplate}
            onSave={handleRefresh}
          />
        )}
      </div>
    </div>
  )
}
