import { NextRequest, NextResponse } from 'next/server';
import { generateWithOpenRouter, RateLimitError } from '@/lib/services/openrouter';
import { generateWithNvidia } from '@/lib/services/nvidia';
import { truncateDiffData } from '@/lib/utils';
import type { GenerateSummaryRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const body: GenerateSummaryRequest = await request.json();
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
            mdContent = await generateWithOpenRouter(prompt);
        } catch (error) {
            if (error instanceof RateLimitError) {
                console.log('OpenRouter rate limit hit, falling back to NVIDIA Kimi K2.5...');
                
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

        console.log(`Generated AI summary using ${usedFallback ? 'NVIDIA Kimi K2.5 (fallback)' : 'OpenRouter (Llama 3.3 70B)'}`);

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
