'use client'

import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Github, AlertTriangle, ArrowRight } from "lucide-react"

interface SetupPromptProps {
    type: 'github' | 'google' | 'both'
}

export function SetupPrompt({ type }: SetupPromptProps) {
    const { data: session } = useSession()

    const needsGitHub = type === 'github' || type === 'both'
    const needsGoogle  = type === 'google'  || type === 'both'
    const hasGitHub    = !!session?.accessToken
    const hasGoogle    = !!session?.googleAccessToken

    const missing = (needsGitHub && !hasGitHub) || (needsGoogle && !hasGoogle)
    if (!missing) return null

    return (
        <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-amber-500/6 border border-amber-500/20">
            <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-amber-500/12">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 space-y-3">
                <div>
                    <p className="text-sm font-semibold text-white">Complete your setup</p>
                    <p className="text-xs text-[var(--noir-400)] mt-0.5">Connect your accounts to enable all features</p>
                </div>
                <div className="space-y-2">
                    {needsGitHub && !hasGitHub && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-[var(--noir-300)]">
                                <Github className="w-4 h-4" />
                                <span>GitHub — access repositories &amp; PRs</span>
                            </div>
                            <Button
                                onClick={() => signIn("github")}
                                size="sm"
                                className="h-7 px-3 bg-[#24292e] hover:bg-[#2f363d] text-white text-xs gap-1"
                            >
                                Connect
                                <ArrowRight className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                    {needsGoogle && !hasGoogle && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-[var(--noir-300)]">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span>Google Drive — save documentation</span>
                            </div>
                            <Button
                                onClick={() => signIn("google")}
                                size="sm"
                                className="h-7 px-3 bg-white hover:bg-gray-100 text-gray-800 text-xs gap-1"
                            >
                                Connect
                                <ArrowRight className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
