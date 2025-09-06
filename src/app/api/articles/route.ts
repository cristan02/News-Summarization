import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  ApiResponse, 
  Article, 
  articleListSelect, 
  articlesByDate,
  articlesByTagWhere 
} from '@/types'

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Article[]>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')

    // Use typed where clause
    const whereClause = tag ? articlesByTagWhere([tag]) : {}

  const articles = await prisma.article.findMany({
      where: whereClause,
      orderBy: articlesByDate
    })

    return NextResponse.json({ 
      success: true, 
      data: articles 
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch articles' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is authenticated (for security)
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting complete database cleanup - deleting all articles and chunks...')

    // Delete all chunks first (due to foreign key constraints)
    const deletedChunks = await prisma.articleChunk.deleteMany({})
    
    // Delete all articles
    const deletedArticles = await prisma.article.deleteMany({})

    console.log(`Complete database cleanup completed: ${deletedArticles.count} articles and ${deletedChunks.count} chunks deleted`)

    return NextResponse.json({
      success: true,
      message: 'All articles and chunks deleted successfully',
      statistics: {
        articlesDeleted: deletedArticles.count,
        chunksDeleted: deletedChunks.count
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error during complete database cleanup:', error)
    return NextResponse.json({
      error: 'Failed to delete articles and chunks',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
