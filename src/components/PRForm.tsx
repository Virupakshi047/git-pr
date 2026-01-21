'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, GitPullRequest } from 'lucide-react';

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
    }) => void;
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
            const files = await res.json();

            if (files.error) throw new Error(files.error);

            onPRFetched({ files, owner, repo, pull_number });
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Failed to fetch PR');
        } finally {
            setIsLoading(false);
            onLoading(false);
        }
    };

    return (
        <div className="flex gap-3">
            <div className="relative flex-1">
                <GitPullRequest className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    value={prLink}
                    onChange={(e) => setPrLink(e.target.value)}
                    placeholder="Paste GitHub PR Link (e.g. https://github.com/facebook/react/pull/31427)"
                    className="pl-10 h-12 text-base bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && fetchPR()}
                />
            </div>
            <Button
                onClick={fetchPR}
                disabled={isLoading || !prLink.trim()}
                className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </>
                ) : (
                    'View Diff'
                )}
            </Button>
        </div>
    );
}
