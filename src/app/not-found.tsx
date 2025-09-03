import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto text-center">
          <CardHeader>
            <div className="mb-4">
              <div className="text-6xl font-bold text-muted-foreground mb-2">404</div>
            </div>
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
            <CardDescription className="text-lg">
              Sorry, we couldn&apos;t find the page you&apos;re looking for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The page you requested might have been moved, deleted, or you entered the wrong URL.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/">
                  Go Home
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/feed">
                  View Feed
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
