import { google, drive_v3 } from 'googleapis';
import path from 'path';
import stream from 'stream';
import fs from 'fs';

interface UploadOptions {
    accessToken?: string;  // OAuth access token
    driveId?: string;      // Optional: specific folder/drive ID
}

/**
 * Create a Google Auth client - either from OAuth token or service account
 */
function createAuthClient(accessToken?: string) {
    if (accessToken) {
        // Use OAuth access token (per-user)
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        return oauth2Client;
    }
    
    // Fallback to service account for backward compatibility
    const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
    if (fs.existsSync(credentialsPath)) {
        console.warn('Using fallback service account - consider using OAuth');
        return new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/documents',
            ],
        });
    }
    
    return null;
}

export async function uploadToGoogle(
    repo: string,
    prNumber: string,
    content: string,
    options: UploadOptions = {}
): Promise<string> {
    const auth = createAuthClient(options.accessToken);
    
    if (!auth) {
        throw new Error('Google Drive authentication required. Please connect your Google account.');
    }
    
    const drive = google.drive({ version: 'v3', auth });
    
    const dateStr = new Date().toISOString().split('T')[0];
    const folderName = `PR-Docs-${dateStr}`;
    
    // Determine parent folder
    // If using OAuth, we'll use the user's root Drive
    // If driveId is provided, use that (shared drive or specific folder)
    const parentId = options.driveId || 'root';
    const isSharedDrive = !!(options.driveId && options.driveId !== 'root');

    let folderId: string;

    // Search for existing folder
    const folderQuery = isSharedDrive
        ? `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`
        : `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false`;
    
    const listParams: drive_v3.Params$Resource$Files$List = {
        q: folderQuery,
        supportsAllDrives: isSharedDrive,
        includeItemsFromAllDrives: isSharedDrive,
        fields: 'files(id)',
    };
    
    if (isSharedDrive) {
        listParams.corpora = 'drive';
        listParams.driveId = parentId;
    }
    
    const folderSearch = await drive.files.list(listParams);

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
        folderId = folderSearch.data.files[0].id!;
    } else {
        // Create new folder
        const folder = await drive.files.create({
            supportsAllDrives: isSharedDrive,
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId],
            },
            fields: 'id',
        });
        folderId = folder.data.id!;
    }

    // Create buffer stream for content
    const bufferStream = new stream.PassThrough();
    bufferStream.end(content);

    // Create Google Doc
    const doc = await drive.files.create({
        supportsAllDrives: isSharedDrive,
        requestBody: {
            name: `${repo}-PR${prNumber}`,
            mimeType: 'application/vnd.google-apps.document',
            parents: [folderId],
        },
        fields: 'id',
        media: {
            mimeType: 'text/markdown',
            body: bufferStream,
        },
    });

    return `https://docs.google.com/document/d/${doc.data.id}/edit`;
}
