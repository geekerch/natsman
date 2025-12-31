import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText, Trash2 } from 'lucide-react'
import type { TreeNode as TreeNodeType } from '../types'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { api } from '../services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Input } from './ui/input'

interface TemplateTreeProps {
  onSelectTemplate: (path: string) => void
  onRefresh?: () => void
}

export interface TemplateTreeRef {
  showCreateFile: () => void
  showCreateFolder: () => void
}

export const TemplateTree = forwardRef<TemplateTreeRef, TemplateTreeProps>(
  ({ onSelectTemplate, onRefresh }, ref) => {
  const [tree, setTree] = useState<TreeNodeType | null>(null)
  const [selectedPath, setSelectedPath] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  // Create file dialog
  const [showCreateFile, setShowCreateFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  
  // Create folder dialog
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState('')

  useImperativeHandle(ref, () => ({
    showCreateFile: () => setShowCreateFile(true),
    showCreateFolder: () => setShowCreateFolder(true)
  }))

  useEffect(() => {
    loadTree()
  }, [])

  const loadTree = async () => {
    setLoading(true)
    try {
      const data = await api.getTemplates()
      setTree(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (node: TreeNodeType) => {
    if (!node.is_folder) {
      setSelectedPath(node.path)
      onSelectTemplate(node.path)
    }
  }

  const handleCreateFile = async () => {
    if (!newFileName) return
    
    try {
      // Ensure .nm extension
      const fileName = newFileName.endsWith('.nm') ? newFileName : newFileName + '.nm'
      console.log('Creating file:', fileName)
      
      await api.createTemplate(fileName, {
        mode: 'request',
        subject: '',
        payload: ''
      })
      
      setShowCreateFile(false)
      setNewFileName('')
      await loadTree()
      onRefresh?.()
    } catch (error) {
      console.error('Failed to create file:', error)
      alert('Failed to create file: ' + (error as Error).message)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName) return
    
    try {
      console.log('Creating folder:', newFolderName)
      
      await api.createFolder(newFolderName)
      setShowCreateFolder(false)
      setNewFolderName('')
      await loadTree()
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert('Failed to create folder: ' + (error as Error).message)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    
    try {
      console.log('Deleting:', itemToDelete)
      
      await api.deleteTemplate(itemToDelete)
      setShowDeleteConfirm(false)
      setItemToDelete('')
      
      // Clear selection if deleted item was selected
      if (selectedPath === itemToDelete) {
        setSelectedPath('')
      }
      
      await loadTree()
      onRefresh?.()
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete: ' + (error as Error).message)
    }
  }

  const confirmDelete = (path: string) => {
    setItemToDelete(path)
    setShowDeleteConfirm(true)
  }

  return (
    <>
      <div className="h-full flex flex-col p-4">
        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading...</div>
        ) : tree && tree.children && tree.children.length > 0 ? (
          tree.children.map((child: TreeNodeType) => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              level={0}
              selectedPath={selectedPath}
              onSelect={handleSelect}
              onDelete={confirmDelete}
            />
          ))
        ) : (
          <div className="text-sm text-muted-foreground py-8 text-center">No templates</div>
        )}
      </div>

      {/* Create File Dialog */}
      <Dialog open={showCreateFile} onOpenChange={setShowCreateFile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter file name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFile(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFile}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">Are you sure you want to delete this item?</p>
            <p className="text-sm text-muted-foreground mt-2">{itemToDelete}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})

TemplateTree.displayName = 'TemplateTree'

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
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => {
          if (node.is_folder) {
            setIsExpanded(!isExpanded)
          } else {
            onSelect(node)
          }
        }}
      >
        {node.is_folder ? (
          <span className="flex-shrink-0 w-4">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        ) : (
          <span className="flex-shrink-0 w-4" />
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
