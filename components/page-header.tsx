"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Settings, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"

const notifications = [
    {
        id: 1,
        type: "inventory",
        message: "Paracetamol stock updated by John Dela Cruz",
        time: "2 minutes ago",
        read: false,
    },
    {
        id: 2,
        type: "expiry",
        message: "5 medicines expiring in 7 days",
        time: "1 hour ago",
        read: false,
    },
    {
        id: 3,
        type: "user",
        message: "New user Sarah Johnson added to system",
        time: "3 hours ago",
        read: true,
    },
    {
        id: 4,
        type: "disposal",
        message: "Expired Amoxicillin marked for disposal",
        time: "5 hours ago",
        read: true,
    },
]

interface PageHeaderProps {
    title: string
    showActions?: boolean
}

export function PageHeader({ title, showActions = true }: PageHeaderProps) {
    const [unreadCount] = useState(notifications.filter((n) => !n.read).length)

    return (
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-dark">{title}</h1>
            {showActions && (
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="relative bg-transparent">
                                <Bell className="w-4 h-4" />
                                {unreadCount > 0 && (
                                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <div className="space-y-2">
                                <h4 className="font-medium text-dark">Notifications</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-2 rounded-lg text-sm ${
                                                !notification.read ? "bg-blue-50 border-l-2 border-primary" : "bg-gray-50"
                                            }`}
                                        >
                                            <div className="font-medium text-dark">{notification.message}</div>
                                            <div className="text-xs text-gray-500">{notification.time}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Settings/Account Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Account
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href="/my-account" className="flex items-center">
                                    <User className="w-4 h-4 mr-2" />
                                    My Account
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/role-management" className="flex items-center">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    )
}
