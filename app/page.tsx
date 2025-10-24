"use client"

import React, {useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import Link from "next/link"
import {useRouter} from "next/navigation"
import {supabase} from "@/lib/supabase"

export default function Login() {
    const [identifier, setIdentifier] = useState("") // username or email
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // 🔍 Check if already logged in (you can store session in localStorage)
    useEffect(() => {
        const user = localStorage.getItem("user")
        if (user) router.push("/dashboard")
    }, [router])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            // 🔎 Find user by username OR email
            const {data: user, error: userError} = await supabase
                .from("users")
                .select("*")
                .or(`username.eq.${identifier},email.eq.${identifier}`)
                .maybeSingle()

            if (userError || !user) {
                setError("Invalid username")
                return
            }

            // 🔐 Compare passwords
            if (user.password !== password) {
                setError("Invalid password")
                return
            }

            // ✅ Store session locally (you can enhance with tokens)
            localStorage.setItem("user", JSON.stringify(user))

            // Redirect to dashboard
            router.push("/dashboard")
        } catch (err) {
            console.error(err)
            setError("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Left side - Login form */}
            <div className="flex flex-1 items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="mb-8 flex justify-start">
                        <img
                            src="/images/medisync-logo.svg"
                            alt="MediSync Logo"
                            className="h-10 w-auto"
                        />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-dark">Welcome to MediSync</h1>
                        <p className="text-lg text-gray-600">Unlock your asset management.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="identifier" className="font-medium text-dark">
                                    Username or Email
                                </Label>
                                <Input
                                    id="identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="h-12 rounded-lg border-gray-300 bg-white"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="font-medium text-dark">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 rounded-lg border-gray-300 bg-white"
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
                                className="h-12 w-full rounded-lg font-medium text-white bg-primary hover:bg-primary/80"
                                disabled={loading}
                            >
                                {loading ? "Logging in..." : "Log In"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right side - Pattern */}
            <div className="relative flex-1 overflow-hidden bg-white">
                <div
                    className="h-full w-full"
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
