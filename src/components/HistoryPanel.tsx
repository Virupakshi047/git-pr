'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { History, ExternalLink, GitPullRequest, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';

export interface HistoryEntry {
    prKey: string;
    prTitle: string;
    prLink: string;
    docTitle: string;
    docLink: string;
    folderPath: string;
    createdAt: string;
}

const STORAGE_KEY = 'pr-documenter-history';

export function loadHistory(): HistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    } catch { return []; }
}

export function saveHistoryEntry(entry: HistoryEntry): void {
    if (typeof window === 'undefined') return;
    const history = loadHistory();
    const updated = [entry, ...history.filter((h) => h.prKey !== entry.prKey)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function findHistoryEntry(prKey: string): HistoryEntry | null {
    return loadHistory().find((h) => h.prKey === prKey) ?? null;
}

function deleteHistoryEntry(prKey: string): HistoryEntry[] {
    const updated = loadHistory().filter((h) => h.prKey !== prKey);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}

function formatRelativeTime(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

interface HistoryPanelProps {
    onLoadEntry?: (entry: HistoryEntry) => void;
}

export function HistoryPanel({ onLoadEntry }: HistoryPanelProps) {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => { setHistory(loadHistory()); }, [isExpanded]);

    const handleDelete = (prKey: string) => setHistory(deleteHistoryEntry(prKey));

    if (history.length === 0 && !isExpanded) return null;

    return (
        <div className="surface-card rounded-xl overflow-hidden">
            <button
                onClick={() => setIsExpanded((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--noir-800)] transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-violet-500/10">
                        <History className="h-3.5 w-3.5 text-violet-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">History</span>
                    {history.length > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-violet-500/12 text-violet-400 rounded-full border border-violet-500/20">
                            {history.length}
                        </span>
                    )}
                </div>
                <div className="text-[var(--noir-500)]">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-[rgba(255,255,255,0.06)]">
                    {history.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <Clock className="h-7 w-7 text-[var(--noir-600)] mx-auto mb-2" />
                            <p className="text-sm text-[var(--noir-500)]">No history yet</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[rgba(255,255,255,0.05)]">
                            {history.map((entry) => (
                                <li key={entry.prKey} className="group flex items-start gap-3 px-4 py-3.5 hover:bg-[var(--noir-800)] transition-colors">
                                    <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-[var(--noir-700)]">
                                        <GitPullRequest className="h-3.5 w-3.5 text-violet-400" />
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-1">
                                        <p className="text-sm font-medium text-white truncate" title={entry.prTitle}>
                                            {entry.prTitle}
                                        </p>
                                        <p className="text-[11px] font-mono text-[var(--noir-500)] truncate">{entry.prKey}</p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <a
                                                href={entry.docLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                <span className="truncate max-w-[160px]">{entry.docTitle}</span>
                                            </a>
                                            <span className="text-[11px] text-[var(--noir-600)]">{formatRelativeTime(entry.createdAt)}</span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {onLoadEntry && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onLoadEntry(entry)}
                                                className="h-7 px-2 text-[var(--noir-400)] hover:text-white hover:bg-[var(--noir-600)] text-xs"
                                            >
                                                Load
                                            </Button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(entry.prKey)}
                                            className="p-1.5 rounded-lg hover:bg-rose-500/12 text-[var(--noir-500)] hover:text-rose-400 transition-all"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
