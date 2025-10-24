"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { Bell, ChevronDown, Loader2, AlertCircle, Plus } from "lucide-react"

export default function StocksManagement() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedMonth, setSelectedMonth] = useState("October")
    const [selectedYear, setSelectedYear] = useState("2025")
    const [currentPage, setCurrentPage] = useState(1)

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

    const items = [
        { id: 1, description: "Aciclovir", unit: "Tablet", dosage: 400, beginning: 120, stock: 20, status: "Low" },
        { id: 2, description: "Aciclovir", unit: "Tablet", dosage: 400, beginning: 120, stock: 20, status: "Low" },
        { id: 3, description: "Aciclovir", unit: "Tablet", dosage: 400, beginning: 120, stock: 20, status: "Low" },
    ]

    // pagination setup
    const itemsPerPage = 5
    const filteredData = items.filter((item) => item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedData = filteredData.slice(startIndex, endIndex)

    useEffect(() => {
        // simulate loading
        setLoading(true)
        const timer = setTimeout(() => setLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="bg-background min-h-screen p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Stocks Management</h1>
                <Button variant="outline" size="icon" className="rounded-lg bg-transparent">
                    <Bell className="w-5 h-5" />
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
                    {/* Month/Year + Export */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-4">
                            {/* Month */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-40 justify-between bg-transparent">
                                        {selectedMonth}
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40">
                                    {months.map((month) => (
                                        <button
                                            key={month}
                                            onClick={() => setSelectedMonth(month)}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
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
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40">
                                    {years.map((year) => (
                                        <button
                                            key={year}
                                            onClick={() => setSelectedYear(year)}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <Button variant="outline">Export</Button>
                    </div>

                    {/* Search / Filter / Delete */}
                    <div className="border-2 border-gray-800 rounded-lg p-6 bg-white">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-55"
                                />
                                <Button variant="outline">Filter</Button>
                            </div>
                            <Button variant="outline">Delete</Button>
                        </div>

                        {/* === Loading State === */}
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="ml-3 text-gray-600">Loading inventory data...</span>
                            </div>
                        )}

                        {/* === Error State === */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <p className="text-sm text-red-700">Error loading data: {error}</p>
                                </div>
                            </div>
                        )}

                        {/* === Table === */}
                        {!loading && !error && (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 border-b border-gray-300">
                                    <tr>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Item Description
                                        </th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Unit of Measurement
                                        </th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">Dosage</th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Beginning Balance
                                        </th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Stock on Hand
                                        </th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Stock Status
                                        </th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Add to List for Reordering
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-gray-500">
                                                {searchTerm ? "No items match your search." : "No stock data available."}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-3 text-sm">{item.description}</td>
                                                <td className="py-3 px-3 text-sm">{item.unit}</td>
                                                <td className="py-3 px-3 text-sm">{item.dosage}</td>
                                                <td className="py-3 px-3 text-sm">{item.beginning}</td>
                                                <td className="py-3 px-3 text-sm">{item.stock}</td>
                                                <td className="py-3 px-3 text-sm text-red-600 font-medium">{item.status}</td>
                                                <td className="py-3 px-3 text-sm text-center">
                                                    <Button variant="ghost" size="icon">
                                                        <Plus className="w-5 h-5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* === Pagination === */}
                        {!loading && !error && filteredData.length > 0 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
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

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(
                                                (page) =>
                                                    page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1),
                                            )
                                            .map((page, index, array) => {
                                                const prevPage = array[index - 1]
                                                const showEllipsis = prevPage && page - prevPage > 1
                                                return (
                                                    <div key={page} className="flex items-center">
                                                        {showEllipsis && <span className="px-2 text-gray-500">...</span>}
                                                        <Button
                                                            variant={currentPage === page ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => setCurrentPage(page)}
                                                            className={`w-9 h-9 ${
                                                                currentPage === page ? "bg-foreground text-background" : "border-gray-300"
                                                            }`}
                                                        >
                                                            {page}
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                    </div>

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
                    <div className="flex flex-col gap-6 border border-border rounded-lg p-6 bg-white">
                        {/* === Sidebar Tabs === */}
                        <Tabs defaultValue="MSD-MED 001" className="flex flex-row gap-6 w-full">
                            <TabsList className="flex flex-col border border-border rounded-lg w-48 p-2 bg-white gap-1 h-fit">
                                {["MSD-MED 001", "MSD-MED 002", "MSD-MED 003", "MSD-MED 004"].map((item) => (
                                    <TabsTrigger
                                        key={item}
                                        value={item}
                                        className="w-full text-left border border-border rounded px-3 py-2 font-medium transition text-sm data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:border-gray-800 hover:bg-gray-50"
                                    >
                                        {item}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {/* === Tab Panels === */}
                            <div className="flex-1 space-y-6">
                                {["MSD-MED 001", "MSD-MED 002", "MSD-MED 003", "MSD-MED 004"].map((item) => (
                                    <TabsContent key={item} value={item} className="space-y-6 mt-0">
                                        <div>
                                            <h3 className="text-sm font-semibold mb-3">Dispense Activity</h3>
                                            <div className="border-2 border-dashed border-border rounded-lg p-4 grid grid-cols-2 gap-4 text-sm bg-white">
                                                <div className="space-y-2">
                                                    <p>
                                                        <span className="font-semibold">Item Description:</span>
                                                    </p>
                                                    <p className="text-gray-600">Paracetamol</p>
                                                    <p className="mt-3">
                                                        <span className="font-semibold">Item Dosage:</span>
                                                    </p>
                                                    <p className="text-gray-600">400 mg</p>
                                                    <p className="mt-3">
                                                        <span className="font-semibold">Unit of Measurement:</span>
                                                    </p>
                                                    <p className="text-gray-600">Tablet</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <p>
                                                        <span className="font-semibold">Beginning Balance:</span>
                                                    </p>
                                                    <p className="text-gray-600">Stock on Hand</p>
                                                    <p className="mt-3">
                                                        <span className="font-semibold">Stock on Hand:</span>
                                                    </p>
                                                    <p className="text-gray-600">Stock on Hand</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <Button variant="outline" className="border-border bg-transparent">
                                                Add a record
                                            </Button>
                                            <Button variant="outline" className="border-border bg-transparent">
                                                Delete a record
                                            </Button>
                                            <Button variant="outline" className="border-border bg-transparent">
                                                Export
                                            </Button>
                                        </div>

                                        <div className="overflow-x-auto border border-border rounded-lg">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-100 border-b border-border">
                                                <tr>
                                                    <th className="border-r border-border px-4 py-3 text-left font-semibold">Patient Name</th>
                                                    <th className="border-r border-border px-4 py-3 text-left font-semibold">Patient Age</th>
                                                    <th className="border-r border-border px-4 py-3 text-left font-semibold">
                                                        Date Issued to Patient
                                                    </th>
                                                    <th className="border-r border-border px-4 py-3 text-left font-semibold">
                                                        Issued Quantity
                                                    </th>
                                                    <th className="border-r border-border px-4 py-3 text-left font-semibold">Remarks</th>
                                                    <th className="border-r border-border px-4 py-3 text-left font-semibold">
                                                        Expiration Date
                                                    </th>
                                                    <th className="px-4 py-3 text-center font-semibold">Edit</th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                {[1, 2, 3].map((row) => (
                                                    <tr key={row} className="hover:bg-gray-50 transition">
                                                        <td className="border-r border-border px-4 py-3">Juan Dela Cruz</td>
                                                        <td className="border-r border-border px-4 py-3">22</td>
                                                        <td className="border-r border-border px-4 py-3">2025-10-12</td>
                                                        <td className="border-r border-border px-4 py-3">5</td>
                                                        <td className="border-r border-border px-4 py-3">Mild fever</td>
                                                        <td className="border-r border-border px-4 py-3">2026-01-01</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={1.5}
                                                                    stroke="currentColor"
                                                                    className="w-4 h-4"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M16.862 3.487a2.126 2.126 0 0 1 3.004 3.004l-9.106 9.106a4.5 4.5 0 0 1-1.732 1.08l-3.39 1.13 1.13-3.39a4.5 4.5 0 0 1 1.08-1.732l9.114-9.114z"
                                                                    />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.5L16.5 4.5" />
                                                                </svg>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </TabsContent>
                                ))}
                            </div>
                        </Tabs>
                    </div>
                </TabsContent>

                {/* === REORDER TAB === */}
                <TabsContent value="reorder" className="space-y-6">
                    {/* Search / Filter / Delete */}
                    <div className="border-2 border-gray-800 rounded-lg p-6 bg-white">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-55"
                                />
                                <Button variant="outline">Filter</Button>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline">Export</Button>
                                <Button variant="outline" className="w-38 bg-transparent">
                                    Send Report
                                </Button>
                            </div>
                        </div>

                        {/* === Loading State === */}
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="ml-3 text-gray-600">Loading inventory data...</span>
                            </div>
                        )}

                        {/* === Error State === */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <p className="text-sm text-red-700">Error loading data: {error}</p>
                                </div>
                            </div>
                        )}

                        {/* === Table === */}
                        {!loading && !error && (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 border-b border-gray-300">
                                    <tr>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Item Description
                                        </th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Unit of Measurement
                                        </th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">Dosage</th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Beginning Balance
                                        </th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Stock on Hand
                                        </th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Stock Status
                                        </th>
                                        <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider">
                                            Add to List for Reordering
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-gray-500">
                                                {searchTerm ? "No items match your search." : "No stock data available."}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-3 text-sm">{item.description}</td>
                                                <td className="py-3 px-3 text-sm">{item.unit}</td>
                                                <td className="py-3 px-3 text-sm">{item.dosage}</td>
                                                <td className="py-3 px-3 text-sm">{item.beginning}</td>
                                                <td className="py-3 px-3 text-sm">{item.stock}</td>
                                                <td className="py-3 px-3 text-sm text-red-600 font-medium">{item.status}</td>
                                                <td className="py-3 px-3 text-sm text-center">
                                                    <Button variant="ghost" size="icon">
                                                        <Plus className="w-5 h-5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* === Pagination === */}
                        {!loading && !error && filteredData.length > 0 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
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

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(
                                                (page) =>
                                                    page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1),
                                            )
                                            .map((page, index, array) => {
                                                const prevPage = array[index - 1]
                                                const showEllipsis = prevPage && page - prevPage > 1
                                                return (
                                                    <div key={page} className="flex items-center">
                                                        {showEllipsis && <span className="px-2 text-gray-500">...</span>}
                                                        <Button
                                                            variant={currentPage === page ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => setCurrentPage(page)}
                                                            className={`w-9 h-9 ${
                                                                currentPage === page ? "bg-foreground text-background" : "border-gray-300"
                                                            }`}
                                                        >
                                                            {page}
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                    </div>

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
            </Tabs>
        </div>
    )
}
