"use client"

import {useState, useEffect} from "react"
import {supabase} from "@/lib/supabase"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"

interface UtilizationRecord {
    dispensedid: number
    itemcode: string
    patientname: string
    patientage: number
    dateissued: string
    issuedquantity: number
    remarks: string
    expirationdate: string
}

interface AddDispenseRecordModalProps {
    isOpen: boolean
    onClose: () => void
    itemcode: string | null
    editingRecord: UtilizationRecord | null
    onRecordAdded: (itemcode: string) => void
}

export function AddDispenseRecordModal({
                                           isOpen,
                                           onClose,
                                           itemcode,
                                           editingRecord,
                                           onRecordAdded,
                                       }: AddDispenseRecordModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        patientname: "",
        patientage: "",
        dateissued: "",
        issuedquantity: "",
        remarks: "",
    })

    // Populate form when editing
    useEffect(() => {
        if (editingRecord) {
            setFormData({
                patientname: editingRecord.patientname,
                patientage: String(editingRecord.patientage),
                dateissued: editingRecord.dateissued,
                issuedquantity: String(editingRecord.issuedquantity),
                remarks: editingRecord.remarks,
            })
        } else {
            setFormData({
                patientname: "",
                patientage: "",
                dateissued: "",
                issuedquantity: "",
                remarks: "",
            })
        }
    }, [editingRecord, isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target
        setFormData((prev) => ({...prev, [name]: value}))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!itemcode) return

        setLoading(true)

        if (editingRecord) {
            // Update existing record
            const {error} = await supabase
                .from("utilizationrecord")
                .update({
                    patientname: formData.patientname,
                    patientage: Number(formData.patientage),
                    dateissued: formData.dateissued,
                    issuedquantity: Number(formData.issuedquantity),
                    remarks: formData.remarks,
                })
                .eq("dispensedid", editingRecord.dispensedid)

            if (error) {
                console.error("Error updating record:", error)
                setLoading(false)
                return
            }

            onRecordAdded(itemcode)
            onClose()
        } else {
            // Add new record
            const {data, error} = await supabase.rpc("add_utilization_record_returning", {
                p_itemcode: itemcode,
                p_patientname: formData.patientname,
                p_patientage: Number(formData.patientage),
                p_dateissued: formData.dateissued || new Date().toISOString().slice(0, 10),
                p_issuedquantity: Number(formData.issuedquantity),
                p_remarks: formData.remarks,
            })

            if (error) {
                console.error("Error inserting record:", error)
                setLoading(false)
                return
            }

            if (data) {
                onRecordAdded(itemcode)
                onClose()
            }
        }

        setLoading(false)
        setFormData({
            patientname: "",
            patientage: "",
            dateissued: "",
            issuedquantity: "",
            remarks: "",
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {editingRecord ? "Edit Dispense Record" : "Add Dispense Record"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="my-2">
                            <Label>Patient Name</Label>
                            <Input name="patientname" value={formData.patientname} onChange={handleChange} required/>
                        </div>
                        <div>
                            <Label>Patient Age</Label>
                            <Input name="patientage" type="number" value={formData.patientage} onChange={handleChange}
                                   required/>
                        </div>
                        <div>
                            <Label>Date Issued</Label>
                            <Input name="dateissued" type="date" value={formData.dateissued} onChange={handleChange}
                                   required/>
                        </div>
                        <div>
                            <Label>Issued Quantity</Label>
                            <Input name="issuedquantity" type="number" value={formData.issuedquantity}
                                   onChange={handleChange} required/>
                        </div>
                        <div className="col-span-2">
                            <Label>Remarks</Label>
                            <Input name="remarks" value={formData.remarks} onChange={handleChange}/>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
