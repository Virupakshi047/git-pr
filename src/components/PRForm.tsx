'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, GitPullRequest, ArrowRight, Search } from 'lucide-react';

interface PRFormProps {
    onPRFetched: (data: {
        files: Array<{
            filename: string;
            additions: number;
            deletions: number;
            patch?: string;
        }>;
        owner: string;
        repo: string;
        pull_number: string;
        prTitle: string;
        prLink: string;
    }) => void;
    onError: (error: string) => void;
    onLoading: (loading: boolean) => void;
}

export function PRForm({ onPRFetched, onError, onLoading }: PRFormProps) {
    const [prLink, setPrLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const fetchPR = async () => {
        const regex = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
        const match = prLink.match(regex);

        if (!match) {
            onError('Invalid URL format. Please use a valid GitHub PR link.');
            return;
        }

        const [, owner, repo, pull_number] = match;

        setIsLoading(true);
        onLoading(true);
        onError('');

        try {
            const res = await fetch(
                `/api/pr?owner=${owner}&repo=${repo}&pull_number=${pull_number}`
            );
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            onPRFetched({
                files: data.files,
                owner,
                repo,
                pull_number,
                prTitle: data.title,
                prLink: data.html_url,
            });
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Failed to fetch PR');
        } finally {
            setIsLoading(false);
            onLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Label */}
            <label htmlFor="pr-input" className="flex items-center gap-2 text-sm font-medium text-[var(--noir-300)]">
                <Search className="h-4 w-4 text-cyan-400" />
                Enter GitHub Pull Request URL
            </label>

            {/* Input Group */}
            <div className={`
                flex flex-col sm:flex-row gap-3 p-1.5 rounded-xl 
                transition-all duration-300
                ${isFocused
                    ? 'bg-[var(--noir-800)] ring-2 ring-cyan-500/30'
                    : 'bg-[var(--noir-850)]'
                }
            `}>
                <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <GitPullRequest
                            className={`h-5 w-5 transition-colors duration-300 ${isFocused ? 'text-cyan-400' : 'text-[var(--noir-500)]'
                                }`}
                        />
                    </div>
                    <Input
                        id="pr-input"
                        type="text"
                        value={prLink}
                        onChange={(e) => setPrLink(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="https://github.com/owner/repo/pull/123"
                        className="
                            pl-12 h-14 text-base font-mono
                            bg-transparent border-0
                            text-white placeholder:text-[var(--noir-500)]
                            focus:ring-0 focus:outline-none
                            focus-visible:ring-0 focus-visible:outline-none
                        "
                        onKeyDown={(e) => e.key === 'Enter' && fetchPR()}
                    />
                </div>

                <Button
                    onClick={fetchPR}
                    disabled={isLoading || !prLink.trim()}
                    className="
                        h-14 px-8 sm:px-6
                        btn-primary rounded-lg
                        text-base font-semibold tracking-wide
                        disabled:opacity-40 disabled:cursor-not-allowed
                        disabled:hover:transform-none
                    "
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            <span className="hidden sm:inline">Analyzing...</span>
                            <span className="sm:hidden">...</span>
                        </>
                    ) : (
                        <>
                            <span>Analyze</span>
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    )}
                </Button>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-[var(--noir-500)] font-mono">
                <span className="text-cyan-400/60">tip:</span> paste any public GitHub PR URL to get started
            </p>
        </div>
    );
}
