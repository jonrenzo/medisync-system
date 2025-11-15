// components/ProtectedPage.tsx
"use client"

import {useEffect, useState} from "react"
import {useRouter} from "next/navigation"
import {Card, CardContent} from "@/components/ui/card"
import {ShieldAlert, Loader2} from "lucide-react"
import {checkPageAccess, PageName} from "@/lib/rbac"

interface ProtectedPageProps {
    pageName: PageName
    children: React.ReactNode
}

export default function ProtectedPage({pageName, children}: ProtectedPageProps) {
    const [loading, setLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)
    const [message, setMessage] = useState("")
    const [userRole, setUserRole] = useState("")
    const router = useRouter()

    useEffect(() => {
        const {hasAccess, user, message} = checkPageAccess(pageName)

        if (!user) {
            // Not logged in - redirect to login
            router.push("/login")
            return
        }

        if (!hasAccess) {
            // Logged in but no access - show access denied
            setAccessDenied(true)
            setMessage(message || "Access denied")
            setUserRole(user.role)
        }

        setLoading(false)
    }, [pageName, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        )
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="border-red-200">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div
                                    className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <ShieldAlert className="h-8 w-8 text-red-600"/>
                                </div>
                                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                                <p className="text-muted-foreground max-w-md mb-6">
                                    {message}
                                </p>
                                <div className="text-sm text-muted-foreground">
                                    Your current role: <span className="font-medium">{userRole}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
