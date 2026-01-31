import { auth } from "@/auth"
import { cookies } from "next/headers"

const PAT_COOKIE = "pr-doc-github-pat"
const GOOGLE_TOKEN_COOKIE = "pr-doc-google-token"
const GOOGLE_REFRESH_COOKIE = "pr-doc-google-refresh"

export interface UserCredentials {
    githubToken?: string
    googleAccessToken?: string
}

/**
 * Refresh Google access token using refresh token
 */
async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
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

        // Update cookie with new token
        try {
            const cookieStore = await cookies()
            cookieStore.set(GOOGLE_TOKEN_COOKIE, data.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60, // 1 hour
            })
            if (data.refresh_token) {
                cookieStore.set(GOOGLE_REFRESH_COOKIE, data.refresh_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 30 * 24 * 60 * 60, // 30 days
                })
            }
        } catch {
            // Ignore cookie errors
        }

        return data.access_token
    } catch (error) {
        console.error("Error refreshing Google token:", error)
        return null
    }
}

/**
 * Get the current user's credentials from the session
 */
export async function getUserCredentials(): Promise<UserCredentials | null> {
    const session = await auth()
    
    if (!session?.user) {
        return null
    }

    return {
        githubToken: session.accessToken,
        googleAccessToken: session.googleAccessToken,
    }
}

/**
 * Get the GitHub token for the current user
 * Priority: 1. PAT (Personal Access Token), 2. OAuth token, 3. Environment variable
 */
export async function getGitHubToken(): Promise<string | null> {
    // First check for PAT (highest priority - bypasses org restrictions)
    try {
        const cookieStore = await cookies()
        const pat = cookieStore.get(PAT_COOKIE)
        if (pat?.value) {
            return pat.value
        }
    } catch {
        // Cookies may not be available in all contexts
    }
    
    // Then check OAuth token from session
    const credentials = await getUserCredentials()
    if (credentials?.githubToken) {
        return credentials.githubToken
    }
    
    // Fallback to environment variable for backward compatibility
    if (process.env.GITHUB_TOKEN) {
        console.warn('Using fallback GITHUB_TOKEN from environment - consider using OAuth')
        return process.env.GITHUB_TOKEN
    }
    
    return null
}

/**
 * Get the Google access token for the current user
 * Will attempt to refresh if token is expired
 */
export async function getGoogleAccessToken(): Promise<string | null> {
    // First try to get from session
    const credentials = await getUserCredentials()
    if (credentials?.googleAccessToken) {
        return credentials.googleAccessToken
    }
    
    // Try to get from cookie
    try {
        const cookieStore = await cookies()
        const accessToken = cookieStore.get(GOOGLE_TOKEN_COOKIE)
        
        if (accessToken?.value) {
            return accessToken.value
        }
        
        // No access token - try to refresh using refresh token
        const refreshToken = cookieStore.get(GOOGLE_REFRESH_COOKIE)
        if (refreshToken?.value) {
            console.log("Attempting to refresh expired Google token...")
            const newToken = await refreshGoogleToken(refreshToken.value)
            if (newToken) {
                console.log("Google token refreshed successfully")
                return newToken
            }
        }
    } catch (error) {
        console.error("Error getting Google access token:", error)
    }
    
    return null
}

/**
 * Check if the user has all required credentials
 */
export async function hasRequiredCredentials(requirements: {
    github?: boolean
    google?: boolean
}): Promise<{ valid: boolean; missing: string[] }> {
    const missing: string[] = []
    
    if (requirements.github) {
        const githubToken = await getGitHubToken()
        if (!githubToken) {
            missing.push('GitHub')
        }
    }
    
    if (requirements.google) {
        const googleToken = await getGoogleAccessToken()
        if (!googleToken) {
            missing.push('Google Drive')
        }
    }
    
    return {
        valid: missing.length === 0,
        missing,
    }
}
