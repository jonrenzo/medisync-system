"use client"

import ProtectedPage from "@/components/ProtectedPage";
import {useState, useEffect} from "react"
import {supabase} from "@/lib/supabase"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Search, Loader2, AlertCircle, Plus, ChevronDown} from "lucide-react"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {InventoryTable, type InventoryItem} from "@/components/requisitions/requisition-table"
import {AddEditInventoryModal} from "@/components/requisitions/add-edit-inventory-modal"
import {MedicineTable} from "@/components/medicines/medicine-table"
import {AddEditMedicineModal} from "@/components/medicines/add-edit-medicine-modal"
import {DropdownMenu, DropdownMenuContent, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

export interface Medicine {
    itemcode: string
    unitofmeasurement: string
    itemdescription: string
    dosage?: string
    qrcode?: string
}

export default function Inventory() {
    // Inventory
    const [inventoryData, setInventoryData] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

    // Medicines
    const [medicines, setMedicines] = useState<Medicine[]>([])
    const [medicineLoading, setMedicineLoading] = useState(true)
    const [medicineError, setMedicineError] = useState<string | null>(null)
    const [medicineSearchTerm, setMedicineSearchTerm] = useState("")
    const [medicineCurrentPage, setMedicineCurrentPage] = useState(1)
    const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false)
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null)

    const itemsPerPage = 50
    const medicineItemsPerPage = 10
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
    const [selectedMonth, setSelectedMonth] = useState("January")
    const [selectedYear, setSelectedYear] = useState("2025")


    useEffect(() => {
        fetchInventoryData()
        fetchMedicines()
    }, [])

    /** ========== INVENTORY FUNCTIONS ========== **/
    const fetchInventoryData = async () => {
        try {
            setLoading(true)
            const {data, error} = await supabase
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
                purchaseOrderNo,
                month,
                year,
                items ( itemdescription, dosage, unitofmeasurement )
            `)
                .eq("month", months.indexOf(selectedMonth) + 1) // convert text month -> number
                .eq("year", parseInt(selectedYear))
                .order("inventoryid", {ascending: false})

            if (error) throw error

            const formatted =
                data?.map((item) => ({
                    ...item,
                    itemdescription: (item.items as any)?.itemdescription,
                    dosage: (item.items as any)?.dosage,
                    unitofmeasurement: (item.items as any)?.unitofmeasurement,
                })) ?? []

            setInventoryData(formatted)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInventoryData()
    }, [selectedMonth, selectedYear])


    const handleSaveInventory = async (formData: {
        itemcode: string
        batchlotno: string
        expirationdate: string
        quantityrequested: number
        quantityissued: number
        unitcost: number
        purchaseOrderNo: string
    }) => {
        try {
            if (editingItem) {
                const {error} = await supabase
                    .from("inventory")
                    .update(formData)
                    .eq("inventoryid", editingItem.inventoryid)
                if (error) throw error
            } else {
                const {error} = await supabase.from("inventory").insert(formData)
                if (error) throw error
            }
            await fetchInventoryData()
            closeInventoryModal()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDeleteInventory = async (id: number) => {
        if (!confirm("Delete this record?")) return
        try {
            const {error} = await supabase.from("inventory").delete().eq("inventoryid", id)
            if (error) throw error
            setInventoryData((prev) => prev.filter((i) => i.inventoryid !== id))
        } catch (err: any) {
            setError(err.message)
        }
    }

    const openAddInventory = () => {
        setEditingItem(null)
        setIsModalOpen(true)
    }

    const openEditInventory = (item: InventoryItem) => {
        setEditingItem(item)
        setIsModalOpen(true)
    }

    const closeInventoryModal = () => {
        setIsModalOpen(false)
        setEditingItem(null)
    }

    /** ========== MEDICINE FUNCTIONS ========== **/
    const fetchMedicines = async () => {
        try {
            setMedicineLoading(true)
            const {data, error} = await supabase.from("items").select("*").order("itemcode", {ascending: true})
            if (error) throw error
            setMedicines(data || [])
        } catch (err: any) {
            setMedicineError(err.message)
        } finally {
            setMedicineLoading(false)
        }
    }

    const handleSaveMedicine = async (formData: {
        itemcode: string
        itemdescription: string
        dosage?: string
        unitofmeasurement: string
    }) => {
        try {
            if (editingMedicine) {
                const {data, error} = await supabase
                    .from("items")
                    .update(formData)
                    .eq("itemcode", editingMedicine.itemcode)
                    .select()
                    .single()
                if (error) throw error
                setMedicines((prev) => prev.map((m) => (m.itemcode === editingMedicine.itemcode ? data : m)))
            } else {
                const {data, error} = await supabase.from("items").insert([formData]).select().single()
                if (error) throw error
                setMedicines((prev) => [data, ...prev])
            }
            closeMedicineModal()
        } catch (err: any) {
            setMedicineError(err.message)
        }
    }

    const handleDeleteMedicine = async (itemcode: string) => {
        if (!confirm("Delete this medicine?")) return
        try {
            const {error} = await supabase.from("items").delete().eq("itemcode", itemcode)
            if (error) throw error
            setMedicines((prev) => prev.filter((m) => m.itemcode !== itemcode))
        } catch (err: any) {
            setMedicineError(err.message)
        }
    }

    const openAddMedicine = () => {
        setEditingMedicine(null)
        setIsMedicineModalOpen(true)
    }

    const openEditMedicine = (medicine: Medicine) => {
        setEditingMedicine(medicine)
        setIsMedicineModalOpen(true)
    }

    const closeMedicineModal = () => {
        setIsMedicineModalOpen(false)
        setEditingMedicine(null)
    }

    /** ========== FILTERING & PAGINATION ========== **/
    const filterItems = <T extends { [key: string]: any }>(
        data: T[],
        search: string,
        keys: string[]
    ) => {
        const lower = search.toLowerCase()
        return data.filter((item) => keys.some((key) => item[key]?.toLowerCase().includes(lower)))
    }

    const paginate = <T, >(data: T[], page: number, perPage: number) =>
        data.slice((page - 1) * perPage, page * perPage)

    const filteredInventory = filterItems(inventoryData, searchTerm, [
        "itemcode",
        "itemdescription",
        "batchlotno",
    ])
    const paginatedInventory = paginate(filteredInventory, currentPage, itemsPerPage)
    const inventoryTotalPages = Math.ceil(filteredInventory.length / itemsPerPage)

    const filteredMedicines = filterItems(medicines, medicineSearchTerm, [
        "itemcode",
        "itemdescription",
        "dosage",
    ])
    const paginatedMedicines = paginate(filteredMedicines, medicineCurrentPage, medicineItemsPerPage)
    const medicineTotalPages = Math.ceil(filteredMedicines.length / medicineItemsPerPage)

    return (
        <ProtectedPage pageName="Inventory">
            <div className="min-h-screen p-6 bg-background">
                <h1 className="mb-8 text-3xl font-bold">Inventory Management</h1>

                <Tabs defaultValue="directory" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="directory">Medicine Directory</TabsTrigger>
                        <TabsTrigger value="intake">Inventory Intake</TabsTrigger>
                    </TabsList>

                    {/* ===== MEDICINE DIRECTORY ===== */}
                    <TabsContent value="directory">
                        <div className="rounded-lg border bg-white p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <Input
                                    placeholder="Search by code, name, or dosage..."
                                    value={medicineSearchTerm}
                                    onChange={(e) => setMedicineSearchTerm(e.target.value)}
                                    className="flex-1"
                                />
                                <Button onClick={openAddMedicine} className="gap-2">
                                    <Plus className="h-4 w-4"/>
                                    Add Medicine
                                </Button>
                            </div>

                            {medicineError && (
                                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
                                    <AlertCircle className="h-5 w-5 text-red-600"/>
                                    <p className="text-sm text-red-700">{medicineError}</p>
                                </div>
                            )}

                            {medicineLoading ? (
                                <div className="flex justify-center py-12 text-gray-600">
                                    <Loader2 className="mr-2 h-8 w-8 animate-spin"/>
                                    Loading medicines...
                                </div>
                            ) : filteredMedicines.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <p className="text-lg font-medium">No medicines found</p>
                                    <p className="text-sm">
                                        {medicineSearchTerm ? 'Try adjusting your search' : 'Add your first medicine to get started'}
                                    </p>
                                </div>
                            ) : (
                                <MedicineTable
                                    key={medicineSearchTerm} // Reset component when search changes
                                    medicines={filteredMedicines}
                                    onEdit={openEditMedicine}
                                    onDelete={handleDeleteMedicine}
                                />
                            )}
                        </div>
                    </TabsContent>

                    {/* ===== INVENTORY INTAKE ===== */}
                    <TabsContent value="intake">
                        {/* Month / Year Filters */}
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex gap-4">
                                {/* Month */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-40 justify-between bg-transparent">
                                            {selectedMonth}
                                            <ChevronDown className="h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-40">
                                        {months.map((month) => (
                                            <button
                                                key={month}
                                                onClick={() => setSelectedMonth(month)}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                            >
                                                {month}
                                            </button>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Year */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-40 justify-between bg-transparent">
                                            {selectedYear}
                                            <ChevronDown className="h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-40">
                                        {years.map((year) => (
                                            <button
                                                key={year}
                                                onClick={() => setSelectedYear(year)}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                            >
                                                {year}
                                            </button>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <Button variant="outline">Export</Button>
                        </div>
                        <div className="rounded-lg border bg-white p-6 space-y-6">
                            <div className="mb-4 flex items-center gap-4">
                                <div className="relative max-w-sm flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"/>
                                    <Input
                                        placeholder="Search by item code, description, or batch..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Button onClick={openAddInventory} className="gap-2">
                                    <Plus className="h-4 w-4"/>
                                    Add Record
                                </Button>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
                                    <AlertCircle className="h-5 w-5 text-red-600"/>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center py-12 text-gray-600">
                                    <Loader2 className="mr-2 h-8 w-8 animate-spin"/>
                                    Loading inventory...
                                </div>
                            ) : (
                                <InventoryTable
                                    items={paginatedInventory}
                                    startIndex={(currentPage - 1) * itemsPerPage}
                                    onEdit={openEditInventory}
                                    onDelete={handleDeleteInventory}
                                />
                            )}
                        </div>

                        <AddEditInventoryModal
                            isOpen={isModalOpen}
                            onClose={closeInventoryModal}
                            onSave={handleSaveInventory}
                            inventoryItem={editingItem}
                        />
                    </TabsContent>
                </Tabs>

                <AddEditMedicineModal
                    isOpen={isMedicineModalOpen}
                    onClose={closeMedicineModal}
                    onSave={handleSaveMedicine}
                    medicine={editingMedicine}
                />
            </div>
        </ProtectedPage>
    )
}
