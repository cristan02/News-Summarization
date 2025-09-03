'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink, Hash } from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  link: string;
  shortSummary: string;
  tag: string;
  source?: string;
  publishedAt?: string | null;
  createdAt?: string;
}

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
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date unavailable';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (articles.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Hash className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{emptyMessage}</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              {title === "Your Personalized Feed" 
                ? "Try adjusting your tag preferences or check back later for new articles."
                : "Try selecting different tags or check back later for new articles."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="text-sm text-muted-foreground">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
        {articles.map((article) => (
          <Card key={article.id} className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight line-clamp-3">
                    {article.title}
                  </CardTitle>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {formatDate(article.publishedAt || article.createdAt)}
                </div>
                {showSource && article.source && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Source:</span>
                    <span>{article.source}</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 space-y-4">
              <CardDescription className="text-sm leading-relaxed whitespace-pre-wrap flex-1">
                {article.shortSummary}
              </CardDescription>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  <Hash className="w-3 h-3 mr-1" />
                  {article.tag}
                </Badge>
              </div>

              <div className="flex gap-2 mt-auto">
                <Button asChild className="flex-1">
                  <Link href={`/article/${article.id}`}>
                    Read More
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
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
