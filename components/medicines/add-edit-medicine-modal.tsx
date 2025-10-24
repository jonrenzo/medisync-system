"use client"

import type React from "react"
import {useState, useEffect} from "react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {X, ChevronDown, AlertCircle} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type {Medicine} from "@/app/inventory/page"

interface AddEditMedicineModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (medicine: {
        itemcode: string
        dosage: string
        unitofmeasurement: string
        itemdescription: string
    }) => Promise<void>
    medicine?: Medicine | null
}

export function AddEditMedicineModal({
                                         isOpen,
                                         onClose,
                                         onSave,
                                         medicine,
                                     }: AddEditMedicineModalProps) {
    const [formData, setFormData] = useState({
        itemcode: "",
        description: "",
        unit: "",
        dosage: "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [manualEdit, setManualEdit] = useState({dosage: false, unit: false})

    const unitOptions = [
        "Tablet",
        "Syrup",
        "Capsule",
        "Sachet",
        "Vial",
        "Nebule",
        "Tube",
        "Rial",
        "Roll",
    ]

    useEffect(() => {
        if (isOpen) {
            setError(null)
            setManualEdit({dosage: false, unit: false})
            if (medicine) {
                setFormData({
                    itemcode: medicine.itemcode,
                    dosage: medicine.dosage || "",
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

    // 🔍 Function to parse dosage and unit from description
    const parseDosageAndUnit = (text: string) => {
        const dosagePattern = /(\d+(\.\d+)?\s?(mg|g|mcg|ml|IU|units|%))/i
        const unitPattern = /\b(tablet|tab|capsule|cap|ampule|vial|bottle|syrup|piece|pcs|patch|drop|cream|ointment|tube|sachet|suspension|solution|suppository|kit|bag|pack|nebule|roll)\b/i

        const dosageMatch = text.match(dosagePattern)
        const unitMatch = text.match(unitPattern)

        return {
            dosage: dosageMatch ? dosageMatch[0] : "",
            unit: unitMatch ? unitMatch[0] : "",
        }
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const {name, value} = e.target

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))

        // 🧠 Auto-parse dosage & unit from description input
        if (name === "description") {
            const parsed = parseDosageAndUnit(value)

            setFormData((prev) => ({
                ...prev,
                dosage: manualEdit.dosage ? prev.dosage : parsed.dosage || prev.dosage,
                unit: manualEdit.unit ? prev.unit : parsed.unit || prev.unit,
            }))
        }

        // Mark if user manually edited dosage/unit
        if (name === "dosage") setManualEdit((prev) => ({...prev, dosage: true}))
        if (name === "unit") setManualEdit((prev) => ({...prev, unit: true}))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

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
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save medicine")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between border-b p-6 border-border">
                    <h2 className="text-lg font-semibold">
                        {medicine ? "Edit Medicine" : "Add New Medicine"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={loading}
                    >
                        <X className="h-5 w-5"/>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600"/>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-sm font-medium">
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
                            <p className="mt-1 text-xs text-gray-500">
                                Item code cannot be changed
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="e.g., Paracetamol 500 mg Tablet"
                            className="w-full rounded-md border px-3 py-2 text-sm border-border focus:ring-primary focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                            rows={3}
                            disabled={loading}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Dosage and unit will auto-fill based on description.
                        </p>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">
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
                        <label className="mb-1 block text-sm font-medium">
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
                                    <ChevronDown className="h-4 w-4 opacity-50"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="bottom"
                                align="start"
                                avoidCollisions={false}
                                className="w-40"
                                onCloseAutoFocus={(e) => e.preventDefault()}
                            >
                                {unitOptions.map((unit) => (
                                    <button
                                        key={unit}
                                        type="button"
                                        onClick={(e) => {
                                            setFormData((prev) => ({...prev, unit}))
                                            setManualEdit((prev) => ({...prev, unit: true}))
                                            e.currentTarget
                                                .closest('[role="menu"]')
                                                ?.dispatchEvent(
                                                    new KeyboardEvent("keydown", {
                                                        key: "Escape",
                                                        bubbles: true,
                                                    })
                                                )
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
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
