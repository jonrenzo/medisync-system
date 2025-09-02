"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Download, Printer, BarChart3, Package, AlertTriangle, Plus } from "lucide-react"

const reportData = {
    monthlyStockMovement: [
        {
            medicine: "Paracetamol",
            brand: "Biogesic",
            dosage: "500mg",
            dosageForm: "Tablet",
            jan: 150,
            feb: 180,
            mar: 165,
            total: 495,
        },
        {
            medicine: "Amoxicillin",
            brand: "Amoxil",
            dosage: "250mg",
            dosageForm: "Capsule",
            jan: 89,
            feb: 95,
            mar: 102,
            total: 286,
        },
        {
            medicine: "Ibuprofen",
            brand: "Advil",
            dosage: "400mg",
            dosageForm: "Tablet",
            jan: 67,
            feb: 72,
            mar: 58,
            total: 197,
        },
        {
            medicine: "Aspirin",
            brand: "Bayer",
            dosage: "100mg",
            dosageForm: "Tablet",
            jan: 45,
            feb: 38,
            mar: 52,
            total: 135,
        },
    ],
    expiredItemsDetailed: [
        {
            medicine: "Paracetamol",
            brand: "Biogesic",
            dosage: "500mg",
            dosageForm: "Tablet",
            batch: "202312001",
            quantity: 50,
            expiredDate: "2024-01-05",
            value: 1250,
            supplier: "PharmaCorp",
        },
        {
            medicine: "Amoxicillin",
            brand: "Amoxil",
            dosage: "250mg",
            dosageForm: "Capsule",
            batch: "202312002",
            quantity: 25,
            expiredDate: "2024-01-03",
            value: 875,
            supplier: "MediSupply",
        },
        {
            medicine: "Ibuprofen",
            brand: "Advil",
            dosage: "400mg",
            dosageForm: "Tablet",
            batch: "202312003",
            quantity: 30,
            expiredDate: "2024-01-01",
            value: 960,
            supplier: "HealthDist",
        },
    ],
    monthlyDisposalReturns: [
        {
            medicine: "Paracetamol",
            brand: "Biogesic",
            dosage: "500mg",
            dosageForm: "Tablet",
            jan: 15,
            feb: 8,
            mar: 12,
            total: 35,
            reason: "Expired",
            supplier: "PharmaCorp",
        },
        {
            medicine: "Amoxicillin",
            brand: "Amoxil",
            dosage: "250mg",
            dosageForm: "Capsule",
            jan: 5,
            feb: 12,
            mar: 8,
            total: 25,
            reason: "Damaged",
            supplier: "MediSupply",
        },
        {
            medicine: "Ibuprofen",
            brand: "Advil",
            dosage: "400mg",
            dosageForm: "Tablet",
            jan: 8,
            feb: 3,
            mar: 15,
            total: 26,
            reason: "Recalled",
            supplier: "HealthDist",
        },
        {
            medicine: "Cetirizine",
            brand: "Zyrtec",
            dosage: "10mg",
            dosageForm: "Tablet",
            jan: 3,
            feb: 7,
            mar: 5,
            total: 15,
            reason: "Expired",
            supplier: "AllergyMeds Inc",
        },
    ],
    dispensedActivity: {
        daily: [
            { date: "2024-01-15", medicine: "Paracetamol", quantity: 25, estValueLost: 625 },
            { date: "2024-01-15", medicine: "Amoxicillin", quantity: 15, estValueLost: 450 },
            { date: "2024-01-14", medicine: "Ibuprofen", quantity: 20, estValueLost: 640 },
            { date: "2024-01-14", medicine: "Paracetamol", quantity: 30, estValueLost: 750 },
            { date: "2024-01-13", medicine: "Aspirin", quantity: 12, estValueLost: 240 },
        ],
        weekly: [
            { week: "Week 1 (Jan 1-7)", totalItems: 45, medicine: "Paracetamol" },
            { week: "Week 2 (Jan 8-14)", totalItems: 38, medicine: "Amoxicillin" },
            { week: "Week 3 (Jan 15-21)", totalItems: 42, medicine: "Ibuprofen" },
        ],
        monthly: [
            { month: "January 2024", totalItems: 105, medicine: "Paracetamol" },
            { month: "December 2023", totalItems: 89, medicine: "Ibuprofen" },
            { month: "November 2023", totalItems: 76, medicine: "Amoxicillin" },
        ],
    },
}

