import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText, Trash2 } from 'lucide-react'
import type { TreeNode as TreeNodeType } from '../types'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

interface TemplateTreeProps {
  onSelectTemplate: (path: string) => void
  onCreateFile: (parentPath: string) => void
  onCreateFolder: (parentPath: string) => void
  onDeleteItem: (path: string) => void
}

export function TemplateTree({
  onSelectTemplate,
  onCreateFile,
  onCreateFolder,
  onDeleteItem
}: TemplateTreeProps) {
  const [tree] = useState<TreeNodeType | null>(null)
  const [selectedPath, setSelectedPath] = useState<string>('')
  const [loading] = useState(false)

  const handleSelect = (node: TreeNodeType) => {
    if (!node.is_folder) {
      setSelectedPath(node.path)
      onSelectTemplate(node.path)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Templates</h3>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onCreateFile('')}
            title="New File"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onCreateFolder('')}
            title="New Folder"
          >
            <Folder className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-sm text-muted-foreground p-2">Loading...</div>
        ) : tree ? (
          <TreeNodeComponent
            node={tree}
            level={0}
            selectedPath={selectedPath}
            onSelect={handleSelect}
            onDelete={onDeleteItem}
          />
        ) : (
          <div className="text-sm text-muted-foreground p-2">No templates</div>
        )}
      </div>
    </div>
  )
}

interface TreeNodeProps {
  node: TreeNodeType
  level: number
  selectedPath: string
  onSelect: (node: TreeNodeType) => void
  onDelete: (path: string) => void
}

function TreeNodeComponent({ node, level, selectedPath, onSelect, onDelete }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const isSelected = node.path === selectedPath

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-2 rounded hover:bg-accent cursor-pointer group",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (node.is_folder) {
            setIsExpanded(!isExpanded)
          } else {
            onSelect(node)
          }
        }}
      >
        {node.is_folder && (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        <span className="flex-shrink-0">
          {node.is_folder ? (
            <Folder className="h-4 w-4 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 text-gray-500" />
          )}
        </span>
        <span className="flex-1 text-sm truncate">{node.name}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onDelete(node.path)
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {node.is_folder && isExpanded && node.children && (
        <div>
          {node.children.map((child: TreeNodeType) => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
