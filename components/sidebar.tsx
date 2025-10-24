"use client"
import Link from "next/link"
import {usePathname} from "next/navigation"
import {
    LayoutDashboard,
    Package,
    AlertTriangle,
    FileText,
    TrendingUp,
    Settings,
    User,
    LogOut,
    Building2,
    HandHelping, Pill,
} from "lucide-react"
import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import Clock from "@/components/ui/clock";
import {supabase} from "@/lib/supabase";
import {router} from "next/client";

const navigation = [
    {name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "Asset"},
    {name: "Inventory", href: "/inventory", icon: Pill, section: "Asset"},
    {name: "Stocks", href: "/stocks", icon: Package, section: "Asset"},
    {name: "Report", href: "/reports", icon: FileText, section: "Asset"},
    {name: "Predict Demand", href: "/forecasting", icon: TrendingUp, section: "Asset"},
    {name: "User Management", href: "/role-management", icon: Settings, section: "Settings"},
    {name: "My Account", href: "/my-account", icon: User, section: "Settings"},
]

export function Sidebar() {
    const pathname = usePathname()

    const handleSignOut = async () => {
        try {
            const {error} = await supabase.auth.signOut()
            if (error) {
                console.error("Error signing out:", error.message)
                return
            }

            if (typeof window !== "undefined") {
                localStorage.clear()
                sessionStorage.clear()
            }

            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/")
            })

            router.push("/")
        } catch (err) {
            console.error("Unexpected error during signout:", err)
            if (typeof window !== "undefined") {
                localStorage.clear()
                sessionStorage.clear()
                window.location.href = "/"
            }
        }
    }


    return (
        <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white font-lexend">
            {/* Logo */}
            <div className="flex items-center gap-3 border-b border-gray-200 p-6">
                <img src="/images/medisync-logo.svg" alt="MediSync Logo" className="h-8 w-auto"/>
            </div>

            {/* Facility Info */}
            <div className="border-b border-gray-200 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4"/>
                    <div>
                        <div className="font-medium text-dark">Sumilang Super Health Center</div>
                        <div className="text-xs">Sumilang, Pasig City</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <div className="space-y-6">
                    {/* Asset Section */}
                    <div>
                        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Asset</div>
                        <div className="space-y-1">
                            {navigation
                                .filter((item) => item.section === "Asset")
                                .map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                                isActive ? "bg-primary text-white" : "text-dark hover:bg-secondary",
                                            )}
                                        >
                                            <item.icon className="h-5 w-5"/>
                                            {item.name}
                                        </Link>
                                    )
                                })}
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div>
                        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Settings</div>
                        <div className="space-y-1">
                            {navigation
                                .filter((item) => item.section === "Settings")
                                .map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                                isActive ? "bg-primary text-white" : "text-dark hover:bg-secondary",
                                            )}
                                        >
                                            <item.icon className="h-5 w-5"/>
                                            {item.name}
                                        </Link>
                                    )
                                })}
                        </div>
                    </div>
                </div>
            </nav>
            <div className="border-t border-gray-200 p-4">
                <Clock/>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-200 p-4">
                <Link href="/">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-dark hover:bg-secondary"
                            onClick={handleSignOut}>
                        <LogOut className="h-5 w-5"/>
                        Log out
                    </Button>
                </Link>
            </div>
        </div>
    )
}
