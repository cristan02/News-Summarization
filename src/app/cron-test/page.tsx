'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface CronJobResult {
  success: boolean;
  message?: string;
  cleanup?: {
    articlesDeleted: number;
    chunksDeleted: number;
    cutoffDate: string;
  };
  newsFetch?: {
    queriesProcessed: number;
    articlesFetched: number;
    articlesSaved: number;
    articlesAlreadyExisted: number;
    errors: number;
  };
  statistics?: {
    articlesDeleted?: number;
    chunksDeleted?: number;
  };
  error?: string;
  timestamp?: string;
}

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [results, setResults] = useState<CronJobResult | null>(null);

  const triggerDailyOperations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cron/daily-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setResults(result);
        toast.success('Daily operations completed successfully');
      } else {
        toast.error(result.error || 'Daily operations failed');
      }
    } catch (error) {
      toast.error('Failed to trigger daily operations');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllArticles = async () => {
    if (!confirm('Are you sure you want to delete ALL articles and chunks from the database? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/articles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setResults(result);
        toast.success('All articles and chunks deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete articles');
      }
    } catch (error) {
      toast.error('Failed to delete articles');
      console.error('Error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cron Job Testing</h1>
        <p className="text-muted-foreground">
          Manually trigger automated cron jobs and manage database content. External news fetching and cleanup happen through the daily operations cron.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Operations</CardTitle>
            <CardDescription>
              Combined job that cleans up old articles (7+ days) and fetches new articles based on your tags. Processes articles from GNews API and NewsAPI, uses Hugging Face AI for summaries, and stores in database. Runs daily at 2:00 AM UTC.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={triggerDailyOperations}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Running...' : 'Trigger Daily Operations'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete All Articles</CardTitle>
            <CardDescription>
              ⚠️ Permanently deletes ALL articles and chunks from the database. This action cannot be undone. Use for testing or database reset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={deleteAllArticles}
              disabled={isDeleting}
              variant="destructive"
              className="w-full"
            >
              {isDeleting ? 'Deleting...' : 'Delete All Articles'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Last Job Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vercel Cron Schedule</CardTitle>
          <CardDescription>
            Automatic execution schedule on Vercel production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="font-medium">Daily Operations:</span>
            <span className="text-muted-foreground">Every day at 2:00 AM UTC</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Includes: News fetching + Cleanup of 7+ day old articles and chunks
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
