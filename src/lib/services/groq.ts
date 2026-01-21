import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API,
});

export async function generateWithGroq(prompt: string): Promise<string> {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
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
    } catch (error) {
        console.error('Groq API Error:', error);
        throw error;
    }
}
