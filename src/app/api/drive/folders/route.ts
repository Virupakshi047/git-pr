import { NextRequest, NextResponse } from "next/server"
import { google, drive_v3 } from "googleapis"
import { getGoogleAccessToken } from "@/lib/auth/credentials"

interface DriveFolder {
    id: string
    name: string
    path?: string
}

// GET - List folders in user's Drive
export async function GET(request: NextRequest) {
    try {
        const accessToken = await getGoogleAccessToken()
        
        if (!accessToken) {
            return NextResponse.json(
                { error: "Google Drive authentication required" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const parentId = searchParams.get("parentId") || "root"
        
        // Create auth client
        const oauth2Client = new google.auth.OAuth2()
        oauth2Client.setCredentials({ access_token: accessToken })
        
        const drive = google.drive({ version: "v3", auth: oauth2Client })
        
        // List folders in the specified parent
        const response = await drive.files.list({
            q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: "files(id, name)",
            orderBy: "name",
            pageSize: 100,
        })
        
        const folders: DriveFolder[] = (response.data.files || []).map(file => ({
            id: file.id!,
            name: file.name!,
        }))
        
        // Also include parent info if not root
        let parentName = "My Drive"
        let parentPath = "/"
        
        if (parentId !== "root") {
            try {
                const parentFile = await drive.files.get({
                    fileId: parentId,
                    fields: "name",
                })
                parentName = parentFile.data.name || parentId
            } catch {
                // Ignore errors getting parent name
            }
        }
        
        return NextResponse.json({
            parentId,
            parentName,
            parentPath,
            folders,
        })
    } catch (error) {
        console.error("Error listing Drive folders:", error)
        return NextResponse.json(
            { error: "Failed to list folders" },
            { status: 500 }
        )
    }
}

// POST - Create a new folder
export async function POST(request: NextRequest) {
    try {
        const accessToken = await getGoogleAccessToken()
        
        if (!accessToken) {
            return NextResponse.json(
                { error: "Google Drive authentication required" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { name, parentId = "root" } = body

        if (!name || typeof name !== "string" || !name.trim()) {
            return NextResponse.json(
                { error: "Folder name is required" },
                { status: 400 }
            )
        }

        // Create auth client
        const oauth2Client = new google.auth.OAuth2()
        oauth2Client.setCredentials({ access_token: accessToken })
        
        const drive = google.drive({ version: "v3", auth: oauth2Client })

        // Create the folder
        const folder = await drive.files.create({
            requestBody: {
                name: name.trim(),
                mimeType: "application/vnd.google-apps.folder",
                parents: [parentId],
            },
            fields: "id, name",
        })

        return NextResponse.json({
            id: folder.data.id,
            name: folder.data.name,
        })
    } catch (error) {
        console.error("Error creating folder:", error)
        return NextResponse.json(
            { error: "Failed to create folder" },
            { status: 500 }
        )
    }
}
