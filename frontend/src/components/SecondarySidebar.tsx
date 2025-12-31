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
    <div className="relative flex">
      <div
        className={cn(
          "border-r bg-background transition-all duration-300",
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
      </div>
      
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "absolute z-10 h-8 w-8 rounded-md border shadow-sm hover:bg-accent transition-all duration-300",
          isOpen ? "-right-4 top-4" : "left-2 top-4"
        )}
        onClick={onToggle}
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
