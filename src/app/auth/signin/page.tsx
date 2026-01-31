'use client'

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Github, Mail } from "lucide-react"

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--noir-950)] via-[var(--noir-900)] to-[var(--noir-950)]">
            <div className="w-full max-w-md p-8">
                {/* Logo/Branding */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-6">
                        <Github className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        PR Documentation
                    </h1>
                    <p className="text-[var(--noir-400)]">
                        Auto-generate documentation from your Pull Requests
                    </p>
                </div>

                {/* Sign In Card */}
                <div className="bg-[var(--noir-850)] border border-[var(--noir-700)] rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-white mb-1">
                            Sign in to continue
                        </h2>
                        <p className="text-sm text-[var(--noir-400)]">
                            Connect your accounts to get started
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* GitHub Sign In */}
                        <Button
                            onClick={() => signIn("github", { callbackUrl: "/" })}
                            className="w-full h-12 bg-[#24292e] hover:bg-[#2f363d] text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
                        >
                            <Github className="w-5 h-5" />
                            Continue with GitHub
                        </Button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[var(--noir-700)]"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-3 bg-[var(--noir-850)] text-[var(--noir-500)]">
                                    then connect
                                </span>
                            </div>
                        </div>

                        {/* Google Sign In */}
                        <Button
                            onClick={() => signIn("google", { callbackUrl: "/" })}
                            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
                        >
                            <Mail className="w-5 h-5 text-red-500" />
                            Connect Google Drive
                        </Button>
                    </div>

                    {/* Info */}
                    <div className="pt-4 border-t border-[var(--noir-700)]">
                        <p className="text-xs text-[var(--noir-500)] text-center">
                            <span className="text-cyan-400">GitHub</span> is used for repository access.{" "}
                            <span className="text-red-400">Google</span> is used for Drive storage.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-[var(--noir-600)] mt-6">
                    By signing in, you agree to our terms of service
                </p>
            </div>
        </div>
    )
}
