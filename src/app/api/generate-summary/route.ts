import { NextRequest, NextResponse } from 'next/server';
import { generateWithGroq, RateLimitError } from '@/lib/services/groq';
import { generateWithNvidia } from '@/lib/services/nvidia';
import { GenerateDocsRequest } from '@/lib/types';

function truncateDiffData(diffData: any, maxFiles: number = 20, maxLinesPerFile: number = 100): any {
    if (!Array.isArray(diffData)) {
        return diffData;
    }

    return diffData.slice(0, maxFiles).map((file: any) => {
        if (file.patch) {
            const lines = file.patch.split('\n');
            if (lines.length > maxLinesPerFile) {
                const truncatedPatch = lines.slice(0, maxLinesPerFile).join('\n');
                return {
                    ...file,
                    patch: truncatedPatch + `\n... [${lines.length - maxLinesPerFile} more lines]`,
                };
            }
        }
        return file;
    });
}

export async function POST(request: NextRequest) {
    try {
        const body: GenerateDocsRequest = await request.json();
        const { owner, repo, prNumber, diffData } = body;

        if (!owner || !repo || !prNumber || !diffData) {
            return NextResponse.json(
                { error: 'Missing required information. Please fetch a valid PR first.' },
                { status: 400 }
            );
        }

        // Truncate diff data to reduce token usage
        const truncatedDiffData = truncateDiffData(diffData);

        const prompt = `
      You are a technical lead. Analyze the Git diff for PR #${prNumber} in "${owner}/${repo}".
      
      Task: Create a concise, high-impact technical summary in Markdown format.
      Rules: Use bullet points. Be extremely brief and to the point. No fluff.
      
      Structure:
      # PR #${prNumber} - Technical Documentation
      
      ## Goal
      One sentence summary of the PR.
      
      ## Key Changes
      Short bullet points of only the important logical/technical changes.
      
      ## Files Modified
      List files with a 1-line description of the change in each.
      
      ## Impact
      Brief note on the impact of these changes.
      
      Diff Data:
      ${JSON.stringify(truncatedDiffData)}
    `;

        let mdContent: string;
        let usedFallback = false;

        try {
            // Try Groq first
            mdContent = await generateWithGroq(prompt);
        } catch (error) {
            if (error instanceof RateLimitError) {
                console.log('Groq rate limit hit, falling back to NVIDIA Kimi K2.5...');
                
                try {
                    // Fallback to NVIDIA Kimi K2.5
                    mdContent = await generateWithNvidia(prompt);
                    usedFallback = true;
                } catch (nvidiaError) {
                    console.error('NVIDIA fallback failed:', nvidiaError);
                    return NextResponse.json(
                        { 
                            error: 'The PR is too large to process. Please try with a smaller PR or contact support.',
                            details: 'Both Groq and NVIDIA APIs failed to process this request.'
                        },
                        { status: 413 }
                    );
                }
            } else {
                throw error;
            }
        }

        console.log(`Generated AI summary${usedFallback ? ' (using Gemini fallback)' : ''}`);

        return NextResponse.json({
            message: 'Success',
            content: mdContent,
            usedFallback,
        });
    } catch (error) {
        console.error('AI Summary Generation Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate documentation. Please try again.' },
            { status: 500 }
        );
    }
}
