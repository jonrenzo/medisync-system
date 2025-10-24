"use client"

import {useState, useEffect} from "react"
import {supabase} from "@/lib/supabase"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {AlertCircle, Edit, Trash2, UserPlus, Loader2} from "lucide-react"
import {Alert, AlertDescription} from "@/components/ui/alert"

interface User {
    id: string
    username: string
    email: string
    role: string
    first_name: string | null
    created_at: string
}

interface AuditLog {
    log_id: string
    user_id: string
    activity_type: string
    timestamp: string
    username?: string
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [isEditUserOpen, setIsEditUserOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [newUser, setNewUser] = useState({
        username: "",
        email: "",
        password: "",
        role: "Health Center Workers",
        first_name: "",
    })

    const roles = [
        "Health Center Workers",
        "Inventory Staff 1",
        "Inventory Staff 2",
        "Admin"
    ]

    useEffect(() => {
        fetchUsers()
        fetchAuditLogs()
    }, [])

    const fetchUsers = async () => {
        try {
            const {data, error} = await supabase
                .from("users")
                .select("*")
                .order("created_at", {ascending: false})

            if (error) throw error
            setUsers(data || [])
        } catch (err) {
            console.error("Error fetching users:", err)
            setError("Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    const fetchAuditLogs = async () => {
        try {
            const {data: logs, error: logsError} = await supabase
                .from("utilizationrecord")
                .select(`
                    dispensedid,
                    patientname,
                    itemcode,
                    issuedquantity,
                    dateissued
                `)
                .order("dateissued", {ascending: false})
                .limit(50)

            if (logsError) throw logsError

            // Get item descriptions for the itemcodes
            const itemCodes = logs?.map(log => log.itemcode) || []
            const {data: itemsData} = await supabase
                .from("items")
                .select("itemcode, itemdescription")
                .in("itemcode", itemCodes)

            // Transform dispensed records into audit logs format
            const auditData = logs?.map(log => {
                const item = itemsData?.find(i => i.itemcode === log.itemcode)
                const medicineName = item?.itemdescription || log.itemcode
                const quantity = log.issuedquantity || 0

                return {
                    log_id: log.dispensedid,
                    user_id: "system",
                    activity_type: `Dispensed ${quantity}x ${medicineName} to ${log.patientname}`,
                    timestamp: log.dateissued,
                    username: "System"
                }
            }) || []

            setAuditLogs(auditData)
        } catch (err) {
            console.error("Error fetching audit logs:", err)
        }
    }

    const handleAddUser = async () => {
        setError("")
        setSuccess("")

        // Validation
        if (!newUser.username || !newUser.email || !newUser.password) {
            setError("Please fill in all required fields")
            return
        }

        if (newUser.password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        try {
            // Insert into users table
            const {data, error} = await supabase
                .from("users")
                .insert([{
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    first_name: newUser.first_name || null,
                }])
                .select()

            if (error) throw error

            setSuccess("User added successfully!")
            setIsAddUserOpen(false)
            setNewUser({
                username: "",
                email: "",
                password: "",
                role: "Health Center Workers",
                first_name: "",
            })
            fetchUsers()

            setTimeout(() => setSuccess(""), 3000)
        } catch (err: any) {
            console.error("Error adding user:", err)
            setError(err.message || "Failed to add user")
        }
    }

    const handleEditUser = async () => {
        if (!selectedUser) return

        setError("")
        setSuccess("")

        try {
            const {error} = await supabase
                .from("users")
                .update({
                    username: selectedUser.username,
                    email: selectedUser.email,
                    role: selectedUser.role,
                    first_name: selectedUser.first_name,
                })
                .eq("id", selectedUser.id)

            if (error) throw error

            setSuccess("User updated successfully!")
            setIsEditUserOpen(false)
            setSelectedUser(null)
            fetchUsers()

            setTimeout(() => setSuccess(""), 3000)
        } catch (err: any) {
            console.error("Error updating user:", err)
            setError(err.message || "Failed to update user")
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return

        setError("")
        setSuccess("")

        try {
            const {error} = await supabase
                .from("users")
                .delete()
                .eq("id", userId)

            if (error) throw error

            setSuccess("User deleted successfully!")
            fetchUsers()

            setTimeout(() => setSuccess(""), 3000)
        } catch (err: any) {
            console.error("Error deleting user:", err)
            setError(err.message || "Failed to delete user")
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <p className="text-muted-foreground mt-1">Manage system users and access levels</p>
                    </div>

                    <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary text-white hover:bg-primary/90">
                                <UserPlus className="mr-2 h-4 w-4"/>
                                Add New User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>Create a new user account with role assignment</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="username">Username *</Label>
                                    <Input
                                        id="username"
                                        value={newUser.username}
                                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                                        placeholder="Enter username"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="first_name">Full Name</Label>
                                    <Input
                                        id="first_name"
                                        value={newUser.first_name}
                                        onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                        placeholder="Enter email"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                        placeholder="Minimum 6 characters"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="role">Role *</Label>
                                    <Select value={newUser.role} onValueChange={(value) => setNewUser({
                                        ...newUser,
                                        role: value
                                    })}>
                                        <SelectTrigger>
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map(role => (
                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleAddUser} className="bg-primary text-white">
                                        Add User
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="bg-green-50 text-green-900 border-green-200">
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <Tabs defaultValue="users" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="users">Users and Access</TabsTrigger>
                        <TabsTrigger value="activity">Activity Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Accounts</CardTitle>
                                <CardDescription>View and manage all system users</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                    </div>
                                ) : users.length === 0 ? (
                                    <div
                                        className="flex items-center justify-center h-64 text-muted-foreground border rounded-lg">
                                        <p>No users found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {users.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                                        <span
                                                            className="text-primary font-semibold">{user.username.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold">
                                                            {user.first_name || user.username}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">{user.email}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Role: {user.role} • Joined {formatDate(user.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUser(user)
                                                            setIsEditUserOpen(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4"/>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity">
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Logs</CardTitle>
                                <CardDescription>Recent system activities and changes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {auditLogs.length === 0 ? (
                                        <div
                                            className="flex items-center justify-center h-64 text-muted-foreground border rounded-lg">
                                            <p>No activity logs found</p>
                                        </div>
                                    ) : (
                                        auditLogs.map((log) => (
                                            <div
                                                key={log.log_id}
                                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">{log.activity_type}</p>
                                                    <p className="text-xs text-gray-500">
                                                        by {log.username} • {formatDate(log.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Edit User Dialog */}
                <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>Update user information and role</DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="edit-username">Username</Label>
                                    <Input
                                        id="edit-username"
                                        value={selectedUser.username}
                                        onChange={(e) => setSelectedUser({
                                            ...selectedUser,
                                            username: e.target.value
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-first_name">Full Name</Label>
                                    <Input
                                        id="edit-first_name"
                                        value={selectedUser.first_name || ""}
                                        onChange={(e) => setSelectedUser({
                                            ...selectedUser,
                                            first_name: e.target.value
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        value={selectedUser.email}
                                        onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-role">Role</Label>
                                    <Select value={selectedUser.role} onValueChange={(value) => setSelectedUser({
                                        ...selectedUser,
                                        role: value
                                    })}>
                                        <SelectTrigger>
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map(role => (
                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleEditUser} className="bg-primary text-white">
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
