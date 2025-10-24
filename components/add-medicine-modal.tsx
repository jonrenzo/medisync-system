"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddMedicineModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (data: any) => Promise<void>
}

function parseItemDescription(description: string) {
    if (!description) return { dosage: "", unit_type: "" }

    const unitTypes = [
        "tablet",
        "capsule",
        "injection",
        "syrup",
        "cream",
        "ointment",
        "drops",
        "powder",
        "suspension",
        "solution",
        "patch",
        "gel",
        "lotion",
        "spray",
    ]

    const dosageMatch = description.match(/(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu|units?)/i)
    const dosage = dosageMatch ? dosageMatch[0] : ""

    let unit_type = ""
    for (const unit of unitTypes) {
        if (description.toLowerCase().includes(unit)) {
            unit_type = unit.charAt(0).toUpperCase() + unit.slice(1)
            break
        }
    }

    return { dosage, unit_type }
}

export function AddMedicineModal({ open, onOpenChange, onSave }: AddMedicineModalProps) {
    const [formData, setFormData] = useState({
        medicine_code: "",
        medicine_base_name: "",
        unit_type: "",
        purchase_price: "",
        purchase_month: "",
        purchase_year: "",
        batch_lot_no: "",
        expiration_date: "",
        quantity_requested: "",
        ending_balance: "",
        dispensed: "",
        unit_cost: "",
        total_amount: "",
        medicine_name: "",
        dosage: "",
        beginning_balance: "",
        delivery: "",
        health_center: "",
        purchase_order_no: "",
    })

    const [isSaving, setIsSaving] = useState(false)

    // Force cleanup pointer-events when modal closes
    useEffect(() => {
        if (!open) {
            // Immediate cleanup
            const cleanup = () => {
                document.body.style.pointerEvents = ''
                document.body.style.removeProperty('pointer-events')

                // Check all elements with data-radix attributes
                const radixElements = document.querySelectorAll('[data-radix-portal], [data-radix-dialog-overlay]')
                radixElements.forEach(el => {
                    if (el instanceof HTMLElement) {
                        el.style.pointerEvents = ''
                    }
                })

                // Check all elements with pointer-events style
                const allElements = document.querySelectorAll('*')
                allElements.forEach(el => {
                    if (el instanceof HTMLElement && el.style.pointerEvents === 'none') {
                        el.style.pointerEvents = ''
                    }
                })
            }

            // Run cleanup immediately and after delays
            cleanup()
            setTimeout(cleanup, 50)
            setTimeout(cleanup, 150)
            setTimeout(cleanup, 300)
        }
    }, [open])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        if (name === "medicine_base_name") {
            const { dosage, unit_type } = parseItemDescription(value)
            setFormData((prev) => ({
                ...prev,
                [name]: value,
                dosage: dosage || prev.dosage,
                unit_type: unit_type || prev.unit_type,
            }))
        } else {
            setFormData((prev) => {
                const updated = {
                    ...prev,
                    [name]: value,
                }

                // Auto-calculate total_amount when unit_cost or ending_balance changes
                if (name === "unit_cost" || name === "dispensed") {
                    const unitCost = name === "unit_cost" ? value : prev.unit_cost
                    const stocks = name === "dispensed" ? value : prev.dispensed

                    if (unitCost && stocks) {
                        const total = Number.parseFloat(unitCost) * Number.parseInt(stocks)
                        updated.total_amount = total.toFixed(2)
                    }
                }

                return updated
            })
        }
    }

    const resetForm = () => {
        setFormData({
            medicine_code: "",
            medicine_base_name: "",
            unit_type: "",
            purchase_price: "",
            purchase_month: "",
            purchase_year: "",
            batch_lot_no: "",
            expiration_date: "",
            quantity_requested: "",
            ending_balance: "",
            dispensed: "",
            unit_cost: "",
            total_amount: "",
            medicine_name: "",
            dosage: "",
            beginning_balance: "",
            delivery: "",
            health_center: "",
            purchase_order_no: "",
        })
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(formData)
            resetForm()
            onOpenChange(false)
        } catch (error) {
            console.error("Error saving:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        resetForm()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Medicine</DialogTitle>
                    <DialogDescription>Add new record for every medicine delivered.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    {/* Medicine Name */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Medicine Name</label>
                        <Input
                            name="medicine_name"
                            value={formData.medicine_name}
                            onChange={handleInputChange}
                            placeholder="e.g., Acyclovir"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Item Code (QR Code) */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Item Code (QR Code)</label>
                        <Input
                            name="medicine_code"
                            value={formData.medicine_code}
                            onChange={handleInputChange}
                            placeholder="e.g., MSD-MED-005"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Item Description */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Item Description</label>
                        <Input
                            name="medicine_base_name"
                            value={formData.medicine_base_name}
                            onChange={handleInputChange}
                            placeholder="e.g., Acyclovir 400mg tablet 1's"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                        <p className="text-xs text-gray-500 mt-1">Dosage and unit type will auto-fill</p>
                    </div>

                    {/* Dosage */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Dosage</label>
                        <Input
                            name="dosage"
                            value={formData.dosage}
                            onChange={handleInputChange}
                            placeholder="e.g., 400mg"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Unit of Measurement */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Unit of Measurement</label>
                        <Input
                            name="unit_type"
                            value={formData.unit_type}
                            onChange={handleInputChange}
                            placeholder="e.g., Tablet"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Purchase Month */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Purchase Month</label>
                        <Input
                            name="purchase_month"
                            value={formData.purchase_month}
                            onChange={handleInputChange}
                            placeholder="e.g., October"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Purchase Year */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Purchase Year</label>
                        <Input
                            name="purchase_year"
                            value={formData.purchase_year}
                            onChange={handleInputChange}
                            placeholder="e.g., 2025"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Purchase Order No. */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Purchase Order No.</label>
                        <Input
                            name="purchase_order_no"
                            value={formData.purchase_order_no}
                            onChange={handleInputChange}
                            placeholder="e.g., 24-07-1462 (EBA)"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Batch/Lot No. */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Batch/Lot No.</label>
                        <Input
                            name="batch_lot_no"
                            value={formData.batch_lot_no}
                            onChange={handleInputChange}
                            placeholder="e.g., INSOV2"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Expiration Date */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Expiration Date</label>
                        <Input
                            name="expiration_date"
                            type="date"
                            value={formData.expiration_date}
                            onChange={handleInputChange}
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Quantity Requested */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Quantity Requested</label>
                        <Input
                            name="quantity_requested"
                            type="number"
                            value={formData.quantity_requested}
                            onChange={handleInputChange}
                            placeholder="e.g., 200"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Stocks Available */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Stocks Available</label>
                        <Input
                            name="ending_balance"
                            type="number"
                            value={formData.ending_balance}
                            onChange={handleInputChange}
                            placeholder="e.g., 200"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Quantity Issued */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Quantity Issued</label>
                        <Input
                            name="dispensed"
                            type="number"
                            value={formData.dispensed}
                            onChange={handleInputChange}
                            placeholder="e.g., 0"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Unit Cost */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Unit Cost</label>
                        <Input
                            name="unit_cost"
                            type="number"
                            step="0.01"
                            value={formData.unit_cost}
                            onChange={handleInputChange}
                            placeholder="e.g., 25.00"
                            className="bg-white border-gray-300"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Total Amount - Auto-calculated */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Total Amount</label>
                        <Input
                            name="total_amount"
                            type="number"
                            step="0.01"
                            value={formData.total_amount}
                            readOnly
                            placeholder="Auto-calculated"
                            className="bg-gray-50 border-gray-300"
                            disabled={true}
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-calculated: Unit Cost × Stocks Available</p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="border-gray-300 text-foreground hover:bg-gray-50 bg-transparent"
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-foreground text-background hover:bg-foreground/90"
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
