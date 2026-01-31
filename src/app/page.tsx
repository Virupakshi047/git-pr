'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { PRForm } from '@/components/PRForm';
import { DiffViewer } from '@/components/DiffViewer';
import { GenerateButton } from '@/components/GenerateButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthButton } from '@/components/AuthButton';
import { SetupPrompt } from '@/components/SetupPrompt';
import { GitPullRequest, FileCode, AlertCircle, Zap, Shield, Clock } from 'lucide-react';

interface PRFile {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
}

interface PRData {
  files: PRFile[];
  owner: string;
  repo: string;
  pull_number: string;
  prTitle: string;
  prLink: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [prData, setPrData] = useState<PRData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handlePRFetched = (data: PRData) => {
    setPrData(data);
    setError('');
    setStatusMessage(`Successfully loaded ${data.files.length} changed file(s).`);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    setPrData(null);
    setStatusMessage('');
  };

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setStatusMessage('Establishing connection...');
    }
  };

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Navigation Bar */}
      <nav className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitPullRequest className="h-6 w-6 text-cyan-400" />
          <span className="font-semibold text-white">PR Documenter</span>
        </div>
        <AuthButton />
      </nav>
      
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero Header */}
        <header className="text-center space-y-6 animate-fade-in-up">
          {/* Logo Mark */}
          <div className="inline-flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
              <div className="relative p-4 rounded-2xl glass-card border-glow-cyan">
                <GitPullRequest className="h-12 w-12 text-cyan-400" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="gradient-text-cyan">PR</span>
              <span className="text-white"> Documenter</span>
            </h1>
            <p className="text-xl sm:text-2xl text-[var(--noir-400)] max-w-2xl mx-auto font-light text-balance">
              Transform GitHub Pull Requests into comprehensive
              <span className="text-cyan-400"> AI-powered</span> documentation
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 stagger-2 animate-fade-in">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-[var(--noir-300)]">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-[var(--noir-300)]">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-[var(--noir-300)]">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Real-time Analysis</span>
            </div>
          </div>
        </header>

        {/* Main Action Card */}
        <section className="animate-fade-in-up stagger-3">
          <div className="glass-card rounded-2xl overflow-hidden hover-lift">
            {/* Terminal-style header */}
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="ml-3 text-xs font-mono text-[var(--noir-500)]">
                pr-documenter — ready
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Setup Prompt for missing connections */}
              {session && <SetupPrompt type="both" />}
              
              {/* PR Form */}
              <PRForm
                onPRFetched={handlePRFetched}
                onError={handleError}
                onLoading={handleLoading}
              />

              {/* Status Message */}
              {statusMessage && !error && (
                <div className="flex items-center gap-3 text-sm animate-fade-in">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10">
                    <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <span className="text-[var(--noir-300)] font-mono">{statusMessage}</span>
                  {isLoading && <span className="terminal-cursor text-cyan-400" />}
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <Alert className="bg-rose-500/10 border-rose-500/30 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                  <AlertDescription className="text-rose-300">{error}</AlertDescription>
                </Alert>
              )}

              {/* Generate Button */}
              {prData && (
                <div className="pt-2 animate-fade-in-up">
                  <GenerateButton prData={prData} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Diff Viewer */}
        {prData && (
          <section className="space-y-6 animate-fade-in-up stagger-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <FileCode className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Changed Files</h2>
              <span className="px-3 py-1 text-xs font-mono font-medium bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                {prData.files.length} {prData.files.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            <DiffViewer files={prData.files} />
          </section>
        )}

        {/* Footer */}
        <footer className="text-center pt-12 border-t border-[var(--noir-700)]">
          <p className="text-sm text-[var(--noir-500)] font-mono">
            Powered by <span className="gradient-text-cyan">Groq AI</span> & <span className="text-white">GitHub API</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
