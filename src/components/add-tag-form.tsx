import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddTagFormProps {
  newTag: string
  onNewTagChange: (value: string) => void
  onAddTag: () => void
  className?: string
}

export function AddTagForm({ newTag, onNewTagChange, onAddTag, className }: AddTagFormProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onAddTag()
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-lg font-semibold text-foreground">Add Custom Tag</h3>
      <div className="space-y-2">
        <Input
          type="text"
          value={newTag}
          onChange={(e) => onNewTagChange(e.target.value)}
          placeholder="Enter a new tag..."
          onKeyPress={handleKeyPress}
          className="w-full"
        />
        <Button
          onClick={onAddTag}
          variant="secondary"
          className="w-full"
          disabled={!newTag.trim()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>
    </div>
  )
}
