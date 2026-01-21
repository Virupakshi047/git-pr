import { NextRequest, NextResponse } from 'next/server';
import { uploadToGoogle } from '@/lib/services/google';

interface CreateDocRequest {
    repo: string;
    prNumber: string;
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: CreateDocRequest = await request.json();
        const { repo, prNumber, content } = body;

        if (!repo || !prNumber || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: repo, prNumber, content' },
                { status: 400 }
            );
        }

        const docUrl = await uploadToGoogle(repo, prNumber, content);

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
