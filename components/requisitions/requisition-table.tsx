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

export function InventoryTable({items, startIndex, onEdit, onDelete}: InventoryTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <tr>
                        Entry No.
                    </th>
                        Item Code
                    </th>
                        Item Description
                    </th>
                        Unit Measurement
                    </th>
                        Batch/Lot No.
                    </th>
                        Expiration Date
                    </th>
                        Quantity Requested
                    </th>
                        Quantity Issued
                    </th>
                        Unit Cost
                    </th>
                        Total Amount
                    </th>
                        Actions
                    </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    <tr>
                        <td colSpan={12} className="py-8 text-center text-gray-500">
                            No inventory data available. Click Import to upload your data.
                        </td>
                    </tr>
                ) : (
                        <tr key={item.inventoryid} className="hover:bg-gray-50">
                                {item.expirationdate ? new Date(item.expirationdate).toLocaleDateString() : "-"}
                            </td>
                                {item.quantityrequested?.toLocaleString() || 0}
                            </td>
                                {item.quantityissued?.toLocaleString() || 0}
                            </td>
                                ₱{item.totalamount?.toFixed(2) || "0.00"}
                            </td>
                                <div className="flex items-center justify-center gap-2">
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(item.inventoryid)}
                                        className="h-8 w-8 text-red-600 hover:text-red-700"
                                    >
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
