'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { DriveSettings } from '@/components/DriveSettings';
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
    RefreshCw,
    History,
} from 'lucide-react';
import { saveHistoryEntry, findHistoryEntry, type HistoryEntry } from '@/components/HistoryPanel';
import type { PRData } from '@/lib/types';

interface GenerateButtonProps {
    prData: PRData | null;
}

type Stage = 'idle' | 'generating' | 'editing' | 'uploading' | 'success';

interface DriveSettingsData {
    folderId: string | null;
    folderPath: string;
    documentName: string;
}

export function GenerateButton({ prData }: GenerateButtonProps) {
    const [stage, setStage] = useState<Stage>('idle');
    const [aiSummary, setAiSummary] = useState('');
    const [result, setResult] = useState<{ path: string; content: string } | null>(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [existingEntry, setExistingEntry] = useState<HistoryEntry | null>(null);
    const [driveSettings, setDriveSettings] = useState<DriveSettingsData>({
        folderId: null,
        folderPath: 'Auto (PR-Docs-{date})',
        documentName: prData ? `${prData.repo}-PR${prData.pull_number}` : '',
    });

    const defaultDocName = prData ? `${prData.repo}-PR${prData.pull_number}` : '';
    const prKey = prData ? `${prData.owner}/${prData.repo}#${prData.pull_number}` : '';

    // On mount / prData change: check if already documented
    useEffect(() => {
        if (!prKey) return;
        const found = findHistoryEntry(prKey);
        setExistingEntry(found);
        // Reset generation state when prData changes
        setStage('idle');
        setAiSummary('');
        setResult(null);
        setError('');
    }, [prKey]);

    const handleDriveSettingsChange = useCallback((settings: DriveSettingsData) => {
        setDriveSettings(settings);
    }, []);

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
                    prTitle: prData.prTitle,
                    prLink: prData.prLink,
                    content: content,
                    folderId: driveSettings.folderId,
                    documentName: driveSettings.documentName || defaultDocName,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ path: data.path, content });
                setStage('success');
                // Save to history
                const docTitle = driveSettings.documentName || defaultDocName;
                saveHistoryEntry({
                    prKey,
                    prTitle: prData.prTitle,
                    prLink: prData.prLink,
                    docTitle,
                    docLink: data.path,
                    folderPath: driveSettings.folderPath,
                    createdAt: new Date().toISOString(),
                });
                setExistingEntry({
                    prKey,
                    prTitle: prData.prTitle,
                    prLink: prData.prLink,
                    docTitle,
                    docLink: data.path,
                    folderPath: driveSettings.folderPath,
                    createdAt: new Date().toISOString(),
                });
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
            {/* Existing Doc Banner - shown when PR was already documented */}
            {existingEntry && stage === 'idle' && (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 animate-fade-in">
                    <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-purple-500/15">
                        <History className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-purple-300">Already documented</p>
                        <p className="text-xs text-[var(--noir-400)] font-mono">
                            This PR was previously saved to&nbsp;
                            <span className="text-[var(--noir-300)]">{existingEntry.folderPath}</span>
                        </p>
                        <a
                            href={existingEntry.docLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium mt-0.5"
                        >
                            <ExternalLink className="h-3 w-3" />
                            {existingEntry.docTitle}
                        </a>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateSummary}
                        className="shrink-0 h-8 px-3 gap-1.5 text-xs font-mono text-[var(--noir-400)] hover:text-white hover:bg-[var(--noir-700)] transition-all"
                        title="Re-analyze this PR"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Re-analyze
                    </Button>
                </div>
            )}
            {(stage === 'idle' || stage === 'editing') && (
                <DriveSettings
                    defaultDocName={defaultDocName}
                    onSettingsChange={handleDriveSettingsChange}
                />
            )}

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
                                Uploading "{driveSettings.documentName || defaultDocName}" to {driveSettings.folderPath}
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
                                    "{driveSettings.documentName || defaultDocName}" saved to {driveSettings.folderPath}
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
