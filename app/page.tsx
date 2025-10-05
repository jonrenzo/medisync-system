"use client"

import React, {useEffect, useState} from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Login() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Check if user is already logged in
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.push('/dashboard')
            }
        }
        checkSession()
    }, [router])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('email')
                .eq('username', username)
                .single()

            if (userError || !userData) {
                setError("Invalid username or password")
                return
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password
            })

            if (error) {
                setError("Invalid username or password")
                return
            }

            // Successful login - redirect to dashboard or home
            router.push("/dashboard")
        } catch (err) {
            setError("An unexpected error occurred")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left side - Login form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo */}
                    <div className="flex justify-start mb-8">
                        <img src="/images/medisync-logo.svg" alt="MediSync Logo" className="h-10 w-auto" />
                    </div>

                    {/* Welcome text */}
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-dark">Welcome to MediSync</h1>
                        <p className="text-gray-600 text-lg">Unlock your asset management.</p>
                    </div>

                    {/* Login form */}
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            {/* Error message */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-dark font-medium">
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
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
                                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-dark hover:underline">
                                    Forgot Password?
                                </Link>
                            </div>
                            <div>
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-primary hover:bg-primary/80 text-white font-medium rounded-lg"
                                    disabled={loading}
                                >
                                    {loading ? "Logging in..." : "Log In"}
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/*
                    Register link
                    <div className="text-center">
                        <span className="text-gray-600">Don&#39;t have an account? </span>
                        <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
                            Register here.
                        </Link>
                    </div>
                    */}
                </div>
            </div>

            {/* Right side - Medical pattern background */}
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
