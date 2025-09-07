import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Tag {
  id: string
  name: string
  usageCount: number
}

interface TagSelectorProps {
  tags: Tag[]
  selectedTags: string[]
  onTagToggle: (tagName: string) => void
  className?: string
}

export function TagSelector({ tags, selectedTags, onTagToggle, className }: TagSelectorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-[--grid-fluid] gap-3">
        {tags.map(tag => (
          <Button
            key={tag.id}
            variant={selectedTags.includes(tag.name) ? "default" : "outline"}
            size="sm"
            onClick={() => onTagToggle(tag.name)}
            className={cn(
              "h-auto p-3 text-sm font-medium transition-all duration-200 hover:scale-105",
              selectedTags.includes(tag.name)
                ? "bg-primary text-primary-foreground shadow-md"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <div className="truncate font-medium">#{tag.name}</div>
          </Button>
        ))}
      </div>
    </div>
  )
}
