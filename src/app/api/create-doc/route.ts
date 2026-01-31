import { NextRequest, NextResponse } from 'next/server';
import { uploadToGoogle } from '@/lib/services/google';
import { getGoogleAccessToken } from '@/lib/auth/credentials';

interface CreateDocRequest {
    repo: string;
    prNumber: string;
    prTitle: string;
    prLink: string;
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: CreateDocRequest = await request.json();
        const { repo, prNumber, prTitle, prLink, content } = body;

        if (!repo || !prNumber || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: repo, prNumber, content' },
                { status: 400 }
            );
        }

        // Get Google access token from user session
        const googleAccessToken = await getGoogleAccessToken();
        
        if (!googleAccessToken) {
            return NextResponse.json(
                { error: 'Google Drive authentication required. Please connect your Google account.' },
                { status: 401 }
            );
        }

        // Prepend PR metadata header to content
        const prHeader = `# ${prTitle}\n\n**PR Link:** ${prLink}\n\n---\n\n`;
        const fullContent = prHeader + content;

        const docUrl = await uploadToGoogle(repo, prNumber, fullContent, {
            accessToken: googleAccessToken,
        });

        console.log('Created Google Doc:', docUrl);

        return NextResponse.json({
            message: 'Success',
            path: docUrl,
        });
    } catch (error) {
        console.error('Google Doc Creation Error:', error);
        return NextResponse.json(
            { error: `Google Doc creation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}

