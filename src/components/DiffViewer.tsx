'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Copy, Check, ChevronDown, ChevronRight, File, Files } from 'lucide-react';
import type { PRFile } from '@/lib/types';

interface DiffViewerProps {
    files: PRFile[];
}

const FILE_ICONS: Record<string, string> = {
    ts: '󰛦', tsx: '⚛', js: '󰌞', jsx: '⚛', py: '󰌠',
    rs: '󱘗', go: '󰟓', css: '󰌜', html: '󰌝', json: '󰘦', md: '󰍔',
};

function getExt(filename: string) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
}

function formatPatch(patch?: string) {
    if (!patch) {
        return (
            <div className="px-4 py-8 text-center">
                <File className="h-7 w-7 text-[var(--noir-600)] mx-auto mb-2" />
                <span className="text-[var(--noir-500)] text-xs italic">Binary file or no textual changes</span>
            </div>
        );
    }

    return patch.split('\n').map((line, i) => {
        let cls = 'block px-4 py-0.5 font-mono text-xs whitespace-pre-wrap';
        if (line.startsWith('+') && !line.startsWith('+++'))      cls += ' diff-addition';
        else if (line.startsWith('-') && !line.startsWith('---')) cls += ' diff-deletion';
        else if (line.startsWith('@@'))                            cls += ' diff-meta';
        else                                                       cls += ' diff-context';
        return (
            <span key={i} className={cls}>
                <span className="inline-block w-8 text-right opacity-30 select-none mr-3 text-[10px]">{i + 1}</span>
                {line}
            </span>
        );
    });
}

function DiffCard({ file, index }: { file: PRFile; index: number }) {
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const ext = getExt(file.filename);

    const total = file.additions + file.deletions;
    const addPct = total > 0 ? (file.additions / total) * 100 : 50;

    const handleCopy = async () => {
        if (file.patch) {
            await navigator.clipboard.writeText(file.patch);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div
            className="surface-card rounded-xl overflow-hidden hover-lift"
            style={{ animationDelay: `${index * 0.07}s` }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between py-2.5 px-4 bg-[var(--noir-800)] border-b border-[rgba(255,255,255,0.06)] cursor-pointer hover:bg-[var(--noir-700)] transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <button className="p-0.5 hover:bg-[var(--noir-600)] rounded transition-colors shrink-0">
                        {isExpanded
                            ? <ChevronDown className="h-3.5 w-3.5 text-[var(--noir-400)]" />
                            : <ChevronRight className="h-3.5 w-3.5 text-[var(--noir-400)]" />
                        }
                    </button>
                    <span className="font-mono text-xs font-medium text-white truncate">{file.filename}</span>
                    {ext && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-[var(--noir-700)] text-[var(--noir-400)] rounded shrink-0">
                            {ext}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="flex items-center gap-2.5 text-[11px] font-mono">
                        <span className="flex items-center gap-1 text-emerald-400">
                            <Plus className="h-3 w-3" />{file.additions}
                        </span>
                        <span className="flex items-center gap-1 text-rose-400">
                            <Minus className="h-3 w-3" />{file.deletions}
                        </span>
                    </div>

                    {/* Mini bar */}
                    <div className="w-16 h-1 bg-[var(--noir-600)] rounded-full overflow-hidden hidden sm:block">
                        <div
                            className="h-full"
                            style={{ background: `linear-gradient(to right, #34d399 ${addPct}%, #f87171 ${addPct}%)` }}
                        />
                    </div>

                    {file.patch && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                            className="h-6 px-2 text-[var(--noir-500)] hover:text-white hover:bg-[var(--noir-600)]"
                        >
                            {copied
                                ? <Check className="h-3 w-3 text-emerald-400" />
                                : <Copy className="h-3 w-3" />
                            }
                        </Button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="relative">
                    <pre className="overflow-x-auto max-h-[360px] bg-[var(--noir-900)]">
                        <code className="block py-2">{formatPatch(file.patch)}</code>
                    </pre>
                    <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[var(--noir-900)] to-transparent pointer-events-none" />
                </div>
            )}
        </div>
    );
}

export function DiffViewer({ files }: DiffViewerProps) {
    const [allCopied, setAllCopied] = useState(false);

    if (files.length === 0) return null;

    const totalAdd = files.reduce((s, f) => s + f.additions, 0);
    const totalDel = files.reduce((s, f) => s + f.deletions, 0);

    const handleCopyAll = async () => {
        const all = files
            .filter((f) => f.patch)
            .map((f) => `### ${f.filename}\n\`\`\`diff\n${f.patch}\n\`\`\``)
            .join('\n\n');
        await navigator.clipboard.writeText(all);
        setAllCopied(true);
        setTimeout(() => setAllCopied(false), 2000);
    };

    return (
        <div className="space-y-3">
            {/* Stats bar */}
            <div className="flex items-center justify-between px-4 py-2.5 surface-card rounded-xl">
                <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <Plus className="h-3.5 w-3.5" />{totalAdd}
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-400">
                        <Minus className="h-3.5 w-3.5" />{totalDel}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAll}
                    className="h-7 px-2.5 text-[var(--noir-400)] hover:text-white hover:bg-[var(--noir-700)] text-xs"
                >
                    {allCopied
                        ? <><Check className="h-3.5 w-3.5 text-emerald-400 mr-1" />Copied</>
                        : <><Files className="h-3.5 w-3.5 mr-1" />Copy All</>
                    }
                </Button>
            </div>

            <div className="space-y-2.5">
                {files.map((file, i) => (
                    <DiffCard key={file.filename} file={file} index={i} />
                ))}
            </div>
        </div>
    );
}
