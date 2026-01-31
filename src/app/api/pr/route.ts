import { NextRequest, NextResponse } from 'next/server';
import { getGitHubToken } from '@/lib/auth/credentials';

/**
 * Parse GitHub API error and return user-friendly message
 */
function parseGitHubError(status: number, errorData: any): string {
    // Handle common GitHub API errors
    switch (status) {
        case 401:
            return 'Authentication failed. Please reconnect your GitHub account in Settings.';
        case 403:
            if (errorData?.message?.includes('organization has enabled OAuth App access restrictions')) {
                return 'This repository belongs to an organization with OAuth restrictions. Please add a Personal Access Token in Settings.';
            }
            return 'Access denied. You may not have permission to view this repository.';
        case 404:
            return 'Pull request not found. Please check the repository and PR number.';
        case 422:
            return 'Invalid request. Please verify the repository owner, name, and PR number.';
        default:
            return 'Failed to fetch pull request data. Please try again.';
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const pull_number = searchParams.get('pull_number');

    if (!owner || !repo || !pull_number) {
        return NextResponse.json(
            { error: 'Please provide repository owner, name, and PR number.' },
            { status: 400 }
        );
    }

    // Get GitHub token from user session or fallback to env
    const githubToken = await getGitHubToken();
    
    if (!githubToken) {
        return NextResponse.json(
            { error: 'GitHub authentication required. Please sign in with GitHub.' },
            { status: 401 }
        );
    }

    try {
        // Fetch PR details and files in parallel
        const [prResponse, filesResponse] = await Promise.all([
            fetch(
                `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}`,
                {
                    headers: {
                        Authorization: `token ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            ),
            fetch(
                `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/files`,
                {
                    headers: {
                        Authorization: `token ${githubToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            ),
        ]);

        if (!prResponse.ok) {
            let errorData;
            try {
                errorData = await prResponse.json();
            } catch {
                errorData = null;
            }
            
            const userMessage = parseGitHubError(prResponse.status, errorData);
            
            // Log the actual error for debugging
            console.error('GitHub API Error:', {
                status: prResponse.status,
                error: errorData,
                repo: `${owner}/${repo}`,
                pr: pull_number
            });
            
            return NextResponse.json(
                { error: userMessage },
                { status: prResponse.status }
            );
        }

        if (!filesResponse.ok) {
            let errorData;
            try {
                errorData = await filesResponse.json();
            } catch {
                errorData = null;
            }
            
            const userMessage = parseGitHubError(filesResponse.status, errorData);
            
            console.error('GitHub API Error (files):', {
                status: filesResponse.status,
                error: errorData,
                repo: `${owner}/${repo}`,
                pr: pull_number
            });
            
            return NextResponse.json(
                { error: userMessage },
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
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
