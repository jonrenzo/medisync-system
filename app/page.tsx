"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

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
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-dark font-medium">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 bg-white border-gray-300 rounded-lg"
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
                            />
                        </div>
                        <div className="text-right">
                            <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-dark">
                                Forgot Password?
                            </Link>
                        </div>
                        <Link href="/dashboard">
                            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg">
                                Log In
                            </Button>
                        </Link>
                    </div>

                    {/* Register link */}
                    <div className="text-center">
                        <span className="text-gray-600">Don&#39;t have an account? </span>
                        <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
                            Register here.
                        </Link>
                    </div>
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
