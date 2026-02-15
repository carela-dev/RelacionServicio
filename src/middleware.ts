import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const response = NextResponse.next()

    // Get cookies from request
    const accessToken = request.cookies.get('sb-access-token')?.value
    const refreshToken = request.cookies.get('sb-refresh-token')?.value

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // If we have tokens, set the session
    if (accessToken && refreshToken) {
        await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        })
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protect all routes except login and root
    if (!user && !request.nextUrl.pathname.startsWith('/login') && request.nextUrl.pathname !== '/') {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        return NextResponse.redirect(redirectUrl)
    }

    if (user && request.nextUrl.pathname.startsWith('/login')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/PanelDeControlDeSupervision'
        return NextResponse.redirect(redirectUrl)
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
