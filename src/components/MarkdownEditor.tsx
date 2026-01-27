'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Edit3, Eye, Split, FileText, Sparkles, X, Loader2 } from 'lucide-react';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface MarkdownEditorProps {
    initialContent: string;
    onSave: (content: string) => void;
    onCancel: () => void;
    isSaving?: boolean;
}

type ViewMode = 'edit' | 'preview' | 'live';

export function MarkdownEditor({
    initialContent,
    onSave,
    onCancel,
    isSaving = false,
}: MarkdownEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [viewMode, setViewMode] = useState<ViewMode>('live');

    const getPreviewMode = () => {
        switch (viewMode) {
            case 'edit':
                return 'edit';
            case 'preview':
                return 'preview';
            case 'live':
            default:
                return 'live';
        }
    };

    const viewModes: { mode: ViewMode; icon: typeof Edit3; label: string }[] = [
        { mode: 'edit', icon: Edit3, label: 'Edit' },
        { mode: 'live', icon: Split, label: 'Split' },
        { mode: 'preview', icon: Eye, label: 'Preview' },
    ];

    return (
        <div className="glass-card rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--noir-600)] bg-[var(--noir-800)]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                        <FileText className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="text-sm font-semibold gradient-text-amber">
                            Documentation Editor
                        </h3>
                        <p className="text-xs text-[var(--noir-500)] font-mono">
                            Review and customize before saving
                        </p>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-[var(--noir-700)] rounded-lg p-1">
                    {viewModes.map(({ mode, icon: Icon, label }) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 
                                text-xs font-medium rounded-md
                                transition-all duration-200
                                ${viewMode === mode
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'text-[var(--noir-400)] hover:text-white hover:bg-[var(--noir-600)]'
                                }
                            `}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor */}
            <div data-color-mode="dark" className="min-h-[400px]">
                <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || '')}
                    preview={getPreviewMode()}
                    height={450}
                    visibleDragbar={false}
                    hideToolbar={false}
                    className="!border-0 !bg-transparent !rounded-none"
                    textareaProps={{
                        placeholder: 'Edit your documentation here...',
                        style: {
                            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
                        }
                    }}
                />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-[var(--noir-600)] bg-[var(--noir-850)]">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--noir-500)] font-mono">
                        {content.length.toLocaleString()} characters
                    </span>
                    <span className="text-[var(--noir-600)]">•</span>
                    <span className="text-xs text-[var(--noir-500)] font-mono">
                        {content.split('\n').length} lines
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="
                            h-10 px-4
                            text-[var(--noir-400)] hover:text-white
                            hover:bg-[var(--noir-700)]
                            transition-all
                        "
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>

                    <Button
                        onClick={() => onSave(content)}
                        disabled={isSaving}
                        className="
                            h-10 px-6
                            btn-primary rounded-lg
                            font-semibold
                            disabled:opacity-50
                        "
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Create Google Doc
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
