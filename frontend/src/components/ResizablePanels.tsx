import { useState, useRef, useEffect, type ReactNode } from 'react'

interface ResizablePanelsProps {
  direction: 'horizontal' | 'vertical'
  defaultSize?: number
  minSize?: number
  maxSize?: number
  children: [ReactNode, ReactNode]
}

export function ResizablePanels({
  direction,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  children
}: ResizablePanelsProps) {
  const [size, setSize] = useState(defaultSize)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      let newSize: number

      if (direction === 'horizontal') {
        newSize = ((e.clientX - rect.left) / rect.width) * 100
      } else {
        newSize = ((e.clientY - rect.top) / rect.height) * 100
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize))
      setSize(newSize)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, direction, minSize, maxSize])

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  return (
    <div
      ref={containerRef}
      className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} h-full w-full`}
    >
      <div
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${size}%`
        }}
        className="overflow-auto"
      >
        {children[0]}
      </div>
      
      <div
        onMouseDown={handleMouseDown}
        className={`
          bg-border hover:bg-accent cursor-${direction === 'horizontal' ? 'col' : 'row'}-resize
          ${direction === 'horizontal' ? 'w-1' : 'h-1'}
          ${isDragging ? 'bg-accent' : ''}
          transition-colors
        `}
      />
      
      <div
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${100 - size}%`
        }}
        className="overflow-auto"
      >
        {children[1]}
      </div>
    </div>
  )
}
