'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileCode, Plus, Minus, Copy, Check, ChevronDown, ChevronRight, File } from 'lucide-react';

interface DiffFile {
    filename: string;
    additions: number;
    deletions: number;
    patch?: string;
}

interface DiffViewerProps {
    files: DiffFile[];
}

function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
}

function getFileIcon(extension: string): string {
    const iconMap: Record<string, string> = {
        ts: '🔷',
        tsx: '⚛️',
        js: '🟨',
        jsx: '⚛️',
        py: '🐍',
        rs: '🦀',
        go: '🐹',
        css: '🎨',
        html: '📄',
        json: '📋',
        md: '📝',
    };
    return iconMap[extension] || '📄';
}

function formatPatch(patch?: string) {
    if (!patch) {
        return (
            <div className="px-4 py-8 text-center">
                <File className="h-8 w-8 text-[var(--noir-500)] mx-auto mb-2" />
                <span className="text-[var(--noir-500)] italic text-sm">
                    Binary file or no textual changes
                </span>
            </div>
        );
    }

    return patch.split('\n').map((line, index) => {
        let className = 'block px-4 py-0.5 font-mono text-sm whitespace-pre-wrap transition-colors';
        let linePrefix = ' ';

        if (line.startsWith('+') && !line.startsWith('+++')) {
            className += ' diff-addition';
            linePrefix = '+';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
            className += ' diff-deletion';
            linePrefix = '-';
        } else if (line.startsWith('@@')) {
            className += ' diff-meta font-medium';
            linePrefix = '@';
        } else {
            className += ' diff-context hover:bg-[var(--noir-800)]';
        }

        return (
            <span key={index} className={className}>
                <span className="inline-block w-5 text-center opacity-50 select-none mr-2">
                    {index + 1}
                </span>
                {line}
            </span>
        );
    });
}

function DiffCard({ file, index }: { file: DiffFile; index: number }) {
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const extension = getFileExtension(file.filename);
    const fileIcon = getFileIcon(extension);

    const handleCopy = async () => {
        if (file.patch) {
            await navigator.clipboard.writeText(file.patch);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const totalChanges = file.additions + file.deletions;
    const additionPercentage = totalChanges > 0 ? (file.additions / totalChanges) * 100 : 50;

    return (
        <div
            className={`
                glass-card rounded-xl overflow-hidden
                hover-lift
                animate-fade-in-up
            `}
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            {/* Header */}
            <div
                className="
                    flex items-center justify-between
                    py-3 px-4
                    bg-[var(--noir-800)] 
                    border-b border-[var(--noir-600)]
                    cursor-pointer
                    hover:bg-[var(--noir-700)] transition-colors
                "
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <button className="p-1 hover:bg-[var(--noir-600)] rounded transition-colors">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-[var(--noir-400)]" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-[var(--noir-400)]" />
                        )}
                    </button>

                    <span className="text-lg" role="img" aria-label="file type">
                        {fileIcon}
                    </span>

                    <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm font-medium text-white truncate">
                            {file.filename}
                        </span>
                        {extension && (
                            <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-[var(--noir-600)] text-[var(--noir-300)] rounded">
                                {extension}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Change Stats */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <Plus className="h-3.5 w-3.5" />
                            <span>{file.additions}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-rose-400">
                            <Minus className="h-3.5 w-3.5" />
                            <span>{file.deletions}</span>
                        </span>
                    </div>

                    {/* Mini change bar */}
                    <div className="w-20 h-1.5 bg-[var(--noir-600)] rounded-full overflow-hidden hidden sm:block">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-rose-500"
                            style={{
                                background: `linear-gradient(to right, var(--accent-emerald) ${additionPercentage}%, var(--accent-rose) ${additionPercentage}%)`
                            }}
                        />
                    </div>

                    {/* Copy Button */}
                    {file.patch && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCopy();
                            }}
                            className="
                                h-7 px-2 
                                text-[var(--noir-400)] hover:text-white 
                                hover:bg-[var(--noir-600)] 
                                transition-all
                            "
                            title="Copy diff"
                        >
                            {copied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                                <Copy className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1.5 text-xs font-mono hidden sm:inline">
                                {copied ? 'Copied' : 'Copy'}
                            </span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Code Content */}
            {isExpanded && (
                <div className="relative">
                    <pre className="overflow-x-auto max-h-[400px] bg-[var(--noir-900)] scrollbar-thin">
                        <code className="block py-2">
                            {formatPatch(file.patch)}
                        </code>
                    </pre>

                    {/* Fade out gradient at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--noir-900)] to-transparent pointer-events-none" />
                </div>
            )}
        </div>
    );
}

export function DiffViewer({ files }: DiffViewerProps) {
    if (files.length === 0) return null;

    // Calculate total stats
    const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
    const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

    return (
        <div className="space-y-4">
            {/* Summary Stats Bar */}
            <div className="flex items-center justify-between px-4 py-3 glass rounded-xl">
                <div className="flex items-center gap-3">
                    <FileCode className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-[var(--noir-300)] font-mono">
                        {files.length} {files.length === 1 ? 'file' : 'files'} changed
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <Plus className="h-4 w-4" />
                        {totalAdditions} additions
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-400">
                        <Minus className="h-4 w-4" />
                        {totalDeletions} deletions
                    </span>
                </div>
            </div>

            {/* File List */}
            <div className="space-y-3">
                {files.map((file, index) => (
                    <DiffCard key={file.filename} file={file} index={index} />
                ))}
            </div>
        </div>
    );
}
