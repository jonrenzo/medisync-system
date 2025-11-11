"use client"

import {Button} from "@/components/ui/button"
import {Edit2, Trash2} from "lucide-react"

export interface InventoryItem {
    inventoryid: number
    itemcode: string
    batchlotno?: string
    expirationdate?: string
    quantityrequested?: number
    quantityissued?: number
    unitcost?: number
    totalamount?: number
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

export function InventoryTable({
                                   items,
                                   startIndex,
                                   onEdit,
                                   onDelete,
                               }: InventoryTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border border-gray-200">
                <thead className="bg-gray-100 text-gray-700">
                <tr>
                    <th className="px-4 py-2">Entry No.</th>
                    <th className="px-4 py-2">Item Code</th>
                    <th className="px-4 py-2">Item Description</th>
                    <th className="px-4 py-2">Unit Measurement</th>
                    <th className="px-4 py-2">Batch/Lot No.</th>
                    <th className="px-4 py-2">Expiration Date</th>
                    <th className="px-4 py-2">Quantity Requested</th>
                    <th className="px-4 py-2">Quantity Issued</th>
                    <th className="px-4 py-2">Unit Cost</th>
                    <th className="px-4 py-2">Total Amount</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                    <tr>
                        <td
                            colSpan={11}
                            className="py-8 text-center text-gray-500"
                        >
                            No inventory data available. Click Import to upload your data.
                        </td>
                    </tr>
                ) : (
                    items.map((item, index) => (
                        <tr key={item.inventoryid} className="hover:bg-gray-50">
                            <td className="px-4 py-2">{startIndex + index + 1}</td>
                            <td className="px-4 py-2">{item.itemcode}</td>
                            <td className="px-4 py-2">{item.itemdescription || "-"}</td>
                            <td className="px-4 py-2">{item.unitofmeasurement || "-"}</td>
                            <td className="px-4 py-2">{item.batchlotno || "-"}</td>
                            <td className="px-4 py-2">
                                {item.expirationdate
                                    ? new Date(item.expirationdate).toLocaleDateString()
                                    : "-"}
                            </td>
                            <td className="px-4 py-2">
                                {item.quantityrequested?.toLocaleString() || 0}
                            </td>
                            <td className="px-4 py-2">
                                {item.quantityissued?.toLocaleString() || 0}
                            </td>
                            <td className="px-4 py-2">
                                ₱{item.unitcost?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-4 py-2 font-medium">
                                ₱{item.totalamount?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-4 py-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(item)}
                                        className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                    >
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
        </div>
    )
}
