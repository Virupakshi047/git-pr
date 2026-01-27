'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import {
    Loader2,
    Sparkles,
    CheckCircle2,
    ExternalLink,
    Brain,
    Copy,
    Check,
    FileText,
    Wand2,
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
            {/* Generate Button - Idle State */}
            {stage === 'idle' && (
                <Button
                    onClick={generateSummary}
                    className="
                        w-full h-16 text-lg
                        btn-primary rounded-xl
                        font-semibold tracking-wide
                        group
                    "
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-black/20 group-hover:bg-black/30 transition-colors">
                            <Wand2 className="h-5 w-5" />
                        </div>
                        <span>Generate AI Documentation</span>
                        <Sparkles className="h-5 w-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                </Button>
            )}

            {/* Generating State */}
            {stage === 'generating' && (
                <div className="glass-card rounded-xl p-6 border-glow-cyan animate-pulse-glow">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-full" />
                            <div className="relative p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                <Brain className="h-6 w-6 text-cyan-400 animate-pulse" />
                            </div>
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-lg font-semibold text-white flex items-center gap-2">
                                AI Analysis in Progress
                                <span className="terminal-cursor" />
                            </p>
                            <p className="text-sm text-[var(--noir-400)] font-mono">
                                Parsing diff and generating technical documentation...
                            </p>
                        </div>
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                    </div>

                    {/* Progress bar animation */}
                    <div className="mt-4 h-1 bg-[var(--noir-700)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 animate-shimmer" />
                    </div>
                </div>
            )}

            {/* AI Summary Card (editing and success states) */}
            {(stage === 'editing' || stage === 'success') && aiSummary && (
                <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
                    <div className="flex items-center justify-between p-4 border-b border-[var(--noir-600)]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/10">
                                <Brain className="h-4 w-4 text-cyan-400" />
                            </div>
                            <span className="text-sm font-medium gradient-text-cyan">
                                AI-Generated Summary
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopySummary}
                            className="h-8 px-3 text-[var(--noir-400)] hover:text-white hover:bg-[var(--noir-700)] transition-all"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                            <span className="ml-2 text-xs font-mono">
                                {copied ? 'Copied!' : 'Copy'}
                            </span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Markdown Editor - Editing State */}
            {stage === 'editing' && (
                <div className="animate-fade-in-up stagger-1">
                    <MarkdownEditor
                        initialContent={aiSummary}
                        onSave={createDoc}
                        onCancel={handleCancel}
                        isSaving={false}
                    />
                </div>
            )}

            {/* Uploading State */}
            {stage === 'uploading' && (
                <div className="glass-card rounded-xl p-6 border border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-500/20 blur-lg rounded-full" />
                            <div className="relative p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <FileText className="h-6 w-6 text-amber-400" />
                            </div>
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-lg font-semibold text-white">
                                Creating Google Doc...
                            </p>
                            <p className="text-sm text-[var(--noir-400)] font-mono">
                                Uploading documentation to Google Drive
                            </p>
                        </div>
                        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                    </div>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <Alert className="bg-rose-500/10 border-rose-500/30 animate-fade-in">
                    <AlertTitle className="text-rose-400 font-semibold">Error</AlertTitle>
                    <AlertDescription className="text-rose-300/80">{error}</AlertDescription>
                </Alert>
            )}

            {/* Success State */}
            {stage === 'success' && result && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="glass-card rounded-xl p-6 border border-emerald-500/20">
                        <div className="flex items-start gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full" />
                                <div className="relative p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <p className="text-lg font-semibold text-emerald-400">
                                    Documentation Created Successfully!
                                </p>
                                <p className="text-sm text-[var(--noir-300)]">
                                    Your technical documentation has been generated and saved to Google Drive.
                                </p>
                                <a
                                    href={result.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                                        inline-flex items-center gap-2 mt-2
                                        text-cyan-400 hover:text-cyan-300
                                        font-medium underline underline-offset-4
                                        transition-colors
                                    "
                                >
                                    <span>Open Google Doc</span>
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="
                            w-full h-12
                            btn-secondary rounded-xl
                            font-medium
                        "
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate New Documentation
                    </Button>
                </div>
            )}
        </div>
    );
}
