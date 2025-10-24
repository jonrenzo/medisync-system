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
import { supabase } from "@/lib/supabase"
import type { InventoryItem } from "@/components/requisitions/requisition-table"

interface AddEditInventoryModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (inventory: {
        itemcode: string
        batchlotno: string
        expirationdate: string
        quantityrequested: number
        quantityissued: number
        unitcost: number
    }) => Promise<void>
    inventoryItem?: InventoryItem | null
}

interface ItemOption {
    itemcode: string
    itemdescription: string
    dosage: string
    unitofmeasurement: string
}

export function AddEditInventoryModal({ isOpen, onClose, onSave, inventoryItem }: AddEditInventoryModalProps) {
    const [formData, setFormData] = useState({
        itemcode: "",
        batchlotno: "",
        expirationdate: "",
        quantityrequested: "",
        quantityissued: "",
        unitcost: "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [itemOptions, setItemOptions] = useState<ItemOption[]>([])
    const [loadingItems, setLoadingItems] = useState(false)
    const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null)

    // Fetch available items from the items table
    useEffect(() => {
        if (isOpen && !inventoryItem) {
            fetchItems()
        }
    }, [isOpen, inventoryItem])

    const fetchItems = async () => {
        try {
            setLoadingItems(true)
            const { data, error } = await supabase
                .from("items")
                .select("itemcode, itemdescription, dosage, unitofmeasurement")
                .order("itemcode")

            if (error) throw error
            setItemOptions(data || [])
        } catch (err) {
            console.error("Error fetching items:", err)
        } finally {
            setLoadingItems(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            setError(null)
            if (inventoryItem) {
                setFormData({
                    itemcode: inventoryItem.itemcode,
                    batchlotno: inventoryItem.batchlotno || "",
                    expirationdate: inventoryItem.expirationdate || "",
                    quantityrequested: inventoryItem.quantityrequested?.toString() || "",
                    quantityissued: inventoryItem.quantityissued?.toString() || "",
                    unitcost: inventoryItem.unitcost?.toString() || "",
                })
                setSelectedItem({
                    itemcode: inventoryItem.itemcode,
                    itemdescription: inventoryItem.itemdescription || "",
                    dosage: inventoryItem.dosage || "",
                    unitofmeasurement: inventoryItem.unitofmeasurement || "",
                })
            } else {
                setFormData({
                    itemcode: "",
                    batchlotno: "",
                    expirationdate: "",
                    quantityrequested: "",
                    quantityissued: "",
                    unitcost: "",
                })
                setSelectedItem(null)
            }
        }
    }, [inventoryItem, isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleItemSelect = (item: ItemOption) => {
        setSelectedItem(item)
        setFormData((prev) => ({
            ...prev,
            itemcode: item.itemcode,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.itemcode.trim()) {
            setError("Please select an item")
            return
        }
        if (!formData.batchlotno.trim()) {
            setError("Batch/Lot No. is required")
            return
        }
        if (!formData.expirationdate) {
            setError("Expiration date is required")
            return
        }

        // Validate numbers (allow 0)
        const quantityRequested = formData.quantityrequested === "" ? 0 : Number(formData.quantityrequested)
        const quantityIssued = formData.quantityissued === "" ? 0 : Number(formData.quantityissued)
        const unitCost = formData.unitcost === "" ? 0 : Number(formData.unitcost)

        if (isNaN(quantityRequested) || quantityRequested < 0) {
            setError("Quantity requested must be a valid positive number")
            return
        }
        if (isNaN(quantityIssued) || quantityIssued < 0) {
            setError("Quantity issued must be a valid positive number")
            return
        }
        if (isNaN(unitCost) || unitCost < 0) {
            setError("Unit cost must be a valid positive number")
            return
        }

        setLoading(true)
        setError(null)

        try {
            await onSave({
                itemcode: formData.itemcode.trim(),
                batchlotno: formData.batchlotno.trim(),
                expirationdate: formData.expirationdate,
                quantityrequested: quantityRequested,
                quantityissued: quantityIssued,
                unitcost: unitCost,
            })
            // Success - parent will close modal
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save inventory")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const totalAmount = (Number(formData.unitcost) || 0) * (Number(formData.quantityissued) || 0)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
                    <h2 className="text-lg font-semibold">
                        {inventoryItem ? "Edit Inventory Item" : "Add New Inventory Item"}
                    </h2>
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

                    {/* Item Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Item <span className="text-red-500">*</span>
                        </label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between bg-white"
                                    type="button"
                                    disabled={loading || !!inventoryItem || loadingItems}
                                >
                                    {selectedItem ? (
                                        <span className="text-left truncate">
                                            {selectedItem.itemcode} - {selectedItem.itemdescription} ({selectedItem.dosage})
                                        </span>
                                    ) : loadingItems ? (
                                        "Loading items..."
                                    ) : (
                                        "Select item"
                                    )}
                                    <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="bottom"
                                align="start"
                                className="w-[500px] max-h-[300px] overflow-y-auto"
                                onCloseAutoFocus={(e) => e.preventDefault()}
                            >
                                {itemOptions.map((item) => (
                                    <button
                                        key={item.itemcode}
                                        type="button"
                                        onClick={(e) => {
                                            handleItemSelect(item)
                                            e.currentTarget.closest('[role="menu"]')?.dispatchEvent(
                                                new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
                                            )
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                    >
                                        <div className="font-medium">{item.itemcode}</div>
                                        <div className="text-gray-600 text-xs">
                                            {item.itemdescription} - {item.dosage} ({item.unitofmeasurement})
                                        </div>
                                    </button>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {inventoryItem && (
                            <p className="text-xs text-gray-500 mt-1">Item cannot be changed when editing</p>
                        )}
                    </div>

                    {/* Selected Item Info */}
                    {selectedItem && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-600">Description:</span>
                                    <div className="font-medium">{selectedItem.itemdescription || "-"}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Dosage:</span>
                                    <div className="font-medium">{selectedItem.dosage || "-"}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Unit:</span>
                                    <div className="font-medium capitalize">{selectedItem.unitofmeasurement || "-"}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Batch/Lot No */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Batch/Lot No. <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="batchlotno"
                                value={formData.batchlotno}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="e.g., BATCH001"
                                required
                            />
                        </div>

                        {/* Expiration Date */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Expiration Date <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="date"
                                name="expirationdate"
                                value={formData.expirationdate}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Quantity Requested */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Quantity Requested</label>
                            <Input
                                type="number"
                                name="quantityrequested"
                                value={formData.quantityrequested}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="0"
                                min="0"
                                step="1"
                            />
                        </div>

                        {/* Quantity Issued */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Quantity Issued</label>
                            <Input
                                type="number"
                                name="quantityissued"
                                value={formData.quantityissued}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="0"
                                min="0"
                                step="1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Unit Cost */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Unit Cost (₱)</label>
                            <Input
                                type="number"
                                name="unitcost"
                                value={formData.unitcost}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        {/* Total Amount (calculated) */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Total Amount (₱)</label>
                            <Input
                                type="text"
                                value={`₱${totalAmount.toFixed(2)}`}
                                disabled
                                className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">Auto-calculated from unit cost × quantity issued</p>
                        </div>
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
                            {loading ? "Saving..." : inventoryItem ? "Update" : "Add Inventory"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
