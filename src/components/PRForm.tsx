'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Link2 } from 'lucide-react';
import type { PRData } from '@/lib/types';

interface PRFormProps {
    onPRFetched: (data: PRData) => void;
    onError: (error: string) => void;
    onLoading: (loading: boolean) => void;
}

export function PRForm({ onPRFetched, onError, onLoading }: PRFormProps) {
    const [prLink, setPrLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchPR = async () => {
        const regex = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
        const match = prLink.match(regex);

        if (!match) {
            onError('Invalid URL. Expected format: github.com/owner/repo/pull/123');
            return;
        }

        const [, owner, repo, pull_number] = match;

        setIsLoading(true);
        onLoading(true);
        onError('');

        try {
            const res = await fetch(`/api/pr?owner=${owner}&repo=${repo}&pull_number=${pull_number}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            onPRFetched({ files: data.files, owner, repo, pull_number, prTitle: data.title, prLink: data.html_url });
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Failed to fetch PR');
        } finally {
            setIsLoading(false);
            onLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <label htmlFor="pr-input" className="flex items-center gap-2 text-xs font-medium text-[var(--noir-400)] uppercase tracking-wider">
                <Link2 className="h-3.5 w-3.5" />
                Pull Request URL
            </label>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        id="pr-input"
                        type="text"
                        value={prLink}
                        onChange={(e) => setPrLink(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && prLink.trim() && fetchPR()}
                        placeholder="https://github.com/owner/repo/pull/123"
                        className="
                            h-11 pl-4 pr-4 font-mono text-sm
                            bg-[var(--noir-800)]
                            border border-[rgba(255,255,255,0.08)]
                            text-white placeholder:text-[var(--noir-500)]
                            rounded-xl
                            transition-all duration-200
                            focus-visible:border-violet-500/60
                            focus-visible:ring-2 focus-visible:ring-violet-500/15
                            focus-visible:ring-offset-0
                        "
                    />
                </div>

                <Button
                    onClick={fetchPR}
                    disabled={isLoading || !prLink.trim()}
                    className="h-11 px-5 btn-primary rounded-xl shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <span className="text-sm font-semibold">Fetch</span>
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>

            <p className="text-[11px] text-[var(--noir-500)]">
                Supports any public or private GitHub repository you have access to.
            </p>
        </div>
    );
}
