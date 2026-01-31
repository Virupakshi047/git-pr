import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { auth } from "@/auth"

const PAT_COOKIE = "pr-doc-github-pat"

// GET - Check if PAT exists
export async function GET() {
    const session = await auth()
    
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const cookieStore = await cookies()
    const pat = cookieStore.get(PAT_COOKIE)
    
    return NextResponse.json({ hasPat: !!pat?.value })
}

// POST - Save PAT
export async function POST(request: NextRequest) {
    const session = await auth()
    
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    try {
        const { token } = await request.json()
        
        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Token is required" }, { status: 400 })
        }
        
        // Validate token format
        if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
            return NextResponse.json({ 
                error: "Invalid token format. Token should start with 'ghp_' or 'github_pat_'" 
            }, { status: 400 })
        }
        
        // Test the token by making a simple API call
        const testResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
            },
        })
        
        if (!testResponse.ok) {
            return NextResponse.json({ 
                error: "Invalid token. Please check your token has the correct permissions." 
            }, { status: 400 })
        }
        
        // Store the token in a secure cookie
        const cookieStore = await cookies()
        cookieStore.set(PAT_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 365 * 24 * 60 * 60, // 1 year (PATs don't expire unless you set them to)
            path: "/",
        })
        
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("PAT save error:", error)
        return NextResponse.json({ error: "Failed to save token" }, { status: 500 })
    }
}

// DELETE - Remove PAT
export async function DELETE() {
    const session = await auth()
    
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const cookieStore = await cookies()
    cookieStore.delete(PAT_COOKIE)
    
    return NextResponse.json({ success: true })
}
