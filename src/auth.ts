import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { cookies } from "next/headers"

declare module "next-auth" {
    interface Session {
        accessToken?: string
        googleAccessToken?: string
        error?: string
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
        }
    }
}

// Cookie names for storing linked tokens
const GITHUB_TOKEN_COOKIE = "pr-doc-github-token"
const GOOGLE_TOKEN_COOKIE = "pr-doc-google-token"
const GOOGLE_REFRESH_COOKIE = "pr-doc-google-refresh"

/**
 * Refresh Google access token using refresh token
 */
async function refreshGoogleToken(refreshToken: string): Promise<{
    accessToken: string
    expiresAt: number
    refreshToken: string
} | null> {
    try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("Failed to refresh Google token:", data)
            return null
        }

        return {
            accessToken: data.access_token,
            expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
            refreshToken: data.refresh_token || refreshToken, // Google may or may not return a new refresh token
        }
    } catch (error) {
        console.error("Error refreshing Google token:", error)
        return null
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        GitHub({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            authorization: {
                params: {
                    scope: "read:user user:email repo",
                },
            },
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents",
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, account }) {
            // When a new account is linked, store its token
            if (account) {
                if (account.provider === "github") {
                    token.accessToken = account.access_token
                    // Store in cookie for persistence across provider switches
                    try {
                        const cookieStore = await cookies()
                        cookieStore.set(GITHUB_TOKEN_COOKIE, account.access_token || "", {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === "production",
                            sameSite: "lax",
                            maxAge: 30 * 24 * 60 * 60, // 30 days
                        })
                    } catch {
                        // Ignore cookie errors
                    }
                }
                if (account.provider === "google") {
                    token.googleAccessToken = account.access_token
                    token.googleRefreshToken = account.refresh_token
                    token.googleTokenExpiry = account.expires_at
                    // Store in cookies for persistence
                    try {
                        const cookieStore = await cookies()
                        cookieStore.set(GOOGLE_TOKEN_COOKIE, account.access_token || "", {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === "production",
                            sameSite: "lax",
                            maxAge: 60 * 60, // 1 hour
                        })
                        if (account.refresh_token) {
                            cookieStore.set(GOOGLE_REFRESH_COOKIE, account.refresh_token, {
                                httpOnly: true,
                                secure: process.env.NODE_ENV === "production",
                                sameSite: "lax",
                                maxAge: 30 * 24 * 60 * 60, // 30 days
                            })
                        }
                    } catch {
                        // Ignore cookie errors
                    }
                }
            }
            
            // Try to restore tokens from cookies if not present
            try {
                const cookieStore = await cookies()
                
                if (!token.accessToken) {
                    const githubToken = cookieStore.get(GITHUB_TOKEN_COOKIE)
                    if (githubToken?.value) {
                        token.accessToken = githubToken.value
                    }
                }
                
                if (!token.googleRefreshToken) {
                    const refreshToken = cookieStore.get(GOOGLE_REFRESH_COOKIE)
                    if (refreshToken?.value) {
                        token.googleRefreshToken = refreshToken.value
                    }
                }
                
                // Check if Google token needs refresh
                const googleToken = cookieStore.get(GOOGLE_TOKEN_COOKIE)
                if (googleToken?.value) {
                    token.googleAccessToken = googleToken.value
                } else if (token.googleRefreshToken) {
                    // Token expired or missing, try to refresh
                    console.log("Refreshing expired Google token...")
                    const refreshed = await refreshGoogleToken(token.googleRefreshToken as string)
                    
                    if (refreshed) {
                        token.googleAccessToken = refreshed.accessToken
                        token.googleTokenExpiry = refreshed.expiresAt
                        token.googleRefreshToken = refreshed.refreshToken
                        
                        // Update cookies
                        cookieStore.set(GOOGLE_TOKEN_COOKIE, refreshed.accessToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === "production",
                            sameSite: "lax",
                            maxAge: 60 * 60, // 1 hour
                        })
                        cookieStore.set(GOOGLE_REFRESH_COOKIE, refreshed.refreshToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === "production",
                            sameSite: "lax",
                            maxAge: 30 * 24 * 60 * 60, // 30 days
                        })
                        console.log("Google token refreshed successfully")
                    } else {
                        console.error("Failed to refresh Google token")
                        token.error = "RefreshAccessTokenError"
                    }
                }
            } catch (error) {
                console.error("Error in jwt callback:", error)
            }
            
            return token
        },
        async session({ session, token }) {
            // Send properties to the client
            session.accessToken = token.accessToken as string | undefined
            session.googleAccessToken = token.googleAccessToken as string | undefined
            session.error = token.error as string | undefined
            if (token.sub) {
                session.user.id = token.sub
            }
            return session
        },
    },
    events: {
        async signOut() {
            // Clear linked tokens on sign out
            try {
                const cookieStore = await cookies()
                cookieStore.delete(GITHUB_TOKEN_COOKIE)
                cookieStore.delete(GOOGLE_TOKEN_COOKIE)
                cookieStore.delete(GOOGLE_REFRESH_COOKIE)
            } catch {
                // Ignore cookie errors
            }
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    trustHost: true,
})
