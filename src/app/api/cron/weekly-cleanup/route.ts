import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Security check for cron jobs
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || cronSecret === 'your_secure_cron_secret_here') {
    // In development, allow requests without secret
    return process.env.NODE_ENV === 'development';
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting weekly cleanup job...');
    
    // Delete articles older than 15 days
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    const deleteResult = await prisma.article.deleteMany({
      where: {
        OR: [
          {
            publishedAt: {
              lt: fifteenDaysAgo
            }
          },
          {
            publishedAt: null,
            createdAt: {
              lt: fifteenDaysAgo
            }
          }
        ]
      }
    });

    console.log(`Weekly cleanup completed: deleted ${deleteResult.count} articles older than 15 days`);

    const response = {
      success: true,
      message: 'Weekly cleanup completed',
      statistics: {
        articlesDeleted: deleteResult.count,
        cutoffDate: fifteenDaysAgo.toISOString()
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in weekly cleanup cron job:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute weekly cleanup',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
