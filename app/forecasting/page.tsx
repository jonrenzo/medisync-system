"use client"

import {useState, useEffect, useRef} from "react"
import {supabase} from "@/lib/supabase"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {
    LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import {Search, Loader2, FileDown, TrendingUp, Target} from "lucide-react"
import jsPDF from "jspdf"
import {useGenerateImage} from "recharts-to-png";
import * as htmlToImage from "html-to-image";


export default function PredictDemand() {
    const [items, setItems] = useState([])
    const [search, setSearch] = useState("")
    const [filteredItems, setFilteredItems] = useState([])
    const [selectedItem, setSelectedItem] = useState(null)
    const [timeRange, setTimeRange] = useState("3")
    const [chartData, setChartData] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [accuracy, setAccuracy] = useState(null)
    const [generateImage, {ref: chartRef}] = useGenerateImage({
        backgroundColor: "#ffffff", // ✅ solid white background
    });


    // ✅ Fetch items
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

    // ✅ Filter items
    useEffect(() => {
        if (!search.trim()) setFilteredItems([])
        else {
            const filtered = items.filter((item) =>
                item.itemdescription.toLowerCase().includes(search.toLowerCase())
            )
            setFilteredItems(filtered.slice(0, 10))
        }
    }, [search, items])

    // ✅ Generate Forecast
    const handleGenerate = async () => {
        if (!selectedItem) return alert("Please select an item first.")
        setLoading(true)
        setChartData([])
        setError("")
        setAccuracy(null)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    item_code: selectedItem.itemcode,
                    months: parseInt(timeRange)
                })
            })
            if (!response.ok) throw new Error("Insufficient data for prediction")
            const result = await response.json()

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

            // ✅ Use accuracy from API (accuracy_mape)
            if (result.accuracy_mape !== undefined && result.accuracy_mape !== null) {
                setAccuracy(100 - result.accuracy_mape)
            } else {
                setAccuracy(null) // fallback if API didn't return it
            }


        } catch (err) {
            console.error("Error fetching prediction:", err)
            setError("Insufficient historical data for the selected medicine.")
        } finally {
            setLoading(false)
        }
    }

    // ✅ Compute statistics
    const averageHistorical =
        chartData.filter(d => d.stockonhand).reduce((a, b) => a + b.stockonhand, 0) /
        (chartData.filter(d => d.stockonhand).length || 1)

    const averageForecast =
        chartData.filter(d => d.forecast).reduce((a, b) => a + b.forecast, 0) /
        (chartData.filter(d => d.forecast).length || 1)

    const maxHistorical = Math.max(...chartData.filter(d => d.stockonhand).map(d => d.stockonhand), 0)
    const minHistorical = Math.min(...chartData.filter(d => d.stockonhand).map(d => d.stockonhand), 0)
    const maxForecast = Math.max(...chartData.filter(d => d.forecast).map(d => d.forecast), 0)
    const minForecast = Math.min(...chartData.filter(d => d.forecast).map(d => d.forecast), 0)

    const trend = averageForecast > averageHistorical ? "increasing" : "decreasing"
    const trendPercentage = ((averageForecast - averageHistorical) / averageHistorical * 100).toFixed(1)

    const getInterpretation = () => {
        const insights = [];

        // Accuracy
        if (accuracy !== null) {
            if (accuracy >= 85) {
                insights.push(`The system is very confident in the prediction, with about ${accuracy.toFixed(1)}% accuracy.`);
            } else if (accuracy >= 70) {
                insights.push(`The prediction is fairly reliable, with around ${accuracy.toFixed(1)}% accuracy. Some small errors may happen.`);
            } else {
                insights.push(`The prediction is less certain (${accuracy.toFixed(1)}% accuracy). It’s best to double-check with real data when possible.`);
            }
        }

        // Trend direction
        if (trend === "increasing") {
            insights.push(`The demand is expected to go up by around ${Math.abs(parseFloat(trendPercentage))}% compared to past months.`);
            insights.push(`You may need to prepare more stock to meet the higher demand.`);
        } else {
            insights.push(`The demand is expected to go down by around ${Math.abs(parseFloat(trendPercentage))}% compared to past months.`);
            insights.push(`You may need fewer stocks since demand is expected to be lower.`);
        }

        // Peak forecast check
        if (maxForecast > maxHistorical * 1.2) {
            insights.push(`Some months may have higher demand than usual. Consider adding extra stock during those times.`);
        }

        // Low forecast check
        if (minForecast < averageHistorical * 0.5) {
            insights.push(`Some months may have very low demand. You can reduce ordering during those periods.`);
        }

        return insights;
    };

    const handleExportPDF = async () => {
        // 1. Get the PNG data URL using html-to-image
        if (!chartRef.current) {
            alert("Chart reference is missing.");
            return;
        }

        let png;
        try {
            png = await htmlToImage.toPng(chartRef.current, {
                backgroundColor: "#ffffff",
            });
        } catch (err) {
            console.error("Chart image capture failed:", err);
            alert("Chart image could not be generated.");
            return;
        }

        if (!png) {
            alert("Chart image could not be generated.");
            return;
        }

        // Helper: ordinal suffix
        const getOrdinalSuffix = (i: number) => {
            const j = i % 10;
            const k = i % 100;
            if (j === 1 && k !== 11) return "st";
            if (j === 2 && k !== 12) return "nd";
            if (j === 3 && k !== 13) return "rd";
            return "th";
        };

        // 2. Start PDF Generation
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;

        const checkNewPage = (requiredSpace: number) => {
            if (y + requiredSpace > pageHeight - margin) {
                pdf.addPage();
                y = margin;
                return true;
            }
            return false;
        };

        // --- Title ---
        pdf.setFontSize(18);
        pdf.setTextColor(30, 64, 175);
        pdf.text("Demand Forecast Report", pageWidth / 2, y, {align: "center"});
        y += 10;

        // --- Medicine Info ---
        pdf.setFontSize(11);
        pdf.setTextColor(107, 114, 128);
        pdf.text(
            `${selectedItem?.itemcode} - ${selectedItem?.itemdescription} (${selectedItem?.dosage})`,
            pageWidth / 2,
            y,
            {align: "center"}
        );
        y += 6;

        pdf.setFontSize(9);
        pdf.setTextColor(156, 163, 175);
        const dateStr = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        pdf.text(
            `Generated: ${dateStr} | Forecast Period: ${timeRange} month(s)`,
            pageWidth / 2,
            y,
            {align: "center"}
        );
        y += 10;

        // --- Accuracy Box ---
        if (accuracy !== null) {
            let accuracyColor: [number, number, number];
            if (accuracy >= 85) accuracyColor = [16, 185, 129]; // green
            else if (accuracy >= 70) accuracyColor = [251, 191, 36]; // yellow
            else accuracyColor = [239, 68, 68]; // red

            pdf.setFillColor(...accuracyColor);
            pdf.roundedRect(pageWidth / 2 - 30, y, 60, 12, 2, 2, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.text(`Model Accuracy: ${accuracy.toFixed(1)}%`, pageWidth / 2, y + 8, {align: "center"});
            y += 20;
        }

        // --- Chart as Image ---
        try {
            const imgProps = pdf.getImageProperties(png);
            const pdfWidth = pageWidth - 2 * margin;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            checkNewPage(pdfHeight);
            pdf.addImage(png, "PNG", margin, y, pdfWidth, pdfHeight);
            y += pdfHeight + 10;
        } catch (err) {
            console.warn("Failed to export chart image:", err);
        }

        // --- Forecast Table ---
        checkNewPage(30);
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Forecast Table", margin, y);
        y += 8;

        const forecastData = chartData
            .filter((d) => d.forecast)
            .slice(0, parseInt(timeRange));

        if (forecastData.length > 0) {
            const numColumns = forecastData.length + 1;
            const tableWidth = pageWidth - 2 * margin;
            const colWidth = tableWidth / numColumns;
            const rowHeight = 10;

            // --- Header Row ---
            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            pdf.setFillColor(59, 130, 246);
            pdf.rect(margin, y, tableWidth, rowHeight, "F");

            let x = margin;
            pdf.text("Medicine", x + colWidth / 2, y + 7, {align: "center"});
            x += colWidth;

            forecastData.forEach((_, idx) => {
                const monthNumber = idx + 1;
                const monthText = `${monthNumber}${getOrdinalSuffix(monthNumber)} Month`;
                pdf.text(monthText, x + colWidth / 2, y + 7, {align: "center"});
                x += colWidth;
            });

            // --- Data Row ---
            y += rowHeight;
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.setFillColor(245, 247, 250);

            // Draw background box first
            pdf.rect(margin, y, tableWidth, rowHeight, "F");
            pdf.setDrawColor(220, 220, 220);
            pdf.rect(margin, y, tableWidth, rowHeight);

            x = margin;
            pdf.text(selectedItem?.itemdescription || "", x + colWidth / 2, y + 7, {align: "center"});
            x += colWidth;

            forecastData.forEach((f) => {
                pdf.text(f.forecast.toFixed(2), x + colWidth / 2, y + 7, {align: "center"});
                x += colWidth;
            });

            y += rowHeight + 10;
        }

        // --- Key Insights ---
        checkNewPage(40);
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Key Insights", margin, y);
        y += 8;

        const insights = getInterpretation();
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        insights.slice(0, 5).forEach((insight) => {
            const lines = pdf.splitTextToSize(`• ${insight}`, pageWidth - 2 * margin - 5);
            lines.forEach((line) => {
                if (checkNewPage(6)) {
                    pdf.setFontSize(12);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text("Key Insights (continued)", margin, y);
                    y += 8;
                    pdf.setFontSize(9);
                    pdf.setTextColor(60, 60, 60);
                }
                pdf.text(line, margin + 3, y);
                y += 5;
            });
        });

        // --- Footer ---
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(
            "Note: Forecasts are based on historical patterns. Confidence intervals show likely value ranges.",
            pageWidth / 2,
            pageHeight - 10,
            {align: "center"}
        );

        // --- Save PDF ---
        pdf.save(`${selectedItem?.itemcode || "forecast"}_${new Date().toISOString().split("T")[0]}.pdf`);
    };


    const interpretation = chartData.length > 0 ? getInterpretation() : []

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Predict Demand</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Generate the Future Demand of Medicines
                    </p>
                </div>

                {/* Export Button */}
                {chartData.length > 0 && (
                    <Button onClick={handleExportPDF} className="flex items-center gap-2">
                        <FileDown className="h-4 w-4"/> Export PDF
                    </Button>
                )}
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
                        />
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
                                        <span
                                            className="font-medium">{item.itemcode}</span> - {item.itemdescription}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Medicine Details */}
                    {selectedItem && (
                        <div className="rounded-lg border p-3 mb-4 bg-gray-50 text-sm">
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <span className="text-gray-600">Item Code:</span>
                                    <div className="font-medium">{selectedItem.itemcode}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Description:</span>
                                    <div className="font-medium">{selectedItem.itemdescription}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Dosage:</span>
                                    <div className="font-medium">{selectedItem.dosage}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Time range */}
                    <div className="flex items-center gap-4 mb-4">
                        <label className="text-sm font-medium">Time Range</label>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Select range"/>
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
                        {loading ? "Predicting..." : "Generate Forecast"}
                    </Button>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {chartData.length > 0 && (
                <div className="mt-8 space-y-6">
                    {/* Accuracy Card */}
                    {accuracy !== null && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5"/>
                                    Model Accuracy
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-6">
                                    <div className={`text-2xl font-bold ${
                                        accuracy >= 85 ? 'text-green-600' :
                                            accuracy >= 70 ? 'text-yellow-600' :
                                                'text-red-600'
                                    }`}>
                                        {accuracy.toFixed(1)}%
                                    </div>
                                    <div className="flex-1">
                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                            <div
                                                className={`h-4 rounded-full ${
                                                    accuracy >= 85 ? 'bg-green-600' :
                                                        accuracy >= 70 ? 'bg-yellow-600' :
                                                            'bg-red-600'
                                                }`}
                                                style={{width: `${accuracy}%`}}
                                            ></div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {accuracy >= 85 ? 'High accuracy - Reliable predictions' :
                                                accuracy >= 70 ? 'Moderate accuracy - Reasonable predictions' :
                                                    'Lower accuracy - Use with caution'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Forecasted Stock Levels</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80 w-full">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                                        <p className="text-muted-foreground">Analyzing data...</p>
                                    </div>
                                ) : (
                                    <div className="bg-white text-black p-4 rounded-lg h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData} ref={chartRef}> {/* ✅ ref is here */}
                                                <CartesianGrid strokeDasharray="3 3"/>
                                                <XAxis
                                                    dataKey="date"
                                                    tickFormatter={(dateStr) => {
                                                        const date = new Date(dateStr);
                                                        return date.toLocaleString("en-US", {month: "long"});
                                                    }}
                                                />

                                                <YAxis/>
                                                <Tooltip/>
                                                <Area dataKey="upper_ci" stroke="none" fill="rgb(147,197,253)"
                                                      fillOpacity={0.2}/>
                                                <Area dataKey="lower_ci" stroke="none" fill="rgb(147,197,253)"
                                                      fillOpacity={0.2}/>
                                                <Line type="monotone" dataKey="stockonhand" stroke="rgb(16,185,129)"
                                                      strokeWidth={2} dot={false} name="Historical"/>
                                                <Line type="monotone" dataKey="forecast" stroke="rgb(59,130,246)"
                                                      strokeWidth={2} name="Forecast" dot={{r: 3}}
                                                      strokeDasharray="5 5"/>
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Forecast Table Card */}
                    {chartData.filter(d => d.forecast).length > 0 && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Forecast Table</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full table-auto border border-gray-200">
                                        <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border px-2 py-1 text-left">Medicine</th>
                                            {chartData
                                                .filter(d => d.forecast)
                                                .slice(0, parseInt(timeRange))
                                                .map((d, idx) => (
                                                    <th key={idx} className="border px-2 py-1 text-center">
                                                        {idx + 1}{idx === 0 ? "st" : idx === 1 ? "nd" : idx === 2 ? "rd" : "th"} Month
                                                    </th>
                                                ))}
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td className="border px-2 py-1 font-medium">{selectedItem?.itemdescription}</td>
                                            {chartData
                                                .filter(d => d.forecast)
                                                .slice(0, parseInt(timeRange))
                                                .map((d, idx) => (
                                                    <td key={idx}
                                                        className="border px-2 py-1 text-center">{d.forecast.toFixed(2)}</td>
                                                ))}
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Key Insights Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5"/>
                                Key Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3 mb-6">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium">Avg. Historical</p>
                                    <p className="text-2xl font-bold text-blue-900">{averageHistorical.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <p className="text-sm text-green-600 font-medium">Avg. Forecast</p>
                                    <p className="text-2xl font-bold text-green-900">{averageForecast.toFixed(2)}</p>
                                </div>
                                <div
                                    className={`p-4 rounded-lg ${trend === 'increasing' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                    <p className={`text-sm font-medium ${trend === 'increasing' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        Trend
                                    </p>
                                    <p className={`text-2xl font-bold ${trend === 'increasing' ? 'text-emerald-900' : 'text-red-900'}`}>
                                        {trend === 'increasing' ? '↑' : '↓'} {Math.abs(parseFloat(trendPercentage))}%
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">Interpretation</h3>
                                {interpretation.map((insight, idx) => (
                                    <p key={idx}
                                       className="text-sm text-muted-foreground border-l-2 border-blue-500 pl-3">
                                        {insight}
                                    </p>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
