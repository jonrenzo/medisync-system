"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, AlertCircle, Plus } from "lucide-react"
import { InventoryTable, type InventoryItem } from "@/components/requisitions/requisition-table"
import { AddEditInventoryModal } from "@/components/requisitions/add-edit-inventory-modal"
import { MedicineTable } from "@/components/medicines/medicine-table"
import { AddEditMedicineModal } from "@/components/medicines/add-edit-medicine-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface Medicine {
    itemcode: string
    unitofmeasurement: string
    itemdescription: string
    dosage: string
    qrcode?: string
}

export default function Inventory() {
    // Inventory state
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 50

    const [inventoryData, setInventoryData] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

    // Medicine state
    const [medicines, setMedicines] = useState<Medicine[]>([])
    const [medicineLoading, setMedicineLoading] = useState(true)
    const [medicineError, setMedicineError] = useState<string | null>(null)
    const [medicineSearchTerm, setMedicineSearchTerm] = useState("")
    const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false)
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null)
    const [medicineCurrentPage, setMedicineCurrentPage] = useState(1)

    const medicineItemsPerPage = 10

    useEffect(() => {
        fetchInventoryData()
        fetchMedicines()
    }, [])

    // Inventory functions
    const fetchInventoryData = async () => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from("inventory")
                .select(`
                    inventoryid,
                    itemcode,
                    batchlotno,
                    expirationdate,
                    quantityrequested,
                    quantityissued,
                    unitcost,
                    totalamount,
                    items (
                        itemdescription,
                        dosage,
                        unitofmeasurement
                    )
                `)
                .order("inventoryid", { ascending: false })

            if (error) throw error

            const flattenedData = data?.map(item => ({
                inventoryid: item.inventoryid,
                itemcode: item.itemcode,
                batchlotno: item.batchlotno,
                expirationdate: item.expirationdate,
                quantityrequested: item.quantityrequested,
                quantityissued: item.quantityissued,
                unitcost: item.unitcost,
                totalamount: item.totalamount,
                itemdescription: (item.items as any)?.itemdescription,
                dosage: (item.items as any)?.dosage,
                unitofmeasurement: (item.items as any)?.unitofmeasurement,
            })) || []

            setInventoryData(flattenedData)
        } catch (err: any) {
            setError(err.message)
            console.error("Error fetching inventory:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item)
        setIsModalOpen(true)
    }

    const handleAddNew = () => {
        setEditingItem(null)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingItem(null)
    }

    const handleSave = async (inventoryData: {
        itemcode: string
        batchlotno: string
        expirationdate: string
        quantityrequested: number
        quantityissued: number
        unitcost: number
    }) => {
        try {
            if (editingItem) {
                const { error } = await supabase
                    .from("inventory")
                    .update({
                        batchlotno: inventoryData.batchlotno,
                        expirationdate: inventoryData.expirationdate,
                        quantityrequested: inventoryData.quantityrequested,
                        quantityissued: inventoryData.quantityissued,
                        unitcost: inventoryData.unitcost,
                    })
                    .eq("inventoryid", editingItem.inventoryid)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from("inventory")
                    .insert({
                        itemcode: inventoryData.itemcode,
                        batchlotno: inventoryData.batchlotno,
                        expirationdate: inventoryData.expirationdate,
                        quantityrequested: inventoryData.quantityrequested,
                        quantityissued: inventoryData.quantityissued,
                        unitcost: inventoryData.unitcost,
                    })

                if (error) throw error
            }

            await fetchInventoryData()
            handleCloseModal()
        } catch (err: any) {
            throw new Error(err.message || "Failed to save inventory")
        }
    }

    const handleDelete = async (inventoryid: number) => {
        if (!confirm("Are you sure you want to delete this inventory item?")) return

        try {
            const { error } = await supabase
                .from("inventory")
                .delete()
                .eq("inventoryid", inventoryid)

            if (error) throw error

            setInventoryData((prev) => prev.filter((item) => item.inventoryid !== inventoryid))

            const newFilteredLength = filteredData.length - 1
            const newTotalPages = Math.ceil(newFilteredLength / itemsPerPage)
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages)
            }
        } catch (err: any) {
            setError(err.message)
            console.error("Error deleting item:", err)
        }
    }

    // Medicine functions
    const fetchMedicines = async () => {
        try {
            setMedicineLoading(true)
            setMedicineError(null)

            const { data, error: fetchError } = await supabase
                .from("items")
                .select("*")
                .order("itemcode", { ascending: true })

            if (fetchError) throw fetchError

            setMedicines(data || [])
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch medicines"
            setMedicineError(errorMessage)
        } finally {
            setMedicineLoading(false)
        }
    }

    const handleAddMedicine = () => {
        setEditingMedicine(null)
        setIsMedicineModalOpen(true)
    }

    const handleEditMedicine = (medicine: Medicine) => {
        setEditingMedicine(medicine)
        setIsMedicineModalOpen(true)
    }

    const handleDeleteMedicine = async (itemcode: string) => {
        if (!confirm("Are you sure you want to delete this medicine?")) return

        try {
            setMedicineError(null)

            const { error: deleteError } = await supabase
                .from("items")
                .delete()
                .eq("itemcode", itemcode)

            if (deleteError) throw deleteError

            setMedicines((prev) => prev.filter((m) => m.itemcode !== itemcode))

            const newFilteredLength = filteredMedicines.length - 1
            const newTotalPages = Math.ceil(newFilteredLength / medicineItemsPerPage)
            if (medicineCurrentPage > newTotalPages && newTotalPages > 0) {
                setMedicineCurrentPage(newTotalPages)
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to delete medicine"
            setMedicineError(errorMessage)
        }
    }

    const handleMedicineModalClose = () => {
        setIsMedicineModalOpen(false)
        setEditingMedicine(null)
    }

    const handleSaveMedicine = async (medicineData: {
        itemcode: string
        itemdescription: string
        dosage: string
        unitofmeasurement: string
    }) => {
        try {
            setMedicineError(null)

            if (editingMedicine) {
                const { data, error: updateError } = await supabase
                    .from("items")
                    .update({
                        itemdescription: medicineData.itemdescription,
                        dosage: medicineData.dosage,
                        unitofmeasurement: medicineData.unitofmeasurement,
                    })
                    .eq("itemcode", editingMedicine.itemcode)
                    .select("*")
                    .single()

                if (updateError) throw new Error(updateError.message || "Failed to update medicine")

                if (data) {
                    setMedicines((prev) =>
                        prev.map((m) => (m.itemcode === editingMedicine.itemcode ? data : m))
                    )
                }
            } else {
                const { data, error: insertError } = await supabase
                    .from("items")
                    .insert([medicineData])
                    .select("*")
                    .single()

                if (insertError) throw new Error(insertError.message || "Failed to add medicine")

                if (data) {
                    setMedicines((prev) => [data, ...prev])
                }
            }

            handleMedicineModalClose()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save medicine"
            throw new Error(errorMessage)
        }
    }

    // Filter and pagination for inventory
    const filteredData = inventoryData.filter((item) => {
        const searchLower = searchTerm.toLowerCase()
        return (
            item.itemcode?.toLowerCase().includes(searchLower) ||
            item.itemdescription?.toLowerCase().includes(searchLower) ||
            item.batchlotno?.toLowerCase().includes(searchLower)
        )
    })

    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedData = filteredData.slice(startIndex, endIndex)

    // Filter and pagination for medicines
    const filteredMedicines = medicines.filter(
        (medicine) =>
            medicine.itemcode.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
            medicine.dosage.toLowerCase().includes(medicineSearchTerm.toLowerCase()) ||
            medicine.itemdescription.toLowerCase().includes(medicineSearchTerm.toLowerCase())
    )

    const medicineTotalPages = Math.ceil(filteredMedicines.length / medicineItemsPerPage)
    const medicineStartIndex = (medicineCurrentPage - 1) * medicineItemsPerPage
    const medicineEndIndex = medicineStartIndex + medicineItemsPerPage
    const paginatedMedicines = filteredMedicines.slice(medicineStartIndex, medicineEndIndex)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    useEffect(() => {
        setMedicineCurrentPage(1)
    }, [medicineSearchTerm])

    return (
        <div className="p-6 bg-background min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            </div>

            <Tabs defaultValue="directory" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="directory">Medicine Directory</TabsTrigger>
                    <TabsTrigger value="intake">Inventory Intake</TabsTrigger>
                </TabsList>

                {/* Directory Tab */}
                <TabsContent value="directory" className="space-y-6">
                    <div className="border border-border rounded-lg p-6 bg-white space-y-6">
                        <div className="flex items-center gap-4">
                            <Input
                                placeholder="Search by code, name, or dosage..."
                                value={medicineSearchTerm}
                                onChange={(e) => {
                                    setMedicineSearchTerm(e.target.value)
                                    setMedicineCurrentPage(1)
                                }}
                                className="flex-1"
                            />
                            <Button onClick={handleAddMedicine} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Medicine
                            </Button>
                        </div>

                        {medicineError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <p className="text-sm text-red-700">{medicineError}</p>
                                </div>
                            </div>
                        )}

                        {medicineLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="ml-3 text-gray-600">Loading medicines...</span>
                            </div>
                        )}

                        {!medicineLoading && (
                            <>
                                <MedicineTable
                                    medicines={paginatedMedicines}
                                    onEdit={handleEditMedicine}
                                    onDelete={handleDeleteMedicine}
                                />

                                {filteredMedicines.length > 0 && (
                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                        <div className="text-sm text-gray-600">
                                            Showing {medicineStartIndex + 1} to{" "}
                                            {Math.min(medicineEndIndex, filteredMedicines.length)} of{" "}
                                            {filteredMedicines.length} medicines
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setMedicineCurrentPage((p) => Math.max(1, p - 1))}
                                                disabled={medicineCurrentPage === 1}
                                            >
                                                Previous
                                            </Button>

                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: medicineTotalPages }, (_, i) => i + 1)
                                                    .filter(
                                                        (page) =>
                                                            page === 1 ||
                                                            page === medicineTotalPages ||
                                                            (page >= medicineCurrentPage - 1 && page <= medicineCurrentPage + 1)
                                                    )
                                                    .map((page, index, array) => {
                                                        const prevPage = array[index - 1]
                                                        const showEllipsis = prevPage && page - prevPage > 1
                                                        return (
                                                            <div key={page} className="flex items-center">
                                                                {showEllipsis && <span className="px-2 text-gray-500">...</span>}
                                                                <Button
                                                                    variant={medicineCurrentPage === page ? "default" : "outline"}
                                                                    size="sm"
                                                                    onClick={() => setMedicineCurrentPage(page)}
                                                                    className="w-9 h-9"
                                                                >
                                                                    {page}
                                                                </Button>
                                                            </div>
                                                        )
                                                    })}
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setMedicineCurrentPage((p) => Math.min(medicineTotalPages, p + 1))}
                                                disabled={medicineCurrentPage === medicineTotalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {filteredMedicines.length === 0 && !medicineLoading && (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">
                                            {medicineSearchTerm
                                                ? "No medicines match your search."
                                                : "No medicines found. Add one to get started."}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>

                {/* Intake Tab */}
                <TabsContent value="intake" className="space-y-6">
                    <div className="border border-border rounded-lg p-6 bg-white space-y-6">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search by item code, description, or batch..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white border-gray-300"
                                />
                            </div>

                            <Button onClick={handleAddNew} className="bg-foreground text-background hover:bg-foreground/90">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Record
                            </Button>
                        </div>

                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="ml-3 text-gray-600">Loading inventory data...</span>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <p className="text-sm text-red-700">Error: {error}</p>
                                </div>
                            </div>
                        )}

                        {!loading && !error && (
                            <>
                                <InventoryTable
                                    items={paginatedData}
                                    startIndex={startIndex}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />

                                {filteredData.length > 0 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                        <div className="text-sm text-gray-600">
                                            Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of{" "}
                                            {filteredData.length} entries
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="border-gray-300"
                                            >
                                                Previous
                                            </Button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                    .filter(
                                                        (page) =>
                                                            page === 1 ||
                                                            page === totalPages ||
                                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                                    )
                                                    .map((page, index, array) => {
                                                        const prevPage = array[index - 1]
                                                        const showEllipsis = prevPage && page - prevPage > 1

                                                        return (
                                                            <div key={page} className="flex items-center">
                                                                {showEllipsis && <span className="px-2 text-gray-500">...</span>}
                                                                <Button
                                                                    variant={currentPage === page ? "default" : "outline"}
                                                                    size="sm"
                                                                    onClick={() => setCurrentPage(page)}
                                                                    className={`w-9 h-9 ${
                                                                        currentPage === page
                                                                            ? "bg-foreground text-background"
                                                                            : "border-gray-300"
                                                                    }`}
                                                                >
                                                                    {page}
                                                                </Button>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className="border-gray-300"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {filteredData.length === 0 && !loading && (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">
                                            {searchTerm ? "No inventory items match your search." : "No inventory data available."}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <AddEditInventoryModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSave}
                        inventoryItem={editingItem}
                    />
                </TabsContent>
            </Tabs>

            {/* Medicine Modal */}
            <AddEditMedicineModal
                isOpen={isMedicineModalOpen}
                onClose={handleMedicineModalClose}
                onSave={handleSaveMedicine}
                medicine={editingMedicine}
            />
        </div>
    )
}
