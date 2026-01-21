import { google } from 'googleapis';
import path from 'path';
import stream from 'stream';

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'google-credentials.json'),
    scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
    ],
});

const drive = google.drive({ version: 'v3', auth });

export async function uploadToGoogle(
    repo: string,
    prNumber: string,
    content: string
): Promise<string> {
    const SHARED_DRIVE_ID = '0APxiz-P4FWE8Uk9PVA';
    const dateStr = new Date().toISOString().split('T')[0];
    const folderName = `PR-Docs-${dateStr}`;

    let folderId: string;

    // Search for existing folder
    const folderSearch = await drive.files.list({
        q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${SHARED_DRIVE_ID}' in parents and trashed = false`,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'drive',
        driveId: SHARED_DRIVE_ID,
        fields: 'files(id)',
    });

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
        folderId = folderSearch.data.files[0].id!;
    } else {
        // Create new folder
        const folder = await drive.files.create({
            supportsAllDrives: true,
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [SHARED_DRIVE_ID],
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
        supportsAllDrives: true,
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
