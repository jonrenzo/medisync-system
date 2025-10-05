"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Search,
    Filter,
    Upload,
    Download,
    Edit,
    History,
    X,
    CheckCircle,
    AlertCircle,
    Loader2,
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



export default function Inventory() {
    const [searchTerm, setSearchTerm] = useState("")
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [uploadResult, setUploadResult] = useState<any>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Data state
    const [inventoryData, setInventoryData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchInventoryData()
    }, [])

    const fetchInventoryData = async () => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from('medicine_inventory')
                .select('*')
                .order('month_year', { ascending: false })
                .order('medicine_name', { ascending: true })

            if (error) throw error

            setInventoryData(data || [])
        } catch (err: any) {
            setError(err.message)
            console.error('Error fetching inventory:', err)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (endingBalance: number) => {
        if (endingBalance === 0) return "bg-red-500 text-white"
        if (endingBalance < 100) return "bg-orange-500 text-white"
        return "bg-primary text-white"
    }

    const getStatusText = (endingBalance: number) => {
        if (endingBalance === 0) return "OUT OF STOCK"
        if (endingBalance < 100) return "LOW STOCK"
        return "IN STOCK"
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const validExtensions = ['.csv', '.txt', '.xlsx', '.xls']
            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

            if (validExtensions.includes(fileExtension)) {
                setSelectedFile(file)
                setUploadError(null)
            } else {
                setUploadError('Please select a valid CSV, TXT, or Excel file')
                setSelectedFile(null)
            }
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            const validExtensions = ['.csv', '.txt', '.xlsx', '.xls']
            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

            if (validExtensions.includes(fileExtension)) {
                setSelectedFile(file)
                setUploadError(null)
            } else {
                setUploadError('Please drop a valid CSV, TXT, or Excel file')
            }
        }
    }

    const handleImport = async () => {
        if (!selectedFile) return

        setIsUploading(true)
        setUploadProgress(0)
        setUploadError(null)
        setUploadResult(null)

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)

            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval)
                        return 90
                    }
                    return prev + 10
                })
            }, 200)

            const response = await fetch('/api/upload-medicine-stocks', {
                method: 'POST',
                body: formData,
            })

            clearInterval(progressInterval)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            setUploadProgress(100)
            setUploadResult(data)

            // Refresh data and close dialog after 2 seconds
            setTimeout(async () => {
                await fetchInventoryData()
                setIsImportOpen(false)
                resetImport()
            }, 2000)

        } catch (error: any) {
            setUploadError(error.message || 'Upload failed')
            setUploadProgress(0)
        } finally {
            setIsUploading(false)
        }
    }

    const resetImport = () => {
        setSelectedFile(null)
        setUploadProgress(0)
        setIsUploading(false)
        setUploadError(null)
        setUploadResult(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Filter inventory data based on search
    const filteredData = inventoryData.filter(item =>
        item.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.medicine_base_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.health_center?.toLowerCase().includes(searchTerm.toLowerCase())
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
                                            Upload your monthly inventory CSV, TXT, or Excel file. The file should contain medicine names, unit types, and stock quantities.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        {/* Drag & Drop Upload Area */}
                                        <div
                                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                                isDragging
                                                    ? 'border-primary bg-blue-50'
                                                    : 'border-gray-300 hover:border-primary'
                                            }`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">
                                                    {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                                                </p>
                                                <p className="text-xs text-gray-500">or</p>
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".csv,.txt,.xlsx,.xls"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                id="csv-upload"
                                            />
                                            <Button
                                                variant="outline"
                                                className="mt-4 bg-transparent"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                            >
                                                Browse Files
                                            </Button>
                                            <p className="text-xs text-gray-500 mt-2">
                                                CSV, TXT, XLSX • Maximum 10MB
                                            </p>
                                        </div>

                                        {/* Selected File Info */}
                                        {selectedFile && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                                            <Upload className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                                                            <p className="text-xs text-blue-600">
                                                                {(selectedFile.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={resetImport}
                                                        disabled={isUploading}
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload Progress */}
                                        {isUploading && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Uploading and processing...</span>
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

                                        {/* Success Message */}
                                        {uploadResult && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-green-900">Upload Successful!</p>
                                                        <p className="text-xs text-green-700 mt-1">{uploadResult.message}</p>
                                                        <div className="text-xs text-green-600 mt-2 space-y-0.5">
                                                            <p>• Processed: {uploadResult.processedRows} records</p>
                                                            <p>• Unique medicines: {uploadResult.uniqueMedicines}</p>
                                                            <p>• Health Center: {uploadResult.healthCenter}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Error Message */}
                                        {uploadError && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-red-900">Upload Failed</p>
                                                        <p className="text-xs text-red-700 mt-1">{uploadError}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* File Format Info */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-sm font-medium mb-2">Expected File Format:</h4>
                                            <div className="text-xs text-gray-600 space-y-1">
                                                <p>Your file should have these columns (no headers needed):</p>
                                                <ul className="list-disc list-inside ml-2 space-y-0.5">
                                                    <li>Medicine name (e.g., "Paracetamol 500mg Tablet")</li>
                                                    <li>Unit type (tablet, capsule, bottle, sachet)</li>
                                                    <li>Beginning balance</li>
                                                    <li>Delivery/received</li>
                                                    <li>Dispensed</li>
                                                    <li>Ending balance</li>
                                                </ul>
                                            </div>
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
                                                disabled={!selectedFile || isUploading || !!uploadResult}
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

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="ml-3 text-gray-600">Loading inventory data...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <p className="text-sm text-red-700">Error loading data: {error}</p>
                            </div>
                        </div>
                    )}

                    {/* Current Inventory Table */}
                    {!loading && !error && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                                    <thead className="bg-secondary border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-2 font-medium text-dark uppercase tracking-wider text-xs w-[15%]">Medicine Name</th>
                                        <th className="text-left py-3 px-2 font-medium text-dark uppercase tracking-wider text-xs w-[10%]">Dosage</th>
                                        <th className="text-left py-3 px-2 font-medium text-dark uppercase tracking-wider text-xs w-[8%]">Unit Type</th>
                                        <th className="text-left py-3 px-2 font-medium text-dark uppercase tracking-wider text-xs w-[8%]">Beginning</th>
                                        <th className="text-left py-3 px-2 font-medium text-dark uppercase tracking-wider text-xs w-[8%]">Delivery</th>
                                        <th className="text-left py-3 px-2 font-medium text-dark uppercase tracking-wider text-xs w-[8%]">Dispensed</th>
                                        <th className="text-left py-3 px-2 font-medium text-dark uppercase tracking-wider text-xs w-[8%]">Ending</th>
                                        {/*<th className="text-left py-3 px-2 font-medium text-dark uppercase tracking-wider text-xs w-[12%]">Health Center</th>*/}
                                        {/*<th className="text-left py-3 px-2 font-medium text-dark uppercase tracking-wider text-xs w-[10%]">Month</th>*/}
                                        <th className="text-left py-3 px-2 font-medium text-dark uppercase tracking-wider text-xs w-[10%]">Status</th>
                                        <th className="text-left py-3 px-2 font-medium text-dark uppercase tracking-wider text-xs w-[5%]">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="py-8 text-center text-gray-500">
                                                {searchTerm ? 'No medicines found matching your search.' : 'No inventory data available. Click Import to upload your data.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-2 text-dark font-medium text-sm truncate" title={item.medicine_base_name}>
                                                    {item.medicine_base_name}
                                                </td>
                                                <td className="py-3 px-2 text-gray-600 text-sm capitalize">{item.dosage}</td>
                                                <td className="py-3 px-2 text-gray-600 text-sm capitalize">{item.unit_type}</td>
                                                <td className="py-3 px-2 text-gray-600 text-sm">{item.beginning_balance?.toLocaleString() || 0}</td>
                                                <td className="py-3 px-2 text-blue-600 text-sm">{item.delivery?.toLocaleString() || 0}</td>
                                                <td className="py-3 px-2 text-orange-600 text-sm">{item.dispensed?.toLocaleString() || 0}</td>
                                                <td className="py-3 px-2 text-dark font-medium text-sm">{item.ending_balance?.toLocaleString() || 0}</td>
                                                <td className="py-3 px-2">
                                                    <Badge className={`${getStatusColor(item.ending_balance)} font-medium px-2 py-1 text-xs`}>
                                                        {getStatusText(item.ending_balance)}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-dark p-1">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="historical" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-dark">
                                <History className="w-5 h-5" />
                                Historical Inventory Data
                            </CardTitle>
                            <CardDescription>
                                View past inventory records for forecasting and analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 text-center py-8">
                                Historical data will appear here after importing multiple months
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
