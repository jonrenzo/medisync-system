"use client"

import {useState, useEffect} from "react"
import {supabase} from "@/lib/supabase"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {AlertCircle, CheckCircle2, Loader2} from "lucide-react"

interface UserProfile {
    id: string
    username: string
    email: string
    role: string
    first_name: string | null
    created_at: string
}

interface LoginHistory {
    log_id: string
    activity_type: string
    timestamp: string
}

export default function MyAccount() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Security settings
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })

    // For demo purposes - in production, you'd get this from auth context
    const currentUserId = "demo-user-id"

    useEffect(() => {
        fetchProfile()
        fetchLoginHistory()
    }, [])

    const fetchProfile = async () => {
        try {
            // In production, get from authenticated user
            const {data, error} = await supabase
                .from("users")
                .select("*")
                .limit(1)
                .single()

            if (error) throw error
            setProfile(data)
        } catch (err) {
            console.error("Error fetching profile:", err)
            setError("Failed to load profile")
        } finally {
            setLoading(false)
        }
    }

    const fetchLoginHistory = async () => {
        try {
            // Fetch recent activity from utilization records as audit trail
            const {data, error} = await supabase
                .from("utilizationrecord")
                .select("dispensedid, dateissued, patientname")
                .order("dateissued", {ascending: false})
                .limit(10)

            if (error) throw error

            const history = data?.map(item => ({
                log_id: item.dispensedid,
                activity_type: `Dispensed medicine to ${item.patientname}`,
                timestamp: item.dateissued
            })) || []

            setLoginHistory(history)
        } catch (err) {
            console.error("Error fetching login history:", err)
        }
    }

    const handleUpdateProfile = async () => {
        if (!profile) return

        setError("")
        setSuccess("")
        setSaving(true)

        try {
            const {error} = await supabase
                .from("users")
                .update({
                    username: profile.username,
                    email: profile.email,
                    first_name: profile.first_name,
                })
                .eq("id", profile.id)

            if (error) throw error

            setSuccess("Profile updated successfully!")
            setTimeout(() => setSuccess(""), 3000)
        } catch (err: any) {
            console.error("Error updating profile:", err)
            setError(err.message || "Failed to update profile")
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async () => {
        setError("")
        setSuccess("")

        // Validation
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setError("Please fill in all password fields")
            return
        }

        if (passwordForm.newPassword.length < 6) {
            setError("New password must be at least 6 characters")
            return
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("New passwords do not match")
            return
        }

        setSaving(true)

        try {
            if (!profile) return
            const {data: user, error: userError} = await supabase
                .from("users")
                .select("password")
                .eq("id", profile.id)
                .single()

            if (userError || !user) {
                setError("User not found")
                return
            }

            if (user.password !== passwordForm.currentPassword) {
                setError("Current password is incorrect")
                return
            }

            const {error: updateError} = await supabase
                .from("users")
                .update({password: passwordForm.newPassword})
                .eq("id", profile.id)

            if (updateError) {
                throw updateError
            }

            setSuccess("Password changed successfully!")
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })

            setTimeout(() => setSuccess(""), 3000)
        } catch (err: any) {
            console.error("Error changing password:", err)
            setError(err.message || "Failed to change password")
        } finally {
            setSaving(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">My Account</h1>
                    <p className="text-muted-foreground mt-1">Manage your personal details and security settings</p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="bg-green-50 text-green-900 border-green-200">
                        <CheckCircle2 className="h-4 w-4"/>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <Tabs defaultValue="profile" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="profile">Profile Settings</TabsTrigger>
                        <TabsTrigger value="security">Security Settings</TabsTrigger>
                        <TabsTrigger value="activity">Account Activity</TabsTrigger>
                    </TabsList>

                    {/* Profile Settings Tab */}
                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Update your personal details and contact information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {profile ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="username">Username</Label>
                                                <Input
                                                    id="username"
                                                    value={profile.username}
                                                    onChange={(e) => setProfile({...profile, username: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="first_name">Full Name</Label>
                                                <Input
                                                    id="first_name"
                                                    value={profile.first_name || ""}
                                                    onChange={(e) => setProfile({
                                                        ...profile,
                                                        first_name: e.target.value
                                                    })}
                                                    placeholder="Enter your full name"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({...profile, email: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <Label>Account Type</Label>
                                            <Input
                                                value={profile.role}
                                                disabled
                                                className="bg-gray-50"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Contact an administrator to change your account type
                                            </p>
                                        </div>

                                        <div>
                                            <Label>Member Since</Label>
                                            <Input
                                                value={formatDate(profile.created_at)}
                                                disabled
                                                className="bg-gray-50"
                                            />
                                        </div>

                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleUpdateProfile}
                                                disabled={saving}
                                                className="bg-primary text-white hover:bg-primary/90"
                                            >
                                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                Update Profile
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No profile data available</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Settings Tab */}
                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription>Manage your login credentials</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-4">Change Password</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="current-password">Current Password</Label>
                                                <Input
                                                    id="current-password"
                                                    type="password"
                                                    value={passwordForm.currentPassword}
                                                    onChange={(e) => setPasswordForm({
                                                        ...passwordForm,
                                                        currentPassword: e.target.value
                                                    })}
                                                    placeholder="Enter current password"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="new-password">New Password</Label>
                                                <Input
                                                    id="new-password"
                                                    type="password"
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm({
                                                        ...passwordForm,
                                                        newPassword: e.target.value
                                                    })}
                                                    placeholder="Enter new password (min 6 characters)"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                                <Input
                                                    id="confirm-password"
                                                    type="password"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({
                                                        ...passwordForm,
                                                        confirmPassword: e.target.value
                                                    })}
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <Button
                                                    onClick={handleChangePassword}
                                                    disabled={saving}
                                                    className="bg-primary text-white hover:bg-primary/90"
                                                >
                                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                    Change Password
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Account Activity Tab */}
                    <TabsContent value="activity">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Log History</CardTitle>
                                <CardDescription>Recent account activities and administrative changes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {loginHistory.length === 0 ? (
                                        <div
                                            className="flex items-center justify-center h-64 text-muted-foreground border rounded-lg">
                                            <p>No activity logs found</p>
                                        </div>
                                    ) : (
                                        loginHistory.map((log) => (
                                            <div
                                                key={log.log_id}
                                                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{log.activity_type}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatDate(log.timestamp)}
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
            </div>
        </div>
    )
}
