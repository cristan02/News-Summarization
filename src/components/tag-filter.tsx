'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Hash } from 'lucide-react';

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  onClearAll: () => void;
  showAllTags?: boolean;
}

export default function TagFilter({
  availableTags,
  selectedTags,
  onTagSelect,
  onTagRemove,
  onClearAll,
  showAllTags = false
}: TagFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTags = availableTags.filter(tag =>
    tag && typeof tag === 'string' && tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
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
        <div className={`flex flex-wrap gap-1.5 ${!showAllTags ? 'max-h-48 overflow-y-auto' : 'max-h-96 overflow-y-auto'
          }`}>
          {filteredTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
              className={`${selectedTags.includes(tag) ? "hover:bg-primary/80 " : "hover:bg-secondary/80"} cursor-pointer  text-xs`}
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
}
