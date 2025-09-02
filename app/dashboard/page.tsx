"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Package, TrendingUp, Calendar, RefreshCw, Eye, BarChart3, Archive } from "lucide-react"
import {Sidebar} from "@/components/sidebar";
import type React from "react";
import Link from "next/link";

const lowStockMedicines = [
    { name: "Paracetamol", stock: 5, threshold: 50, status: "critical" },
    { name: "Amoxicillin", stock: 12, threshold: 30, status: "low" },
    { name: "Ibuprofen", stock: 8, threshold: 25, status: "critical" },
    { name: "Aspirin", stock: 15, threshold: 40, status: "low" },
    { name: "Cetirizine", stock: 3, threshold: 20, status: "critical" },
]

const upcomingExpiries = [
    { name: "Paracetamol", batch: "202512029", expiryDate: "2024-01-15", daysLeft: 5 },
    { name: "Amoxicillin", batch: "202512030", expiryDate: "2024-01-20", daysLeft: 10 },
    { name: "Ibuprofen", batch: "202512031", expiryDate: "2024-01-25", daysLeft: 15 },
]

export default function Dashboard() {
    return (
        <div className="p-6 space-y-6 bg-background min-h-screen font-lexend">

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Dashboard
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-dark">Total Medicines</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-dark">1,234</div>
                        <p className="text-xs text-muted-foreground">+2.5% from last month</p>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-dark">Low Stock Items</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-dark text-orange-500">23</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-dark">Expiring Soon</CardTitle>
                        <Calendar className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-dark text-red-500">8</div>
                        <p className="text-xs text-muted-foreground">Within 30 days</p>
                    </CardContent>
                </Card>

{/*                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-dark">Monthly Value</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-dark">₱45,231</div>
                        <p className="text-xs text-muted-foreground">+12% from last month</p>
                    </CardContent>
                </Card>*/}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Medicines */}
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-dark">
                            Top 5 Low Stock Medicines
                            <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View All
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {lowStockMedicines.map((medicine, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-medium">{medicine.name}</div>
                                        <div className="text-sm text-gray-500">{medicine.stock} units remaining</div>
                                    </div>
                                    <Badge variant={medicine.status === "critical" ? "destructive" : "secondary"}>
                                        {medicine.status === "critical" ? "Critical" : "Low Stock"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Expiries */}
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-dark">
                            Upcoming Expiries (30 days)
                            <Button variant="outline" size="sm">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                View All Alerts
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {upcomingExpiries.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                                >
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-sm text-gray-500">Batch: {item.batch}</div>
                                        <div className="text-sm text-red-600">Expires: {item.expiryDate}</div>
                                    </div>
                                    <Badge variant="destructive">{item.daysLeft} days</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle className="text-dark">Quick Actions</CardTitle>
                    <CardDescription>Frequently used actions and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href='/forecasting'>
                            <Button
                                variant="outline"
                                className="w-full h-20 flex-col gap-2 bg-white border-gray-200 text-dark hover:bg-primary hover:text-white hover:border-primary"
                            >
                                <BarChart3 className="w-6 h-6" />
                                View Forecast Chart
                            </Button>
                        </Link>
                        <Link href='/inventory'>
                            <Button
                                variant="outline"
                                className="w-full h-20 flex-col gap-2 bg-white border-gray-200 text-dark hover:bg-primary hover:text-white hover:border-primary"
                            >
                                <Archive className="w-6 h-6" />
                                Go to Full Inventory
                            </Button>
                        </Link>
                        <Link href='/tracker'>
                            <Button
                                variant="outline"
                                className="w-full h-20 flex-col gap-2 bg-white border-gray-200 text-dark hover:bg-primary hover:text-white hover:border-primary"
                            >
                                <AlertTriangle className="w-6 h-6" />
                                View Expiry Alerts
                            </Button>
                        </Link>
                        <Link href='/dashboard'>
                            <Button
                                variant="outline"
                                className="w-full h-20 flex-col gap-2 bg-white border-gray-200 text-dark hover:bg-primary hover:text-white hover:border-primary"
                            >
                                <RefreshCw className="w-6 h-6" />
                                Refresh Dashboard
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
