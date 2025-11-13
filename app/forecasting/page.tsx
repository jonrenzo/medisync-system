"use client"

import {useState, useEffect} from "react"
import {supabase} from "@/lib/supabase"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {
    LineChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import {Search, Loader2} from "lucide-react"

export default function PredictDemand() {
    const [items, setItems] = useState([])
    const [search, setSearch] = useState("")
    const [filteredItems, setFilteredItems] = useState([])
    const [selectedItem, setSelectedItem] = useState(null)
    const [timeRange, setTimeRange] = useState("3")
    const [chartData, setChartData] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // ✅ Fetch all items from Supabase
    useEffect(() => {
        const fetchItems = async () => {
            const {data, error} = await supabase
                .from("items")
                .select("itemcode, itemdescription, dosage, unitofmeasurement")
                .order("itemcode")

            if (!error && data) setItems(data)
        }
        fetchItems()
    }, [])

    // ✅ Filter items based on search query
    useEffect(() => {
        if (!search.trim()) setFilteredItems([])
        else {
            const filtered = items.filter((item) =>
                item.itemdescription.toLowerCase().includes(search.toLowerCase())
            )
            setFilteredItems(filtered.slice(0, 10)) // show top 10
        }
    }, [search, items])

    // ✅ Handle "Generate" button click
    const handleGenerate = async () => {
        if (!selectedItem) return alert("Please select an item first.")
        setLoading(true)
        setChartData([])
        setError("")

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    item_code: selectedItem.itemcode,
                    months: parseInt(timeRange)
                })
            })

            if (!response.ok) {
                throw new Error("Insufficient data for prediction")
            }
            const result = await response.json()

            // ✅ Combine historical + forecast data
            const historyData = result.history.map((h: any) => ({
                date: h.date,
                stockonhand: h.stockonhand,
                forecast: null,
                lower_ci: null,
                upper_ci: null,
                type: "historical"
            }))

            const predictionData = result.predictions.map((p: any) => ({
                date: p.date,
                forecast: p.forecast,
                lower_ci: p.lower_ci,
                upper_ci: p.upper_ci,
                stockonhand: null,
                type: "forecast"
            }))

            setChartData([...historyData, ...predictionData])
        } catch (err) {
            console.error("Error fetching prediction:", err)
            setError("Insufficient historical data for the selected medicine. Please choose a different item or time range.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Predict Demand</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Generate the Future Demand of the Medicines
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {/* Search bar */}
                    <div className="mb-4 relative">
                        <div className="flex items-center gap-2 mb-2">
                            <Search className="h-4 w-4 text-muted-foreground"/>
                            <label className="text-sm font-medium">Search Medicine</label>
                        </div>
                        <Input
                            type="text"
                            placeholder="Type medicine name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />

                        {/* Suggestion dropdown */}
                        {filteredItems.length > 0 && (
                            <div
                                className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-56 overflow-auto">
                                {filteredItems.map((item) => (
                                    <button
                                        key={item.itemcode}
                                        onClick={() => {
                                            setSelectedItem(item)
                                            setSearch("")
                                            setFilteredItems([])
                                            setError("")
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        <span className="font-medium">{item.itemcode}</span> -{" "}
                                        {item.itemdescription}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected item card */}
                    {selectedItem && (
                        <div className="rounded-lg border p-3 mb-4 bg-gray-50">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-600">Description:</span>
                                    <div className="font-medium">{selectedItem.itemdescription}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Dosage:</span>
                                    <div className="font-medium">{selectedItem.dosage}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Unit:</span>
                                    <div className="font-medium capitalize">{selectedItem.unitofmeasurement}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Time range dropdown */}
                    <div className="flex items-center gap-4 mb-4">
                        <label className="text-sm font-medium">Time Range</label>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 month</SelectItem>
                                <SelectItem value="3">3 months</SelectItem>
                                <SelectItem value="6">6 months</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Generate button */}
                    <Button onClick={handleGenerate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {loading ? "Predicting demand..." : "Generate Forecast"}
                    </Button>

                    {/* Error message */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Chart */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Forecasted Stock Levels</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-80 w-full">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                <p className="text-muted-foreground">Analyzing historical data and predicting
                                    demand...</p>
                            </div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis dataKey="date"/>
                                    <YAxis/>
                                    <Tooltip/>

                                    {/* Confidence Interval (shaded area) */}
                                    <Area
                                        type="monotone"
                                        dataKey="upper_ci"
                                        stroke="none"
                                        fill="#93c5fd"
                                        fillOpacity={0.2}
                                        isAnimationActive={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="lower_ci"
                                        stroke="none"
                                        fill="#93c5fd"
                                        fillOpacity={0.2}
                                        isAnimationActive={false}
                                    />

                                    {/* Historical Line */}
                                    <Line
                                        type="monotone"
                                        dataKey="stockonhand"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Historical"
                                    />

                                    {/* Forecast Line */}
                                    <Line
                                        type="monotone"
                                        dataKey="forecast"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        name="Forecast"
                                        dot={{r: 3}}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Select a medicine and click Generate to view forecast</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
