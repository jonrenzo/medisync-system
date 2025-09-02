"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Search,
    Filter,
    Plus,
    Trash2,
    Upload,
    Download,
    Edit,
    History,
    TrendingDown,
    BarChart3,
    TrendingUp,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const inventoryData = [
    {
        id: 1,
        name: "Paracetamol",
        categories: "Analgesic",
        dosageForm: "Tablet",
        dosage: "500mg",
        brand: "Biogesic",
        batchNo: "202512029",
        expiryDate: "2024-12-15",
        supplier: "PharmaCorp",
        stocks: 112,
        status: "IN STOCK",
    },
    {
        id: 2,
        name: "Amoxicillin",
        categories: "Antibiotic",
        dosageForm: "Capsule",
        dosage: "250mg",
        brand: "Amoxil",
        batchNo: "202512030",
        expiryDate: "2024-08-20",
        supplier: "MediSupply",
        stocks: 0,
        status: "OUT OF STOCK",
    },
    {
        id: 3,
        name: "Ibuprofen",
        categories: "Anti-inflammatory",
        dosageForm: "Tablet",
        dosage: "400mg",
        brand: "Advil",
        batchNo: "202512031",
        expiryDate: "2024-06-10",
        supplier: "HealthDist",
        stocks: 20,
        status: "LOW STOCK",
    },
    {
        id: 4,
        name: "Aspirin",
        categories: "Analgesic",
        dosageForm: "Tablet",
        dosage: "100mg",
        brand: "Bayer",
        batchNo: "202512032",
        expiryDate: "2025-03-25",
        supplier: "BayerPharma",
        stocks: 112,
        status: "IN STOCK",
    },
    {
        id: 5,
        name: "Cetirizine",
        categories: "Antihistamine",
        dosageForm: "Tablet",
        dosage: "10mg",
        brand: "Zyrtec",
        batchNo: "202512033",
        expiryDate: "2024-09-30",
        supplier: "AllergyMeds Inc",
        stocks: 0,
        status: "OUT OF STOCK",
    },
    {
        id: 6,
        name: "Omeprazole",
        categories: "Proton Pump Inhibitor",
        dosageForm: "Capsule",
        dosage: "20mg",
        brand: "Losec",
        batchNo: "202512034",
        expiryDate: "2024-11-18",
        supplier: "GastroPharma",
        stocks: 20,
        status: "LOW STOCK",
    },
    {
        id: 7,
        name: "Metformin",
        categories: "Antidiabetic",
        dosageForm: "Tablet",
        dosage: "500mg",
        brand: "Glucophage",
        batchNo: "202512035",
        expiryDate: "2025-01-12",
        supplier: "DiabetesCare Ltd",
        stocks: 112,
        status: "IN STOCK",
    },
    {
        id: 8,
        name: "Amlodipine",
        categories: "Antihypertensive",
        dosageForm: "Tablet",
        dosage: "5mg",
        brand: "Norvasc",
        batchNo: "202512036",
        expiryDate: "2024-07-08",
        supplier: "CardioMeds",
        stocks: 0,
        status: "OUT OF STOCK",
    },
    {
        id: 9,
        name: "Simvastatin",
        categories: "Statin",
        dosageForm: "Tablet",
        dosage: "20mg",
        brand: "Zocor",
        batchNo: "202512037",
        expiryDate: "2024-10-22",
        supplier: "CholesterolCare",
        stocks: 20,
        status: "LOW STOCK",
    },
    {
        id: 10,
        name: "Losartan",
        categories: "ARB",
        dosageForm: "Tablet",
        dosage: "50mg",
        brand: "Cozaar",
        batchNo: "202512038",
        expiryDate: "2025-02-14",
        supplier: "HypertensionMeds",
        stocks: 112,
        status: "IN STOCK",
    },
]

