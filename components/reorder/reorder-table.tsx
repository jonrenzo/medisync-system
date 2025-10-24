"use client"

import {Edit2, Minus} from "lucide-react"
import {Button} from "@/components/ui/button"

export interface ReorderItem {
    id: number
    itemcode: string
    itemdescription: string
    unitofmeasurement: string
    stockonhand: number
    dosage: string
    quantityrequested: number
    personincharge: string
    removetolist: boolean
}

interface ReorderTableProps {
    items: ReorderItem[]
    startIndex: number
    onEdit: (item: ReorderItem) => void
    onRemove: (id: number) => void
}

export function ReorderTable({items, startIndex, onEdit, onRemove}: ReorderTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item Description</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unit of Measurement</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Dosage</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock on Hand</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Quantity Requested</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Person in Charge</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Edit</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Remove to list for
                        reordering
                    </th>
                </tr>
                </thead>
                <tbody>
                {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{item.itemdescription}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.unitofmeasurement}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.dosage}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.stockonhand}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.quantityrequested}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.personincharge}</td>
                        <td className="px-4 py-3 text-center">
                            <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-8 w-8 p-0">
                                <Edit2 className="h-4 w-4"/>
                            </Button>
                        </td>
                        <td className="px-4 py-3 text-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemove(item.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                                <Minus className="h-4 w-4"/>
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
