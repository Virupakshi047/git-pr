'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, CheckCircle2, ExternalLink } from 'lucide-react';

interface GenerateButtonProps {
    prData: {
        owner: string;
        repo: string;
        pull_number: string;
        files: Array<{ filename: string; patch?: string }>;
    } | null;
}

export function GenerateButton({ prData }: GenerateButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<{ path: string; content: string } | null>(null);
    const [error, setError] = useState('');

    const generateDocs = async () => {
        if (!prData) return;

        setIsGenerating(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch('/api/generate-docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    owner: prData.owner,
                    repo: prData.repo,
                    prNumber: prData.pull_number,
                    diffData: prData.files.map((f) => ({
                        filename: f.filename,
                        patch: f.patch,
                    })),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ path: data.path, content: data.content });
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!prData) return null;

    return (
        <div className="space-y-4">
            <Button
                onClick={generateDocs}
                disabled={isGenerating}
                className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white font-semibold shadow-xl shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        AI is analyzing and writing...
                    </>
                ) : (
                    <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate AI Documentation
                    </>
                )}
            </Button>

            {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {result && (
                <Alert className="bg-emerald-500/10 border-emerald-500/50">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <AlertTitle className="text-emerald-400">Success!</AlertTitle>
                    <AlertDescription className="flex items-center gap-2">
                        <span>Documentation generated successfully.</span>
                        <a
                            href={result.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium underline underline-offset-4"
                        >
                            Open Google Doc
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
