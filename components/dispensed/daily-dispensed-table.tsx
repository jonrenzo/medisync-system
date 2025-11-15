"use client"

import {useState, useEffect} from "react"
import {supabase} from "@/lib/supabase"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {Checkbox} from "@/components/ui/checkbox"
import {AddDispenseRecordModal} from "@/components/dispensed/add-edit-dispensed-modal"
import {Pencil, Trash2} from "lucide-react"
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


interface Stock {
    stockid: number
    itemcode: string
    beginningbalance: number
    stockonhand: number
    stockstatus: string
    listtoreorder: boolean
    itemdescription?: string
    dosage?: string
    unitofmeasurement?: string
    month?: number
    year?: number
}

interface UtilizationRecord {
    dispensedid: number
    itemcode: string
    patientname: string
    patientage: number
    dateissued: string
    issuedquantity: number
    remarks: string
    expirationdate: string
}

interface DailyDispenseTabsProps {
    selectedMonth: string
    selectedYear: string
}

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

export function DailyDispenseTabs({selectedMonth, selectedYear}: DailyDispenseTabsProps) {
    const [stocks, setStocks] = useState<Stock[]>([])
    const [records, setRecords] = useState<Record<string, UtilizationRecord[]>>({})
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeItemCode, setActiveItemCode] = useState<string | null>(null)
    const [editingRecord, setEditingRecord] = useState<UtilizationRecord | null>(null)
    const [selectedIds, setSelectedIds] = useState<Record<string, number[]>>({})
    const [activeTab, setActiveTab] = useState<string>("")
    const [searchTerm, setSearchTerm] = useState("")


    // === Fetch Stocks ===
    useEffect(() => {
        const fetchStocks = async () => {
            setLoading(true)

            // Convert month name to number (1-12)
            const monthNumber = months.indexOf(selectedMonth) + 1
            const yearNumber = parseInt(selectedYear)

            const {data, error} = await supabase
                .from("stocks")
                .select(
                    "stockid, itemcode, itemdescription, dosage, unitofmeasurement, beginningbalance, stockonhand, stockstatus, listtoreorder, month, year"
                )
                .eq("month", monthNumber)
                .eq("year", yearNumber)
                .order("stockid", {ascending: true})

            if (!error && data) {
                setStocks(data)
                if (data.length > 0) {
                    setActiveTab(data[0].itemcode)
                }
            }
            setLoading(false)
        }
        fetchStocks()
    }, [selectedMonth, selectedYear])

    // === Fetch Utilization Records ===
    useEffect(() => {
        if (stocks.length === 0) return

        const fetchRecords = async () => {
            const allRecords: Record<string, UtilizationRecord[]> = {}
            for (const stock of stocks) {
                const {data, error} = await supabase
                    .from("utilizationrecord")
                    .select("*")
                    .eq("itemcode", stock.itemcode)
                    .order("dateissued", {ascending: false})
                if (!error && data) allRecords[stock.itemcode] = data
            }
            setRecords(allRecords)
        }

        fetchRecords()
    }, [stocks])

    // === Selection Handlers ===
    const handleSelectAll = (itemcode: string, checked: boolean) => {
        if (checked) {
            const allIds = records[itemcode]?.map(r => r.dispensedid) || []
            setSelectedIds(prev => ({...prev, [itemcode]: allIds}))
        } else {
            setSelectedIds(prev => ({...prev, [itemcode]: []}))
        }
    }

    const handleSelectOne = (itemcode: string, dispensedid: number, checked: boolean) => {
        setSelectedIds(prev => {
            const currentIds = prev[itemcode] || []
            if (checked) {
                return {...prev, [itemcode]: [...currentIds, dispensedid]}
            } else {
                return {...prev, [itemcode]: currentIds.filter(id => id !== dispensedid)}
            }
        })
    }

    // === Bulk Delete Handler ===
    const handleBulkDelete = async (itemcode: string) => {
        const ids = selectedIds[itemcode] || []
        if (ids.length === 0) return

        if (!confirm(`Are you sure you want to delete ${ids.length} record(s)?`)) return

        try {
            const {error} = await supabase
                .from("utilizationrecord")
                .delete()
                .in("dispensedid", ids)

            if (error) throw error

            // Refresh records and clear selection
            await refreshRecords(itemcode)
            setSelectedIds(prev => ({...prev, [itemcode]: []}))
            alert(`Successfully deleted ${ids.length} record(s)`)
        } catch (err: any) {
            alert("Error deleting records: " + err.message)
        }
    }

    // === Refresh Records + Stockonhand After Adding/Editing ===
    const refreshRecords = async (itemcode: string) => {
        const {data: utilizationData} = await supabase
            .from("utilizationrecord")
            .select("*")
            .eq("itemcode", itemcode)
            .order("dateissued", {ascending: false})

        const {data: stockData} = await supabase
            .from("stocks")
            .select("stockonhand")
            .eq("itemcode", itemcode)
            .single()

        setRecords((prev) => ({
            ...prev,
            [itemcode]: utilizationData || [],
        }))

        setStocks((prev) =>
            prev.map((s) =>
                s.itemcode === itemcode
                    ? {...s, stockonhand: stockData?.stockonhand ?? s.stockonhand}
                    : s
            )
        )
    }

    const handleEdit = (record: UtilizationRecord) => {
        setEditingRecord(record)
        setActiveItemCode(record.itemcode)
        setIsModalOpen(true)
    }

    const handleExportDailyPDF = () => {
        if (!activeStock) {
            alert("No active medicine selected.");
            return;
        }

        const itemcode = activeStock.itemcode;
        const data = records[itemcode] || [];

        const doc = new jsPDF("p", "mm", "a4");

        // --- Header ---
        doc.setFontSize(16);
        doc.text("Daily Dispense Report", 14, 16);

        doc.setFontSize(12);
        doc.text(`Month: ${selectedMonth}`, 14, 24);
        doc.text(`Year: ${selectedYear}`, 14, 30);

        // --- Item Details ---
        doc.setFontSize(11);
        doc.text(`Item Description: ${activeStock.itemdescription}`, 14, 40);
        doc.text(`Dosage: ${activeStock.dosage}`, 14, 46);
        doc.text(`Unit: ${activeStock.unitofmeasurement}`, 14, 52);
        doc.text(`Beginning Balance: ${activeStock.beginningbalance}`, 14, 58);
        doc.text(`Stock on Hand: ${activeStock.stockonhand}`, 14, 64);
        doc.text(`Status: ${activeStock.stockstatus}`, 14, 70);

        // --- Table Columns ---
        const tableColumn = [
            "Patient",
            "Age",
            "Date Issued",
            "Qty",
            "Remarks",
            "Expiration"
        ];

        // --- Table Rows ---
        const tableRows = data.map((r) => [
            r.patientname,
            r.patientage,
            r.dateissued,
            r.issuedquantity,
            r.remarks,
            r.expirationdate
        ]);

        // --- Generate table ---
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 80,
            styles: {fontSize: 9}
        });

        // --- Save PDF ---
        doc.save(
            `dispensed-${activeStock.itemdescription}-${selectedMonth}-${selectedYear}.pdf`
        );
    };


    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingRecord(null)
        setActiveItemCode(null)
    }

    if (loading)
        return <div className="flex items-center justify-center py-12 text-gray-500">Loading stock records...</div>

    if (stocks.length === 0)
        return <div className="flex items-center justify-center py-12 text-gray-500">No stock records found
            for {selectedMonth} {selectedYear}.</div>

    // Find the active stock
    const activeStock = stocks.find(s => s.itemcode === activeTab)
    if (!activeStock) return null

    const currentSelectedIds = selectedIds[activeStock.itemcode] || []
    const allSelected = records[activeStock.itemcode]?.length > 0 &&
        currentSelectedIds.length === records[activeStock.itemcode]?.length

    return (
        <div className="w-full space-y-4">
            {/* 🔍 Search Bar */}
            <Input
                placeholder="Search medicine…"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                }
                className="w-64"
            />

            <div className="flex flex-row gap-6 w-full">

                {/* Sidebar */}
                <div
                    className="flex h-96 w-48 flex-col gap-1 overflow-y-auto rounded-lg border bg-white p-2 border-border shrink-0">
                    {stocks
                        .filter((s) =>
                            s.itemcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.itemdescription ?? "").toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((stock) => (

                            <button
                                key={stock.stockid}
                                onClick={() => setActiveTab(stock.itemcode)}
                                className={`w-full text-left border border-border rounded px-3 py-2 font-medium transition text-sm hover:bg-gray-50 ${
                                    activeTab === stock.itemcode
                                        ? 'bg-gray-800 text-white border-gray-800'
                                        : 'bg-white text-gray-900'
                                }`}
                            >
                                {stock.itemdescription}
                            </button>
                        ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 space-y-6">
                    {/* === Stock Details === */}
                    <div>
                        <h3 className="mb-3 text-sm font-semibold">Dispense Activity</h3>
                        <div
                            className="grid grid-cols-2 gap-4 rounded-lg border-2 border-dashed bg-white p-4 text-sm border-border">
                            <div className="space-y-2">
                                <p><span className="font-semibold">Item Description:</span></p>
                                <p className="text-gray-600">{activeStock.itemdescription || "—"}</p>
                                <p className="mt-3"><span className="font-semibold">Dosage:</span></p>
                                <p className="text-gray-600">{activeStock.dosage || "—"}</p>
                                <p className="mt-3"><span className="font-semibold">Unit:</span></p>
                                <p className="text-gray-600">{activeStock.unitofmeasurement || "—"}</p>
                            </div>
                            <div className="space-y-2">
                                <p><span className="font-semibold">Beginning Balance:</span></p>
                                <p className="text-gray-600">{activeStock.beginningbalance}</p>
                                <p className="mt-3"><span className="font-semibold">Stock on Hand:</span></p>
                                <p className="text-gray-600">{activeStock.stockonhand}</p>
                                <p className="mt-3"><span className="font-semibold">Status:</span></p>
                                <p className="text-gray-600">{activeStock.stockstatus}</p>
                            </div>
                        </div>
                    </div>

                    {/* === Actions === */}
                    <div className="flex justify-between items-center gap-3">
                        {currentSelectedIds.length > 0 && (
                            <div
                                className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2">
                            <span className="text-sm font-medium text-blue-900">
                                {currentSelectedIds.length} record{currentSelectedIds.length > 1 ? 's' : ''} selected
                            </span>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleBulkDelete(activeStock.itemcode)}
                                    className="flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                    Delete Selected
                                </Button>
                            </div>
                        )}
                        <div className={`flex gap-3 ${currentSelectedIds.length === 0 ? 'ml-auto' : ''}`}>
                            <Button
                                variant="outline"
                                onClick={handleExportDailyPDF}
                                className="border-border bg-transparent"
                            >
                                Export PDF
                            </Button>

                            <Button
                                variant="outline"
                                className="bg-transparent border-border"
                                onClick={() => {
                                    setActiveItemCode(activeStock.itemcode)
                                    setEditingRecord(null)
                                    setIsModalOpen(true)
                                }}
                            >
                                Add Record
                            </Button>
                        </div>

                    </div>

                    {/* === Table === */}
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-gray-100 border-border">
                            <tr>
                                <th className="border-r px-4 py-3 text-left border-border w-[3%]">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={(checked) => handleSelectAll(activeStock.itemcode, checked as boolean)}
                                        aria-label="Select all"
                                    />
                                </th>
                                <th className="border-r px-4 py-3 text-left font-semibold border-border">Patient</th>
                                <th className="border-r px-4 py-3 text-left font-semibold border-border">Age</th>
                                <th className="border-r px-4 py-3 text-left font-semibold border-border">Date Issued
                                </th>
                                <th className="border-r px-4 py-3 text-left font-semibold border-border">Qty</th>
                                <th className="border-r px-4 py-3 text-left font-semibold border-border">Remarks</th>
                                <th className="border-r px-4 py-3 text-left font-semibold border-border">Expiration</th>
                                <th className="px-4 py-3 text-left font-semibold border-border">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                            {records[activeStock.itemcode]?.length ? (
                                records[activeStock.itemcode].map((r) => (
                                    <tr
                                        key={r.dispensedid}
                                        className={`hover:bg-gray-50 transition ${currentSelectedIds.includes(r.dispensedid) ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="border-r px-4 py-3 border-border">
                                            <Checkbox
                                                checked={currentSelectedIds.includes(r.dispensedid)}
                                                onCheckedChange={(checked) => handleSelectOne(activeStock.itemcode, r.dispensedid, checked as boolean)}
                                                aria-label={`Select record for ${r.patientname}`}
                                            />
                                        </td>
                                        <td className="border-r px-4 py-3 border-border">{r.patientname}</td>
                                        <td className="border-r px-4 py-3 border-border">{r.patientage}</td>
                                        <td className="border-r px-4 py-3 border-border">{r.dateissued}</td>
                                        <td className="border-r px-4 py-3 border-border">{r.issuedquantity}</td>
                                        <td className="border-r px-4 py-3 border-border">{r.remarks}</td>
                                        <td className="border-r px-4 py-3 border-border">{r.expirationdate}</td>
                                        <td className="px-8 py-3 border-border">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(r)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Pencil className="h-4 w-4"/>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-4 text-center text-gray-500">
                                        No dispense records found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                <AddDispenseRecordModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    itemcode={activeItemCode}
                    editingRecord={editingRecord}
                    onRecordAdded={refreshRecords}
                />
            </div>
        </div>
    )
}
