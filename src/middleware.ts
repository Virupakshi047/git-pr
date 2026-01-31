import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth

    // Public routes that don't require authentication
    const publicRoutes = ["/auth/signin", "/auth/error", "/api/auth"]
    const isPublicRoute = publicRoutes.some(route => 
        req.nextUrl.pathname.startsWith(route)
    )

    // Allow public routes
    if (isPublicRoute) {
        return NextResponse.next()
    }

    // Redirect to signin if not logged in and trying to access protected route
    if (!isLoggedIn && !req.nextUrl.pathname.startsWith("/api")) {
        const signInUrl = new URL("/auth/signin", req.nextUrl.origin)
        signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
        return NextResponse.redirect(signInUrl)
    }

    // Return 401 for protected API routes
    if (!isLoggedIn && req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        // Match all routes except static files and images
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
}
