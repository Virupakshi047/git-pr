'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { DriveSettings } from '@/components/DriveSettings';
import {
    Loader2, Sparkles, CheckCircle2, ExternalLink,
    Copy, Check, FileText, Wand2, RefreshCw, History,
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

    useEffect(() => {
        if (!prKey) return;
        setExistingEntry(findHistoryEntry(prKey));
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
                    diffData: prData.files.map((f) => ({ filename: f.filename, patch: f.patch })),
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
                    content,
                    folderId: driveSettings.folderId,
                    documentName: driveSettings.documentName || defaultDocName,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setResult({ path: data.path, content });
                setStage('success');
                const docTitle = driveSettings.documentName || defaultDocName;
                const entry: HistoryEntry = {
                    prKey, prTitle: prData.prTitle, prLink: prData.prLink,
                    docTitle, docLink: data.path, folderPath: driveSettings.folderPath,
                    createdAt: new Date().toISOString(),
                };
                saveHistoryEntry(entry);
                setExistingEntry(entry);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Document creation failed');
            setStage('editing');
        }
    };

    const handleCopySummary = async () => {
        if (aiSummary) {
            await navigator.clipboard.writeText(aiSummary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!prData) return null;

    return (
        <div className="space-y-5">
            {/* Already documented banner */}
            {existingEntry && stage === 'idle' && (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-violet-500/8 border border-violet-500/20 animate-fade-in">
                    <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-violet-500/12">
                        <History className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-violet-300">Previously documented</p>
                        <a
                            href={existingEntry.docLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[var(--noir-300)] hover:text-white transition-colors mt-0.5"
                        >
                            <ExternalLink className="h-3 w-3" />
                            {existingEntry.docTitle}
                        </a>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateSummary}
                        className="shrink-0 h-7 px-2.5 gap-1.5 text-xs text-[var(--noir-400)] hover:text-white hover:bg-[var(--noir-700)]"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Re-generate
                    </Button>
                </div>
            )}

            {(stage === 'idle' || stage === 'editing') && (
                <DriveSettings
                    defaultDocName={defaultDocName}
                    onSettingsChange={handleDriveSettingsChange}
                />
            )}

            {/* Idle — main CTA */}
            {stage === 'idle' && (
                <Button
                    onClick={generateSummary}
                    className="w-full h-12 text-base btn-primary rounded-xl font-semibold group"
                >
                    <Wand2 className="h-4 w-4" />
                    Generate AI Documentation
                    <Sparkles className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                </Button>
            )}

            {/* Generating */}
            {stage === 'generating' && (
                <div className="surface-card rounded-xl p-5 border-glow-violet animate-pulse-glow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-violet-500/12 border border-violet-500/20 shrink-0">
                            <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-white">Analyzing pull request<span className="terminal-cursor" /></p>
                            <p className="text-xs text-[var(--noir-400)] mt-0.5">AI is reading the diff and writing documentation…</p>
                        </div>
                    </div>
                    <div className="mt-4 h-0.5 bg-[var(--noir-700)] rounded-full overflow-hidden">
                        <div className="h-full animate-shimmer rounded-full" />
                    </div>
                </div>
            )}

            {/* AI summary card header */}
            {(stage === 'editing' || stage === 'success') && aiSummary && (
                <div className="surface-card rounded-xl overflow-hidden animate-fade-in-up">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                            <span className="text-xs font-semibold text-[var(--noir-300)] uppercase tracking-wider">AI Summary</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopySummary}
                            className="h-7 px-2.5 text-[var(--noir-400)] hover:text-white hover:bg-[var(--noir-700)]"
                        >
                            {copied
                                ? <><Check className="h-3.5 w-3.5 text-emerald-400" /><span className="ml-1.5 text-xs">Copied</span></>
                                : <><Copy className="h-3.5 w-3.5" /><span className="ml-1.5 text-xs">Copy</span></>
                            }
                        </Button>
                    </div>
                </div>
            )}

            {/* Editor */}
            {stage === 'editing' && (
                <div className="animate-fade-in-up">
                    <MarkdownEditor
                        initialContent={aiSummary}
                        onSave={createDoc}
                        onCancel={() => { setStage('idle'); setAiSummary(''); }}
                        isSaving={false}
                    />
                </div>
            )}

            {/* Uploading */}
            {stage === 'uploading' && (
                <div className="surface-card rounded-xl p-5 border border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                            <FileText className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-white">Creating Google Doc…</p>
                            <p className="text-xs text-[var(--noir-400)] mt-0.5">
                                Saving "{driveSettings.documentName || defaultDocName}" to {driveSettings.folderPath}
                            </p>
                        </div>
                        <Loader2 className="h-5 w-5 animate-spin text-amber-400 shrink-0" />
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <Alert className="bg-rose-500/8 border-rose-500/25 animate-fade-in">
                    <AlertTitle className="text-rose-400 font-semibold text-sm">Error</AlertTitle>
                    <AlertDescription className="text-rose-300/80 text-sm">{error}</AlertDescription>
                </Alert>
            )}

            {/* Success */}
            {stage === 'success' && result && (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="surface-card rounded-xl p-5 border border-emerald-500/20">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-emerald-400">Documentation created</p>
                                <p className="text-xs text-[var(--noir-300)] mt-0.5">
                                    "{driveSettings.documentName || defaultDocName}" saved to {driveSettings.folderPath}
                                </p>
                                <a
                                    href={result.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors mt-2 font-medium"
                                >
                                    Open Google Doc
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => { setStage('idle'); setAiSummary(''); setResult(null); setError(''); }}
                        className="w-full h-10 btn-secondary rounded-xl text-sm font-medium"
                    >
                        <Sparkles className="h-3.5 w-3.5 mr-2" />
                        Generate New Documentation
                    </Button>
                </div>
            )}
        </div>
    );
}
