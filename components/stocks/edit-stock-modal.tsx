"use client"

import {useState, useEffect} from "react"
import {supabase} from "@/lib/supabase"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"

interface StockItem {
    stockid: number
    itemcode: string
    itemname: string
    unitofmeasurement: string
    dosage: string
    beginningbalance: number
    stockonhand: number
    stockstatus: string
    listtoreorder: boolean
}

interface EditStockModalProps {
    isOpen: boolean
    onClose: () => void
    stock: StockItem | null
    onStockUpdated: () => void
}

export function EditStockModal({
                                   isOpen,
                                   onClose,
                                   stock,
                                   onStockUpdated,
                               }: EditStockModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        beginningbalance: "",
        stockonhand: "",
        stockstatus: "",
    })

    // Populate form when editing
    useEffect(() => {
        if (stock) {
            setFormData({
                beginningbalance: String(stock.beginningbalance),
                stockonhand: String(stock.stockonhand),
                stockstatus: stock.stockstatus,
            })
        } else {
            setFormData({
                beginningbalance: "",
                stockonhand: "",
                stockstatus: "",
            })
        }
    }, [stock, isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target
        setFormData((prev) => ({...prev, [name]: value}))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stock) return

        setLoading(true)

        try {
            const {error} = await supabase
                .from("stocks")
                .update({
                    beginningbalance: Number(formData.beginningbalance),
                    stockonhand: Number(formData.stockonhand),
                    stockstatus: formData.stockstatus,
                })
                .eq("stockid", stock.stockid)

            if (error) throw error

            onStockUpdated()
            onClose()
            alert("Stock updated successfully!")
        } catch (err: any) {
            console.error("Error updating stock:", err)
            alert("Error updating stock: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Stock</DialogTitle>
                </DialogHeader>

                {stock && (
                    <div className="mb-4 rounded-lg bg-gray-50 p-4">
                        <div className="space-y-1 text-sm">
                            <p className="font-semibold text-gray-900">{stock.itemname}</p>
                            <p className="text-gray-600">
                                {stock.dosage} • {stock.unitofmeasurement}
                            </p>
                            <p className="text-gray-500">Item Code: {stock.itemcode}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Beginning Balance</Label>
                            <Input
                                name="beginningbalance"
                                type="number"
                                value={formData.beginningbalance}
                                onChange={handleChange}
                                required
                                min="0"
                            />
                        </div>
                        <div>
                            <Label>Stock on Hand</Label>
                            <Input
                                name="stockonhand"
                                type="number"
                                value={formData.stockonhand}
                                onChange={handleChange}
                                required
                                min="0"
                            />
                        </div>
                        <div className="col-span-2">
                            <Label>Stock Status</Label>
                            <Input
                                name="stockstatus"
                                value={formData.stockstatus}
                                onChange={handleChange}
                                placeholder="e.g., Available, Low Stock, Out of Stock"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
