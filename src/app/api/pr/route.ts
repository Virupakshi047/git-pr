import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const pull_number = searchParams.get('pull_number');

    if (!owner || !repo || !pull_number) {
        return NextResponse.json(
            { error: 'Missing required parameters: owner, repo, pull_number' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/files`,
            {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `GitHub API Error: ${response.status} - ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('PR Fetch Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
