import { Card, CardContent } from "@/components/ui/card"
import { Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserPreferencesHeaderProps {
  userName?: string | null
  className?: string
}

export function UserPreferencesHeader({ userName, className }: UserPreferencesHeaderProps) {
  return (
    <Card className={cn("border-none shadow-lg bg-gradient-to-r from-primary/10 to-secondary/10", className)}>
      <CardContent className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome, {userName}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Customize your interests to get personalized news recommendations
        </p>
      </CardContent>
    </Card>
  )
}
