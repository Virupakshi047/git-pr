import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API,
});

function estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
}
function truncatePrompt(prompt: string, maxTokens: number = 6000): string {
    const estimatedTokens = estimateTokenCount(prompt);
    
    if (estimatedTokens <= maxTokens) {
        return prompt;
    }
    
    // Calculate how much to keep (leave some buffer)
    const ratio = (maxTokens * 0.9) / estimatedTokens;
    const targetLength = Math.floor(prompt.length * ratio);
    
    return prompt.substring(0, targetLength) + '\n\n[... truncated due to size ...]';
}

export class RateLimitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RateLimitError';
    }
}

export async function generateWithGroq(prompt: string, options?: { maxTokens?: number }): Promise<string> {
    try {
        // Truncate prompt if it's too large
        const truncatedPrompt = truncatePrompt(prompt, options?.maxTokens);
        const estimatedTokens = estimateTokenCount(truncatedPrompt);
        
        console.log(`Groq request - Estimated tokens: ${estimatedTokens}`);
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: truncatedPrompt,
                },
            ],
            model: 'openai/gpt-oss-120b',
            temperature: 1,
            max_completion_tokens: 8192,
            top_p: 1,
            stream: true,
            stop: null,
        });

        let fullContent = '';
        for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || '';
            fullContent += content;
        }

        return fullContent;
    } catch (error: any) {
        console.error('Groq API Error:', error);
        
        // Check if it's a rate limit error
        if (error?.status === 413 || error?.error?.code === 'rate_limit_exceeded') {
            throw new RateLimitError('Request too large for Groq API. Please try with a smaller PR.');
        }
        
        throw error;
    }
}
