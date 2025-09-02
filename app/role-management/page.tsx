"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, UserPlus, Edit, Trash2, Search, Shield, Activity, Eye } from "lucide-react"

const users = [
    {
        id: 1,
        name: "Dr. Maria Santos",
        email: "maria.santos@medisync.com",
        role: "Admin",
        status: "active",
        lastLogin: "2024-01-15 09:30",
    },
    {
        id: 2,
        name: "John Dela Cruz",
        email: "john.delacruz@medisync.com",
        role: "Inventory Staff",
        status: "active",
        lastLogin: "2024-01-15 08:45",
    },
    {
        id: 3,
        name: "Sarah Johnson",
        email: "sarah.johnson@medisync.com",
        role: "Viewer",
        status: "active",
        lastLogin: "2024-01-14 16:20",
    },
    {
        id: 4,
        name: "Michael Brown",
        email: "michael.brown@medisync.com",
        role: "Inventory Staff",
        status: "inactive",
        lastLogin: "2024-01-10 14:15",
    },
    {
        id: 5,
        name: "Lisa Garcia",
        email: "lisa.garcia@medisync.com",
        role: "Admin",
        status: "active",
        lastLogin: "2024-01-15 07:30",
    },
]

const activityLog = [
    {
        id: 1,
        user: "Dr. Maria Santos",
        action: "Added new medicine",
        item: "Paracetamol 500mg",
        timestamp: "2024-01-15 10:30",
        type: "create",
    },
    {
        id: 2,
        user: "John Dela Cruz",
        action: "Updated stock quantity",
        item: "Amoxicillin 250mg",
        timestamp: "2024-01-15 09:15",
        type: "update",
    },
    {
        id: 3,
        user: "Sarah Johnson",
        action: "Generated monthly report",
        item: "January 2024 Report",
        timestamp: "2024-01-15 08:45",
        type: "report",
    },
    {
        id: 4,
        user: "Dr. Maria Santos",
        action: "Deleted expired item",
        item: "Ibuprofen 400mg",
        timestamp: "2024-01-14 16:20",
        type: "delete",
    },
    {
        id: 5,
        user: "John Dela Cruz",
        action: "Marked item for disposal",
        item: "Aspirin 100mg",
        timestamp: "2024-01-14 14:30",
        type: "disposal",
    },
]

const rolePermissions = {
    Admin: ["Create", "Read", "Update", "Delete", "Manage Users", "Generate Reports", "System Settings"],
    "Inventory Staff": ["Create", "Read", "Update", "Generate Reports"],
    Viewer: ["Read", "Generate Reports"],
}

export default function RoleManagement() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedRole, setSelectedRole] = useState("all")

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = selectedRole === "all" || user.role === selectedRole
        return matchesSearch && matchesRole
    })

    return (
        <div className="bg-background min-h-screen p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-dark">Role Management</h1>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add New User
                </Button>
            </div>

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="roles">Role Permissions</TabsTrigger>
                    <TabsTrigger value="activity">Activity Log</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-6">
                    {/* User Management */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-dark">User Management</CardTitle>
                            <CardDescription>Manage user accounts and assign roles</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Search and Filter */}
                            <div className="flex gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Inventory Staff">Inventory Staff</SelectItem>
                                        <SelectItem value="Viewer">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* User Statistics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Total Users</p>
                                                <p className="text-2xl font-bold">{users.length}</p>
                                            </div>
                                            <Users className="w-8 h-8 text-primary" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Active Users</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {users.filter((u) => u.status === "active").length}
                                                </p>
                                            </div>
                                            <Shield className="w-8 h-8 text-green-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Admins</p>
                                                <p className="text-2xl font-bold text-purple-600">
                                                    {users.filter((u) => u.role === "Admin").length}
                                                </p>
                                            </div>
                                            <Shield className="w-8 h-8 text-purple-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Staff</p>
                                                <p className="text-2xl font-bold text-orange-600">
                                                    {users.filter((u) => u.role === "Inventory Staff").length}
                                                </p>
                                            </div>
                                            <Users className="w-8 h-8 text-orange-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Users List */}
                            <div className="space-y-4">
                                {filteredUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                        </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-dark">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                                <div className="text-sm text-gray-500">Last login: {user.lastLogin}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant={user.role === "Admin" ? "default" : "secondary"}>{user.role}</Badge>
                                            <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roles" className="space-y-6">
                    {/* Role Permissions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {Object.entries(rolePermissions).map(([role, permissions]) => (
                            <Card key={role}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-dark">
                                        <Shield className="w-5 h-5" />
                                        {role}
                                    </CardTitle>
                                    <CardDescription>{users.filter((u) => u.role === role).length} users with this role</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {permissions.map((permission, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-sm">{permission}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Permissions
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-6">
                    {/* Activity Log */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                            <CardDescription>Track user actions and system changes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activityLog.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    activity.type === "create"
                                                        ? "bg-green-100"
                                                        : activity.type === "update"
                                                            ? "bg-blue-100"
                                                            : activity.type === "delete"
                                                                ? "bg-red-100"
                                                                : activity.type === "disposal"
                                                                    ? "bg-orange-100"
                                                                    : "bg-gray-100"
                                                }`}
                                            >
                                                <Activity
                                                    className={`w-5 h-5 ${
                                                        activity.type === "create"
                                                            ? "text-green-600"
                                                            : activity.type === "update"
                                                                ? "text-blue-600"
                                                                : activity.type === "delete"
                                                                    ? "text-red-600"
                                                                    : activity.type === "disposal"
                                                                        ? "text-orange-600"
                                                                        : "text-gray-600"
                                                    }`}
                                                />
                                            </div>
                                            <div>
                                                <div className="font-medium">{activity.user}</div>
                                                <div className="text-sm text-gray-500">
                                                    {activity.action}: {activity.item}
                                                </div>
                                                <div className="text-sm text-gray-400">{activity.timestamp}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    activity.type === "create"
                                                        ? "default"
                                                        : activity.type === "update"
                                                            ? "secondary"
                                                            : activity.type === "delete"
                                                                ? "destructive"
                                                                : "outline"
                                                }
                                            >
                                                {activity.type}
                                            </Badge>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
