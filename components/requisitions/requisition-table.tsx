"use client"

import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"

export interface InventoryItem {
    inventoryid: number
    itemcode: string
    batchlotno?: string
    expirationdate?: string
    quantityrequested?: number
    quantityissued?: number
    unitcost?: number
    totalamount?: number
    // Extended fields from joined items table
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

export function InventoryTable({ items, startIndex, onEdit, onDelete }: InventoryTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-100 border-b border-border">
                <tr>
                    <th className="text-left py-3 px-3 font-semibold text-foreground text-xs uppercase tracking-wider w-[8%]">
                        Entry No.
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground text-xs uppercase tracking-wider w-[10%]">
                        Item Code
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground text-xs uppercase tracking-wider w-[15%]">
                        Item Description
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground text-xs uppercase tracking-wider w-[10%]">
                        Unit Measurement
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground text-xs uppercase tracking-wider w-[8%]">
                        Batch/Lot No.
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground text-xs uppercase tracking-wider w-[10%]">
                        Expiration Date
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground text-xs uppercase tracking-wider w-[8%]">
                        Quantity Requested
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground text-xs uppercase tracking-wider w-[8%]">
                        Quantity Issued
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground text-xs uppercase tracking-wider w-[8%]">
                        Unit Cost
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-foreground text-xs uppercase tracking-wider w-[10%]">
                        Total Amount
                    </th>
                    <th className="text-center py-3 px-3 font-semibold text-foreground text-xs uppercase tracking-wider w-[8%]">
                        Actions
                    </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                    <tr>
                        <td colSpan={12} className="py-8 text-center text-gray-500">
                            No inventory data available. Click Import to upload your data.
                        </td>
                    </tr>
                ) : (
                    items.map((item, index) => (
                        <tr key={item.inventoryid} className="hover:bg-gray-50">
                            <td className="py-3 px-3 text-foreground text-sm">{startIndex + index + 1}</td>
                            <td className="py-3 px-3 text-gray-600 text-sm">{item.itemcode}</td>
                            <td className="py-3 px-3 text-foreground font-medium text-sm">
                                {item.itemdescription || "-"}
                            </td>
                            <td className="py-3 px-3 text-gray-600 text-sm capitalize">
                                {item.unitofmeasurement || "-"}
                            </td>
                            <td className="py-3 px-3 text-gray-600 text-sm">{item.batchlotno || "-"}</td>
                            <td className="py-3 px-3 text-gray-600 text-sm">
                                {item.expirationdate ? new Date(item.expirationdate).toLocaleDateString() : "-"}
                            </td>
                            <td className="py-3 px-3 text-gray-600 text-sm">
                                {item.quantityrequested?.toLocaleString() || 0}
                            </td>
                            <td className="py-3 px-3 text-gray-600 text-sm">
                                {item.quantityissued?.toLocaleString() || 0}
                            </td>
                            <td className="py-3 px-3 text-gray-600 text-sm">
                                ₱{item.unitcost?.toFixed(2) || "0.00"}
                            </td>
                            <td className="py-3 px-3 text-foreground font-medium text-sm">
                                ₱{item.totalamount?.toFixed(2) || "0.00"}
                            </td>
                            <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(item)}
                                        className="h-8 w-8"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(item.inventoryid)}
                                        className="h-8 w-8 text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    )
}
