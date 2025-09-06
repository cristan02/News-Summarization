'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink, Hash } from 'lucide-react';
import Link from 'next/link';
import { Article } from '@/types';

interface ArticleGridProps {
  articles: Article[];
  title?: string;
  emptyMessage?: string;
  showSource?: boolean;
}

export default function ArticleGrid({ 
  articles, 
  title, 
  emptyMessage = "No articles found",
  showSource = true 
}: ArticleGridProps) {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Date unavailable';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (articles.length === 0) {
    return (
      <div className="w-full">
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Hash className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No Articles Found</h3>
              <p className="text-muted-foreground">
                {emptyMessage}
              </p>
              <div className="text-sm text-muted-foreground">
                {title === "Your Personalized Feed" 
                  ? "Try adjusting your tag preferences or check back later for new articles."
                  : "Try selecting different topics or check back later for new articles."
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="text-sm text-muted-foreground">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {articles.map((article) => (
          <Card key={article.id} className="group h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-0 shadow-md">
            <CardHeader className="space-y-2 pb-2 px-4 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold leading-tight line-clamp-3 group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{formatDate(article.publishedAt)}</span>
                </div>
                {showSource && article.source && (
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="font-medium">Via:</span>
                    <span className="truncate">{article.source}</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 space-y-3 px-4 pb-4 pt-0">
              <CardDescription className="text-sm leading-relaxed flex-1">
                {article.summary}
              </CardDescription>

              <div className="flex items-start">
                <Badge variant="secondary" className="text-xs font-medium">
                  <Hash className="w-3 h-3 mr-1" />
                  {article.tag}
                </Badge>
              </div>

              <div className="flex gap-2 mt-auto">
                <Button asChild className="flex-1 h-9">
                  <Link href={`/article/${article.id}`}>
                    Read Article
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={() => window.open(article.link, '_blank')}
                  title="Open original article"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
