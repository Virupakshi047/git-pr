'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, Eye, Split, FileText, Sparkles } from 'lucide-react';
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

    return (
        <Card className="overflow-hidden bg-card/50 backdrop-blur-xl border-border/50 shadow-2xl">
            <CardHeader className="py-3 px-4 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1.5 rounded-lg bg-violet-500/20">
                            <FileText className="h-4 w-4 text-violet-400" />
                        </div>
                        <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent font-semibold">
                            AI Generated Documentation
                        </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-muted/50 rounded-lg p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('edit')}
                                className={`h-7 px-2.5 text-xs transition-all ${viewMode === 'edit'
                                        ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Edit3 className="h-3 w-3 mr-1" />
                                Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('live')}
                                className={`h-7 px-2.5 text-xs transition-all ${viewMode === 'live'
                                        ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Split className="h-3 w-3 mr-1" />
                                Split
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('preview')}
                                className={`h-7 px-2.5 text-xs transition-all ${viewMode === 'preview'
                                        ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Eye className="h-3 w-3 mr-1" />
                                Preview
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Markdown Editor */}
                <div data-color-mode="dark" className="min-h-[400px]">
                    <MDEditor
                        value={content}
                        onChange={(val) => setContent(val || '')}
                        preview={getPreviewMode()}
                        height={400}
                        visibleDragbar={false}
                        hideToolbar={false}
                        className="!border-0 !bg-transparent"
                        textareaProps={{
                            placeholder: 'Edit your documentation here...',
                        }}
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                        Edit the content above before creating the Google Doc
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={onCancel}
                            disabled={isSaving}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => onSave(content)}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02]"
                        >
                            {isSaving ? (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                                    Creating Doc...
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
            </CardContent>
        </Card>
    );
}
