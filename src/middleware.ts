import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

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
