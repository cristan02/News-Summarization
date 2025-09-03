import { withAuth } from 'next-auth/middleware'

// Apply NextAuth middleware only to protected application & API paths.
// Cron routes (/api/cron/*) are intentionally excluded so they can use their own token auth.
export default withAuth()

export const config = {
	matcher: [
		'/feed/:path*',
		'/article/:path*',
		'/protected/:path*',
		'/user-preferences/:path*',
		// Protected API endpoints
		'/api/chat/:path*',
		'/api/articles/:path*',
		'/api/user-preferences/:path*'
	]
}