"use client"

import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import type { Medicine } from "@/app/inventory/page"

interface MedicineTableProps {
    medicines: Medicine[]
    onEdit: (medicine: Medicine) => void
    onDelete: (itemcode: string) => void
}

export function MedicineTable({ medicines, onEdit, onDelete }: MedicineTableProps) {
    return (
        <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-border">
                <tr>
                    <th className="px-4 py-3 text-left font-semibold">Item Code</th>
                    <th className="px-4 py-3 text-left font-semibold">Description</th>
                    <th className="px-4 py-3 text-left font-semibold">Unit</th>
                    <th className="px-4 py-3 text-left font-semibold">Dosage</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-border">
                {medicines.map((medicine) => (
                    <tr key={medicine.itemcode} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">{medicine.itemcode}</td>
                        <td className="px-4 py-3">{medicine.itemdescription}</td>
                        <td className="px-4 py-3">{medicine.unitofmeasurement}</td>
                        <td className="px-4 py-3">{medicine.dosage}</td>
                        <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(medicine)} className="h-8 w-8">
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(medicine.itemcode)}
                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