// Historical data organized by year and month
const historicalData = {
    "2024": {
        January: [
            {
                id: 1,
                name: "Paracetamol",
                categories: "Analgesic",
                dosageForm: "Tablet",
                dosage: "500mg",
                brand: "Biogesic",
                batchNo: "202401001",
                expiryDate: "2024-12-15",
                supplier: "PharmaCorp",
                received: 200,
                dispensed: 180,
                wastage: 8,
                estValueLost: 450, // Changed from totalSales: 4500
                revenueLost: 200,
            },
            {
                id: 2,
                name: "Amoxicillin",
                categories: "Antibiotic",
                dosageForm: "Capsule",
                dosage: "250mg",
                brand: "Amoxil",
                batchNo: "202401002",
                expiryDate: "2024-08-20",
                supplier: "MediSupply",
                received: 100,
                dispensed: 95,
                wastage: 3,
                estValueLost: 332.5, // Changed from totalSales: 3325
                revenueLost: 105,
            },
            {
                id: 3,
                name: "Ibuprofen",
                categories: "Anti-inflammatory",
                dosageForm: "Tablet",
                dosage: "400mg",
                brand: "Advil",
                batchNo: "202401003",
                expiryDate: "2024-06-10",
                supplier: "HealthDist",
                received: 80,
                dispensed: 72,
                wastage: 1,
                estValueLost: 230.4, // Changed from totalSales: 2304
                revenueLost: 32,
            },
        ],
        December: [
            {
                id: 1,
                name: "Paracetamol",
                categories: "Analgesic",
                dosageForm: "Tablet",
                dosage: "500mg",
                brand: "Biogesic",
                batchNo: "202312001",
                expiryDate: "2024-12-15",
                supplier: "PharmaCorp",
                received: 180,
                dispensed: 145,
                wastage: 5,
                estValueLost: 362.5, // Changed from totalSales: 3625
                revenueLost: 125,
            },
            {
                id: 4,
                name: "Aspirin",
                categories: "Analgesic",
                dosageForm: "Tablet",
                dosage: "100mg",
                brand: "Bayer",
                batchNo: "202312004",
                expiryDate: "2025-03-25",
                supplier: "BayerPharma",
                received: 120,
                dispensed: 98,
                wastage: 7,
                estValueLost: 196, // Changed from totalSales: 1960
                revenueLost: 140,
            },
        ],
    },
    "2023": {
        December: [
            {
                id: 1,
                name: "Paracetamol",
                categories: "Analgesic",
                dosageForm: "Tablet",
                dosage: "500mg",
                brand: "Biogesic",
                batchNo: "202312001",
                expiryDate: "2024-12-15",
                supplier: "PharmaCorp",
                received: 150,
                dispensed: 135,
                wastage: 4,
                estValueLost: 337.5, // Changed from totalSales: 3375
                revenueLost: 100,
            },
            {
                id: 5,
                name: "Cetirizine",
                categories: "Antihistamine",
                dosageForm: "Tablet",
                dosage: "10mg",
                brand: "Zyrtec",
                batchNo: "202312005",
                expiryDate: "2024-09-30",
                supplier: "AllergyMeds Inc",
                received: 60,
                dispensed: 55,
                wastage: 2,
                estValueLost: 165, // Changed from totalSales: 1650
                revenueLost: 60,
            },
        ],
        November: [
            {
                id: 3,
                name: "Ibuprofen",
                categories: "Anti-inflammatory",
                dosageForm: "Tablet",
                dosage: "400mg",
                brand: "Advil",
                batchNo: "202311003",
                expiryDate: "2024-06-10",
                supplier: "HealthDist",
                received: 90,
                dispensed: 78,
                wastage: 6,
                estValueLost: 249.6, // Changed from totalSales: 2496
                revenueLost: 192,
            },
            {
                id: 6,
                name: "Omeprazole",
                categories: "Proton Pump Inhibitor",
                dosageForm: "Capsule",
                dosage: "20mg",
                brand: "Losec",
                batchNo: "202311006",
                expiryDate: "2024-11-18",
                supplier: "GastroPharma",
                received: 70,
                dispensed: 65,
                wastage: 3,
                estValueLost: 227.5, // Changed from totalSales: 2275
                revenueLost: 105,
            },
        ],
    },
}

