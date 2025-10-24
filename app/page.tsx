"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Login() {
    const [identifier, setIdentifier] = useState("") // username or email
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // 🔍 Check session on load
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession()
            if (data.session) router.push("/dashboard")
        }
        checkSession()
    }, [router])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            let email = identifier.trim()

            if (!identifier.includes("@")) {
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("email")
                    .eq("username", identifier)
                    .maybeSingle()

                if (userError || !userData) {
                    setError("Invalid username or password")
                    return
                }

                email = userData.email
            }

            // 🔐 Sign in
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                setError("Invalid email/username or password")
                return
            }

            router.push("/dashboard")
        } catch (err) {
            console.error(err)
            setError("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left side - Login form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex justify-start mb-8">
                        <img
                            src="/images/medisync-logo.svg"
                            alt="MediSync Logo"
                            className="h-10 w-auto"
                        />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-dark">Welcome to MediSync</h1>
                        <p className="text-gray-600 text-lg">Unlock your asset management.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="identifier" className="text-dark font-medium">
                                    Username or Email
                                </Label>
                                <Input
                                    id="identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="h-12 bg-white border-gray-300 rounded-lg"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-dark font-medium">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 bg-white border-gray-300 rounded-lg"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="text-right">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-gray-600 hover:text-dark hover:underline"
                                >
                                    Forgot Password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg"
                                disabled={loading}
                            >
                                {loading ? "Logging in..." : "Log In"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right side - Pattern */}
            <div className="flex-1 bg-white relative overflow-hidden">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: `url('/images/medisync-pattern.svg')`,
                        backgroundSize: "auto",
                        backgroundRepeat: "repeat",
                        opacity: 0.1,
                    }}
                />
            </div>
        </div>
    )
}
