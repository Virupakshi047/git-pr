import { NextRequest, NextResponse } from 'next/server';
import { generateWithGroq } from '@/lib/services/groq';
import { uploadToGoogle } from '@/lib/services/google';
import { GenerateDocsRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const body: GenerateDocsRequest = await request.json();
        const { owner, repo, prNumber, diffData } = body;

        if (!owner || !repo || !prNumber || !diffData) {
            return NextResponse.json(
                { error: 'Missing required fields: owner, repo, prNumber, diffData' },
                { status: 400 }
            );
        }

        const prompt = `
      You are a technical lead. Analyze the Git diff for PR #${prNumber} in "${owner}/${repo}".
      
      Task: Create a concise, high-impact technical summary (.md).
      Rules: Use bullet points. Be extremely brief and to the point. No fluff.
      
      Structure:
      1. **Goal**: One sentence summary of the PR.
      2. **Key Changes**: Short bullet points of only the important logical/technical changes.
      3. **Files Modified**: List files with a 1-line description of the change in each.
      
      Diff Data:
      ${JSON.stringify(diffData)}
    `;

        const mdContent = await generateWithGroq(prompt);
        const docUrl = await uploadToGoogle(repo, prNumber, mdContent);

        console.log('Generated doc URL:', docUrl);

        return NextResponse.json({
            message: 'Success',
            path: docUrl,
            content: mdContent,
        });
    } catch (error) {
        console.error('AI Generation Error:', error);
        return NextResponse.json(
            { error: `AI Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}
