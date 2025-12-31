import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"

interface SecondarySidebarProps {
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  className?: string
}

export function SecondarySidebar({
  isOpen,
  onToggle,
  children,
  className
}: SecondarySidebarProps) {
  return (
    <>
      <div
        className={cn(
          "relative border-r bg-background transition-all duration-300",
          isOpen ? "w-64" : "w-0",
          className
        )}
      >
        <div className={cn(
          "h-full overflow-hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          {children}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border bg-background shadow-sm"
          onClick={onToggle}
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </>
  )
}
