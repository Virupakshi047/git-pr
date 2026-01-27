'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import {
    Loader2,
    Sparkles,
    CheckCircle2,
    ExternalLink,
    Brain,
    Copy,
    Check,
} from 'lucide-react';

interface GenerateButtonProps {
    prData: {
        owner: string;
        repo: string;
        pull_number: string;
        files: Array<{ filename: string; patch?: string }>;
    } | null;
}

type Stage = 'idle' | 'generating' | 'editing' | 'uploading' | 'success';

export function GenerateButton({ prData }: GenerateButtonProps) {
    const [stage, setStage] = useState<Stage>('idle');
    const [aiSummary, setAiSummary] = useState('');
    const [result, setResult] = useState<{ path: string; content: string } | null>(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const generateSummary = async () => {
        if (!prData) return;

        setStage('generating');
        setError('');
        setResult(null);
        setAiSummary('');

        try {
            const res = await fetch('/api/generate-summary', {
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
                setAiSummary(data.content);
                setStage('editing');
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Summary generation failed');
            setStage('idle');
        }
    };

    const createDoc = async (content: string) => {
        if (!prData) return;

        setStage('uploading');
        setError('');

        try {
            const res = await fetch('/api/create-doc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repo: prData.repo,
                    prNumber: prData.pull_number,
                    content: content,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ path: data.path, content });
                setStage('success');
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Document creation failed');
            setStage('editing');
        }
    };

    const handleCancel = () => {
        setStage('idle');
        setAiSummary('');
    };

    const handleCopySummary = async () => {
        if (aiSummary) {
            await navigator.clipboard.writeText(aiSummary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleReset = () => {
        setStage('idle');
        setAiSummary('');
        setResult(null);
        setError('');
    };

    if (!prData) return null;

    return (
        <div className="space-y-6">
            {/* Generate Button - Only show in idle state */}
            {stage === 'idle' && (
                <Button
                    onClick={generateSummary}
                    className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white font-semibold shadow-xl shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]"
                >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate AI Documentation
                </Button>
            )}

            {/* Generating State */}
            {stage === 'generating' && (
                <Card className="bg-card/50 backdrop-blur-xl border-violet-500/30 shadow-xl shadow-violet-500/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
                                <Brain className="h-6 w-6 text-violet-400 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-medium text-foreground">
                                    AI is analyzing the PR...
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Generating technical documentation from the diff
                                </p>
                            </div>
                            <Loader2 className="h-5 w-5 animate-spin text-violet-400 ml-auto" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AI Summary Display (shown in editing and success states) */}
            {(stage === 'editing' || stage === 'success') && aiSummary && (
                <Card className="bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-indigo-500/5 border-violet-500/20 shadow-xl">
                    <CardHeader className="pb-3 border-b border-border/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Brain className="h-4 w-4 text-violet-400" />
                                <span className="text-violet-400">AI Summary</span>
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopySummary}
                                className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            >
                                {copied ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                                <span className="ml-1 text-xs">
                                    {copied ? 'Copied!' : 'Copy'}
                                </span>
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            )}

            {/* Markdown Editor - Show in editing state */}
            {stage === 'editing' && (
                <MarkdownEditor
                    initialContent={aiSummary}
                    onSave={createDoc}
                    onCancel={handleCancel}
                    isSaving={false}
                />
            )}

            {/* Uploading State */}
            {stage === 'uploading' && (
                <Card className="bg-card/50 backdrop-blur-xl border-indigo-500/30 shadow-xl shadow-indigo-500/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-center gap-4">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                            <div className="space-y-1">
                                <p className="text-lg font-medium text-foreground">
                                    Creating Google Doc...
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Uploading your documentation to Google Drive
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Success State */}
            {stage === 'success' && result && (
                <div className="space-y-4">
                    <Alert className="bg-emerald-500/10 border-emerald-500/50">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <AlertTitle className="text-emerald-400">Success!</AlertTitle>
                        <AlertDescription className="flex items-center gap-2">
                            <span>Documentation created successfully.</span>
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
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="w-full border-border/50 hover:bg-muted/50"
                    >
                        Generate New Documentation
                    </Button>
                </div>
            )}
        </div>
    );
}
