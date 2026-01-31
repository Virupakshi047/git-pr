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

    // Close dropdown when clicking outside
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
        return (
            <div className="h-10 w-10 rounded-full bg-[var(--noir-700)] animate-pulse" />
        )
    }

    if (!session) {
        return (
            <Button
                onClick={() => signIn()}
                className="btn-primary h-10 px-4 rounded-xl flex items-center gap-2"
            >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
            </Button>
        )
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-[var(--noir-800)] hover:bg-[var(--noir-700)] transition-colors border border-[var(--noir-700)]"
            >
                {session.user?.image ? (
                    <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={32}
                        height={32}
                        className="rounded-lg"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                    </div>
                )}
                <span className="text-sm font-medium text-white hidden sm:block max-w-[120px] truncate">
                    {session.user?.name}
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--noir-400)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 py-2 bg-[var(--noir-800)] border border-[var(--noir-700)] rounded-xl shadow-xl z-50">
                    {/* User info */}
                    <div className="px-4 py-2 border-b border-[var(--noir-700)]">
                        <p className="text-sm font-medium text-white truncate">
                            {session.user?.name}
                        </p>
                        <p className="text-xs text-[var(--noir-400)] truncate">
                            {session.user?.email}
                        </p>
                    </div>

                    {/* Auth Status */}
                    <div className="px-4 py-2 border-b border-[var(--noir-700)]">
                        <div className="flex items-center gap-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${session.accessToken ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-[var(--noir-400)]">
                                GitHub: {session.accessToken ? 'Connected' : 'Not connected'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-1">
                            <span className={`w-2 h-2 rounded-full ${session.googleAccessToken ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <span className="text-[var(--noir-400)]">
                                Google Drive: {session.googleAccessToken ? 'Connected' : 'Not connected'}
                            </span>
                        </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                        <Link href="/settings" onClick={() => setIsOpen(false)}>
                            <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[var(--noir-700)] flex items-center gap-2">
                                <Settings className="w-4 h-4 text-[var(--noir-400)]" />
                                Settings
                            </button>
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[var(--noir-700)] flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
