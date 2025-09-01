'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface CronJobResult {
  success: boolean;
  message?: string;
  data?: {
    articlesProcessed?: number;
    articlesDeleted?: number;
    errors?: string[];
    [key: string]: unknown;
  };
  error?: string;
}

export default function CronTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CronJobResult | null>(null);

  const triggerJob = async (action: 'daily-fetch' | 'cleanup') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cron/manual-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setResults(result);
        toast.success(`${action} job completed successfully`);
      } else {
        toast.error(result.error || 'Job failed');
      }
    } catch (error) {
      toast.error('Failed to trigger job');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cron Job Testing</h1>
        <p className="text-muted-foreground">
          Manually trigger automated cron jobs for testing purposes. External news fetching only happens through these cron jobs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily News Fetch</CardTitle>
            <CardDescription>
              The ONLY way external news is fetched. Processes articles from GNews API and NewsAPI, uses Hugging Face AI for summaries, and stores in database based on your tags.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => triggerJob('daily-fetch')}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Running...' : 'Trigger Daily Fetch'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cleanup Old Articles</CardTitle>
            <CardDescription>
              Removes articles older than 60 days and unused tags from the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => triggerJob('cleanup')}
              disabled={isLoading}
              variant="secondary"
              className="w-full"
            >
              {isLoading ? 'Running...' : 'Trigger Cleanup'}
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
          <CardTitle>Cron Job Schedule</CardTitle>
          <CardDescription>
            Automatic execution schedule on Vercel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Daily News Fetch:</span>
            <span className="text-muted-foreground">Every day at 6:00 AM UTC</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Cleanup Old Articles:</span>
            <span className="text-muted-foreground">Every day at 2:00 AM UTC</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
