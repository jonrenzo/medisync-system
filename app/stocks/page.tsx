"use client"

import ProtectedPage from "@/components/ProtectedPage";
import {useState, useEffect, useMemo} from "react"
import {supabase} from "@/lib/supabase"
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent} from "@/components/ui/dropdown-menu"
import {
    Bell,
    ChevronDown,
    Loader2,
    AlertCircle,
    Download,
    Send,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X,
    Filter
} from "lucide-react"
import {StockTable, type StocksItem} from "@/components/stocks/stocks-table"
import {ReorderTable, type ReorderItem} from "@/components/reorder/reorder-table"
import {DailyDispenseTabs} from "@/components/dispensed/daily-dispensed-table"
import {ReorderModal} from "@/components/reorder/reorder-modal"
import {EditStockModal} from "@/components/stocks/edit-stock-modal"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
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
    const [selectedMonth, setSelectedMonth] = useState("January")
    const [selectedYear, setSelectedYear] = useState("2025")
    const [dispensedMonth, setDispensedMonth] = useState("January")
    const [dispensedYear, setDispensedYear] = useState("2025")
    const [currentPage, setCurrentPage] = useState(1)
    const [reorderCurrentPage, setReorderCurrentPage] = useState(1)
    const [reorderModalOpen, setReorderModalOpen] = useState(false)
    const [selectedStock, setSelectedStock] = useState<StocksItem | null>(null)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editingStock, setEditingStock] = useState<StocksItem | null>(null)

    // Filter states for stocks
    const [sortBy, setSortBy] = useState<string>('itemcode')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [stockLevelFilter, setStockLevelFilter] = useState<string>('all')
    const [reorderFilter, setReorderFilter] = useState<string>('all')

    const itemsPerPage = 10

    const sortOptions = [
        {value: 'itemcode', label: 'Item Code'},
        {value: 'itemname', label: 'Item Name'},
        {value: 'beginningbalance', label: 'Beginning Balance'},
        {value: 'stockonhand', label: 'Stock on Hand'},
        {value: 'stockstatus', label: 'Stock Status'}
    ];

    const statusOptions = [
        {value: 'all', label: 'All Status'},
        {value: 'In Stock', label: 'In Stock'},
        {value: 'Out of Stock', label: 'Out of Stock'},
        {value: 'Low Stock', label: 'Low Stock'}
    ];

    const stockLevelOptions = [
        {value: 'all', label: 'All Stock Levels'},
        {value: 'high', label: 'High Stock (>50)'},
        {value: 'medium', label: 'Medium Stock (10-50)'},
        {value: 'low', label: 'Low Stock (<10)'},
        {value: 'zero', label: 'Zero Stock'}
    ];

    const reorderFilterOptions = [
        {value: 'all', label: 'All Items'},
        {value: 'reorder', label: 'In Reorder List'},
        {value: 'not_reorder', label: 'Not in Reorder List'}
    ];

    // Fetch Stocks Table
    useEffect(() => {
        const fetchStocks = async () => {
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

        fetchStocks()
    }, [selectedMonth, selectedYear])

    // Fetch Reorder Table
    useEffect(() => {
        const fetchReorderItems = async () => {
            try {
                setReorderLoading(true)
                setReorderError(null)

                const {data: reorderData, error: reorderError} = await supabase
                    .from("reorder")
                    .select("*")
                    .order("reorderid", {ascending: false})

                if (reorderError) throw reorderError

                if (!reorderData || reorderData.length === 0) {
                    setReorderItems([])
                    return
                }

                const itemCodes = [...new Set(reorderData.map(r => r.itemcode))]

                const {data: itemsData, error: itemsError} = await supabase
                    .from("items")
                    .select("itemcode, itemdescription, unitofmeasurement, dosage")
                    .in("itemcode", itemCodes)

                if (itemsError) throw itemsError

                const {data: stocksData, error: stocksError} = await supabase
                    .from("stocks")
                    .select("itemcode, stockonhand, stockid")
                    .in("itemcode", itemCodes)
                    .order("stockid", {ascending: false})

                if (stocksError) throw stocksError

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
            } catch (err: any) {
                setReorderError(err.message)
            } finally {
                setReorderLoading(false)
            }
        }

        fetchReorderItems()
    }, [])

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setSortBy('itemcode');
        setSortOrder('asc');
        setStatusFilter('all');
        setStockLevelFilter('all');
        setReorderFilter('all');
    };

    const activeFiltersCount = [
        searchTerm !== '',
        statusFilter !== 'all',
        stockLevelFilter !== 'all',
        reorderFilter !== 'all',
        sortBy !== 'itemcode' || sortOrder !== 'asc'
    ].filter(Boolean).length;

    // Advanced filtering and sorting for stocks
    const filteredAndSortedStocks = useMemo(() => {
        let result = [...stocks];

        // Apply search filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter((stock) =>
                stock.itemcode?.toLowerCase().includes(lower) ||
                stock.itemname?.toLowerCase().includes(lower)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter(stock => stock.stockstatus === statusFilter);
        }

        // Apply stock level filter
        if (stockLevelFilter !== 'all') {
            result = result.filter(stock => {
                const qty = stock.stockonhand || 0;
                if (stockLevelFilter === 'high') return qty > 50;
                if (stockLevelFilter === 'medium') return qty >= 10 && qty <= 50;
                if (stockLevelFilter === 'low') return qty > 0 && qty < 10;
                if (stockLevelFilter === 'zero') return qty === 0;
                return true;
            });
        }

        // Apply reorder filter
        if (reorderFilter !== 'all') {
            result = result.filter(stock => {
                if (reorderFilter === 'reorder') return stock.listtoreorder === true;
                if (reorderFilter === 'not_reorder') return stock.listtoreorder === false;
                return true;
            });
        }

        // Apply sorting
        result.sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortBy) {
                case 'itemcode':
                    aVal = a.itemcode || '';
                    bVal = b.itemcode || '';
                    break;
                case 'itemname':
                    aVal = a.itemname || '';
                    bVal = b.itemname || '';
                    break;
                case 'beginningbalance':
                    aVal = a.beginningbalance || 0;
                    bVal = b.beginningbalance || 0;
                    break;
                case 'stockonhand':
                    aVal = a.stockonhand || 0;
                    bVal = b.stockonhand || 0;
                    break;
                case 'stockstatus':
                    aVal = a.stockstatus || '';
                    bVal = b.stockstatus || '';
                    break;
                default:
                    return 0;
            }

            if (typeof aVal === 'string') {
                return sortOrder === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            } else {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            }
        });

        return result;
    }, [stocks, searchTerm, statusFilter, stockLevelFilter, reorderFilter, sortBy, sortOrder]);

    const totalPages = Math.ceil(filteredAndSortedStocks.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginated = filteredAndSortedStocks.slice(startIndex, startIndex + itemsPerPage)

    const filteredReorder = reorderItems.filter((item) =>
        item.itemdescription.toLowerCase().includes(reorderSearchTerm.toLowerCase()),
    )
    const reorderTotalPages = Math.ceil(filteredReorder.length / itemsPerPage)
    const reorderStartIndex = (reorderCurrentPage - 1) * itemsPerPage
    const reorderPaginated = filteredReorder.slice(reorderStartIndex, reorderStartIndex + itemsPerPage)

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
    }

    const handleReorderRemove = async (id: number) => {
        if (!confirm("Are you sure you want to remove this item from the reorder list?")) return

        try {
            const itemToRemove = reorderItems.find((item) => item.id === id)
            if (!itemToRemove) return

            const {error} = await supabase.from("reorder").delete().eq("reorderid", id)
            if (error) throw error

            const {error: updateError} = await supabase
                .from("stocks")
                .update({listtoreorder: false})
                .eq("itemcode", itemToRemove.itemcode)

            if (updateError) throw updateError

            setStocks((prevStocks) =>
                prevStocks.map((stock) =>
                    stock.itemcode === itemToRemove.itemcode
                        ? {...stock, listtoreorder: false}
                        : stock
                )
            )

            setReorderItems((prev) => prev.filter((item) => item.id !== id))

            alert("Item removed from reorder list successfully!")
        } catch (err: any) {
            setReorderError(err.message)
        }
    }

    const handleExportReorderPDF = () => {
        const doc = new jsPDF("p", "mm", "a4");
        doc.setFontSize(16);
        doc.text("Reorder List", 14, 16);

        const tableColumn = [
            "Description", "UOM", "Dosage", "Stock on Hand", "Qty Requested", "In-charge",
        ];

        const tableRows = filteredReorder.map((item) => [
            item.itemdescription,
            item.unitofmeasurement,
            item.dosage,
            item.stockonhand,
            item.quantityrequested,
            item.personincharge,
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 24,
            styles: {fontSize: 9},
        });

        doc.save(`reorder-${new Date().toISOString().split("T")[0]}.pdf`);
    };

    const handleExportStocksPDF = () => {
        const doc = new jsPDF("p", "mm", "a4");
        doc.setFontSize(16);
        doc.text("Stocks Report", 14, 16);
        doc.setFontSize(12);
        doc.text(`Month: ${selectedMonth}`, 14, 24);
        doc.text(`Year: ${selectedYear}`, 14, 30);

        const tableColumn = [
            "Item Code", "Item Name", "UOM", "Dosage", "Beginning", "On Hand", "Status",
        ];

        const tableRows = filteredAndSortedStocks.map((item) => [
            item.itemcode,
            item.itemname,
            item.unitofmeasurement,
            item.dosage,
            item.beginningbalance,
            item.stockonhand,
            item.stockstatus,
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 36,
            styles: {fontSize: 9},
        });

        doc.save(`stocks-${selectedMonth}-${selectedYear}.pdf`);
    };

    const generateReorderPDFFile = () => {
        const doc = new jsPDF("p", "mm", "a4");
        doc.setFontSize(16);
        doc.text("Reorder List", 14, 16);

        const tableColumn = [
            "Description", "UOM", "Dosage", "Stock on Hand", "Qty Requested", "In-charge",
        ];

        const tableRows = filteredReorder.map((item) => [
            item.itemdescription,
            item.unitofmeasurement,
            item.dosage,
            item.stockonhand,
            item.quantityrequested,
            item.personincharge,
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 24,
            styles: {fontSize: 9},
        });

        const filename = `Reorder-Report-${new Date()
            .toISOString()
            .split("T")[0]}.pdf`;

        doc.save(filename);
        return filename;
    };

    const handleSendReport = () => {
        const filename = generateReorderPDFFile();
        const email = "cityhealth@pasigcity.gov.ph";
        const subject = encodeURIComponent("Reorder Report");
        const body = encodeURIComponent(
            "Hello,\n\nPlease see attached the reorder report.\n\nThank you."
        );

        window.open(
            `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`,
            "_blank"
        );

        alert(
            "Your report has been generated. Please attach the PDF file in the Gmail tab that opened."
        );
    };

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

    const handleSaveReorder = async (quantity: number, personInCharge: string) => {
        if (!selectedStock) return

        try {
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

            const {error: updateError} = await supabase
                .from("stocks")
                .update({listtoreorder: true})
                .eq("stockid", selectedStock.stockid)

            if (updateError) throw updateError

            setStocks((prevStocks) =>
                prevStocks.map((stock) =>
                    stock.stockid === selectedStock.stockid
                        ? {...stock, listtoreorder: true}
                        : stock
                )
            )

            const {data: reorderData, error: fetchError} = await supabase
                .from("reorder")
                .select("*")
                .order("reorderid", {ascending: false})

            if (!fetchError && reorderData) {
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
        <ProtectedPage pageName="Stocks">
            <div className="min-h-screen p-6 bg-background space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Stocks Management</h1>
                    <Button variant="outline" size="icon" className="rounded-lg bg-transparent">
                        <Bell className="h-5 w-5"/>
                    </Button>
                </div>

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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-40 justify-between bg-white">
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

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-40 justify-between bg-white">
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

                            <Button variant="outline" onClick={handleExportStocksPDF}>Export</Button>
                        </div>

                        {/* Search + Table */}
                        <div className="rounded-lg border-2 bg-white p-6">
                            {/* Search Bar */}
                            <div className="mb-4 flex items-center gap-4">
                                <div className="relative max-w-sm flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"/>
                                    <Input
                                        placeholder="Search by item code or name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Advanced Filters Row */}
                            <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-gray-500"/>
                                    <span className="text-sm font-medium text-gray-700">Filters:</span>
                                </div>

                                {/* Sort By */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <ArrowUpDown className="h-4 w-4"/>
                                            Sort: {sortOptions.find(opt => opt.value === sortBy)?.label}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        {sortOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setSortBy(option.value)}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                                                    sortBy === option.value ? 'bg-gray-50 font-medium' : ''
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Sort Order Toggle */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleSortOrder}
                                    className="gap-2"
                                >
                                    {sortOrder === 'asc' ? (
                                        <ArrowUp className="h-4 w-4"/>
                                    ) : (
                                        <ArrowDown className="h-4 w-4"/>
                                    )}
                                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                                </Button>

                                {/* Status Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={statusFilter !== 'all' ? 'border-blue-500 text-blue-700' : ''}
                                        >
                                            {statusOptions.find(opt => opt.value === statusFilter)?.label}
                                            <ChevronDown className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setStatusFilter(option.value)}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                                                    statusFilter === option.value ? 'bg-gray-50 font-medium' : ''
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Stock Level Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={stockLevelFilter !== 'all' ? 'border-blue-500 text-blue-700' : ''}
                                        >
                                            {stockLevelOptions.find(opt => opt.value === stockLevelFilter)?.label}
                                            <ChevronDown className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        {stockLevelOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setStockLevelFilter(option.value)}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                                                    stockLevelFilter === option.value ? 'bg-gray-50 font-medium' : ''
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Reorder Status Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={reorderFilter !== 'all' ? 'border-blue-500 text-blue-700' : ''}
                                        >
                                            {reorderFilterOptions.find(opt => opt.value === reorderFilter)?.label}
                                            <ChevronDown className="ml-2 h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        {reorderFilterOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setReorderFilter(option.value)}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                                                    reorderFilter === option.value ? 'bg-gray-50 font-medium' : ''
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Clear Filters */}
                                {activeFiltersCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearAllFilters}
                                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <X className="h-4 w-4"/>
                                        Clear All ({activeFiltersCount})
                                    </Button>
                                )}
                            </div>

                            {/* Active Filters Display */}
                            {activeFiltersCount > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {searchTerm && (
                                        <span
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                            Search: "{searchTerm}"
                                            <button onClick={() => setSearchTerm('')}>
                                                <X className="h-3 w-3"/>
                                            </button>
                                        </span>
                                    )}
                                    {statusFilter !== 'all' && (
                                        <span
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                            {statusOptions.find(opt => opt.value === statusFilter)?.label}
                                            <button onClick={() => setStatusFilter('all')}>
                                                <X className="h-3 w-3"/>
                                            </button>
                                        </span>
                                    )}
                                    {stockLevelFilter !== 'all' && (
                                        <span
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                            {stockLevelOptions.find(opt => opt.value === stockLevelFilter)?.label}
                                            <button onClick={() => setStockLevelFilter('all')}>
                                                <X className="h-3 w-3"/>
                                            </button>
                                        </span>
                                    )}
                                    {reorderFilter !== 'all' && (
                                        <span
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                                            {reorderFilterOptions.find(opt => opt.value === reorderFilter)?.label}
                                            <button onClick={() => setReorderFilter('all')}>
                                                <X className="h-3 w-3"/>
                                            </button>
                                        </span>
                                    )}
                                    {(sortBy !== 'itemcode' || sortOrder !== 'asc') && (
                                        <span
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm">
                                            Sort: {sortOptions.find(opt => opt.value === sortBy)?.label} ({sortOrder === 'asc' ? '↑' : '↓'})
                                            <button onClick={() => {
                                                setSortBy('itemcode');
                                                setSortOrder('asc');
                                            }}>
                                                <X className="h-3 w-3"/>
                                            </button>
                                        </span>
                                    )}
                                </div>
                            )}

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
                                <>
                                    <StockTable
                                        stocks={paginated}
                                        startIndex={startIndex}
                                        onEdit={handleEditStock}
                                        onDelete={handleDelete}
                                        onBulkDelete={handleBulkDelete}
                                        onAddToReorder={handleAddToReorder}
                                    />

                                    {/* Results summary */}
                                    <div className="mt-4 text-sm text-gray-600">
                                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedStocks.length)} of {filteredAndSortedStocks.length} results
                                        {filteredAndSortedStocks.length !== stocks.length && (
                                            <span
                                                className="text-gray-500"> (filtered from {stocks.length} total)</span>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Pagination */}
                            {!loading && !error && filteredAndSortedStocks.length > 0 && (
                                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                                    <div className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
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
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex gap-4">
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
                            </div>
                            <DailyDispenseTabs selectedMonth={dispensedMonth} selectedYear={dispensedYear}/>
                        </div>
                    </TabsContent>

                    {/* === REORDER TAB === */}
                    <TabsContent value="reorder" className="space-y-6">
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
                                    onClick={handleExportReorderPDF}
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

                        <div className="rounded-lg border-2 border-gray-800 bg-white p-6">
                            {reorderLoading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                    <span className="ml-3 text-gray-600">Loading reorder items...</span>
                                </div>
                            )}

                            {reorderError && (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-600"/>
                                        <p className="text-sm text-red-700">{reorderError}</p>
                                    </div>
                                </div>
                            )}

                            {!reorderLoading && !reorderError && (
                                <>
                                    <ReorderTable
                                        items={reorderPaginated}
                                        startIndex={reorderStartIndex}
                                        onEdit={handleReorderEdit}
                                        onRemove={handleReorderRemove}
                                    />

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
        </ProtectedPage>
    )
}
