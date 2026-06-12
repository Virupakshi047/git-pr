'use client'

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, Settings, User, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"

export function AuthButton() {
    const { data: session, status } = useSession()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    if (status === "loading") {
        return <div className="h-8 w-8 rounded-full bg-[var(--noir-700)] animate-pulse" />
    }

    if (!session) {
        return (
            <Button
                onClick={() => signIn()}
                className="btn-primary h-9 px-4 rounded-xl text-sm font-medium flex items-center gap-2"
            >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
            </Button>
        )
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-[var(--noir-800)] hover:bg-[var(--noir-700)] transition-colors border border-[rgba(255,255,255,0.08)]"
            >
                {session.user?.image ? (
                    <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={26}
                        height={26}
                        className="rounded-lg"
                    />
                ) : (
                    <div className="w-[26px] h-[26px] rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-white" />
                    </div>
                )}
                <span className="text-sm font-medium text-white hidden sm:block max-w-[100px] truncate">
                    {session.user?.name}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--noir-400)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-52 py-1.5 bg-[var(--noir-800)] border border-[rgba(255,255,255,0.09)] rounded-xl shadow-2xl z-50 animate-fade-in">
                    {/* User info */}
                    <div className="px-3 py-2.5 border-b border-[rgba(255,255,255,0.07)]">
                        <p className="text-sm font-semibold text-white truncate">{session.user?.name}</p>
                        <p className="text-xs text-[var(--noir-400)] truncate mt-0.5">{session.user?.email}</p>
                    </div>

                    {/* Connection status */}
                    <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.07)] space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${session.accessToken ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            <span className="text-[var(--noir-400)]">GitHub {session.accessToken ? 'connected' : 'not connected'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${session.googleAccessToken ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            <span className="text-[var(--noir-400)]">Google Drive {session.googleAccessToken ? 'connected' : 'not connected'}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="py-1">
                        <Link href="/settings" onClick={() => setIsOpen(false)}>
                            <button className="w-full px-3 py-2 text-left text-sm text-[var(--noir-200)] hover:bg-[var(--noir-700)] hover:text-white flex items-center gap-2.5 transition-colors">
                                <Settings className="w-3.5 h-3.5 text-[var(--noir-400)]" />
                                Settings
                            </button>
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-[var(--noir-700)] flex items-center gap-2.5 transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
