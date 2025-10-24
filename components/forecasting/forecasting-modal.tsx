"use client"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {X} from "lucide-react"

interface MedicineModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function MedicineModal({isOpen, onClose}: MedicineModalProps) {
    const [timeRange, setTimeRange] = useState("7 days")
    const [selectedMedicine, setSelectedMedicine] = useState("acetylcysteine")
    const [selectedDosage, setSelectedDosage] = useState("100mg")
    const [selectedUnit, setSelectedUnit] = useState("sachet")

    const medicines = ["Acetylcysteine", "Allopurinol", "Aluminum Magnesium"]
    const dosages = ["100mg", "200mg", "600mg"]
    const units = ["Sachet", "Tablet", "Syrup"]

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between border-b p-6 border-border">
                    <div>
                        <h2 className="text-lg font-semibold">Select a Medicine</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Select one of these medicines for the system to predict its future stocks for a specific
                            time range.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-5 w-5"/>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Time Range */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Time Range</label>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7 days">7 days</SelectItem>
                                <SelectItem value="14 days">14 days</SelectItem>
                                <SelectItem value="30 days">30 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Medicine Selection */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Item Name */}
                        <div>
                            <label className="block text-sm font-medium mb-3">Item Name</label>
                            <div className="space-y-2">
                                {medicines.map((medicine) => (
                                    <label key={medicine} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="medicine"
                                            value={medicine}
                                            checked={selectedMedicine === medicine.toLowerCase()}
                                            onChange={(e) => setSelectedMedicine(e.target.value.toLowerCase())}
                                            className="h-4 w-4"
                                        />
                                        <span className="text-sm">{medicine}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Dosage */}
                        <div>
                            <label className="block text-sm font-medium mb-3">Dosage</label>
                            <div className="space-y-2">
                                {dosages.map((dosage) => (
                                    <label key={dosage} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="dosage"
                                            value={dosage}
                                            checked={selectedDosage === dosage}
                                            onChange={(e) => setSelectedDosage(e.target.value)}
                                            className="h-4 w-4"
                                        />
                                        <span className="text-sm">{dosage}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Unit of Measurement */}
                        <div>
                            <label className="block text-sm font-medium mb-3">Unit of Measurement</label>
                            <div className="space-y-2">
                                {units.map((unit) => (
                                    <label key={unit} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="unit"
                                            value={unit}
                                            checked={selectedUnit === unit.toLowerCase()}
                                            onChange={(e) => setSelectedUnit(e.target.value.toLowerCase())}
                                            className="h-4 w-4"
                                        />
                                        <span className="text-sm">{unit}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end p-6 border-t border-border">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button className="bg-primary text-white hover:bg-primary/90">Save</Button>
                </div>
            </div>
        </div>
    )
}
