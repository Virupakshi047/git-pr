'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    History,
    ExternalLink,
    Trash2,
    FolderOpen,
    GitPullRequest,
    Clock,
    ChevronDown,
    ChevronUp,
    X,
} from 'lucide-react';

export interface HistoryEntry {
    /** Unique key: owner/repo#pullNumber */
    prKey: string;
    prTitle: string;
    prLink: string;
    docTitle: string;
    docLink: string;
    folderPath: string;
    createdAt: string; // ISO string
}

const STORAGE_KEY = 'pr-documenter-history';

export function loadHistory(): HistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    } catch {
        return [];
    }
}

export function saveHistoryEntry(entry: HistoryEntry): void {
    if (typeof window === 'undefined') return;
    const history = loadHistory();
    // Remove existing entry for the same PR so we don't duplicate
    const filtered = history.filter((h) => h.prKey !== entry.prKey);
    // Prepend latest
    const updated = [entry, ...filtered].slice(0, 50); // cap at 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function findHistoryEntry(prKey: string): HistoryEntry | null {
    const history = loadHistory();
    return history.find((h) => h.prKey === prKey) ?? null;
}

function deleteHistoryEntry(prKey: string): HistoryEntry[] {
    const history = loadHistory();
    const updated = history.filter((h) => h.prKey !== prKey);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}

function formatRelativeTime(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

interface HistoryPanelProps {
    /** Called when user clicks "Load" on a history entry */
    onLoadEntry?: (entry: HistoryEntry) => void;
}

export function HistoryPanel({ onLoadEntry }: HistoryPanelProps) {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        setHistory(loadHistory());
    }, [isExpanded]);

    const handleDelete = (prKey: string) => {
        const updated = deleteHistoryEntry(prKey);
        setHistory(updated);
    };

    if (history.length === 0 && !isExpanded) return null;

    return (
        <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
            {/* Header */}
            <button
                onClick={() => setIsExpanded((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[var(--noir-800)] transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                        <History className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="text-sm font-semibold text-white">History</span>
                    {history.length > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 rounded-full border border-purple-500/20">
                            {history.length}
                        </span>
                    )}
                </div>
                <div className="text-[var(--noir-400)]">
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </div>
            </button>

            {/* Entry List */}
            {isExpanded && (
                <div className="border-t border-[var(--noir-700)]">
                    {history.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                            <Clock className="h-8 w-8 text-[var(--noir-600)] mx-auto mb-2" />
                            <p className="text-sm text-[var(--noir-500)]">No history yet</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[var(--noir-700)/50]">
                            {history.map((entry) => (
                                <li
                                    key={entry.prKey}
                                    className="group flex items-start gap-3 px-5 py-4 hover:bg-[var(--noir-800)/60] transition-colors"
                                >
                                    {/* Icon */}
                                    <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-[var(--noir-700)]">
                                        <GitPullRequest className="h-3.5 w-3.5 text-cyan-400" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <p className="text-sm font-medium text-white truncate" title={entry.prTitle}>
                                            {entry.prTitle}
                                        </p>
                                        <p className="text-[11px] font-mono text-[var(--noir-500)] truncate">
                                            {entry.prKey}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                                            <a
                                                href={entry.docLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                <span className="truncate max-w-[180px]">{entry.docTitle}</span>
                                            </a>
                                            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--noir-500)]">
                                                <FolderOpen className="h-3 w-3" />
                                                <span className="truncate max-w-[120px]">{entry.folderPath}</span>
                                            </span>
                                            <span className="text-[11px] text-[var(--noir-600)]">
                                                {formatRelativeTime(entry.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {onLoadEntry && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onLoadEntry(entry)}
                                                className="h-7 px-2 text-[var(--noir-400)] hover:text-white hover:bg-[var(--noir-600)] text-xs font-mono transition-all"
                                                title="Load this PR"
                                            >
                                                Load
                                            </Button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(entry.prKey)}
                                            className="p-1.5 rounded-lg hover:bg-rose-500/15 text-[var(--noir-500)] hover:text-rose-400 transition-all"
                                            title="Remove from history"
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
