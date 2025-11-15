"use client"

import ProtectedPage from "@/components/ProtectedPage";
import {useState, useEffect} from "react"
import {supabase} from "@/lib/supabase"
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Download, FileDown, Bell, Loader2, TrendingUp, TrendingDown, AlertTriangle} from "lucide-react"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface ReportRow {
    itemdescription: string
    unitofmeasurement: string
    dosage: string
    beginningbalance: number
    quantityrequested: number
    issuedquantity: number
    stockonhand: number
    itemcode: string
}

interface MonthlyTrend {
    month: string
    stock: number
    issued: number
    requested: number
}

interface TopItem {
    name: string
    quantity: number
    percentage: number
}

export default function Reports() {
    const [month, setMonth] = useState(1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [searchQuery, setSearchQuery] = useState("")
    const [reportData, setReportData] = useState<ReportRow[]>([])
    const [loading, setLoading] = useState(false)
    const [availableYears, setAvailableYears] = useState<number[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
    const [topDispensed, setTopDispensed] = useState<TopItem[]>([])
    const [topRequested, setTopRequested] = useState<TopItem[]>([])
    const [lowStock, setLowStock] = useState<ReportRow[]>([])
    const itemsPerPage = 10

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

    useEffect(() => {
        const fetchYears = async () => {
            const {data} = await supabase
                .from("monthlysummary")
                .select("year")
                .order("year", {ascending: false})

            if (data) {
                const uniqueYears = [...new Set(data.map(d => d.year))]
                setAvailableYears(uniqueYears)
            }
        }
        fetchYears()
    }, [])

    useEffect(() => {
        fetchReportData()
        fetchAnalyticsData()
    }, [month, year])

    const fetchReportData = async () => {
        setLoading(true)
        try {
            const {data: summaryData, error: summaryError} = await supabase
                .from("monthlysummary")
                .select(`
                    itemcode,
                    beginningbalance,
                    quantityrequested,
                    issuedquantity,
                    stockonhand,
                    month,
                    year
                `)
                .eq("month", month)
                .eq("year", year)
                .order("itemcode")

            if (summaryError) throw summaryError

            const itemCodes = summaryData?.map(d => d.itemcode) || []
            const {data: itemsData, error: itemsError} = await supabase
                .from("items")
                .select("itemcode, itemdescription, unitofmeasurement, dosage")
                .in("itemcode", itemCodes)

            if (itemsError) throw itemsError

            const combined = summaryData?.map(summary => {
                const item = itemsData?.find(i => i.itemcode === summary.itemcode)
                return {
                    itemcode: summary.itemcode,
                    itemdescription: item?.itemdescription || summary.itemcode,
                    unitofmeasurement: item?.unitofmeasurement || "N/A",
                    dosage: item?.dosage || "N/A",
                    beginningbalance: summary.beginningbalance || 0,
                    quantityrequested: summary.quantityrequested || 0,
                    issuedquantity: summary.issuedquantity || 0,
                    stockonhand: summary.stockonhand || 0,
                }
            }) || []

            setReportData(combined)

            // Calculate low stock items (less than 20% of beginning balance)
            const lowStockItems = combined.filter(item =>
                item.beginningbalance > 0 &&
                item.stockonhand < item.beginningbalance * 0.2
            ).slice(0, 10)
            setLowStock(lowStockItems)

        } catch (error) {
            console.error("Error fetching report data:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAnalyticsData = async () => {
        try {
            // Fetch last 6 months trend
            const {data: trendData} = await supabase
                .from("monthlysummary")
                .select("month, year, stockonhand, issuedquantity, quantityrequested")
                .eq("year", year)
                .order("month", {ascending: true})

            if (trendData) {
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                const aggregated = trendData.reduce((acc: any, curr) => {
                    const monthKey = monthNames[curr.month - 1]
                    if (!acc[monthKey]) {
                        acc[monthKey] = {month: monthKey, stock: 0, issued: 0, requested: 0}
                    }
                    acc[monthKey].stock += curr.stockonhand || 0
                    acc[monthKey].issued += curr.issuedquantity || 0
                    acc[monthKey].requested += curr.quantityrequested || 0
                    return acc
                }, {})

                setMonthlyTrends(Object.values(aggregated))
            }

            // Get top dispensed items for current month
            const {data: dispensedData} = await supabase
                .from("monthlysummary")
                .select("itemcode, issuedquantity")
                .eq("month", month)
                .eq("year", year)
                .order("issuedquantity", {ascending: false})
                .limit(5)

            if (dispensedData) {
                const itemCodes = dispensedData.map(d => d.itemcode)
                const {data: itemsData} = await supabase
                    .from("items")
                    .select("itemcode, itemdescription")
                    .in("itemcode", itemCodes)

                const total = dispensedData.reduce((sum, item) => sum + (item.issuedquantity || 0), 0)
                const topItems = dispensedData.map(item => {
                    const itemInfo = itemsData?.find(i => i.itemcode === item.itemcode)
                    return {
                        name: itemInfo?.itemdescription || item.itemcode,
                        quantity: item.issuedquantity || 0,
                        percentage: total > 0 ? Math.round((item.issuedquantity / total) * 100) : 0
                    }
                })
                setTopDispensed(topItems)
            }

            // Get top requested items
            const {data: requestedData} = await supabase
                .from("monthlysummary")
                .select("itemcode, quantityrequested")
                .eq("month", month)
                .eq("year", year)
                .order("quantityrequested", {ascending: false})
                .limit(5)

            if (requestedData) {
                const itemCodes = requestedData.map(d => d.itemcode)
                const {data: itemsData} = await supabase
                    .from("items")
                    .select("itemcode, itemdescription")
                    .in("itemcode", itemCodes)

                const total = requestedData.reduce((sum, item) => sum + (item.quantityrequested || 0), 0)
                const topItems = requestedData.map(item => {
                    const itemInfo = itemsData?.find(i => i.itemcode === item.itemcode)
                    return {
                        name: itemInfo?.itemdescription || item.itemcode,
                        quantity: item.quantityrequested || 0,
                        percentage: total > 0 ? Math.round((item.quantityrequested / total) * 100) : 0
                    }
                })
                setTopRequested(topItems)
            }

        } catch (error) {
            console.error("Error fetching analytics data:", error)
        }
    }

    const filteredData = reportData.filter(row =>
        row.itemdescription.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentPageData = filteredData.slice(startIndex, endIndex)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, month, year])

    const handleExportPDF = async () => {
        try {
            const pdf = new jsPDF()
            const pageWidth = pdf.internal.pageSize.getWidth()
            let startY = 20

            try {
                const logo = new Image()
                logo.crossOrigin = "anonymous"

                await new Promise((resolve, reject) => {
                    logo.onload = resolve
                    logo.onerror = reject
                    logo.src = "/images/medisync-logo.svg"
                    setTimeout(() => reject(new Error("Logo load timeout")), 2000)
                })

                const logoWidth = 40
                const logoHeight = 15
                pdf.addImage(logo, "PNG", (pageWidth - logoWidth) / 2, 10, logoWidth, logoHeight)
                startY = 35
            } catch (logoError) {
                pdf.setFontSize(16)
                pdf.setFont("helvetica", "bold")
                pdf.setTextColor(59, 130, 246)
                pdf.text("MediSync", pageWidth / 2, 15, {align: "center"})
                startY = 25
            }

            pdf.setFontSize(18)
            pdf.setFont("helvetica", "bold")
            pdf.setTextColor(0)
            pdf.text("Inventory Report", pageWidth / 2, startY, {align: "center"})

            pdf.setFontSize(12)
            pdf.setFont("helvetica", "normal")
            const monthName = months.find(m => m.value === month)?.label || ""
            pdf.text(`${monthName} ${year}`, pageWidth / 2, startY + 7, {align: "center"})

            pdf.setFontSize(10)
            pdf.setTextColor(100)
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, startY + 13, {align: "center"})

            const tableData = filteredData.map(row => [
                row.itemdescription,
                row.unitofmeasurement,
                row.dosage,
                row.beginningbalance.toString(),
                row.quantityrequested.toString(),
                row.issuedquantity.toString(),
                row.stockonhand.toString()
            ])

            autoTable(pdf, {
                head: [[
                    "Item Description",
                    "Unit",
                    "Dosage",
                    "Beginning Balance",
                    "Qty Requested",
                    "Issued Qty",
                    "Stock on Hand"
                ]],
                body: tableData,
                startY: startY + 20,
                theme: "grid",
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: 255,
                    fontStyle: "bold",
                    fontSize: 9
                },
                bodyStyles: {
                    fontSize: 8
                },
                columnStyles: {
                    0: {cellWidth: 45},
                    1: {cellWidth: 20, halign: "center"},
                    2: {cellWidth: 20, halign: "center"},
                    3: {cellWidth: 25, halign: "center"},
                    4: {cellWidth: 25, halign: "center"},
                    5: {cellWidth: 25, halign: "center"},
                    6: {cellWidth: 25, halign: "center", fontStyle: "bold"}
                },
                margin: {left: 10, right: 10}
            })

            const finalY = (pdf as any).lastAutoTable.finalY + 10
            pdf.setFontSize(10)
            pdf.setFont("helvetica", "bold")
            pdf.setTextColor(0)

            const totalItems = filteredData.length
            const totalStock = filteredData.reduce((sum, row) => sum + row.stockonhand, 0)
            const totalRequested = filteredData.reduce((sum, row) => sum + row.quantityrequested, 0)
            const totalIssued = filteredData.reduce((sum, row) => sum + row.issuedquantity, 0)

            pdf.text(`Summary:`, 14, finalY)
            pdf.setFont("helvetica", "normal")
            pdf.text(`Total Items: ${totalItems} | Total Stock: ${totalStock} | Total Requested: ${totalRequested} | Total Issued: ${totalIssued}`, 14, finalY + 6)

            pdf.save(`MediSync_Inventory_Report_${year}_${String(month).padStart(2, "0")}.pdf`)
        } catch (error) {
            console.error("Error generating PDF:", error)
            alert(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`)
        }
    }

    const handlePrintReport = () => {
        window.print()
    }

    const months = [
        {value: 1, label: "January"},
        {value: 2, label: "February"},
        {value: 3, label: "March"},
        {value: 4, label: "April"},
        {value: 5, label: "May"},
        {value: 6, label: "June"},
        {value: 7, label: "July"},
        {value: 8, label: "August"},
        {value: 9, label: "September"},
        {value: 10, label: "October"},
        {value: 11, label: "November"},
        {value: 12, label: "December"},
    ]

    return (
        <ProtectedPage pageName="Reports">
            <div className="min-h-screen bg-background p-6">
                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }

                        .print-area, .print-area * {
                            visibility: visible;
                        }

                        .print-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }

                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold">Reports & Analytics</CardTitle>
                            <Button variant="outline" size="icon" className="no-print">
                                <Bell className="h-4 w-4"/>
                            </Button>
                        </div>

                        <div className="flex gap-4 mt-4 no-print">
                            <Select value={String(month)} onValueChange={(val) => setMonth(Number(val))}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Month"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(m => (
                                        <SelectItem key={m.value} value={String(m.value)}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Year"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.length > 0 ? (
                                        availableYears.map(y => (
                                            <SelectItem key={y} value={String(y)}>
                                                {y}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <>
                                            <SelectItem value="2024">2024</SelectItem>
                                            <SelectItem value="2023">2023</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Tabs defaultValue="report" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="report">Inventory Report</TabsTrigger>
                                <TabsTrigger value="analytics">Data Analysis</TabsTrigger>
                            </TabsList>

                            {/* Inventory Report Tab */}
                            <TabsContent value="report" className="space-y-4">
                                <div className="flex items-center justify-between gap-4 no-print">
                                    <div className="flex gap-2 flex-1">
                                        <Input
                                            placeholder="Search"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="max-w-xs"
                                        />
                                        <Button variant="outline" disabled>
                                            Filter
                                        </Button>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={handleExportPDF}>
                                            <Download className="mr-2 h-4 w-4"/>
                                            Export PDF
                                        </Button>
                                        <Button onClick={handlePrintReport}>
                                            <FileDown className="mr-2 h-4 w-4"/>
                                            Send Report
                                        </Button>
                                    </div>
                                </div>

                                <div className="print-area">
                                    <div className="hidden print:block mb-6">
                                        <h1 className="text-2xl font-bold text-center mb-2">Inventory Report</h1>
                                        <p className="text-center text-gray-600">
                                            {months.find(m => m.value === month)?.label} {year}
                                        </p>
                                    </div>

                                    {loading ? (
                                        <div className="flex items-center justify-center h-64">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                            <span className="ml-2 text-muted-foreground">Loading report data...</span>
                                        </div>
                                    ) : filteredData.length === 0 ? (
                                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                                            <p>No data available for the selected period</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto border rounded-lg">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                                        Item Description
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                                        Unit of measurement
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                                        Dosage
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                                        Beginning Balance
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                                        Quantity Requested
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                                        Issued Quantity
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                                                        Ending Balance<br/>(Stock on Hand)
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                {currentPageData.map((row, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {row.itemdescription}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {row.unitofmeasurement}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {row.dosage}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center font-medium">
                                                            {row.beginningbalance}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center font-medium">
                                                            {Math.round(row.quantityrequested)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center font-medium">
                                                            {Math.round(row.issuedquantity)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center font-bold text-primary">
                                                            {Math.round(row.stockonhand)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>

                                            {totalPages > 1 && (
                                                <div
                                                    className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                                                    <div className="text-sm text-gray-700">
                                                        Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} items
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                            disabled={currentPage === 1}
                                                        >
                                                            Previous
                                                        </Button>
                                                        <div className="text-sm text-gray-700">
                                                            Page {currentPage} of {totalPages}
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                            disabled={currentPage === totalPages}
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!loading && filteredData.length > 0 && (
                                        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="text-sm text-gray-600">Total Items</div>
                                                    <div
                                                        className="text-2xl font-bold">{Math.round(filteredData.length)}</div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="text-sm text-gray-600">Total Stock on Hand</div>
                                                    <div className="text-2xl font-bold">
                                                        {Math.round(filteredData.reduce((sum, row) => sum + row.stockonhand, 0))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="text-sm text-gray-600">Total Requested</div>
                                                    <div className="text-2xl font-bold">
                                                        {Math.round(filteredData.reduce((sum, row) => sum + row.quantityrequested, 0))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="text-sm text-gray-600">Total Issued</div>
                                                    <div className="text-2xl font-bold">
                                                        {Math.round(filteredData.reduce((sum, row) => sum + row.issuedquantity, 0))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Data Analysis Tab */}
                            <TabsContent value="analytics" className="space-y-6">
                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                    </div>
                                ) : (
                                    <>
                                        {/* Key Metrics */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Total Dispensed</p>
                                                            <p className="text-2xl font-bold">

                                                                {Math.round(reportData.reduce((sum, row) => sum + row.issuedquantity, 0))}
                                                            </p>
                                                        </div>
                                                        <TrendingUp className="h-8 w-8 text-green-500"/>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Total Requested</p>
                                                            <p className="text-2xl font-bold">
                                                                {Math.round(reportData.reduce((sum, row) => sum + row.quantityrequested, 0))}
                                                            </p>
                                                        </div>
                                                        <TrendingDown className="h-8 w-8 text-blue-500"/>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Low Stock Items</p>
                                                            <p className="text-2xl font-bold text-red-600">
                                                                {lowStock.length}
                                                            </p>
                                                        </div>
                                                        <AlertTriangle className="h-8 w-8 text-red-500"/>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardContent className="pt-6">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Stock Value</p>
                                                            <p className="text-2xl font-bold">
                                                                P{reportData.reduce((sum, row) => sum + row.stockonhand, 0)}
                                                            </p>
                                                        </div>
                                                        <Package className="h-8 w-8 text-purple-500"/>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Charts Row 1 */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Monthly Trends Line Chart */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Monthly Inventory Trends</CardTitle>
                                                    <CardDescription>Stock levels, dispensed, and requested items over
                                                        time</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <LineChart data={monthlyTrends}>
                                                            <CartesianGrid strokeDasharray="3 3"/>
                                                            <XAxis dataKey="month"/>
                                                            <YAxis/>
                                                            <Tooltip/>
                                                            <Legend/>
                                                            <Line type="monotone" dataKey="stock" stroke="#3b82f6"
                                                                  strokeWidth={2} name="Stock on Hand"/>
                                                            <Line type="monotone" dataKey="issued" stroke="#10b981"
                                                                  strokeWidth={2} name="Dispensed"/>
                                                            <Line type="monotone" dataKey="requested" stroke="#f59e0b"
                                                                  strokeWidth={2} name="Requested"/>
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>

                                            {/* Top Dispensed Items - Bar Chart */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Top 5 Dispensed Items</CardTitle>
                                                    <CardDescription>Most frequently dispensed medicines this
                                                        month</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <BarChart data={topDispensed}>
                                                            <CartesianGrid strokeDasharray="3 3"/>
                                                            <XAxis dataKey="name" angle={-45} textAnchor="end"
                                                                   height={100}
                                                                   fontSize={12}/>
                                                            <YAxis/>
                                                            <Tooltip/>
                                                            <Bar dataKey="quantity" fill="#10b981"
                                                                 name="Quantity Dispensed"/>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Charts Row 2 */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Top Requested Items - Pie Chart */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Top Requested Items Distribution</CardTitle>
                                                    <CardDescription>Breakdown of most requested
                                                        medicines</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <PieChart>
                                                            <Pie
                                                                data={topRequested}
                                                                cx="50%"
                                                                cy="50%"
                                                                labelLine={false}
                                                                label={({
                                                                            name,
                                                                            percentage
                                                                        }) => `${name.substring(0, 15)}... (${percentage}%)`}
                                                                outerRadius={80}
                                                                fill="#8884d8"
                                                                dataKey="quantity"
                                                            >
                                                                {topRequested.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`}
                                                                          fill={COLORS[index % COLORS.length]}/>
                                                                ))}
                                                            </Pie>
                                                            <Tooltip/>
                                                            <Legend/>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>

                                            {/* Stock Status Bar Chart */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Stock Status Comparison</CardTitle>
                                                    <CardDescription>Beginning balance vs current stock
                                                        levels</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <BarChart data={reportData.slice(0, 10)}>
                                                            <CartesianGrid strokeDasharray="3 3"/>
                                                            <XAxis dataKey="itemdescription" angle={-45}
                                                                   textAnchor="end"
                                                                   height={100} fontSize={10}/>
                                                            <YAxis/>
                                                            <Tooltip/>
                                                            <Legend/>
                                                            <Bar dataKey="beginningbalance" fill="#3b82f6"
                                                                 name="Beginning Balance"/>
                                                            <Bar dataKey="stockonhand" fill="#10b981"
                                                                 name="Current Stock"/>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Low Stock Alert Table */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5 text-red-500"/>
                                                    Low Stock Alerts
                                                </CardTitle>
                                                <CardDescription>Items with stock below 20% of beginning
                                                    balance</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {lowStock.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <p>No low stock items found</p>
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto border rounded-lg">
                                                        <table className="w-full">
                                                            <thead className="bg-red-50 border-b">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
                                                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Beginning</th>
                                                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Current</th>
                                                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200">
                                                            {lowStock.map((item, index) => {
                                                                const percentage = item.beginningbalance > 0
                                                                    ? Math.round((item.stockonhand / item.beginningbalance) * 100)
                                                                    : 0
                                                                return (
                                                                    <tr key={index} className="hover:bg-red-25">
                                                                        <td className="px-4 py-3 text-sm font-medium">{item.itemdescription}</td>
                                                                        <td className="px-4 py-3 text-sm text-center">{item.beginningbalance}</td>
                                                                        <td className="px-4 py-3 text-sm text-center font-bold text-red-600">
                                                                            {item.stockonhand}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-sm text-center">
                                                                        <span
                                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                            {percentage}% remaining
                                                                        </span>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Inventory Turnover Analysis */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Inventory Turnover Analysis</CardTitle>
                                                <CardDescription>Comparison of requested vs issued
                                                    quantities</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={reportData.slice(0, 10)}>
                                                        <CartesianGrid strokeDasharray="3 3"/>
                                                        <XAxis dataKey="itemdescription" angle={-45} textAnchor="end"
                                                               height={100} fontSize={10}/>
                                                        <YAxis/>
                                                        <Tooltip/>
                                                        <Legend/>
                                                        <Bar dataKey="quantityrequested" fill="#f59e0b"
                                                             name="Requested"/>
                                                        <Bar dataKey="issuedquantity" fill="#10b981" name="Issued"/>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>

                                        {/* Summary Insights */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Key Insights</CardTitle>
                                                <CardDescription>Summary of important trends and
                                                    recommendations</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {topDispensed.length > 0 && (
                                                        <div
                                                            className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                                            <h4 className="font-semibold text-green-900 mb-2">Most
                                                                In-Demand</h4>
                                                            <p className="text-sm text-green-800">
                                                                <strong>{topDispensed[0].name}</strong> is your most
                                                                dispensed item with {topDispensed[0].quantity} units
                                                                issued
                                                                this month.
                                                            </p>
                                                        </div>
                                                    )}
                                                    {lowStock.length > 0 && (
                                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                            <h4 className="font-semibold text-red-900 mb-2">Stock
                                                                Alert</h4>
                                                            <p className="text-sm text-red-800">
                                                                {lowStock.length} item(s) are running low on stock.
                                                                Consider
                                                                reordering to maintain adequate inventory levels.
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <h4 className="font-semibold text-blue-900 mb-2">Fulfillment
                                                            Rate</h4>
                                                        <p className="text-sm text-blue-800">
                                                            {reportData.length > 0 ? (
                                                                <>
                                                                    {Math.round((reportData.reduce((sum, row) => sum + row.issuedquantity, 0) /
                                                                        Math.max(reportData.reduce((sum, row) => sum + row.quantityrequested, 0), 1)) * 100)}%
                                                                    of requested items were successfully dispensed this
                                                                    month.
                                                                </>
                                                            ) : "No data available"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </ProtectedPage>
    )
}

const Package = ({className}: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m7.5 4.27 9 5.15"/>
        <path
            d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/>
        <path d="M12 22V12"/>
    </svg>
)