// Monthly trends data
const monthlyTrends = [
    {
        month: "January 2024",
        totalValue: 125000,
        totalItems: 1250,
        dispensedItems: 890,
        expiredItems: 15,
        disposedItems: 8,
        receivedItems: 450,
        turnoverRate: 71.2,
    },
    {
        month: "December 2023",
        totalValue: 118000,
        totalItems: 1180,
        dispensedItems: 820,
        expiredItems: 12,
        disposedItems: 6,
        receivedItems: 380,
        turnoverRate: 69.5,
    },
    {
        month: "November 2023",
        totalValue: 112000,
        totalItems: 1120,
        dispensedItems: 780,
        expiredItems: 18,
        disposedItems: 10,
        receivedItems: 420,
        turnoverRate: 69.6,
    },
    {
        month: "October 2023",
        totalValue: 108000,
        totalItems: 1080,
        dispensedItems: 750,
        expiredItems: 14,
        disposedItems: 7,
        receivedItems: 390,
        turnoverRate: 69.4,
    },
    {
        month: "September 2023",
        totalValue: 105000,
        totalItems: 1050,
        dispensedItems: 720,
        expiredItems: 16,
        disposedItems: 9,
        receivedItems: 360,
        turnoverRate: 68.6,
    },
    {
        month: "August 2023",
        totalValue: 102000,
        totalItems: 1020,
        dispensedItems: 695,
        expiredItems: 20,
        disposedItems: 12,
        receivedItems: 340,
        turnoverRate: 68.1,
    },
]

