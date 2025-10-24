"use client"

import {Button} from "@/components/ui/button"
import {Edit2, Trash2, ChevronLeft, ChevronRight} from "lucide-react"
import type {Medicine} from "@/app/inventory/page"
import {useState, useEffect} from "react"

interface MedicineTableProps {
    medicines: Medicine[]
    onEdit: (medicine: Medicine) => void
    onDelete: (itemcode: string) => void
}

export function MedicineTable({medicines, onEdit, onDelete}: MedicineTableProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Reset to page 1 when medicines list changes (e.g., after search)
    useEffect(() => {
        setCurrentPage(1)
    }, [medicines.length])

    // Calculate pagination
    const totalPages = Math.ceil(medicines.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentMedicines = medicines.slice(startIndex, endIndex)

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
    }

    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1))
    }

    const goToPage = (page: number) => {
        setCurrentPage(page)
    }

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                    <thead className="border-b bg-gray-100 border-border">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold">Item Code</th>
                        <th className="px-4 py-3 text-left font-semibold">Description</th>
                        <th className="px-4 py-3 text-left font-semibold">Unit</th>
                        <th className="px-4 py-3 text-left font-semibold">Dosage</th>
                        <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                    {currentMedicines.map((medicine) => (
                        <tr key={medicine.itemcode} className="transition hover:bg-gray-50">
                            <td className="px-4 py-3">{medicine.itemcode}</td>
                            <td className="px-4 py-3">{medicine.itemdescription}</td>
                            <td className="px-4 py-3">{medicine.unitofmeasurement}</td>
                            <td className="px-4 py-3">{medicine.dosage}</td>
                            <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(medicine)}
                                            className="h-8 w-8">
                                        <Edit2 className="h-4 w-4"/>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(medicine.itemcode)}
                                        className="h-8 w-8 text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, medicines.length)} of {medicines.length} items
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="h-8"
                        >
                            <ChevronLeft className="h-4 w-4"/>
                            Previous
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => {
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                    return (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => goToPage(page)}
                                            className="h-8 w-8 p-0"
                                        >
                                            {page}
                                        </Button>
                                    )
                                } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                ) {
                                    return <span key={page} className="px-1">...</span>
                                }
                                return null
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="h-8"
                        >
                            Next
                            <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