export default function Reports() {
    const [selectedMonth, setSelectedMonth] = useState("january-2024")
    const [reportType, setReportType] = useState("monthly-stock")
    const [isAddDispensingOpen, setIsAddDispensingOpen] = useState(false)
    const [dispensingForm, setDispensingForm] = useState({
        medicine: "",
        quantity: "",
        unitPrice: "",
        date: new Date().toISOString().split("T")[0],
    })

    const handleAddDispensing = () => {
        // This would normally update the inventory and historical data
        // For now, we'll just show the concept
        console.log("Adding dispensing record:", dispensingForm)

        // Calculate revenue
        const revenue = Number.parseInt(dispensingForm.quantity) * Number.parseFloat(dispensingForm.unitPrice)

        // This would:
        // 1. Deduct quantity from current inventory
        // 2. Add record to historical data
        // 3. Update dispensed activity list

        alert(
            `Dispensing record added successfully!\nMedicine: ${dispensingForm.medicine}\nQuantity: ${dispensingForm.quantity}\nRevenue: ₱${revenue}\n\nThis would update the inventory stock and historical data.`,
        )

        setIsAddDispensingOpen(false)
        setDispensingForm({
            medicine: "",
            quantity: "",
            unitPrice: "",
            date: new Date().toISOString().split("T")[0],
        })
    }

    return (
        <div className="bg-background min-h-screen p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-dark">Reports</h1>
                <div className="flex gap-2">
                    <Button className="bg-primary hover:bg-primary/90 text-white" size="sm">
                        <Printer className="w-4 h-4 mr-2" />
                        Print Report
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 text-white" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Report Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                    <CardDescription>Select report type and time period</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Report Type</label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly-stock">Monthly Stock Report</SelectItem>
                                    <SelectItem value="expired-items">Expired Items Report</SelectItem>
                                    <SelectItem value="disposal-returns">Returns Report</SelectItem>
                                    <SelectItem value="dispensed-items">Dispensed Items Report</SelectItem>
                                    <SelectItem value="asset-value">Monthly Asset Value</SelectItem>
                                    <SelectItem value="sales-report">Monthly Sales Report</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Time Period</label>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="january-2024">January 2024</SelectItem>
                                    <SelectItem value="december-2023">December 2023</SelectItem>
                                    <SelectItem value="november-2023">November 2023</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="bg-primary hover:bg-primary/90 text-white">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Generate Report
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Report Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-dark">Est. Value Lost</CardTitle>
                        <BarChart3 className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">₱4,523</div>
                        <p className="text-xs text-red-600">105 items expired/disposed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-dark">Expired Items</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">105</div>
                        <p className="text-xs text-red-600">₱3,085 value lost</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-dark">Stock Movement</CardTitle>
                        <Package className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,113</div>
                        <p className="text-xs text-gray-600">Total items moved this quarter</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Reports */}
            <div className="space-y-6">
                {/* Monthly Stock Movement Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Stock Movement by Medicine</CardTitle>
                        <CardDescription>Track inventory movement per medicine with complete details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Medicine</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Brand</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Dosage</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Form</th>
                                    <th className="text-center py-3 px-4 font-medium text-dark text-sm">Jan</th>
                                    <th className="text-center py-3 px-4 font-medium text-dark text-sm">Feb</th>
                                    <th className="text-center py-3 px-4 font-medium text-dark text-sm">Mar</th>
                                    <th className="text-center py-3 px-4 font-medium text-dark text-sm">Total</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {reportData.monthlyStockMovement.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium text-dark">{item.medicine}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.brand}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.dosage}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.dosageForm}</td>
                                        <td className="py-3 px-4 text-center font-medium">{item.jan}</td>
                                        <td className="py-3 px-4 text-center font-medium">{item.feb}</td>
                                        <td className="py-3 px-4 text-center font-medium">{item.mar}</td>
                                        <td className="py-3 px-4 text-center font-bold text-primary">{item.total}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Returns Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Returns Report</CardTitle>
                        <CardDescription>Track returned items by month with supplier information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-orange-50 border-b border-orange-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Medicine</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Brand</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Dosage</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Form</th>
                                    <th className="text-center py-3 px-4 font-medium text-dark text-sm">Jan</th>
                                    <th className="text-center py-3 px-4 font-medium text-dark text-sm">Feb</th>
                                    <th className="text-center py-3 px-4 font-medium text-dark text-sm">Mar</th>
                                    <th className="text-center py-3 px-4 font-medium text-dark text-sm">Total</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Reason</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Supplier</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {reportData.monthlyDisposalReturns.map((item, index) => (
                                    <tr key={index} className="hover:bg-orange-25">
                                        <td className="py-3 px-4 font-medium text-dark">{item.medicine}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.brand}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.dosage}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.dosageForm}</td>
                                        <td className="py-3 px-4 text-center font-medium">{item.jan}</td>
                                        <td className="py-3 px-4 text-center font-medium">{item.feb}</td>
                                        <td className="py-3 px-4 text-center font-medium">{item.mar}</td>
                                        <td className="py-3 px-4 text-center font-bold text-orange-600">{item.total}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.reason}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.supplier}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Expired Items Detailed Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Expired Items - Detailed Report</CardTitle>
                        <CardDescription>Complete inventory data for expired items</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-red-50 border-b border-red-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Medicine</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Brand</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Dosage</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Form</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Batch</th>
                                    <th className="text-center py-3 px-4 font-medium text-dark text-sm">Quantity</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Expired Date</th>
                                    <th className="text-left py-3 px-4 font-medium text-dark text-sm">Supplier</th>
                                    <th className="text-right py-3 px-4 font-medium text-dark text-sm">Value Lost</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {reportData.expiredItemsDetailed.map((item, index) => (
                                    <tr key={index} className="hover:bg-red-25">
                                        <td className="py-3 px-4 font-medium text-dark">{item.medicine}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.brand}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.dosage}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.dosageForm}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.batch}</td>
                                        <td className="py-3 px-4 text-center font-medium">{item.quantity}</td>
                                        <td className="py-3 px-4 text-red-600 font-medium">{item.expiredDate}</td>
                                        <td className="py-3 px-4 text-gray-600">{item.supplier}</td>
                                        <td className="py-3 px-4 text-right font-bold text-red-600">₱{item.value}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Dispensed Items & Sales Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Dispensing Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Daily Dispensing Activity
                                <Dialog open={isAddDispensingOpen} onOpenChange={setIsAddDispensingOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-primary hover:bg-primary/90 text-white" size="sm">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Dispensing
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Dispensing Record</DialogTitle>
                                            <DialogDescription>
                                                Add a new dispensing record. This will update the inventory stock and historical data.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="medicine">Medicine</Label>
                                                <Select
                                                    value={dispensingForm.medicine}
                                                    onValueChange={(value) => setDispensingForm({ ...dispensingForm, medicine: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select medicine" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Paracetamol">Paracetamol</SelectItem>
                                                        <SelectItem value="Amoxicillin">Amoxicillin</SelectItem>
                                                        <SelectItem value="Ibuprofen">Ibuprofen</SelectItem>
                                                        <SelectItem value="Aspirin">Aspirin</SelectItem>
                                                        <SelectItem value="Cetirizine">Cetirizine</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="quantity">Quantity</Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    value={dispensingForm.quantity}
                                                    onChange={(e) => setDispensingForm({ ...dispensingForm, quantity: e.target.value })}
                                                    placeholder="Enter quantity"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="unitPrice">Unit Price (₱)</Label>
                                                <Input
                                                    id="unitPrice"
                                                    type="number"
                                                    step="0.01"
                                                    value={dispensingForm.unitPrice}
                                                    onChange={(e) => setDispensingForm({ ...dispensingForm, unitPrice: e.target.value })}
                                                    placeholder="Enter unit price"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="date">Date</Label>
                                                <Input
                                                    id="date"
                                                    type="date"
                                                    value={dispensingForm.date}
                                                    onChange={(e) => setDispensingForm({ ...dispensingForm, date: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" onClick={() => setIsAddDispensingOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleAddDispensing} className="bg-primary hover:bg-primary/90 text-white">
                                                    Add Dispensing
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardTitle>
                            <CardDescription>Recent daily dispensing records</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-green-50 border-b border-green-200">
                                    <tr>
                                        <th className="text-left py-2 px-3 font-medium text-dark text-sm">Date</th>
                                        <th className="text-left py-2 px-3 font-medium text-dark text-sm">Medicine</th>
                                        <th className="text-center py-2 px-3 font-medium text-dark text-sm">Qty</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {reportData.dispensedActivity.daily.map((item, index) => (
                                        <tr key={index} className="hover:bg-green-25">
                                            <td className="py-2 px-3 text-sm text-gray-600">{item.date}</td>
                                            <td className="py-2 px-3 text-sm font-medium text-dark">{item.medicine}</td>
                                            <td className="py-2 px-3 text-sm text-center">{item.quantity}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weekly & Monthly Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly & Monthly Summary</CardTitle>
                            <CardDescription>Dispensing activity summary</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium text-dark mb-2">Weekly Summary</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-blue-50 border-b border-blue-200">
                                        <tr>
                                            <th className="text-left py-2 px-3 font-medium text-dark text-sm">Week</th>
                                            <th className="text-center py-2 px-3 font-medium text-dark text-sm">Items</th>
                                            <th className="text-right py-2 px-3 font-medium text-dark text-sm">Medicine</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                        {reportData.dispensedActivity.weekly.map((item, index) => (
                                            <tr key={index} className="hover:bg-blue-25">
                                                <td className="py-2 px-3 text-sm text-gray-600">{item.week}</td>
                                                <td className="py-2 px-3 text-sm text-center font-medium">{item.totalItems}</td>
                                                <td className="py-2 px-3 text-sm text-right font-medium text-blue-600">
                                                    {item.medicine}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-dark mb-2">Monthly Summary</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-purple-50 border-b border-purple-200">
                                        <tr>
                                            <th className="text-left py-2 px-3 font-medium text-dark text-sm">Month</th>
                                            <th className="text-center py-2 px-3 font-medium text-dark text-sm">Items</th>
                                            <th className="text-right py-2 px-3 font-medium text-dark text-sm">Medicine</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                        {reportData.dispensedActivity.monthly.map((item, index) => (
                                            <tr key={index} className="hover:bg-purple-25">
                                                <td className="py-2 px-3 text-sm text-gray-600">{item.month}</td>
                                                <td className="py-2 px-3 text-sm text-center font-medium">{item.totalItems}</td>
                                                <td className="py-2 px-3 text-sm text-right font-medium text-purple-600">
                                                    {item.medicine}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
