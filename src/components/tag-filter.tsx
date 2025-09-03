'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Search, Filter, X, Hash } from 'lucide-react';

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  onClearAll: () => void;
  showAllTags?: boolean;
  title?: string;
}

export default function TagFilter({
  availableTags,
  selectedTags,
  onTagSelect,
  onTagRemove,
  onClearAll,
  showAllTags = false,
  title = "Filter by Tags"
}: TagFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TagsList = ({ tags, isCompact = false }: { tags: string[], isCompact?: boolean }) => (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Selected ({selectedTags.length})</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearAll}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="default"
                className="cursor-pointer hover:bg-primary/80 text-xs"
                onClick={() => onTagRemove(tag)}
              >
                {tag}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Available tags */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          Available Tags ({filteredTags.length})
        </h4>
        <div className={`flex flex-wrap gap-1.5 ${
          !showAllTags && !isCompact ? 'max-h-32 overflow-y-auto' : ''
        }`}>
          {filteredTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
              className="cursor-pointer hover:bg-secondary/80 text-xs"
              onClick={() => 
                selectedTags.includes(tag) ? onTagRemove(tag) : onTagSelect(tag)
              }
            >
              <Hash className="mr-1 h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {filteredTags.length === 0 && searchTerm && (
        <div className="text-center text-muted-foreground text-sm py-4">
          No tags found matching &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  );

  // Mobile/tablet view with sheet
  const MobileTagFilter = () => (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="md:hidden">
          <Filter className="w-4 h-4 mr-2" />
          Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Hash className="w-5 h-5 mr-2" />
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 overflow-y-auto">
          <TagsList tags={filteredTags} isCompact={true} />
        </div>
      </SheetContent>
    </Sheet>
  );

  // Desktop view with card
  const DesktopTagFilter = () => (
    <Card className="hidden md:block">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Hash className="w-5 h-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TagsList tags={filteredTags} />
      </CardContent>
    </Card>
  );

  return (
    <>
      <MobileTagFilter />
      <DesktopTagFilter />
    </>
  );
}
