import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { FileText, FolderPlus } from 'lucide-react'
import { TemplateTree } from '../components/TemplateTree'
import { RequestEditor } from '../components/RequestEditor'
import type { TemplateTreeRef } from '../components/TemplateTree'

export default function RequestsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [refreshKey, setRefreshKey] = useState(0)
  const treeRef = useRef<TemplateTreeRef>(null)

  const handleSelectTemplate = (path: string) => {
    setSelectedTemplate(path)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="w-80 flex flex-col">
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Templates</CardTitle>
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
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <TemplateTree
              ref={treeRef}
              key={refreshKey}
              onSelectTemplate={handleSelectTemplate}
              onRefresh={handleRefresh}
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="flex-1 flex flex-col">
        {!selectedTemplate ? (
          <Card className="flex-1 flex items-center justify-center">
            <CardContent className="text-muted-foreground">
              Select a template to edit
            </CardContent>
          </Card>
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
