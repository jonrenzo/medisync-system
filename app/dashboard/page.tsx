"use client"

import {useState, useEffect} from "react"
import {supabase} from "@/lib/supabase"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent} from "@/components/ui/dropdown-menu"
import {
    AlertTriangle,
    Package,
    TrendingUp,
    Calendar,
    RefreshCw,
    Eye,
    BarChart3,
    Archive,
    Loader2,
    ChevronDown
} from "lucide-react"
import Link from "next/link"
import {useRouter} from "next/navigation"

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]
const years = ["2023", "2024", "2025", "2026"]

interface LowStockItem {
    itemcode: string
    itemname: string
    stockonhand: number
    status: "critical" | "low"
}

interface ExpiringItem {
    itemcode: string
    itemname: string
    batchnumber: string
    expirationdate: string
    daysLeft: number
}

interface DashboardStats {
    totalMedicines: number
    totalDispensed: number
    lowStockCount: number
    highStockCount: number
}

export default function Dashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState("January")
    const [selectedYear, setSelectedYear] = useState("2025")
    const [stats, setStats] = useState<DashboardStats>({
        totalMedicines: 0,
        totalDispensed: 0,
        lowStockCount: 0,
        highStockCount: 0,
    })
    const [lowStockMedicines, setLowStockMedicines] = useState<LowStockItem[]>([])
    const [upcomingExpiries, setUpcomingExpiries] = useState<ExpiringItem[]>([])
    const [highStockMedicines, setHighStockMedicines] = useState<
        { itemcode: string; itemname: string; stockonhand: number }[]
    >([])


    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // Get current month and year
            const currentDate = new Date()
            const filterMonth = months.indexOf(selectedMonth) + 1
            const filterYear = parseInt(selectedYear)

            const {count: inventoryCount, error: inventoryError} = await supabase
                .from("items")
                .select("*", {count: "exact", head: true})

            // 2. Fetch total dispensed for selected month from utilizationrecord
            const firstDayOfMonth = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`
            const lastDayOfMonth = new Date(filterYear, filterMonth, 0).getDate()
            const lastDayOfMonthStr = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`

            const {count: dispensedCount, error: dispensedError} = await supabase
                .from("utilizationrecord")
                .select("*", {count: "exact", head: true})
                .gte("dateissued", firstDayOfMonth)
                .lte("dateissued", lastDayOfMonthStr)

            // 3. Fetch stocks data for selected month/year
            const {data: stocksData, error: stocksError} = await supabase
                .from("stocks")
                .select(`
                    stockid,
                    itemcode,
                    stockonhand,
                    stockstatus,
                    beginningbalance,
                    month,
                    year
                `)
                .eq("month", filterMonth)
                .eq("year", filterYear)
                .order("stockid", {ascending: false})

            // Get unique item codes (latest stock per item)
            const latestStocksMap = new Map()
            stocksData?.forEach(stock => {
                if (!latestStocksMap.has(stock.itemcode)) {
                    latestStocksMap.set(stock.itemcode, stock)
                }
            })
            const latestStocks = Array.from(latestStocksMap.values())

            // Get item codes from stocks
            const itemCodes = latestStocks.map(s => s.itemcode)

            // Fetch inventory details for these items (only if we have itemCodes)
            let inventoryData: Array<{ itemcode: string; itemdescription: string }> = []
            if (itemCodes.length > 0) {
                const {data, error: invError} = await supabase
                    .from("inventory")
                    .select("itemcode, itemdescription")
                    .in("itemcode", itemCodes)

                if (!invError) {
                    inventoryData = data || []
                }
            }

            // Create a map of itemcode to description
            const inventoryMap = new Map(
                inventoryData?.map(item => [item.itemcode, item.itemdescription]) || []
            )

            // 4. Calculate low and high stock counts (from latest stocks only)
            const lowStock = latestStocks.filter(s => s.stockonhand < 200)

            const highStock = latestStocks.filter(s => s.stockonhand > 200)

            // 5. Get top 5 low stock items with descriptions (sorted by lowest first)
            const lowStockItems: LowStockItem[] = lowStock
                .sort((a, b) => a.stockonhand - b.stockonhand)
                .slice(0, 5)
                .map(s => ({
                    itemcode: s.itemcode,
                    itemname: inventoryMap.get(s.itemcode) || s.itemcode,
                    stockonhand: s.stockonhand,
                    status: s.stockonhand < 50 ? "critical" : "low"
                }))

            // 6. Fetch upcoming expiries from inventory table (within 30 days)
            let expiringItems: ExpiringItem[] = []

            const topHighStockItems = latestStocks
                .filter(s => s.stockonhand > 200)
                .sort((a, b) => b.stockonhand - a.stockonhand)
                .slice(0, 5)
                .map(s => ({
                    itemcode: s.itemcode,
                    itemname: inventoryMap.get(s.itemcode) || s.itemcode,
                    stockonhand: s.stockonhand
                }))

            try {
                const thirtyDaysFromNow = new Date()
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
                const thirtyDaysDate = thirtyDaysFromNow.toISOString().split('T')[0]
                const todayDate = currentDate.toISOString().split('T')[0]

                const {data: expiryData, error: expiryError} = await supabase
                    .from("inventory")
                    .select("itemcode, itemdescription, expirationdate")
                    .not("expirationdate", "is", null)
                    .lte("expirationdate", thirtyDaysDate)
                    .gte("expirationdate", todayDate)
                    .order("expirationdate", {ascending: true})
                    .limit(3)

                if (!expiryError && expiryData && expiryData.length > 0) {
                    // Calculate days left for expiring items
                    expiringItems = expiryData.map(item => {
                        const expiryDate = new Date(item.expirationdate)
                        const daysLeft = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

                        return {
                            itemcode: item.itemcode,
                            itemname: item.itemdescription || item.itemcode,
                            batchnumber: "N/A",
                            expirationdate: item.expirationdate,
                            daysLeft
                        }
                    })
                }
            } catch (err) {
                // Silently fail
            }

            // Update state
            setStats({
                totalMedicines: inventoryCount || 0,
                totalDispensed: dispensedCount || 0,
                lowStockCount: lowStock.length,
                highStockCount: highStock.length,

            })
            setLowStockMedicines(lowStockItems)
            setUpcomingExpiries(expiringItems)
            setHighStockMedicines(topHighStockItems)

        } catch (error: any) {
            // Silently fail - data will show as 0
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [selectedMonth, selectedYear])

    const handleRefresh = () => {
        fetchDashboardData()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                <span className="ml-3 text-gray-600">Loading dashboard...</span>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6 space-y-6 bg-background font-lexend">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
                <div className="flex items-center gap-4">
                    {/* Month Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-40 justify-between bg-transparent">
                                {selectedMonth}
                                <ChevronDown className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-40">
                            {months.map((month) => (
                                <button
                                    key={month}
                                    onClick={() => setSelectedMonth(month)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                >
                                    {month}
                                </button>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Year Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-32 justify-between bg-transparent">
                                {selectedYear}
                                <ChevronDown className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-32">
                            {years.map((year) => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedYear(year)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                >
                                    {year}
                                </button>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={handleRefresh}
                    >
                        <RefreshCw className="mr-2 h-4 w-4"/>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-6 md:grid-cols-2">
                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-dark">Total Medicines</CardTitle>
                        <Package className="h-8 w-8 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-dark">{stats.totalMedicines}</div>
                        <p className="text-xs text-muted-foreground">Active Medicines in Directory</p>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-dark">Total Dispensed
                            ({selectedMonth})</CardTitle>
                        <TrendingUp className="h-8 w-8 text-green-500"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-dark">{stats.totalDispensed}</div>
                        <p className="text-xs text-muted-foreground">Dispensed this month</p>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-dark">Total Medicines in Low Stocks</CardTitle>
                        <AlertTriangle className="h-8 w-8 text-orange-500"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-orange-500">{stats.lowStockCount}</div>
                        <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-dark">Total Medicines in High Stocks</CardTitle>
                        <Calendar className="h-8 w-8 text-green-500"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-500">{stats.highStockCount}</div>
                        <p className="text-xs text-muted-foreground">Well stocked</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Low Stock Medicines */}
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-dark">
                            Top 5 Low Stock Medicines
                            <Link href="/stocks">
                                <Button variant="outline" size="sm">
                                    <Eye className="mr-2 h-4 w-4"/>
                                    View All
                                </Button>
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lowStockMedicines.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No low stock items found
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {lowStockMedicines.map((medicine, index) => (
                                    <div key={index}
                                         className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                        <div>
                                            <div className="font-medium">{medicine.itemname}</div>
                                            <div className="text-sm text-gray-500">{medicine.stockonhand} units
                                                remaining
                                            </div>
                                        </div>
                                        <Badge variant={medicine.status === "critical" ? "destructive" : "secondary"}>
                                            {medicine.status === "critical" ? "Critical" : "Low Stock"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top 5 High Stock Medicines */}
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-dark">
                            Top 5 High Stock Medicines
                            <Link href="/stocks">
                                <Button variant="outline" size="sm">
                                    <Eye className="mr-2 h-4 w-4"/>
                                    View All
                                </Button>
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {highStockMedicines.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No high stock items found
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {highStockMedicines.map((medicine, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-lg bg-green-50 p-3"
                                    >
                                        <div>
                                            <div className="font-medium">{medicine.itemname}</div>
                                            <div className="text-sm text-gray-500">
                                                {medicine.stockonhand} units on hand
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-green-200 text-green-800">
                                            High Stock
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
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
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <Link href="/forecasting">
                            <Button
                                variant="outline"
                                className="h-20 w-full flex-col gap-2 border-gray-200 bg-white text-dark hover:bg-primary hover:border-primary hover:text-white"
                            >
                                <BarChart3 className="h-6 w-6"/>
                                View Forecast Chart
                            </Button>
                        </Link>
                        <Link href="/inventory">
                            <Button
                                variant="outline"
                                className="h-20 w-full flex-col gap-2 border-gray-200 bg-white text-dark hover:bg-primary hover:border-primary hover:text-white"
                            >
                                <Archive className="h-6 w-6"/>
                                Go to Full Inventory
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            className="h-20 w-full flex-col gap-2 border-gray-200 bg-white text-dark hover:bg-primary hover:border-primary hover:text-white"
                        >
                            <RefreshCw className="h-6 w-6"/>
                            Refresh Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
