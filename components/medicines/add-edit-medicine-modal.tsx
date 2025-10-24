"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, ChevronDown, AlertCircle } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Medicine } from "@/app/medicine-management/page"

interface AddEditMedicineModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (medicine: { itemcode: string; dosage: string; unitofmeasurement: string; itemdescription: string }) => Promise<void>
    medicine?: Medicine | null
}

export function AddEditMedicineModal({ isOpen, onClose, onSave, medicine }: AddEditMedicineModalProps) {
    const [formData, setFormData] = useState({
        itemcode: "",
        description: "",
        unit: "",
        dosage: "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const unitOptions = [
        "Tablet",
        "Syrup",
        "Capsule",
        "Sachet",
        "Vial",
        "Nebule",
        "Tube",
        "Rial",
        "Roll"
    ]

    useEffect(() => {
        if (isOpen) {
            setError(null)
            if (medicine) {
                setFormData({
                    itemcode: medicine.itemcode,
                    dosage: medicine.dosage,
                    unit: medicine.unitofmeasurement,
                    description: medicine.itemdescription || "",
                })
            } else {
                setFormData({
                    itemcode: "",
                    dosage: "",
                    unit: "",
                    description: "",
                })
            }
        }
    }, [medicine, isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.itemcode.trim()) {
            setError("Item code is required")
            return
        }
        if (!formData.dosage.trim()) {
            setError("Dosage is required")
            return
        }
        if (!formData.unit) {
            setError("Unit is required")
            return
        }

        setLoading(true)
        setError(null)

        try {
            await onSave({
                itemcode: formData.itemcode.trim(),
                dosage: formData.dosage.trim(),
                unitofmeasurement: formData.unit,
                itemdescription: formData.description.trim(),
            })
            // Success - parent will close modal
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save medicine")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-lg font-semibold">{medicine ? "Edit Medicine" : "Add New Medicine"}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={loading}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Item Code <span className="text-red-500">*</span>
                        </label>
                        <Input
                            name="itemcode"
                            value={formData.itemcode}
                            onChange={handleChange}
                            disabled={!!medicine || loading}
                            placeholder="e.g., MED001"
                            required
                        />
                        {medicine && (
                            <p className="text-xs text-gray-500 mt-1">Item code cannot be changed</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Optional description"
                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            rows={3}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Dosage <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            name="dosage"
                            value={formData.dosage}
                            onChange={handleChange}
                            placeholder="e.g., 500mg"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Unit <span className="text-red-500">*</span>
                        </label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between bg-white"
                                    type="button"
                                    disabled={loading}
                                >
                                    {formData.unit || "Select unit"}
                                    <ChevronDown className="w-4 h-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="start" avoidCollisions={false} className="w-40" onCloseAutoFocus={(e) => e.preventDefault()}>
                                {unitOptions.map((unit) => (
                                    <button
                                        key={unit}
                                        type="button"
                                        onClick={(e) => {
                                            setFormData(prev => ({ ...prev, unit }))
                                            e.currentTarget.closest('[role="menu"]')?.dispatchEvent(
                                                new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
                                            )
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 bg-transparent"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? "Saving..." : medicine ? "Update" : "Add Medicine"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
