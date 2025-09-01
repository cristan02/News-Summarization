import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectedTagsProps {
  selectedTags: string[]
  onTagRemove: (tagName: string) => void
  className?: string
}

export function SelectedTags({ selectedTags, onTagRemove, className }: SelectedTagsProps) {
  if (selectedTags.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="text-lg font-semibold text-foreground">Selected (0)</h3>
        <p className="text-sm text-muted-foreground">No tags selected yet. Choose some interests above.</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-lg font-semibold text-foreground">
        Selected ({selectedTags.length})
      </h3>
      <div className="max-h-64 overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors group px-3 py-1"
              onClick={() => onTagRemove(tag)}
            >
              <span className="mr-1">{tag}</span>
              <X className="h-3 w-3 group-hover:text-destructive-foreground" />
            </Badge>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Click on a tag to remove it</p>
    </div>
  )
}
