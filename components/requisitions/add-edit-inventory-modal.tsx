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
import {supabase} from "@/lib/supabase"
import type {InventoryItem} from "@/components/requisitions/requisition-table"
import {
    Command,
    CommandInput,
    CommandList,
    CommandItem,
    CommandEmpty,
    CommandGroup,
} from "@/components/ui/command"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"

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
        purchaseOrderNo: string
        month: number
        year: number
    }) => Promise<void>
    inventoryItem?: InventoryItem | null
}

interface ItemOption {
    itemcode: string
    itemdescription: string
    dosage: string
    unitofmeasurement: string
}

export function AddEditInventoryModal({
                                          isOpen,
                                          onClose,
                                          onSave,
                                          inventoryItem,
                                      }: AddEditInventoryModalProps) {
    const [formData, setFormData] = useState({
        itemcode: "",
        batchlotno: "",
        purchaseOrderNo: "",
        expirationdate: "",
        quantityrequested: "",
        quantityissued: "",
        unitcost: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [itemOptions, setItemOptions] = useState<ItemOption[]>([])
    const [loadingItems, setLoadingItems] = useState(false)
    const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null)

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]
    const years = ["2023", "2024", "2025", "2026"]

    // Fetch available items from the items table
    useEffect(() => {
        if (isOpen && !inventoryItem) {
            fetchItems()
        }
    }, [isOpen, inventoryItem])

    const fetchItems = async () => {
        try {
            setLoadingItems(true)
            const {data, error} = await supabase
                .from("items")
                .select("itemcode, itemdescription, dosage, unitofmeasurement")
                .order("itemcode")

            if (error) throw error

            // 🔍 Parsing logic for dosage and unit
            const parseDosageAndUnit = (description: string) => {
                const dosagePattern =
                    /(\d+(\.\d+)?\s?(mg|g|mcg|ml|IU|units|%))/i
                const unitPattern =
                    /\b(tablet|tab|capsule|cap|ampule|vial|bottle|syrup|piece|pcs|patch|drop|cream|ointment|tube|sachet|suspension|solution|suppository|kit|bag|pack)\b/i

                const dosageMatch = description.match(dosagePattern)
                const unitMatch = description.match(unitPattern)

                return {
                    dosage: dosageMatch ? dosageMatch[0] : "",
                    unit: unitMatch ? unitMatch[0] : "",
                }
            }

            // 🧠 Enhance items with parsed dosage/unit if missing
            const enhancedData = (data || []).map((item) => {
                const parsed = parseDosageAndUnit(item.itemdescription || "")
                return {
                    ...item,
                    dosage: item.dosage || parsed.dosage,
                    unitofmeasurement: item.unitofmeasurement || parsed.unit,
                }
            })

            setItemOptions(enhancedData)
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
                    purchaseOrderNo: inventoryItem.purchaseOrderNo || "",
                    expirationdate: inventoryItem.expirationdate || "",
                    quantityrequested:
                        inventoryItem.quantityrequested?.toString() || "",
                    quantityissued:
                        inventoryItem.quantityissued?.toString() || "",
                    unitcost: inventoryItem.unitcost?.toString() || "",
                    month:
                        inventoryItem.month || new Date().getMonth() + 1,
                    year: inventoryItem.year || new Date().getFullYear(),
                })
                setSelectedItem({
                    itemcode: inventoryItem.itemcode,
                    itemdescription: inventoryItem.itemdescription || "",
                    dosage: inventoryItem.dosage || "",
                    unitofmeasurement:
                        inventoryItem.unitofmeasurement || "",
                })
            } else {
                setFormData({
                    itemcode: "",
                    batchlotno: "",
                    purchaseOrderNo: "",
                    expirationdate: "",
                    quantityrequested: "",
                    quantityissued: "",
                    unitcost: "",
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                })
                setSelectedItem(null)
            }
        }
    }, [inventoryItem, isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target
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

        if (!formData.itemcode.trim()) {
            setError("Please select an item")
            return
        }
        if (!formData.batchlotno.trim()) {
            setError("Batch/Lot No. is required")
            return
        }
        if (!formData.purchaseOrderNo.trim()) {
            setError("Purchase Order No. is required")
            return
        }
        if (!formData.expirationdate) {
            setError("Expiration date is required")
            return
        }

        const quantityRequested =
            formData.quantityrequested === ""
                ? 0
                : Number(formData.quantityrequested)
        const quantityIssued =
            formData.quantityissued === ""
                ? 0
                : Number(formData.quantityissued)
        const unitCost =
            formData.unitcost === "" ? 0 : Number(formData.unitcost)

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
                purchaseOrderNo: formData.purchaseOrderNo.trim(),
                expirationdate: formData.expirationdate,
                quantityrequested: quantityRequested,
                quantityissued: quantityIssued,
                unitcost: unitCost,
                month: formData.month,
                year: formData.year,
            })
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save inventory"
            )
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const totalAmount =
        (Number(formData.unitcost) || 0) *
        (Number(formData.quantityissued) || 0)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-lg max-h-[90vh]">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between border-b bg-white p-6 border-border">
                    <h2 className="text-lg font-semibold">
                        {inventoryItem
                            ? "Edit Inventory Item"
                            : "Add New Inventory Item"}
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
                                <AlertCircle className="h-4 w-4 text-red-600"/>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Item Selection */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">
                            Item <span className="text-red-500">*</span>
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between bg-white"
                                    type="button"
                                    disabled={loading || !!inventoryItem || loadingItems}
                                >
                                    {selectedItem ? (
                                        <span className="truncate text-left">
                        {selectedItem.itemcode} - {selectedItem.itemdescription}{" "}
                                            ({selectedItem.dosage})
                    </span>
                                    ) : loadingItems ? (
                                        "Loading items..."
                                    ) : (
                                        "Search or select item"
                                    )}
                                    <ChevronDown className="h-4 w-4 opacity-50"/>
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent className="p-0 w-[500px]" align="start">
                                <Command>
                                    <CommandInput placeholder="Search item..."/>
                                    <CommandList>
                                        <CommandEmpty>No item found.</CommandEmpty>
                                        <CommandGroup>
                                            {itemOptions.map((item) => (
                                                <CommandItem
                                                    key={item.itemcode}
                                                    value={`${item.itemcode} ${item.itemdescription}`}
                                                    onSelect={() => {
                                                        handleItemSelect(item)
                                                    }}
                                                >
                                                    <div>
                                                        <div className="font-medium">
                                                            {item.itemcode}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {item.itemdescription} - {item.dosage} (
                                                            {item.unitofmeasurement})
                                                        </div>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {inventoryItem && (
                            <p className="mt-1 text-xs text-gray-500">
                                Item cannot be changed when editing
                            </p>
                        )}
                    </div>

                    {/* Selected Item Info */}
                    {selectedItem && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-600">Description:</span>
                                    <div className="font-medium">
                                        {selectedItem.itemdescription || "-"}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Dosage:</span>
                                    <div className="font-medium">
                                        {selectedItem.dosage || "-"}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Unit:</span>
                                    <div className="font-medium capitalize">
                                        {selectedItem.unitofmeasurement || "-"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Batch, PO, Expiration */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">
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

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Purchase Order No.{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                name="purchaseOrderNo"
                                value={formData.purchaseOrderNo}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="e.g., 24-07-1462(EBA)"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Expiration Date{" "}
                                <span className="text-red-500">*</span>
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

                    {/* Month & Year */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Month
                            </label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between bg-white"
                                        type="button"
                                        disabled={loading}
                                    >
                                        {months[formData.month - 1] ||
                                            "Select month"}
                                        <ChevronDown className="h-4 w-4 opacity-50"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40">
                                    {months.map((m, i) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    month: i + 1,
                                                }))
                                            }
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Year
                            </label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between bg-white"
                                        type="button"
                                        disabled={loading}
                                    >
                                        {formData.year || "Select year"}
                                        <ChevronDown className="h-4 w-4 opacity-50"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-32">
                                    {years.map((y) => (
                                        <button
                                            key={y}
                                            type="button"
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    year: parseInt(y),
                                                }))
                                            }
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Quantities */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Quantity Requested
                            </label>
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

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Quantity Issued
                            </label>
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

                    {/* Cost */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Unit Cost (₱)
                            </label>
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

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Total Amount (₱)
                            </label>
                            <Input
                                type="text"
                                value={`₱${totalAmount.toFixed(2)}`}
                                disabled
                                className="bg-gray-50"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Auto-calculated from unit cost × quantity issued
                            </p>
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
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading
                                ? "Saving..."
                                : inventoryItem
                                    ? "Update"
                                    : "Add Inventory"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
