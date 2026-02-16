interface NvidiaMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface NvidiaResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export async function generateWithNvidia(prompt: string): Promise<string> {
    const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
    
    if (!process.env.NVIDIA_API_KEY) {
        throw new Error('NVIDIA_API_KEY not configured');
    }

    const headers = {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
    };

    const payload = {
        model: "moonshotai/kimi-k2.5",
        messages: [
            {
                role: "user" as const,
                content: prompt
            }
        ],
        max_tokens: 16384,
        temperature: 1.00,
        top_p: 1.00,
        stream: false,
    };

    try {
        const response = await fetch(invokeUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`NVIDIA API error: ${response.status} - ${errorText}`);
        }

        const data: NvidiaResponse = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response from NVIDIA API');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('NVIDIA API Error:', error);
        throw error;
    }
}
