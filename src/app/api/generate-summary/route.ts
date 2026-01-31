import { NextRequest, NextResponse } from 'next/server';
import { generateWithGroq } from '@/lib/services/groq';
import { GenerateDocsRequest } from '@/lib/types';

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
      ${JSON.stringify(diffData)}
    `;

        const mdContent = await generateWithGroq(prompt);

        console.log('Generated AI summary');

        return NextResponse.json({
            message: 'Success',
            content: mdContent,
        });
    } catch (error) {
        console.error('AI Summary Generation Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate documentation. Please try again.' },
            { status: 500 }
        );
    }
}
