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
        // Fetch PR details and files in parallel
        const [prResponse, filesResponse] = await Promise.all([
            fetch(
                `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}`,
                {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            ),
            fetch(
                `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/files`,
                {
                    headers: {
                        Authorization: `token ${process.env.GITHUB_TOKEN}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            ),
        ]);

        if (!prResponse.ok) {
            const errorText = await prResponse.text();
            return NextResponse.json(
                { error: `GitHub API Error: ${prResponse.status} - ${errorText}` },
                { status: prResponse.status }
            );
        }

        if (!filesResponse.ok) {
            const errorText = await filesResponse.text();
            return NextResponse.json(
                { error: `GitHub API Error: ${filesResponse.status} - ${errorText}` },
                { status: filesResponse.status }
            );
        }

        const prData = await prResponse.json();
        const filesData = await filesResponse.json();

        return NextResponse.json({
            title: prData.title,
            html_url: prData.html_url,
            files: filesData,
        });
    } catch (error) {
        console.error('PR Fetch Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