export default function Inventory() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedYear, setSelectedYear] = useState("2024")
    const [selectedMonth, setSelectedMonth] = useState("January")
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)

    const getStatusColor = (status: string) => {
        switch (status) {
            case "IN STOCK":
                return "bg-primary text-white"
            case "OUT OF STOCK":
                return "bg-red-500 text-white"
            case "LOW STOCK":
                return "bg-orange-500 text-white"
            default:
                return "bg-gray-500 text-white"
        }
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && file.type === "text/csv") {
            setSelectedFile(file)
        } else {
            alert("Please select a valid CSV file")
        }
    }

    const handleImport = async () => {
        if (!selectedFile) return

        setIsUploading(true)
        setUploadProgress(0)

        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setIsUploading(false)
                    alert(
                        `Successfully imported ${selectedFile.name}!\n\nThis would normally:\n- Parse the CSV file\n- Validate the data\n- Update the inventory database\n- Show import results`,
                    )
                    setIsImportOpen(false)
                    setSelectedFile(null)
                    setUploadProgress(0)
                    return 100
                }
                return prev + 10
            })
        }, 200)
    }

    const resetImport = () => {
        setSelectedFile(null)
        setUploadProgress(0)
        setIsUploading(false)
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const currentHistoricalData = historicalData[selectedYear]?.[selectedMonth] || []

    const filteredHistoricalData = currentHistoricalData.filter(
        (item: { name: string; brand: string }) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.brand.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return (
        <div className="p-6 bg-background min-h-screen">
            <PageHeader title="Inventory" />

            <Tabs defaultValue="current" className="space-y-6">
                <TabsList className="bg-white border border-gray-200">
                    <TabsTrigger
                        value="current"
                        className="data-[state=active]:bg-primary data-[state=active]:text-white text-dark"
                    >
                        Current Inventory
                    </TabsTrigger>
                    <TabsTrigger
                        value="historical"
                        className="data-[state=active]:bg-primary data-[state=active]:text-white text-dark"
                    >
                        Historical Data
                    </TabsTrigger>
                    <TabsTrigger
                        value="trends"
                        className="data-[state=active]:bg-primary data-[state=active]:text-white text-dark"
                    >
                        Monthly Trends
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="space-y-6">
                    {/* Search and Action Bar */}
                    <div className="flex items-center justify-between mb-6 gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search a medicine"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white border-gray-300"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary hover:text-white bg-white"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filter
                            </Button>
                            <Button className="bg-primary hover:bg-primary/90 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add
                            </Button>
                            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="border-primary text-primary hover:bg-primary hover:text-white bg-white"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Import
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Import Inventory Data</DialogTitle>
                                        <DialogDescription>
                                            Upload a CSV file to import inventory data. Make sure your file includes the required columns.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        {/* File Upload Area */}
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">Choose a CSV file to upload</p>
                                                <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
                                            </div>
                                            <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="csv-upload" />
                                            <Button
                                                variant="outline"
                                                className="mt-4 bg-transparent"
                                                onClick={() => document.getElementById("csv-upload")?.click()}
                                                disabled={isUploading}
                                            >
                                                Select CSV File
                                            </Button>
                                        </div>

                                        {/* Selected File Info */}
                                        {selectedFile && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                                                        <p className="text-xs text-blue-600">
                                                            {(selectedFile.size / 1024).toFixed(1)} KB • CSV File
                                                        </p>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={resetImport} disabled={isUploading}>
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload Progress */}
                                        {isUploading && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Uploading...</span>
                                                    <span>{uploadProgress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* CSV Format Info */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-sm font-medium mb-2">Required CSV Format:</h4>
                                            <div className="text-xs text-gray-600 space-y-1">
                                                <p>• Name, Categories, Dosage Form, Dosage, Brand</p>
                                                <p>• Batch No., Expiry Date, Supplier, Stocks</p>
                                                <p>• Date format: YYYY-MM-DD</p>
                                            </div>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 h-auto text-xs text-primary"
                                                onClick={() => {
                                                    // Create and download sample CSV
                                                    const csvContent =
                                                        "Name,Categories,Dosage Form,Dosage,Brand,Batch No.,Expiry Date,Supplier,Stocks\nParacetamol,Analgesic,Tablet,500mg,Biogesic,202512029,2024-12-15,PharmaCorp,112"
                                                    const blob = new Blob([csvContent], { type: "text/csv" })
                                                    const url = window.URL.createObjectURL(blob)
                                                    const a = document.createElement("a")
                                                    a.href = url
                                                    a.download = "inventory_template.csv"
                                                    a.click()
                                                    window.URL.revokeObjectURL(url)
                                                }}
                                            >
                                                Download Sample Template
                                            </Button>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsImportOpen(false)
                                                    resetImport()
                                                }}
                                                disabled={isUploading}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleImport}
                                                disabled={!selectedFile || isUploading}
                                                className="bg-primary hover:bg-primary/90 text-white"
                                            >
                                                {isUploading ? "Importing..." : "Import Data"}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Button
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary hover:text-white bg-white"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Current Inventory Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">NAME</th>
                                    <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                        Categories
                                    </th>
                                    <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                        Dosage Form
                                    </th>
                                    <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                        Dosage
                                    </th>
                                    <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                        Brand
                                    </th>
                                    <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                        Batch No.
                                    </th>
                                    <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                        Expiry Date
                                    </th>
                                    <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                        Supplier
                                    </th>
                                    <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                        Stocks
                                    </th>
                                    <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                        Status
                                    </th>
                                    <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {inventoryData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="py-4 px-6 text-dark font-medium">{item.name}</td>
                                        <td className="py-4 px-6 text-gray-600">{item.categories}</td>
                                        <td className="py-4 px-6 text-gray-600">{item.dosageForm}</td>
                                        <td className="py-4 px-6 text-gray-600">{item.dosage}</td>
                                        <td className="py-4 px-6 text-gray-600">{item.brand}</td>
                                        <td className="py-4 px-6 text-gray-600">{item.batchNo}</td>
                                        <td className="py-4 px-6 text-gray-600">{item.expiryDate}</td>
                                        <td className="py-4 px-6 text-gray-600">{item.supplier}</td>
                                        <td className="py-4 px-6 text-dark font-medium">{item.stocks}</td>
                                        <td className="py-4 px-6">
                                            <Badge className={`${getStatusColor(item.status)} font-medium px-3 py-1`}>{item.status}</Badge>
                                        </td>
                                        <td className="py-4 px-6">
                                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-dark">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="historical" className="space-y-6">
                    {/* Historical Data Controls */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-dark">
                                <History className="w-5 h-5" />
                                Historical Inventory Data
                            </CardTitle>
                            <CardDescription>
                                Complete historical records for forecasting analysis and trend monitoring
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search medicine or brand..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2024">2024</SelectItem>
                                        <SelectItem value="2023">2023</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedYear === "2024" && (
                                            <>
                                                <SelectItem value="January">January</SelectItem>
                                                <SelectItem value="December">December</SelectItem>
                                            </>
                                        )}
                                        {selectedYear === "2023" && (
                                            <>
                                                <SelectItem value="December">December</SelectItem>
                                                <SelectItem value="November">November</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button className="bg-primary hover:bg-primary/90 text-white">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Data
                                </Button>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <Card className="border-blue-200 bg-blue-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-blue-600">Total Received</p>
                                                <p className="text-2xl font-bold text-blue-700">
                                                    {filteredHistoricalData.reduce((sum: never, item: { received: never }) => sum + item.received, 0)}
                                                </p>
                                            </div>
                                            <Plus className="w-8 h-8 text-blue-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-green-200 bg-green-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-green-600">Total Dispensed</p>
                                                <p className="text-2xl font-bold text-green-700">
                                                    {filteredHistoricalData.reduce((sum: never, item: { dispensed: never }) => sum + item.dispensed, 0)}
                                                </p>
                                            </div>
                                            <TrendingDown className="w-8 h-8 text-green-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-red-200 bg-red-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-red-600">Total Wastage</p>
                                                <p className="text-2xl font-bold text-red-700">
                                                    {filteredHistoricalData.reduce((sum: never, item: { wastage: never }) => sum + item.wastage, 0)}
                                                </p>
                                            </div>
                                            <Trash2 className="w-8 h-8 text-red-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-purple-200 bg-purple-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-red-600">Est. Value Lost</p>
                                                <p className="text-2xl font-bold text-red-700">
                                                    ₱{filteredHistoricalData.reduce((sum: never, item: { estValueLost: never }) => sum + item.estValueLost, 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <BarChart3 className="w-8 h-8 text-red-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Historical Data Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-secondary border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            NAME
                                        </th>
                                        <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Categories
                                        </th>
                                        <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Dosage Form
                                        </th>
                                        <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Dosage
                                        </th>
                                        <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Brand
                                        </th>
                                        <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Batch No.
                                        </th>
                                        <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Expiry Date
                                        </th>
                                        <th className="text-left py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Supplier
                                        </th>
                                        <th className="text-center py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Received
                                        </th>
                                        <th className="text-center py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Dispensed
                                        </th>
                                        <th className="text-center py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Wastage
                                        </th>
                                        <th className="text-right py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Est. Value Lost
                                        </th>
                                        <th className="text-right py-4 px-6 font-medium text-dark uppercase tracking-wider text-sm">
                                            Revenue Lost
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {filteredHistoricalData.map((item: { id: never; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; categories: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; dosageForm: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; dosage: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; brand: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; batchNo: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; expiryDate: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; supplier: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; received: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; dispensed: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; wastage: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; estValueLost: { toLocaleString: () => string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined }; revenueLost: { toLocaleString: () => string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined } }) => (
                                        <tr key={`${item.id}-${selectedYear}-${selectedMonth}`} className="hover:bg-gray-50">
                                            <td className="py-4 px-6 text-dark font-medium">{item.name}</td>
                                            <td className="py-4 px-6 text-gray-600">{item.categories}</td>
                                            <td className="py-4 px-6 text-gray-600">{item.dosageForm}</td>
                                            <td className="py-4 px-6 text-gray-600">{item.dosage}</td>
                                            <td className="py-4 px-6 text-gray-600">{item.brand}</td>
                                            <td className="py-4 px-6 text-gray-600">{item.batchNo}</td>
                                            <td className="py-4 px-6 text-gray-600">{item.expiryDate}</td>
                                            <td className="py-4 px-6 text-gray-600">{item.supplier}</td>
                                            <td className="py-4 px-6 text-center text-blue-600 font-medium">{item.received}</td>
                                            <td className="py-4 px-6 text-center text-green-600 font-medium">{item.dispensed}</td>
                                            <td className="py-4 px-6 text-center text-red-600 font-medium">{item.wastage}</td>
                                            <td className="py-4 px-6 text-right text-red-600 font-medium">
                                                ₱{item.estValueLost.toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6 text-right text-red-600 font-medium">
                                                ₱{item.revenueLost.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredHistoricalData.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No historical data available for {selectedMonth} {selectedYear}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                    {/* Monthly Trends */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-dark">
                                <TrendingUp className="w-5 h-5" />
                                Monthly Inventory Trends
                            </CardTitle>
                            <CardDescription>
                                Track inventory performance and trends over time for forecasting analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Trend Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
{/*                                <Card className="border-green-200 bg-green-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-green-600">Avg Monthly Value</p>
                                                <p className="text-2xl font-bold text-green-700">
                                                    ₱
                                                    {Math.round(
                                                        monthlyTrends.reduce((sum, trend) => sum + trend.totalValue, 0) / monthlyTrends.length,
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                            <BarChart3 className="w-8 h-8 text-green-500" />
                                        </div>
                                    </CardContent>
                                </Card>*/}

                                <Card className="border-blue-200 bg-blue-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-blue-600">Avg Turnover Rate</p>
                                                <p className="text-2xl font-bold text-blue-700">
                                                    {(
                                                        monthlyTrends.reduce((sum, trend) => sum + trend.turnoverRate, 0) / monthlyTrends.length
                                                    ).toFixed(1)}
                                                    %
                                                </p>
                                            </div>
                                            <TrendingUp className="w-8 h-8 text-blue-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-purple-200 bg-purple-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-purple-600">Total Dispensed</p>
                                                <p className="text-2xl font-bold text-purple-700">
                                                    {monthlyTrends.reduce((sum, trend) => sum + trend.dispensedItems, 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <TrendingDown className="w-8 h-8 text-purple-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-orange-200 bg-orange-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-orange-600">Total Wastage</p>
                                                <p className="text-2xl font-bold text-orange-700">
                                                    {monthlyTrends.reduce((sum, trend) => sum + trend.expiredItems + trend.disposedItems, 0)}
                                                </p>
                                            </div>
                                            <Trash2 className="w-8 h-8 text-orange-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Monthly Trends Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-blue-50 border-b border-blue-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium text-dark text-sm">Month</th>
                                        <th className="text-center py-3 px-4 font-medium text-dark text-sm">Total Items</th>
                                        <th className="text-center py-3 px-4 font-medium text-dark text-sm">Dispensed</th>
                                        <th className="text-center py-3 px-4 font-medium text-dark text-sm">Received</th>
                                        <th className="text-center py-3 px-4 font-medium text-dark text-sm">Expired</th>
                                        <th className="text-center py-3 px-4 font-medium text-dark text-sm">Disposed</th>
                                        <th className="text-center py-3 px-4 font-medium text-dark text-sm">Turnover Rate</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {monthlyTrends.map((trend, index) => (
                                        <tr key={index} className="hover:bg-blue-25">
                                            <td className="py-3 px-4 text-sm font-medium text-dark">{trend.month}</td>

                                            <td className="py-3 px-4 text-sm text-center">{trend.totalItems}</td>
                                            <td className="py-3 px-4 text-sm text-center text-blue-600">{trend.dispensedItems}</td>
                                            <td className="py-3 px-4 text-sm text-center text-green-600">{trend.receivedItems}</td>
                                            <td className="py-3 px-4 text-sm text-center text-red-600">{trend.expiredItems}</td>
                                            <td className="py-3 px-4 text-sm text-center text-orange-600">{trend.disposedItems}</td>
                                            <td className="py-3 px-4 text-sm text-center font-medium">{trend.turnoverRate}%</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Export Button */}
                            <div className="flex justify-end mt-4">
                                <Button className="bg-primary hover:bg-primary/90 text-white">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Trends Data
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
