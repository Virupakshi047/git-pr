'use client'

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    const errorMessages: Record<string, string> = {
        Configuration: "There is a problem with the server configuration.",
        AccessDenied: "You do not have permission to sign in.",
        Verification: "The verification token has expired or has already been used.",
        Default: "An error occurred during authentication.",
    }

    const errorMessage = errorMessages[error || ""] || errorMessages.Default

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--noir-950)] via-[var(--noir-900)] to-[var(--noir-950)]">
            <div className="w-full max-w-md p-8">
                <div className="bg-[var(--noir-850)] border border-red-500/20 rounded-2xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        Authentication Error
                    </h1>
                    <p className="text-[var(--noir-400)] mb-6">
                        {errorMessage}
                    </p>

                    {error && (
                        <p className="text-xs text-[var(--noir-500)] mb-6 font-mono">
                            Error code: {error}
                        </p>
                    )}

                    <Link href="/auth/signin">
                        <Button className="btn-primary">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Sign In
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function ErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--noir-950)] via-[var(--noir-900)] to-[var(--noir-950)]">
                <div className="text-white">Loading...</div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    )
}
