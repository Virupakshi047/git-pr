'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCode, Plus, Minus, Copy, Check } from 'lucide-react';

interface DiffFile {
    filename: string;
    additions: number;
    deletions: number;
    patch?: string;
}

interface DiffViewerProps {
    files: DiffFile[];
}

function formatPatch(patch?: string) {
    if (!patch) {
        return (
            <span className="block px-4 py-2 text-muted-foreground italic">
                No textual changes found.
            </span>
        );
    }

    return patch.split('\n').map((line, index) => {
        let className = 'block px-4 py-0.5 font-mono text-sm whitespace-pre-wrap';

        if (line.startsWith('+') && !line.startsWith('+++')) {
            className += ' bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
            className += ' bg-red-500/10 text-red-400 border-l-2 border-red-500';
        } else if (line.startsWith('@@')) {
            className += ' bg-blue-500/10 text-blue-400';
        } else {
            className += ' text-muted-foreground';
        }

        return (
            <span key={index} className={className}>
                {line}
            </span>
        );
    });
}

function DiffCard({ file, index }: { file: DiffFile; index: number }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (file.patch) {
            await navigator.clipboard.writeText(file.patch);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Card
            key={index}
            className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 shadow-xl"
        >
            <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm font-medium text-foreground">
                            {file.filename}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-emerald-400">
                                <Plus className="h-3 w-3" />
                                {file.additions}
                            </span>
                            <span className="flex items-center gap-1 text-red-400">
                                <Minus className="h-3 w-3" />
                                {file.deletions}
                            </span>
                        </div>
                        {file.patch && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopy}
                                className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                                title="Copy diff"
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
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <pre className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    <code>{formatPatch(file.patch)}</code>
                </pre>
            </CardContent>
        </Card>
    );
}

export function DiffViewer({ files }: DiffViewerProps) {
    if (files.length === 0) return null;

    return (
        <div className="space-y-4">
            {files.map((file, index) => (
                <DiffCard key={index} file={file} index={index} />
            ))}
        </div>
    );
}
