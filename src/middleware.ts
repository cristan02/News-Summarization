import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Manual auth middleware to avoid withAuth edge runtime issue.
export async function middleware(req: NextRequest) {
	// getToken reads from cookies / Authorization header
	const token = await getToken({ req })
	if (token) return NextResponse.next()

	// For API requests return 401 JSON instead of redirect
	if (req.nextUrl.pathname.startsWith('/api/')) {
		return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	// Redirect user to home/login
	const url = new URL('/', req.url)
	url.searchParams.set('from', req.nextUrl.pathname)
	return NextResponse.redirect(url)
}

// Only run on these protected paths; cron routes excluded.
export const config = {
	matcher: [
		'/feed/:path*',
		'/article/:path*',
		'/protected/:path*',
		'/user-preferences/:path*',
		'/api/chat/:path*',
		'/api/articles/:path*',
		'/api/user-preferences/:path*'
	]
}