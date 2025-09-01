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

    console.log('Starting cleanup old articles job...');
    
    // Delete articles older than 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const deleteResult = await prisma.article.deleteMany({
      where: {
        createdAt: {
          lt: sixtyDaysAgo
        }
      }
    });

    // Clean up unused tags (tags with usageCount 0)
    const unusedTagsResult = await prisma.tag.deleteMany({
      where: {
        usageCount: 0
      }
    });

    // Update tag usage counts to reflect current articles
    const tagCounts = await prisma.article.groupBy({
      by: ['tag'],
      _count: {
        tag: true
      }
    });

    // Reset all tag counts first
    await prisma.tag.updateMany({
      data: {
        usageCount: 0
      }
    });

    // Update with current counts
    for (const tagCount of tagCounts) {
      await prisma.tag.upsert({
        where: { name: tagCount.tag },
        update: { usageCount: tagCount._count.tag },
        create: { 
          name: tagCount.tag,
          usageCount: tagCount._count.tag
        }
      });
    }

    const response = {
      success: true,
      message: 'Cleanup job completed',
      statistics: {
        oldArticlesDeleted: deleteResult.count,
        unusedTagsDeleted: unusedTagsResult.count,
        tagCountsUpdated: tagCounts.length
      },
      timestamp: new Date().toISOString()
    };

    console.log('Cleanup job completed:', response.statistics);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in cleanup cron job:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to execute cleanup job',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
