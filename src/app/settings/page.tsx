'use client'

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    Github, 
    ArrowLeft, 
    CheckCircle2, 
    XCircle, 
    RefreshCw,
    LogOut,
    ExternalLink,
    Key,
    Save,
    Trash2,
    AlertTriangle
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

// Cookie name for PAT
const PAT_COOKIE = "pr-doc-github-pat"

export default function SettingsPage() {
    const { data: session, status } = useSession()
    const [patToken, setPatToken] = useState("")
    const [hasPat, setHasPat] = useState(false)
    const [patSaving, setPatSaving] = useState(false)
    const [patMessage, setPatMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Check if PAT exists on mount
    useEffect(() => {
        const checkPat = async () => {
            try {
                const res = await fetch("/api/auth/pat")
                const data = await res.json()
                setHasPat(data.hasPat)
            } catch {
                // Ignore errors
            }
        }
        checkPat()
    }, [])

    const savePat = async () => {
        if (!patToken.trim()) return
        
        setPatSaving(true)
        setPatMessage(null)
        
        try {
            const res = await fetch("/api/auth/pat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: patToken }),
            })
            
            const data = await res.json()
            
            if (res.ok) {
                setHasPat(true)
                setPatToken("")
                setPatMessage({ type: 'success', text: 'Personal Access Token saved successfully!' })
            } else {
                setPatMessage({ type: 'error', text: data.error || 'Failed to save token' })
            }
        } catch {
            setPatMessage({ type: 'error', text: 'Failed to save token' })
        } finally {
            setPatSaving(false)
        }
    }

    const deletePat = async () => {
        setPatSaving(true)
        try {
            await fetch("/api/auth/pat", { method: "DELETE" })
            setHasPat(false)
            setPatMessage({ type: 'success', text: 'Personal Access Token removed' })
        } catch {
            setPatMessage({ type: 'error', text: 'Failed to remove token' })
        } finally {
            setPatSaving(false)
        }
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--noir-950)] via-[var(--noir-900)] to-[var(--noir-950)]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500" />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--noir-950)] via-[var(--noir-900)] to-[var(--noir-950)]">
                <div className="text-center">
                    <p className="text-[var(--noir-400)] mb-4">Please sign in to access settings</p>
                    <Button onClick={() => signIn()} className="btn-primary">
                        Sign In
                    </Button>
                </div>
            </div>
        )
    }

    const hasGitHub = !!session.accessToken
    const hasGoogle = !!session.googleAccessToken

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--noir-950)] via-[var(--noir-900)] to-[var(--noir-950)]">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="text-[var(--noir-400)] hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Settings</h1>
                        <p className="text-sm text-[var(--noir-400)]">Manage your connected accounts</p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-[var(--noir-850)] border border-[var(--noir-700)] rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
                    <div className="flex items-center gap-4">
                        {session.user?.image ? (
                            <Image
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                width={64}
                                height={64}
                                className="rounded-xl"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                    {session.user?.name?.[0] || "U"}
                                </span>
                            </div>
                        )}
                        <div>
                            <p className="text-lg font-medium text-white">{session.user?.name}</p>
                            <p className="text-sm text-[var(--noir-400)]">{session.user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Connections Card */}
                <div className="bg-[var(--noir-850)] border border-[var(--noir-700)] rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Connected Accounts</h2>
                    <div className="space-y-4">
                        {/* GitHub Connection */}
                        <div className="flex items-center justify-between p-4 bg-[var(--noir-800)] rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-[#24292e]">
                                    <Github className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">GitHub</p>
                                    <p className="text-sm text-[var(--noir-400)]">
                                        {hasGitHub ? 'Access to repositories & PRs' : 'Not connected'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasGitHub ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        <span className="text-sm text-green-500">Connected</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-5 h-5 text-red-500" />
                                        <Button 
                                            onClick={() => signIn("github")}
                                            size="sm"
                                            className="bg-[#24292e] hover:bg-[#2f363d] text-white"
                                        >
                                            Connect
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Google Connection */}
                        <div className="flex items-center justify-between p-4 bg-[var(--noir-800)] rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-white">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-white">Google Drive</p>
                                    <p className="text-sm text-[var(--noir-400)]">
                                        {hasGoogle ? 'Save documentation to Drive' : 'Not connected'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasGoogle ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        <span className="text-sm text-green-500">Connected</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-5 h-5 text-red-500" />
                                        <Button 
                                            onClick={() => signIn("google")}
                                            size="sm"
                                            className="bg-white hover:bg-gray-100 text-gray-800"
                                        >
                                            Connect
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info box */}
                    <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                        <p className="text-sm text-cyan-300">
                            <strong>Note:</strong> Both connections are required for full functionality. 
                            GitHub is used to access your repositories, and Google Drive is used to save generated documentation.
                        </p>
                    </div>
                </div>

                {/* Personal Access Token Card */}
                <div className="bg-[var(--noir-850)] border border-[var(--noir-700)] rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Key className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-semibold text-white">GitHub Personal Access Token</h2>
                    </div>
                    
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-amber-300">
                                <p className="font-medium mb-1">For Organization-Restricted Repositories</p>
                                <p className="text-amber-300/80">
                                    If your organization has OAuth restrictions, you can use a Personal Access Token (PAT) instead.
                                    The PAT will be used as a fallback when OAuth fails.
                                </p>
                            </div>
                        </div>
                    </div>

                    {hasPat ? (
                        <div className="flex items-center justify-between p-4 bg-[var(--noir-800)] rounded-xl">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span className="text-white">Personal Access Token configured</span>
                            </div>
                            <Button
                                onClick={deletePat}
                                disabled={patSaving}
                                size="sm"
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <Input
                                    type="password"
                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                    value={patToken}
                                    onChange={(e) => setPatToken(e.target.value)}
                                    className="flex-1 bg-[var(--noir-800)] border-[var(--noir-700)] text-white placeholder:text-[var(--noir-500)]"
                                />
                                <Button
                                    onClick={savePat}
                                    disabled={patSaving || !patToken.trim()}
                                    className="btn-primary"
                                >
                                    <Save className="w-4 h-4 mr-1" />
                                    Save
                                </Button>
                            </div>
                            <p className="text-xs text-[var(--noir-500)]">
                                Create a token at{" "}
                                <a 
                                    href="https://github.com/settings/tokens/new?scopes=repo" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:underline"
                                >
                                    github.com/settings/tokens
                                </a>
                                {" "}with <code className="text-amber-400">repo</code> scope.
                            </p>
                        </div>
                    )}

                    {patMessage && (
                        <p className={`mt-3 text-sm ${patMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {patMessage.text}
                        </p>
                    )}
                </div>

                {/* Reconnect Options */}
                <div className="bg-[var(--noir-850)] border border-[var(--noir-700)] rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
                    <div className="space-y-3">
                        <Button
                            onClick={() => signIn("github")}
                            variant="outline"
                            className="w-full justify-start gap-3 h-12 border-[var(--noir-700)] text-[var(--noir-300)] hover:text-white hover:bg-[var(--noir-800)]"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reconnect GitHub (refresh permissions)
                        </Button>
                        <Button
                            onClick={() => signIn("google")}
                            variant="outline"
                            className="w-full justify-start gap-3 h-12 border-[var(--noir-700)] text-[var(--noir-300)] hover:text-white hover:bg-[var(--noir-800)]"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reconnect Google Drive (refresh permissions)
                        </Button>
                        <a 
                            href="https://myaccount.google.com/permissions" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 w-full h-12 px-4 rounded-md border border-[var(--noir-700)] text-[var(--noir-300)] hover:text-white hover:bg-[var(--noir-800)] transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Manage Google permissions
                        </a>
                    </div>
                </div>

                {/* Sign Out */}
                <div className="pt-4 border-t border-[var(--noir-700)]">
                    <Button
                        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                        variant="outline"
                        className="w-full justify-center gap-2 h-12 border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/50"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    )
}
