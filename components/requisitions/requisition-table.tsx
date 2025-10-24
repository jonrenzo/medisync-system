"use client"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Edit2, Trash2} from "lucide-react"

export interface InventoryItem {
    month: number
    year: number
    inventoryid: number
    itemcode: string
    batchlotno?: string
    expirationdate?: string
    quantityrequested?: number
    quantityissued?: number
    unitcost?: number
    totalamount?: number
    purchaseOrderNo?: string
    itemdescription?: string
    dosage?: string
    unitofmeasurement?: string
}

interface InventoryTableProps {
    items: InventoryItem[]
    startIndex: number
    onEdit: (item: InventoryItem) => void
    onDelete: (inventoryid: number) => void
}

export function InventoryTable({items, startIndex, onEdit, onDelete}: InventoryTableProps) {
    const itemsPerPage = 10
    const [currentPage, setCurrentPage] = useState(1)

    const totalPages = Math.ceil(items.length / itemsPerPage)
    const startIdx = (currentPage - 1) * itemsPerPage
    const currentItems = items.slice(startIdx, startIdx + itemsPerPage)

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1)
    }

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1)
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="border-b bg-gray-100 border-border">
                <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[8%]">
                        Entry No.
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[10%]">
                        Item Code
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[15%]">
                        Item Description
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[10%]">
                        Unit Measurement
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[8%]">
                        Batch/Lot No.
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[8%]">
                        Purchase Order No.
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[10%]">
                        Expiration Date
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[8%]">
                        Quantity Requested
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[8%]">
                        Quantity Issued
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[8%]">
                        Unit Cost
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[10%]">
                        Total Amount
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-foreground w-[8%]">
                        Actions
                    </th>
                </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                {currentItems.length === 0 ? (
                    <tr>
                        <td colSpan={12} className="py-8 text-center text-gray-500">
                            No inventory data available. Click Import to upload your data.
                        </td>
                    </tr>
                ) : (
                    currentItems.map((item, index) => (
                        <tr key={item.inventoryid} className="hover:bg-gray-50">
                            <td className="px-3 py-3 text-sm text-foreground">{startIdx + index + 1}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{item.itemcode}</td>
                            <td className="px-3 py-3 text-sm font-medium text-foreground">{item.itemdescription || "-"}</td>
                            <td className="px-3 py-3 text-sm capitalize text-gray-600">{item.unitofmeasurement || "-"}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{item.batchlotno || "-"}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{item.purchaseOrderNo || "-"}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">
                                {item.expirationdate ? new Date(item.expirationdate).toLocaleDateString() : "-"}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600">
                                {item.quantityrequested?.toLocaleString() || 0}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600">
                                {item.quantityissued?.toLocaleString() || 0}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600">₱{item.unitcost?.toFixed(2) || "0.00"}</td>
                            <td className="px-3 py-3 text-sm font-medium text-foreground">
                                ₱{item.totalamount?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}
                                            className="h-8 w-8">
                                        <Edit2 className="h-4 w-4"/>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(item.inventoryid)}
                                        className="h-8 w-8 text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>

            {/* Pagination Controls */}
            {items.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-4 px-3">
                    <Button onClick={handlePrevious} disabled={currentPage === 1} variant="outline">
                        Previous
                    </Button>

                    <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

                    <Button onClick={handleNext} disabled={currentPage === totalPages} variant="outline">
                        Next
                    </Button>
                </div>
            )}
        </div>
    )
}
