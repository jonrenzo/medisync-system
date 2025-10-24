"use client"

import {useState} from "react"
import {BadgePlus, CheckCircle2, Edit2, Trash2} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Checkbox} from "@/components/ui/checkbox"

export interface StocksItem {
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

interface StocksTableProps {
    stocks: StocksItem[]
    startIndex: number
    onEdit: (stock: StocksItem) => void
    onDelete: (id: number) => void
    onBulkDelete: (ids: number[]) => void
    onAddToReorder: (stock: StocksItem) => void
}

export function StockTable({
                               stocks,
                               startIndex,
                               onEdit,
                               onDelete,
                               onBulkDelete,
                               onAddToReorder
                           }: StocksTableProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([])

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(stocks.map(s => s.stockid))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (stockid: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, stockid])
        } else {
            setSelectedIds(prev => prev.filter(id => id !== stockid))
        }
    }

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return
        onBulkDelete(selectedIds)
        setSelectedIds([])
    }

    const allSelected = stocks.length > 0 && selectedIds.length === stocks.length
    const someSelected = selectedIds.length > 0 && selectedIds.length < stocks.length

    return (
        <div className="space-y-4">
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div
                    className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                    <span className="text-sm font-medium text-blue-900">
                        {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
                    </span>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2"
                    >
                        <Trash2 className="h-4 w-4"/>
                        Delete Selected
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b bg-gray-100 border-border">
                    <tr>
                        <th className="px-3 py-3 text-left w-[3%]">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all"
                                className={someSelected ? "data-[state=checked]:bg-blue-600" : ""}
                            />
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[7%]">
                            Stock ID
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[10%]">
                            Item Code
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[15%]">
                            Item Name
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[10%]">
                            Unit
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[10%]">
                            Dosage
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[8%]">
                            Beginning
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[8%]">
                            On Hand
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground w-[10%]">
                            Status
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-foreground w-[12%]">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {stocks.length === 0 ? (
                        <tr>
                            <td colSpan={10} className="py-8 text-center text-gray-500">
                                No Stock data available. Click Import to upload your data.
                            </td>
                        </tr>
                    ) : (
                        stocks.map((stock, index) => (
                            <tr
                                key={stock.stockid}
                                className={`hover:bg-gray-50 ${selectedIds.includes(stock.stockid) ? 'bg-blue-50' : ''}`}
                            >
                                <td className="px-3 py-3">
                                    <Checkbox
                                        checked={selectedIds.includes(stock.stockid)}
                                        onCheckedChange={(checked) => handleSelectOne(stock.stockid, checked as boolean)}
                                        aria-label={`Select ${stock.itemname}`}
                                    />
                                </td>
                                <td className="px-3 py-3 text-sm text-foreground">{startIndex + index + 1}</td>
                                <td className="px-3 py-3 text-sm text-gray-600">{stock.itemcode}</td>
                                <td className="px-3 py-3 text-sm text-gray-600">{stock.itemname}</td>
                                <td className="px-3 py-3 text-sm capitalize text-gray-600">
                                    {stock.unitofmeasurement || "-"}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-600">{stock.dosage || "-"}</td>
                                <td className="px-3 py-3 text-sm text-gray-600">{stock.beginningbalance}</td>
                                <td className="px-3 py-3 text-sm text-gray-600">{stock.stockonhand}</td>
                                <td className="px-3 py-3 text-sm text-gray-600">{stock.stockstatus}</td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                        {/* Edit Button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(stock)}
                                            className="h-8 w-8"
                                            title="Edit stock"
                                        >
                                            <Edit2 className="h-4 w-4 text-blue-600"/>
                                        </Button>

                                        {/* Delete Button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(stock.stockid)}
                                            className="h-8 w-8"
                                            title="Delete stock"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600"/>
                                        </Button>

                                        {/* Add to Reorder Button */}
                                        {stock.listtoreorder ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 cursor-default"
                                                disabled
                                                title="Already in reorder list"
                                            >
                                                <CheckCircle2 className="h-5 w-5 text-green-600"/>
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onAddToReorder(stock)}
                                                className="h-8 w-8"
                                                title="Add to reorder list"
                                            >
                                                <BadgePlus className="h-5 w-5 text-gray-600"/>
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

