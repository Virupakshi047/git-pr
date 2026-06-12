'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Edit3, Eye, Split, Sparkles, X, Loader2 } from 'lucide-react';
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

export function MarkdownEditor({ initialContent, onSave, onCancel, isSaving = false }: MarkdownEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [viewMode, setViewMode] = useState<ViewMode>('live');

    const viewModes: { mode: ViewMode; icon: typeof Edit3; label: string }[] = [
        { mode: 'edit',    icon: Edit3, label: 'Edit'    },
        { mode: 'live',    icon: Split, label: 'Split'   },
        { mode: 'preview', icon: Eye,   label: 'Preview' },
    ];

    return (
        <div className="surface-card rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[var(--noir-800)]">
                <div className="section-label">Documentation Editor</div>

                {/* View mode */}
                <div className="flex items-center bg-[var(--noir-700)] rounded-lg p-0.5">
                    {viewModes.map(({ mode, icon: Icon, label }) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`
                                flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all
                                ${viewMode === mode
                                    ? 'bg-violet-500/20 text-violet-300'
                                    : 'text-[var(--noir-400)] hover:text-white hover:bg-[var(--noir-600)]'
                                }
                            `}
                        >
                            <Icon className="h-3 w-3" />
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
                    preview={viewMode}
                    height={450}
                    visibleDragbar={false}
                    hideToolbar={false}
                    className="!border-0 !bg-transparent !rounded-none"
                    textareaProps={{
                        placeholder: 'Edit your documentation here…',
                        style: { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }
                    }}
                />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(255,255,255,0.06)] bg-[var(--noir-850)]">
                <span className="text-[11px] text-[var(--noir-500)] font-mono">
                    {content.length.toLocaleString()} chars · {content.split('\n').length} lines
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="h-9 px-3 text-[var(--noir-400)] hover:text-white hover:bg-[var(--noir-700)] text-sm"
                    >
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSave(content)}
                        disabled={isSaving}
                        className="h-9 px-4 btn-primary rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                        {isSaving
                            ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</>
                            : <><Sparkles className="mr-2 h-3.5 w-3.5" />Save to Google Docs</>
                        }
                    </Button>
                </div>
            </div>
        </div>
    );
}
