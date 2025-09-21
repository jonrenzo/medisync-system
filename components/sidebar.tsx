"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Clock from "@/components/ui/clock";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "Asset" },
    { name: "Inventory", href: "/inventory", icon: Package, section: "Asset" },
    { name: "Tracker", href: "/tracker", icon: AlertTriangle, section: "Asset" },
    { name: "Report", href: "/reports", icon: FileText, section: "Asset" },
    { name: "Forecasting", href: "/forecasting", icon: TrendingUp, section: "Asset" },
    { name: "Role Management", href: "/role-management", icon: Settings, section: "Settings" },
    { name: "My Account", href: "/my-account", icon: User, section: "Settings" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200 font-lexend">
            {/* Logo */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
                <img src="/images/medisync-logo.svg" alt="MediSync Logo" className="h-8 w-auto" />
            </div>

            {/* Facility Info */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
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
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Asset</div>
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
                                            <item.icon className="w-5 h-5" />
                                            {item.name}
                                        </Link>
                                    )
                                })}
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Settings</div>
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
                                            <item.icon className="w-5 h-5" />
                                            {item.name}
                                        </Link>
                                    )
                                })}
                        </div>
                    </div>
                </div>
            </nav>
            <div className="p-4 border-t border-gray-200">
                <Clock />
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
                <Link href="/">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-dark hover:bg-secondary">
                        <LogOut className="w-5 h-5" />
                        Log out
                    </Button>
                </Link>
            </div>
        </div>
    )
}
