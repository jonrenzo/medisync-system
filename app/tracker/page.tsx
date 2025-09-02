"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Package, QrCode, RotateCcw, Trash2, CheckCircle, Mail, History, Search } from "lucide-react"

const alerts = [
    {
        id: 1,
        medicine: "Paracetamol",
        type: "Low Stock",
        batch: "202512029",
        quantity: 5,
        threshold: 50,
        status: "active",
    },
    {
        id: 2,
        medicine: "Amoxicillin",
        type: "Expiry Warning",
        batch: "202512030",
        expiryDate: "2024-01-20",
        status: "active",
    },
    { id: 3, medicine: "Ibuprofen", type: "Out of Stock", batch: "202512031", quantity: 0, status: "critical" },
    {
        id: 4,
        medicine: "Aspirin",
        type: "Overstock",
        batch: "202512032",
        quantity: 500,
        threshold: 100,
        status: "warning",
    },
]

const disposalItems = [
    {
        id: 1,
        medicine: "Expired Paracetamol",
        batch: "202412001",
        quantity: 50,
        reason: "Expired",
        date: "2024-01-10",
        status: "pending",
    },
    {
        id: 2,
        medicine: "Damaged Amoxicillin",
        batch: "202412002",
        quantity: 25,
        reason: "Damaged packaging",
        date: "2024-01-08",
        status: "successful",
    },
    {
        id: 3,
        medicine: "Recalled Ibuprofen",
        batch: "202412003",
        quantity: 100,
        reason: "Manufacturer recall",
        date: "2024-01-05",
        status: "pending",
    },
]

export default function Tracker() {
    const [searchTerm, setSearchTerm] = useState("")

    return (
        <div className="bg-background min-h-screen p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-dark">Tracker</h1>
                <div className="flex gap-2">
                    <Button className="bg-primary text-white hover:bg-primary/90" size="sm">
                        <QrCode className="w-4 h-4 mr-2" />
                        Scan QR/Barcode
                    </Button>
                    <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                        size="sm"
                    >
                        <History className="w-4 h-4 mr-2" />
                        View Batch History
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="alerts" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    <TabsTrigger value="disposal">For Return</TabsTrigger>
                </TabsList>

                <TabsContent value="alerts" className="space-y-6">
                    {/* Search and Filter */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-dark">Stock Alerts & Expiry Warnings</CardTitle>
                            <CardDescription>Monitor low stock, overstock, and expiry alerts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search alerts..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Alert Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <Card className="border-red-200 bg-red-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-red-600">Critical Alerts</p>
                                                <p className="text-2xl font-bold text-red-700">3</p>
                                            </div>
                                            <AlertTriangle className="w-8 h-8 text-red-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-orange-200 bg-orange-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-orange-600">Low Stock</p>
                                                <p className="text-2xl font-bold text-orange-700">8</p>
                                            </div>
                                            <Package className="w-8 h-8 text-orange-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-blue-200 bg-blue-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-primary">In Stock</p>
                                                <p className="text-2xl font-bold text-primary">156</p>
                                            </div>
                                            <CheckCircle className="w-8 h-8 text-primary" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-purple-200 bg-purple-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-purple-600">Overstock</p>
                                                <p className="text-2xl font-bold text-purple-700">12</p>
                                            </div>
                                            <Package className="w-8 h-8 text-purple-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Alerts List */}
                            <div className="space-y-4">
                                {alerts.map((alert) => (
                                    <div key={alert.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <AlertTriangle
                                                className={`w-5 h-5 ${
                                                    alert.status === "critical"
                                                        ? "text-red-500"
                                                        : alert.status === "warning"
                                                            ? "text-orange-500"
                                                            : "text-yellow-500"
                                                }`}
                                            />
                                            <div>
                                                <div className="font-medium">{alert.medicine}</div>
                                                <div className="text-sm text-gray-500">
                                                    {alert.type} • Batch: {alert.batch}
                                                    {alert.quantity !== undefined && ` • Quantity: ${alert.quantity}`}
                                                    {alert.expiryDate && ` • Expires: ${alert.expiryDate}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    alert.status === "critical"
                                                        ? "destructive"
                                                        : alert.status === "warning"
                                                            ? "secondary"
                                                            : "default"
                                                }
                                            >
                                                {alert.type}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                                                size="sm"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Mark as Resolved
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                                                size="sm"
                                            >
                                                <Mail className="w-4 h-4 mr-2" />
                                                Send Reminder
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="disposal" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-dark">Return Tracking</CardTitle>
                            <CardDescription>Track disposed items and returns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-6">
                                <Button className="bg-primary text-white hover:bg-primary/90">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Mark for Return
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Return Item
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {disposalItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                                        <div>
                                            <div className="font-medium">{item.medicine}</div>
                                            <div className="text-sm text-gray-500">
                                                Batch: {item.batch} • Quantity: {item.quantity} • Reason: {item.reason}
                                            </div>
                                            <div className="text-sm text-gray-500">Date: {item.date}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={item.status === "successful" ? "default" : "secondary"}>
                                                {item.status === "successful" ? "Completed" : "Pending"}
                                            </Badge>
                                            {item.status === "pending" && (
                                                <Button
                                                    variant="outline"
                                                    className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                                                    size="sm"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Complete
                                                </Button>
                                            )}
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
