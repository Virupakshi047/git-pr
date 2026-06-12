'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { PRForm } from '@/components/PRForm';
import { DiffViewer } from '@/components/DiffViewer';
import { GenerateButton } from '@/components/GenerateButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthButton } from '@/components/AuthButton';
import { SetupPrompt } from '@/components/SetupPrompt';
import { HistoryPanel, type HistoryEntry } from '@/components/HistoryPanel';
import { GitPullRequest, FileCode, AlertCircle, Sparkles } from 'lucide-react';
import type { PRData } from '@/lib/types';

export default function Home() {
  const { data: session } = useSession();
  const [prData, setPrData] = useState<PRData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handlePRFetched = (data: PRData) => {
    setPrData(data);
    setError('');
    setStatusMessage(`Loaded ${data.files.length} changed file${data.files.length !== 1 ? 's' : ''}.`);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    setPrData(null);
    setStatusMessage('');
  };

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading);
    if (loading) setStatusMessage('Fetching pull request…');
  };

  const handleLoadHistory = (entry: HistoryEntry) => {
    const match = entry.prKey.match(/^([^/]+)\/([^#]+)#(\d+)$/);
    if (!match) return;
    const [, owner, repo, pull_number] = match;
    setPrData({ files: [], owner, repo, pull_number, prTitle: entry.prTitle, prLink: entry.prLink });
    setError('');
    setStatusMessage(`Loaded history entry for ${entry.prKey}.`);
  };

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">

      {/* Nav */}
      <nav className="max-w-4xl mx-auto mb-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-violet-500/15 border border-violet-500/20">
            <GitPullRequest className="h-4 w-4 text-violet-400" />
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">PR Documenter</span>
        </div>
        <AuthButton />
      </nav>

      <div className="max-w-4xl mx-auto space-y-10">

        {/* Hero */}
        <header className="text-center space-y-5 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/8 text-xs font-medium text-violet-300">
            <Sparkles className="h-3 w-3" />
            AI-Powered Documentation
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-none">
              <span className="text-white">PR </span>
              <span className="gradient-text-violet">Documenter</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--noir-300)] max-w-xl mx-auto font-light">
              Paste a GitHub pull request URL and get a comprehensive technical summary — ready to save to Google Docs.
            </p>
          </div>
        </header>

        {/* History */}
        <section className="animate-fade-in-up stagger-1">
          <HistoryPanel onLoadEntry={handleLoadHistory} />
        </section>

        {/* Main Card */}
        <section className="animate-fade-in-up stagger-2">
          <div className="surface-card rounded-2xl overflow-hidden">
            <div className="p-6 sm:p-8 space-y-6">

              {/* Section label */}
              <div className="section-label">Analyze Pull Request</div>

              {session && <SetupPrompt type="both" />}

              <PRForm
                onPRFetched={handlePRFetched}
                onError={handleError}
                onLoading={handleLoading}
              />

              {/* Status */}
              {statusMessage && !error && (
                <div className="flex items-center gap-2.5 text-sm animate-fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  <span className="text-[var(--noir-300)]">{statusMessage}</span>
                  {isLoading && <span className="terminal-cursor" />}
                </div>
              )}

              {/* Error */}
              {error && (
                <Alert className="bg-rose-500/8 border-rose-500/25 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                  <AlertDescription className="text-rose-300">{error}</AlertDescription>
                </Alert>
              )}

              {/* Generate */}
              {prData && (
                <div className="pt-1 animate-fade-in-up">
                  <GenerateButton prData={prData} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Diff Viewer */}
        {prData && prData.files.length > 0 && (
          <section className="space-y-4 animate-fade-in-up stagger-3">
            <div className="flex items-center gap-3">
              <div className="section-label">
                Changed Files
              </div>
              <span className="ml-auto px-2.5 py-0.5 text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                {prData.files.length} {prData.files.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            <DiffViewer files={prData.files} />
          </section>
        )}

        {/* Footer */}
        <footer className="text-center pb-6 border-t border-[var(--noir-700)] pt-8">
          <p className="text-xs text-[var(--noir-500)]">
            Powered by{' '}
            <span className="gradient-text-violet">OpenRouter AI</span>
            {' '}·{' '}
            <span className="text-[var(--noir-400)]">GitHub API</span>
            {' '}·{' '}
            <span className="text-[var(--noir-400)]">Google Drive</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
