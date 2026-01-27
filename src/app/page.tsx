'use client';

import { useState } from 'react';
import { PRForm } from '@/components/PRForm';
import { DiffViewer } from '@/components/DiffViewer';
import { GenerateButton } from '@/components/GenerateButton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { GitPullRequest, FileCode, AlertCircle } from 'lucide-react';

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
}

export default function Home() {
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
      setStatusMessage('Connecting to GitHub...');
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
              <GitPullRequest className="h-10 w-10 text-violet-400" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-violet-200 to-purple-200 bg-clip-text text-transparent">
            PR AI Documentation Assistant
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Paste a GitHub PR link to view diffs and generate AI-powered technical documentation
          </p>
        </header>

        {/* Main Card */}
        <Card className="bg-card/30 backdrop-blur-xl border-border/50 shadow-2xl shadow-violet-500/5">
          <CardContent className="p-6 space-y-6">
            {/* PR Form */}
            <PRForm
              onPRFetched={handlePRFetched}
              onError={handleError}
              onLoading={handleLoading}
            />

            {/* Status Message */}
            {statusMessage && !error && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileCode className="h-4 w-4" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            {prData && <GenerateButton prData={prData} />}
          </CardContent>
        </Card>

        {/* Diff Viewer */}
        {prData && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <FileCode className="h-5 w-5 text-primary" />
              <span>Changed Files</span>
              <span className="ml-2 px-2.5 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                {prData.files.length}
              </span>
            </div>
            <DiffViewer files={prData.files} />
          </section>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8 border-t border-border/30">
          <p>Powered by Groq AI & GitHub</p>
        </footer>
      </div>
    </main>
  );
}
