"use client"

import {useState, useEffect} from "react"
import {supabase} from "@/lib/supabase"
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent} from "@/components/ui/dropdown-menu"
import {Bell, ChevronDown, Loader2, AlertCircle, Download, Send} from "lucide-react"
import {StockTable, type StocksItem} from "@/components/stocks/stocks-table"
import {ReorderTable, type ReorderItem} from "@/components/reorder/reorder-table"
import {DailyDispenseTabs} from "@/components/dispensed/daily-dispensed-table"
import {ReorderModal} from "@/components/reorder/reorder-modal"
import {EditStockModal} from "@/components/stocks/edit-stock-modal"

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]
const years = ["2023", "2024", "2025", "2026"]

export default function StocksManagement() {
    const [stocks, setStocks] = useState<StocksItem[]>([])
    const [reorderItems, setReorderItems] = useState<ReorderItem[]>([])
    const [loading, setLoading] = useState(true)
    const [reorderLoading, setReorderLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [reorderError, setReorderError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [reorderSearchTerm, setReorderSearchTerm] = useState("")
    const [selectedMonth, setSelectedMonth] = useState("October")
    const [selectedYear, setSelectedYear] = useState("2025")
    const [dispensedMonth, setDispensedMonth] = useState("October")
    const [dispensedYear, setDispensedYear] = useState("2025")
    const [currentPage, setCurrentPage] = useState(1)
    const [reorderCurrentPage, setReorderCurrentPage] = useState(1)
    const [reorderModalOpen, setReorderModalOpen] = useState(false)
    const [selectedStock, setSelectedStock] = useState<StocksItem | null>(null)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editingStock, setEditingStock] = useState<StocksItem | null>(null)
    const itemsPerPage = 10


    // Fetch Stocks Table
    useEffect(() => {
        const fetchStocks = async () => {
            try {
                setLoading(true)
                setError(null)

                // Convert month name to number (1-12)
                const monthNumber = months.indexOf(selectedMonth) + 1
                const yearNumber = parseInt(selectedYear)

                const {data, error} = await supabase
                    .from("stocks")
                    .select(`
                    stockid,
                    itemcode,
                    beginningbalance,
                    stockonhand,
                    stockstatus,
                    listtoreorder,
                    month,
                    year,
                    items (
                        itemdescription,
                        dosage,
                        unitofmeasurement
                    )
                `)
                    .eq("month", monthNumber)
                    .eq("year", yearNumber)
                    .order("stockid", {ascending: false})

                if (error) throw error

                const formatted =
                    data?.map((s: any) => ({
                        stockid: s.stockid,
                        itemcode: s.itemcode,
                        itemname: s.items?.itemdescription ?? "",
                        unitofmeasurement: s.items?.unitofmeasurement ?? "",
                        dosage: s.items?.dosage ?? "",
                        beginningbalance: s.beginningbalance,
                        stockonhand: s.stockonhand,
                        stockstatus: s.stockstatus,
                        listtoreorder: s.listtoreorder,
                    })) || []

                setStocks(formatted)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchStocks()
    }, [selectedMonth, selectedYear])

    // Fetch Reorder Table
    useEffect(() => {
        const fetchReorderItems = async () => {
            try {
                setReorderLoading(true)
                setReorderError(null)

                // Fetch reorder items
                const {data: reorderData, error: reorderError} = await supabase
                    .from("reorder")
                    .select("*")
                    .order("reorderid", {ascending: false})

                if (reorderError) throw reorderError

                if (!reorderData || reorderData.length === 0) {
                    setReorderItems([])
                    return
                }

                // Get unique item codes
                const itemCodes = [...new Set(reorderData.map(r => r.itemcode))]

                // Fetch items data
                const {data: itemsData, error: itemsError} = await supabase
                    .from("items")
                    .select("itemcode, itemdescription, unitofmeasurement, dosage")
                    .in("itemcode", itemCodes)

                if (itemsError) throw itemsError

                // Fetch latest stocks data for each item
                const {data: stocksData, error: stocksError} = await supabase
                    .from("stocks")
                    .select("itemcode, stockonhand, stockid")
                    .in("itemcode", itemCodes)
                    .order("stockid", {ascending: false})

                if (stocksError) throw stocksError

                // Create lookup maps
                const itemsMap = new Map(itemsData?.map(item => [item.itemcode, item]))

                // Get the latest stock for each itemcode
                const stocksMap = new Map()
                stocksData?.forEach(stock => {
                    if (!stocksMap.has(stock.itemcode)) {
                        stocksMap.set(stock.itemcode, stock)
                    }
                })

                // Combine data
                const formatted = reorderData.map((item: any) => {
                    const itemData = itemsMap.get(item.itemcode)
                    const stockData = stocksMap.get(item.itemcode)

                    return {
                        id: item.reorderid,
                        itemcode: item.itemcode,
                        itemdescription: itemData?.itemdescription ?? "",
                        unitofmeasurement: itemData?.unitofmeasurement ?? "",
                        dosage: itemData?.dosage ?? "",
                        stockonhand: stockData?.stockonhand ?? 0,
                        quantityrequested: item.quantityrequested,
                        personincharge: item.personincharge,
                    }
                })

                setReorderItems(formatted)
            } catch (err: any) {
                setReorderError(err.message)
            } finally {
                setReorderLoading(false)
            }
        }

        fetchReorderItems()
    }, [])

    const handleAddToReorder = (stock: StocksItem) => {
        setSelectedStock(stock)
        setReorderModalOpen(true)
    }

    const handleEditStock = (stock: StocksItem) => {
        setEditingStock(stock)
        setEditModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this stock record?")) return

        try {
            const {error} = await supabase.from("stocks").delete().eq("stockid", id)
            if (error) throw error
            setStocks((prev) => prev.filter((s) => s.stockid !== id))
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleBulkDelete = async (ids: number[]) => {
        if (!confirm(`Are you sure you want to delete ${ids.length} stock record(s)?`)) return

        try {
            const {error} = await supabase
                .from("stocks")
                .delete()
                .in("stockid", ids)

            if (error) throw error

            setStocks((prev) => prev.filter((s) => !ids.includes(s.stockid)))
            alert(`Successfully deleted ${ids.length} item(s)`)
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleReorderEdit = (item: ReorderItem) => {
        console.log("Edit reorder item:", item)
        // open modal later
    }

    const handleReorderRemove = async (id: number) => {
        if (!confirm("Are you sure you want to remove this item from the reorder list?")) return

        try {
            // Find the item to get its itemcode before deleting
            const itemToRemove = reorderItems.find((item) => item.id === id)
            if (!itemToRemove) return

            // Delete from reorder table
            const {error} = await supabase.from("reorder").delete().eq("reorderid", id)
            if (error) throw error

            // Update the stocks table to set listtoreorder back to false
            const {error: updateError} = await supabase
                .from("stocks")
                .update({listtoreorder: false})
                .eq("itemcode", itemToRemove.itemcode)

            if (updateError) throw updateError

            // Update local stocks state
            setStocks((prevStocks) =>
                prevStocks.map((stock) =>
                    stock.itemcode === itemToRemove.itemcode
                        ? {...stock, listtoreorder: false}
                        : stock
                )
            )

            // Update reorder items state
            setReorderItems((prev) => prev.filter((item) => item.id !== id))

            alert("Item removed from reorder list successfully!")
        } catch (err: any) {
            setReorderError(err.message)
        }
    }

    const handleExportReorder = () => {
        const csv = [
            ["Item Description", "Unit of Measurement", "Dosage", "Stock on Hand", "Quantity Requested", "Person in Charge"],
            ...filteredReorder.map((item) => [
                item.itemdescription,
                item.unitofmeasurement,
                item.dosage,
                item.stockonhand,
                item.quantityrequested,
                item.personincharge,
            ]),
        ]
        const csvContent = csv.map((row) => row.join(",")).join("\n")
        const blob = new Blob([csvContent], {type: "text/csv"})
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `reorder-${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    const handleSendReport = () => {
        console.log("Sending report with items:", filteredReorder)
        // TODO: Email to CHO Office
    }

    const refreshStocks = async () => {
        try {
            setLoading(true)
            setError(null)

            const monthNumber = months.indexOf(selectedMonth) + 1
            const yearNumber = parseInt(selectedYear)

            const {data, error} = await supabase
                .from("stocks")
                .select(`
                stockid,
                itemcode,
                beginningbalance,
                stockonhand,
                stockstatus,
                listtoreorder,
                month,
                year,
                items (
                    itemdescription,
                    dosage,
                    unitofmeasurement
                )
            `)
                .eq("month", monthNumber)
                .eq("year", yearNumber)
                .order("stockid", {ascending: false})

            if (error) throw error

            const formatted =
                data?.map((s: any) => ({
                    stockid: s.stockid,
                    itemcode: s.itemcode,
                    itemname: s.items?.itemdescription ?? "",
                    unitofmeasurement: s.items?.unitofmeasurement ?? "",
                    dosage: s.items?.dosage ?? "",
                    beginningbalance: s.beginningbalance,
                    stockonhand: s.stockonhand,
                    stockstatus: s.stockstatus,
                    listtoreorder: s.listtoreorder,
                })) || []

            setStocks(formatted)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const filtered = stocks.filter(
        (s) =>
            s.itemcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.itemname.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)

    const filteredReorder = reorderItems.filter((item) =>
        item.itemdescription.toLowerCase().includes(reorderSearchTerm.toLowerCase()),
    )
    const reorderTotalPages = Math.ceil(filteredReorder.length / itemsPerPage)
    const reorderStartIndex = (reorderCurrentPage - 1) * itemsPerPage
    const reorderPaginated = filteredReorder.slice(reorderStartIndex, reorderStartIndex + itemsPerPage)

    const handleSaveReorder = async (quantity: number, personInCharge: string) => {
        if (!selectedStock) return

        try {
            // Insert into reorder table
            const {data, error} = await supabase
                .from("reorder")
                .insert({
                    itemcode: selectedStock.itemcode,
                    itemdescription: selectedStock.itemname,
                    unitofmeasurement: selectedStock.unitofmeasurement,
                    stockonhand: selectedStock.stockonhand,
                    quantityrequested: quantity,
                    personincharge: personInCharge,
                })
                .select()

            if (error) throw error

            // Update the stock's listtoreorder field to true
            const {error: updateError} = await supabase
                .from("stocks")
                .update({listtoreorder: true})
                .eq("stockid", selectedStock.stockid)

            if (updateError) throw updateError

            // Update local stocks state to reflect the change
            setStocks((prevStocks) =>
                prevStocks.map((stock) =>
                    stock.stockid === selectedStock.stockid
                        ? {...stock, listtoreorder: true}
                        : stock
                )
            )

            // Refresh reorder items
            const {data: reorderData, error: fetchError} = await supabase
                .from("reorder")
                .select("*")
                .order("reorderid", {ascending: false})

            if (!fetchError && reorderData) {
                // Re-fetch with the same logic as in useEffect
                const itemCodes = [...new Set(reorderData.map(r => r.itemcode))]

                const [{data: itemsData}, {data: stocksData}] = await Promise.all([
                    supabase.from("items").select("itemcode, itemdescription, unitofmeasurement, dosage").in("itemcode", itemCodes),
                    supabase.from("stocks").select("itemcode, stockonhand, stockid").in("itemcode", itemCodes).order("stockid", {ascending: false})
                ])

                const itemsMap = new Map(itemsData?.map(item => [item.itemcode, item]))
                const stocksMap = new Map()
                stocksData?.forEach(stock => {
                    if (!stocksMap.has(stock.itemcode)) {
                        stocksMap.set(stock.itemcode, stock)
                    }
                })

                const formatted = reorderData.map((item: any) => {
                    const itemData = itemsMap.get(item.itemcode)
                    const stockData = stocksMap.get(item.itemcode)

                    return {
                        id: item.reorderid,
                        itemcode: item.itemcode,
                        itemdescription: itemData?.itemdescription ?? "",
                        unitofmeasurement: itemData?.unitofmeasurement ?? "",
                        dosage: itemData?.dosage ?? "",
                        stockonhand: stockData?.stockonhand ?? 0,
                        quantityrequested: item.quantityrequested,
                        personincharge: item.personincharge,
                    }
                })

                setReorderItems(formatted)
            }

            alert("Item added to reorder list successfully!")
        } catch (err: any) {
            alert("Error adding to reorder list: " + err.message)
        }
    }

    return (
        <div className="min-h-screen p-6 bg-background space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Stocks Management</h1>
                <Button variant="outline" size="icon" className="rounded-lg bg-transparent">
                    <Bell className="h-5 w-5"/>
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="stocks" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="stocks">Stocks</TabsTrigger>
                    <TabsTrigger value="daily">Daily Dispense</TabsTrigger>
                    <TabsTrigger value="reorder">Reorder</TabsTrigger>
                </TabsList>

                {/* === STOCKS TAB === */}
                <TabsContent value="stocks" className="space-y-6">
                    {/* Month / Year Filters */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex gap-4">
                            {/* Month */}
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

                            {/* Year */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-40 justify-between bg-transparent">
                                        {selectedYear}
                                        <ChevronDown className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40">
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
                        </div>

                        <Button variant="outline">Export</Button>
                    </div>

                    {/* Search + Table */}
                    <div className="rounded-lg border-2 border-gray-800 bg-white p-6">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <Input
                                placeholder="Search by item code or name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64"
                            />
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                <span className="ml-3 text-gray-600">Loading stocks...</span>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600"/>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        {!loading && !error && (
                            <StockTable
                                stocks={paginated}
                                startIndex={startIndex}
                                onEdit={handleEditStock}
                                onDelete={handleDelete}
                                onBulkDelete={handleBulkDelete}
                                onAddToReorder={handleAddToReorder}
                            />
                        )}

                        {/* Pagination */}
                        {!loading && !error && filtered.length > 0 && (
                            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                                <div className="text-sm text-gray-600">
                                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of{" "}
                                    {filtered.length} entries
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="border-gray-300"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="border-gray-300"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* === DISPENSED TAB === */}
                <TabsContent value="daily" className="space-y-6">
                    <div className="rounded-lg border bg-white p-6 border-border">
                        {/* Month / Year Filters */}
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex gap-4">
                                {/* Month */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-40 justify-between bg-transparent">
                                            {dispensedMonth}
                                            <ChevronDown className="h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-40">
                                        {months.map((month) => (
                                            <button
                                                key={month}
                                                onClick={() => setDispensedMonth(month)}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                            >
                                                {month}
                                            </button>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Year */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-40 justify-between bg-transparent">
                                            {dispensedYear}
                                            <ChevronDown className="h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-40">
                                        {years.map((year) => (
                                            <button
                                                key={year}
                                                onClick={() => setDispensedYear(year)}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                            >
                                                {year}
                                            </button>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <Button variant="outline">Export</Button>
                        </div>
                        <DailyDispenseTabs selectedMonth={dispensedMonth} selectedYear={dispensedYear}/>
                    </div>
                </TabsContent>

                {/* === REORDER TAB === */}
                <TabsContent value="reorder" className="space-y-6">
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-4">
                        <Input
                            placeholder="Search by item description..."
                            value={reorderSearchTerm}
                            onChange={(e) => setReorderSearchTerm(e.target.value)}
                            className="w-64"
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleExportReorder}
                                className="flex items-center gap-2 bg-transparent"
                            >
                                <Download className="h-4 w-4"/>
                                Export
                            </Button>
                            <Button variant="outline" onClick={handleSendReport}
                                    className="flex items-center gap-2 bg-transparent">
                                <Send className="h-4 w-4"/>
                                Send Report
                            </Button>
                        </div>
                    </div>

                    {/* Reorder Table */}
                    <div className="rounded-lg border-2 border-gray-800 bg-white p-6">
                        {/* Loading */}
                        {reorderLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                <span className="ml-3 text-gray-600">Loading reorder items...</span>
                            </div>
                        )}

                        {/* Error */}
                        {reorderError && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600"/>
                                    <p className="text-sm text-red-700">{reorderError}</p>
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        {!reorderLoading && !reorderError && (
                            <>
                                <ReorderTable
                                    items={reorderPaginated}
                                    startIndex={reorderStartIndex}
                                    onEdit={handleReorderEdit}
                                    onRemove={handleReorderRemove}
                                />

                                {/* Pagination */}
                                {filteredReorder.length > 0 && (
                                    <div
                                        className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                                        <div className="text-sm text-gray-600">
                                            Showing {reorderStartIndex + 1} to{" "}
                                            {Math.min(reorderStartIndex + itemsPerPage, filteredReorder.length)} of {filteredReorder.length}{" "}
                                            entries
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setReorderCurrentPage((p) => Math.max(1, p - 1))}
                                                disabled={reorderCurrentPage === 1}
                                                className="border-gray-300"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setReorderCurrentPage((p) => Math.min(reorderTotalPages, p + 1))}
                                                disabled={reorderCurrentPage === reorderTotalPages}
                                                className="border-gray-300"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {filteredReorder.length === 0 && (
                                    <div className="py-12 text-center">
                                        <p className="text-gray-500">No reorder items found</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
            {/* Reorder Modal */}
            <ReorderModal
                isOpen={reorderModalOpen}
                onClose={() => {
                    setReorderModalOpen(false)
                    setSelectedStock(null)
                }}
                onSave={handleSaveReorder}
                itemDescription={selectedStock?.itemname ?? ""}
                unitOfMeasurement={selectedStock?.unitofmeasurement ?? ""}
                dosage={selectedStock?.dosage ?? ""}
                stocksAvailable={selectedStock?.stockonhand ?? 0}
            />
            <EditStockModal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false)
                    setEditingStock(null)
                }}
                stock={editingStock}
                onStockUpdated={refreshStocks}
            />
        </div>
    )
}
