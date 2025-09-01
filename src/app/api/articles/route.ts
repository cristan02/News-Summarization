import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')

    let whereClause = {}
    if (tag) {
      whereClause = { tag: tag }
    }

    const articles = await prisma.article.findMany({
      where: whereClause,
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        link: true,
        content: true,
        shortSummary: true,
        tag: true,
        source: true,
        author: true,
        publishedAt: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' }, 
      { status: 500 }
    )
  }
}
