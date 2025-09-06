import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getArticleById, Article, ApiResponse } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Article>>> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const { id } = await params
  const article: Article | null = await prisma.article.findUnique(getArticleById(id))

    if (!article) {
      return NextResponse.json({ 
        success: false, 
        error: 'Article not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      data: article 
    })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch article' 
    }, { status: 500 })
  }
}
