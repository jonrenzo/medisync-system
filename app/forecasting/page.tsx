"use client"

import ProtectedPage from "@/components/ProtectedPage";
import {useState, useEffect, useRef} from "react"
import {supabase} from "@/lib/supabase"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {
    LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import {Search, Loader2, FileDown, TrendingUp, Target, Package, AlertTriangle} from "lucide-react"
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
    const [currentStock, setCurrentStock] = useState(0)
    const [safetyStockPercent, setSafetyStockPercent] = useState(30)
    const [generateImage, {ref: chartRef}] = useGenerateImage({
        backgroundColor: "#ffffff",
    });

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

    useEffect(() => {
        if (!search.trim()) setFilteredItems([])
        else {
            const filtered = items.filter((item) =>
                item.itemdescription.toLowerCase().includes(search.toLowerCase())
            )
            setFilteredItems(filtered.slice(0, 10))
        }
    }, [search, items])

    // Fetch current stock when item is selected
    useEffect(() => {
        const fetchCurrentStock = async () => {
            if (!selectedItem) return;

            const {data, error} = await supabase
                .from("inventory")
                .select("quantityissued")
                .eq("itemcode", selectedItem.itemcode)
                .order("inventoryid", {ascending: false})
                .limit(1)
                .single();

            if (!error && data) {
                setCurrentStock(data.quantityissued || 0);
            } else {
                setCurrentStock(0);
            }
        }

        fetchCurrentStock();
    }, [selectedItem]);

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

            if (result.accuracy_mape !== undefined && result.accuracy_mape !== null) {
                setAccuracy(100 - result.accuracy_mape)
            } else {
                setAccuracy(null)
            }

        } catch (err) {
            console.error("Error fetching prediction:", err)
            setError("Insufficient historical data for the selected medicine.")
        } finally {
            setLoading(false)
        }
    }

    // Calculate restocking suggestions
    const calculateRestockingSuggestion = () => {
        const forecastData = chartData.filter(d => d.forecast);
        if (forecastData.length === 0) return null;

        // Total forecasted demand
        const totalForecastedDemand = forecastData.reduce((sum, d) => sum + d.forecast, 0);

        // Average monthly demand
        const avgMonthlyDemand = totalForecastedDemand / forecastData.length;

        // Peak demand (highest month)
        const peakDemand = Math.max(...forecastData.map(d => d.forecast));

        // Safety stock calculation
        const safetyStock = (totalForecastedDemand * safetyStockPercent) / 100;

        // Target stock level (what you need to have)
        const targetStockLevel = totalForecastedDemand + safetyStock;

        // Recommended reorder quantity (how much to order)
        const reorderQuantity = Math.max(0, targetStockLevel - currentStock);

        // Reorder point (when to reorder) - based on monthly average
        const reorderPoint = avgMonthlyDemand + (avgMonthlyDemand * safetyStockPercent / 100);

        // Stock status
        const stockStatus = currentStock < reorderPoint ? 'low' :
            currentStock < avgMonthlyDemand ? 'moderate' : 'sufficient';

        // Monthly breakdown
        const monthlyBreakdown = forecastData.map((d, idx) => ({
            month: idx + 1,
            demand: d.forecast,
            withSafety: d.forecast + (d.forecast * safetyStockPercent / 100)
        }));

        return {
            totalForecastedDemand,
            avgMonthlyDemand,
            peakDemand,
            safetyStock,
            reorderQuantity,
            targetStockLevel,
            reorderPoint,
            stockStatus,
            monthlyBreakdown,
            currentStock
        };
    };

    const restockingSuggestion = chartData.length > 0 ? calculateRestockingSuggestion() : null;

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

        if (accuracy !== null) {
            if (accuracy >= 85) {
                insights.push(`The system is very confident in the prediction, with about ${accuracy.toFixed(1)}% accuracy.`);
            } else if (accuracy >= 70) {
                insights.push(`The prediction is fairly reliable, with around ${accuracy.toFixed(1)}% accuracy. Some small errors may happen.`);
            } else {
                insights.push(`The prediction is less certain (${accuracy.toFixed(1)}% accuracy). It's best to double-check with real data when possible.`);
            }
        }

        if (trend === "increasing") {
            insights.push(`The demand is expected to go up by around ${Math.abs(parseFloat(trendPercentage))}% compared to past months.`);
            insights.push(`You may need to prepare more stock to meet the higher demand.`);
        } else {
            insights.push(`The demand is expected to go down by around ${Math.abs(parseFloat(trendPercentage))}% compared to past months.`);
            insights.push(`You may need fewer stocks since demand is expected to be lower.`);
        }

        if (maxForecast > maxHistorical * 1.2) {
            insights.push(`Some months may have higher demand than usual. Consider adding extra stock during those times.`);
        }

        if (minForecast < averageHistorical * 0.5) {
            insights.push(`Some months may have very low demand. You can reduce ordering during those periods.`);
        }

        return insights;
    };

    const handleExportPDF = async () => {
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

        const getOrdinalSuffix = (i: number) => {
            const j = i % 10;
            const k = i % 100;
            if (j === 1 && k !== 11) return "st";
            if (j === 2 && k !== 12) return "nd";
            if (j === 3 && k !== 13) return "rd";
            return "th";
        };

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

        pdf.setFontSize(18);
        pdf.setTextColor(30, 64, 175);
        pdf.text("Demand Forecast Report", pageWidth / 2, y, {align: "center"});
        y += 10;

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

        if (accuracy !== null) {
            let accuracyColor: [number, number, number];
            if (accuracy >= 85) accuracyColor = [16, 185, 129];
            else if (accuracy >= 70) accuracyColor = [251, 191, 36];
            else accuracyColor = [239, 68, 68];

            pdf.setFillColor(...accuracyColor);
            pdf.roundedRect(pageWidth / 2 - 30, y, 60, 12, 2, 2, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.text(`Model Accuracy: ${accuracy.toFixed(1)}%`, pageWidth / 2, y + 8, {align: "center"});
            y += 20;
        }

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

        // Add Restocking Recommendations Section
        if (restockingSuggestion) {
            checkNewPage(80);

            // Section Header
            pdf.setFontSize(14);
            pdf.setTextColor(30, 64, 175);
            pdf.text("Restocking Recommendations", margin, y);
            y += 8;

            // Stock Status Box
            let statusColor: [number, number, number];
            let statusText: string;
            if (restockingSuggestion.stockStatus === 'low') {
                statusColor = [239, 68, 68]; // red
                statusText = 'LOW STOCK - Reorder Now!';
            } else if (restockingSuggestion.stockStatus === 'moderate') {
                statusColor = [251, 191, 36]; // yellow
                statusText = 'MODERATE - Monitor Closely';
            } else {
                statusColor = [16, 185, 129]; // green
                statusText = 'SUFFICIENT STOCK';
            }

            pdf.setFillColor(...statusColor);
            pdf.roundedRect(margin, y, pageWidth - 2 * margin, 10, 2, 2, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.text(statusText, pageWidth / 2, y + 7, {align: "center"});
            y += 15;

            // Key Metrics in Grid
            const boxWidth = (pageWidth - 2 * margin - 6) / 3;
            const boxHeight = 20;

            // Box 1: Current Stock
            pdf.setFillColor(245, 245, 245);
            pdf.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, "F");
            pdf.setDrawColor(200, 200, 200);
            pdf.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, "S");
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(8);
            pdf.text("Current Stock", margin + boxWidth / 2, y + 7, {align: "center"});
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(12);
            pdf.text(`${restockingSuggestion.currentStock.toFixed(0)} units`, margin + boxWidth / 2, y + 15, {align: "center"});

            // Box 2: Reorder Quantity (Highlighted)
            pdf.setFillColor(219, 234, 254);
            pdf.roundedRect(margin + boxWidth + 3, y, boxWidth, boxHeight, 2, 2, "F");
            pdf.setDrawColor(59, 130, 246);
            pdf.setLineWidth(0.5);
            pdf.roundedRect(margin + boxWidth + 3, y, boxWidth, boxHeight, 2, 2, "S");
            pdf.setLineWidth(0.2);
            pdf.setTextColor(30, 64, 175);
            pdf.setFontSize(8);
            pdf.text("Recommended Reorder", margin + boxWidth + 3 + boxWidth / 2, y + 7, {align: "center"});
            pdf.setTextColor(30, 64, 175);
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${restockingSuggestion.reorderQuantity.toFixed(0)} units`, margin + boxWidth + 3 + boxWidth / 2, y + 15, {align: "center"});
            pdf.setFont("helvetica", "normal");

            // Box 3: Target Stock
            pdf.setFillColor(245, 245, 245);
            pdf.roundedRect(margin + 2 * boxWidth + 6, y, boxWidth, boxHeight, 2, 2, "F");
            pdf.setDrawColor(200, 200, 200);
            pdf.roundedRect(margin + 2 * boxWidth + 6, y, boxWidth, boxHeight, 2, 2, "S");
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(8);
            pdf.text("Target Stock Level", margin + 2 * boxWidth + 6 + boxWidth / 2, y + 7, {align: "center"});
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(12);
            pdf.text(`${restockingSuggestion.targetStockLevel.toFixed(0)} units`, margin + 2 * boxWidth + 6 + boxWidth / 2, y + 15, {align: "center"});

            y += boxHeight + 8;

            // Additional Metrics
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            const metrics = [
                {
                    label: "Total Forecasted Demand",
                    value: `${restockingSuggestion.totalForecastedDemand.toFixed(0)} units (${timeRange} months)`
                },
                {
                    label: "Average Monthly Demand",
                    value: `${restockingSuggestion.avgMonthlyDemand.toFixed(0)} units/month`
                },
                {label: "Peak Demand", value: `${restockingSuggestion.peakDemand.toFixed(0)} units`},
                {
                    label: "Safety Stock Buffer",
                    value: `${restockingSuggestion.safetyStock.toFixed(0)} units (${safetyStockPercent}%)`
                },
                {label: "Reorder Point", value: `${restockingSuggestion.reorderPoint.toFixed(0)} units`},
            ];

            metrics.forEach((metric) => {
                checkNewPage(7);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`${metric.label}:`, margin, y);
                pdf.setTextColor(0, 0, 0);
                pdf.setFont("helvetica", "bold");
                pdf.text(metric.value, margin + 60, y);
                pdf.setFont("helvetica", "normal");
                y += 7;
            });

            y += 5;

            // Monthly Breakdown Table
            checkNewPage(40);
            pdf.setFontSize(11);
            pdf.setTextColor(0, 0, 0);
            pdf.text("Monthly Demand Breakdown", margin, y);
            y += 6;

            const tableStartY = y;
            const colWidths = [30, 50, 60];
            const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);
            const rowHeight = 8;

            // Table Header
            pdf.setFillColor(59, 130, 246);
            pdf.rect(margin, y, totalTableWidth, rowHeight, "F");
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(9);

            let xPos = margin;
            pdf.text("Month", xPos + colWidths[0] / 2, y + 5.5, {align: "center"});
            xPos += colWidths[0];
            pdf.text("Forecasted Demand", xPos + colWidths[1] / 2, y + 5.5, {align: "center"});
            xPos += colWidths[1];
            pdf.text("With Safety Stock", xPos + colWidths[2] / 2, y + 5.5, {align: "center"});

            y += rowHeight;

            // Table Rows
            pdf.setTextColor(0, 0, 0);
            restockingSuggestion.monthlyBreakdown.forEach((month, idx) => {
                checkNewPage(rowHeight);

                // Alternating row colors
                if (idx % 2 === 0) {
                    pdf.setFillColor(249, 250, 251);
                    pdf.rect(margin, y, totalTableWidth, rowHeight, "F");
                }

                // Draw borders
                pdf.setDrawColor(229, 231, 235);
                pdf.rect(margin, y, totalTableWidth, rowHeight);

                xPos = margin;
                pdf.text(`Month ${month.month}`, xPos + colWidths[0] / 2, y + 5.5, {align: "center"});
                xPos += colWidths[0];
                pdf.text(`${month.demand.toFixed(0)} units`, xPos + colWidths[1] / 2, y + 5.5, {align: "center"});
                xPos += colWidths[1];
                pdf.setTextColor(30, 64, 175);
                pdf.setFont("helvetica", "bold");
                pdf.text(`${month.withSafety.toFixed(0)} units`, xPos + colWidths[2] / 2, y + 5.5, {align: "center"});
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(0, 0, 0);

                y += rowHeight;
            });

            y += 8;

            // Recommendation Summary Box
            checkNewPage(20);
            pdf.setFillColor(219, 234, 254);
            pdf.setDrawColor(59, 130, 246);
            pdf.roundedRect(margin, y, pageWidth - 2 * margin, 18, 2, 2, "FD");

            pdf.setTextColor(30, 64, 175);
            pdf.setFontSize(9);
            pdf.text("Recommendation Summary:", margin + 3, y + 6);
            pdf.setTextColor(60, 60, 60);
            pdf.setFontSize(8);

            let summaryText = "";
            if (restockingSuggestion.stockStatus === 'low') {
                summaryText = `Order ${restockingSuggestion.reorderQuantity.toFixed(0)} units immediately to avoid stockouts. Current stock is below the reorder point.`;
            } else if (restockingSuggestion.stockStatus === 'moderate') {
                summaryText = `Consider ordering ${restockingSuggestion.reorderQuantity.toFixed(0)} units soon. Monitor stock levels closely.`;
            } else {
                summaryText = `Stock levels are sufficient. Plan to reorder ${restockingSuggestion.reorderQuantity.toFixed(0)} units when stock falls below ${restockingSuggestion.reorderPoint.toFixed(0)} units.`;
            }

            const summaryLines = pdf.splitTextToSize(summaryText, pageWidth - 2 * margin - 10);
            let summaryY = y + 11;
            summaryLines.forEach((line) => {
                pdf.text(line, margin + 3, summaryY);
                summaryY += 4;
            });

            y += 22;
        }

        checkNewPage(30);
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

        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(
            "Note: Forecasts are based on historical patterns. Confidence intervals show likely value ranges.",
            pageWidth / 2,
            pageHeight - 10,
            {align: "center"}
        );

        pdf.save(`${selectedItem?.itemcode || "forecast"}_${new Date().toISOString().split("T")[0]}.pdf`);
    };

    const interpretation = chartData.length > 0 ? getInterpretation() : []

    return (
        <ProtectedPage pageName="Prediction">
            <div className="min-h-screen bg-background p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Predict Demand</h1>
                    </div>

                    {chartData.length > 0 && (
                        <Button onClick={handleExportPDF} className="flex items-center gap-2">
                            <FileDown className="h-4 w-4"/> Export PDF
                        </Button>
                    )}
                </div>

                <Card>
                    <CardContent className="pt-6">
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

                        {selectedItem && (
                            <div className="rounded-lg border p-3 mb-4 bg-gray-50 text-sm">
                                <div className="grid grid-cols-4 gap-2">
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
                                    <div>
                                        <span className="text-gray-600">Current Stock:</span>
                                        <div className="font-medium">{currentStock} units</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
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

                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">Safety Stock %</label>
                                <Input
                                    type="number"
                                    value={safetyStockPercent}
                                    onChange={(e) => setSafetyStockPercent(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                                    className="w-[100px]"
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>

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
                        {/* Restocking Recommendation Card */}
                        {restockingSuggestion && (
                            <Card className="border-2 border-blue-200 bg-blue-50/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-blue-600"/>
                                        Restocking Recommendations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                                        <div className={`p-4 rounded-lg ${
                                            restockingSuggestion.stockStatus === 'low' ? 'bg-red-100 border-2 border-red-300' :
                                                restockingSuggestion.stockStatus === 'moderate' ? 'bg-yellow-100 border-2 border-yellow-300' :
                                                    'bg-green-100 border-2 border-green-300'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {restockingSuggestion.stockStatus === 'low' && (
                                                    <AlertTriangle className="h-5 w-5 text-red-600"/>
                                                )}
                                                <p className={`text-sm font-medium ${
                                                    restockingSuggestion.stockStatus === 'low' ? 'text-red-700' :
                                                        restockingSuggestion.stockStatus === 'moderate' ? 'text-yellow-700' :
                                                            'text-green-700'
                                                }`}>
                                                    Current Stock Status
                                                </p>
                                            </div>
                                            <p className={`text-2xl font-bold ${
                                                restockingSuggestion.stockStatus === 'low' ? 'text-red-900' :
                                                    restockingSuggestion.stockStatus === 'moderate' ? 'text-yellow-900' :
                                                        'text-green-900'
                                            }`}>
                                                {restockingSuggestion.currentStock.toFixed(0)} units
                                            </p>
                                            <p className={`text-xs mt-1 ${
                                                restockingSuggestion.stockStatus === 'low' ? 'text-red-600' :
                                                    restockingSuggestion.stockStatus === 'moderate' ? 'text-yellow-600' :
                                                        'text-green-600'
                                            }`}>
                                                {restockingSuggestion.stockStatus === 'low' ? 'Reorder Now!' :
                                                    restockingSuggestion.stockStatus === 'moderate' ? 'Monitor Closely' :
                                                        'Sufficient Stock'}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-blue-100 border-2 border-blue-300 rounded-lg">
                                            <p className="text-sm text-blue-700 font-medium mb-2">Recommended Reorder
                                                Qty</p>
                                            <p className="text-2xl font-bold text-blue-900">
                                                {restockingSuggestion.reorderQuantity.toFixed(0)} units
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                Target: {restockingSuggestion.targetStockLevel.toFixed(0)} units total
                                            </p>
                                        </div>

                                        <div className="p-4 bg-purple-100 border-2 border-purple-300 rounded-lg">
                                            <p className="text-sm text-purple-700 font-medium mb-2">Reorder Point</p>
                                            <p className="text-2xl font-bold text-purple-900">
                                                {restockingSuggestion.reorderPoint.toFixed(0)} units
                                            </p>
                                            <p className="text-xs text-purple-600 mt-1">
                                                Order when stock hits this level
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                                        <div className="p-3 bg-white rounded-lg border">
                                            <p className="text-sm text-gray-600 mb-1">Total Forecasted Demand</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {restockingSuggestion.totalForecastedDemand.toFixed(0)} units
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">For next {timeRange} month(s)</p>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border">
                                            <p className="text-sm text-gray-600 mb-1">Average Monthly Demand</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {restockingSuggestion.avgMonthlyDemand.toFixed(0)} units/month
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border">
                                            <p className="text-sm text-gray-600 mb-1">Peak Demand</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {restockingSuggestion.peakDemand.toFixed(0)} units
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Highest forecasted month</p>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border">
                                            <p className="text-sm text-gray-600 mb-1">Safety Stock Buffer</p>
                                            <p className="text-xl font-bold text-gray-900">
                                                {restockingSuggestion.safetyStock.toFixed(0)} units
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{safetyStockPercent}% of total
                                                demand</p>
                                        </div>
                                    </div>

                                    {/* Monthly Breakdown Table */}
                                    <div className="mt-4">
                                        <h4 className="font-semibold text-sm mb-2">Monthly Demand Breakdown</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm border border-gray-200">
                                                <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border px-3 py-2 text-left">Month</th>
                                                    <th className="border px-3 py-2 text-right">Forecasted Demand</th>
                                                    <th className="border px-3 py-2 text-right">With Safety Stock</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {restockingSuggestion.monthlyBreakdown.map((month) => (
                                                    <tr key={month.month} className="hover:bg-gray-50">
                                                        <td className="border px-3 py-2">Month {month.month}</td>
                                                        <td className="border px-3 py-2 text-right font-medium">
                                                            {month.demand.toFixed(0)} units
                                                        </td>
                                                        <td className="border px-3 py-2 text-right text-blue-600 font-medium">
                                                            {month.withSafety.toFixed(0)} units
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

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
                                                    className={`h-2 rounded-full ${
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
                                                <LineChart data={chartData} ref={chartRef}>
                                                    <CartesianGrid strokeDasharray="3 3"/>
                                                    <XAxis
                                                        dataKey="date"
                                                        tickFormatter={(dateStr) => {
                                                            const date = new Date(dateStr);
                                                            return date.toLocaleString("en-US", {month: "short"});
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
        </ProtectedPage>
    )
}
