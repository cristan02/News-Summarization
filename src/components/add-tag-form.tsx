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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddTag()
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-lg font-semibold text-foreground">Add Custom Tag</h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          type="text"
          value={newTag}
          onChange={(e) => onNewTagChange(e.target.value)}
          placeholder="Enter a new tag..."
          className="w-full"
        />
        <Button
          type="submit"
          disabled={!newTag.trim()}
          className="w-full"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tag
        </Button>
      </form>
    </div>
  )
}
