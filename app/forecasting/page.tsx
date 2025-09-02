"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Download, RefreshCw, BarChart3, AlertTriangle, CheckCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const forecastData = [
    { date: "2024-01-01", actual: 45, predicted: null, safety: 30 },
    { date: "2024-01-02", actual: 52, predicted: null, safety: 30 },
    { date: "2024-01-03", actual: 38, predicted: null, safety: 30 },
    { date: "2024-01-04", actual: 61, predicted: null, safety: 30 },
    { date: "2024-01-05", actual: 47, predicted: null, safety: 30 },
    { date: "2024-01-06", actual: 55, predicted: null, safety: 30 },
    { date: "2024-01-07", actual: 42, predicted: null, safety: 30 },
    { date: "2024-01-08", actual: null, predicted: 48, safety: 30 },
    { date: "2024-01-09", actual: null, predicted: 53, safety: 30 },
    { date: "2024-01-10", actual: null, predicted: 46, safety: 30 },
    { date: "2024-01-11", actual: null, predicted: 51, safety: 30 },
    { date: "2024-01-12", actual: null, predicted: 44, safety: 30 },
    { date: "2024-01-13", actual: null, predicted: 49, safety: 30 },
    { date: "2024-01-14", actual: null, predicted: 47, safety: 30 },
]

const demandPredictions = [
    {
        medicine: "Paracetamol",
        currentStock: 112,
        predicted7d: 85,
        predicted14d: 165,
        predicted30d: 340,
        status: "adequate",
    },
    { medicine: "Amoxicillin", currentStock: 45, predicted7d: 52, predicted14d: 98, predicted30d: 205, status: "low" },
    { medicine: "Ibuprofen", currentStock: 78, predicted7d: 42, predicted14d: 89, predicted30d: 178, status: "adequate" },
    { medicine: "Aspirin", currentStock: 23, predicted7d: 38, predicted14d: 76, predicted30d: 156, status: "critical" },
    {
        medicine: "Cetirizine",
        currentStock: 156,
        predicted7d: 28,
        predicted14d: 54,
        predicted30d: 115,
        status: "overstock",
    },
]

export default function Forecasting() {
    const [selectedMedicine, setSelectedMedicine] = useState("paracetamol")
    const [timeRange, setTimeRange] = useState("7")

    return (
        <div className="bg-background min-h-screen p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-dark">Forecasting</h1>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                        size="sm"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Re-run ARIMA Analysis
                    </Button>
                    <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                        size="sm"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download Forecast
                    </Button>
                </div>
            </div>

            {/* Forecast Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-dark">Demand Forecasting</CardTitle>
                    <CardDescription className="text-gray-600">
                        ARIMA-based demand prediction and safety stock analysis
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-end mb-6">
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Select Medicine</label>
                            <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paracetamol">Paracetamol</SelectItem>
                                    <SelectItem value="amoxicillin">Amoxicillin</SelectItem>
                                    <SelectItem value="ibuprofen">Ibuprofen</SelectItem>
                                    <SelectItem value="aspirin">Aspirin</SelectItem>
                                    <SelectItem value="cetirizine">Cetirizine</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Time Range</label>
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7 days</SelectItem>
                                    <SelectItem value="14">14 days</SelectItem>
                                    <SelectItem value="30">30 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="bg-primary hover:bg-primary/90 text-white">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Generate Forecast
                        </Button>
                    </div>

                    {/* Forecast Chart */}
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecastData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) =>
                                        new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                    }
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                    formatter={(value, name) => [
                                        value,
                                        name === "actual" ? "Actual Usage" : name === "predicted" ? "Predicted Demand" : "Safety Stock",
                                    ]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    name="actual"
                                    connectNulls={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="predicted"
                                    stroke="#f43f5e"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    name="predicted"
                                    connectNulls={false}
                                />
                                <Line type="monotone" dataKey="safety" stroke="#f59e0b" strokeWidth={1} name="safety" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Demand Predictions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-dark">Predicted Demand Summary</CardTitle>
                    <CardDescription className="text-gray-600">
                        Demand forecasts for all medicines with stock recommendations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {demandPredictions.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <div className="font-medium">{item.medicine}</div>
                                        <div className="text-sm text-gray-500">Current Stock: {item.currentStock} units</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-500">7 Days</div>
                                        <div className="font-medium">{item.predicted7d}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-500">14 Days</div>
                                        <div className="font-medium">{item.predicted14d}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-500">30 Days</div>
                                        <div className="font-medium">{item.predicted30d}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                item.status === "critical"
                                                    ? "destructive"
                                                    : item.status === "low"
                                                        ? "secondary"
                                                        : item.status === "overstock"
                                                            ? "outline"
                                                            : "default"
                                            }
                                        >
                                            {item.status === "critical" && <AlertTriangle className="w-3 h-3 mr-1" />}
                                            {item.status === "adequate" && <CheckCircle className="w-3 h-3 mr-1" />}
                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Forecast Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700 flex items-center gap-2 text-dark">
                            <AlertTriangle className="w-5 h-5" />
                            Critical Stock Alert
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-red-600 mb-3">
                            Aspirin is predicted to run out in 5 days based on current usage patterns.
                        </p>
                        <Button className="bg-primary hover:bg-primary/90 text-white" size="sm" variant="destructive">
                            Order Now
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="text-orange-700 flex items-center gap-2 text-dark">
                            <TrendingUp className="w-5 h-5" />
                            Demand Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-orange-600 mb-3">
                            Paracetamol demand is increasing by 15% compared to last month.
                        </p>
                        <Button
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                            size="sm"
                        >
                            View Details
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="text-green-700 flex items-center gap-2 text-dark">
                            <CheckCircle className="w-5 h-5" />
                            Optimal Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-green-600 mb-3">Ibuprofen stock levels are optimal for the next 30 days.</p>
                        <Button
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary hover:text-white bg-transparent"
                            size="sm"
                        >
                            Maintain Level
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
