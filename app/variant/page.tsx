"use client"
import React, {useState} from 'react';
import {Download, Play, TrendingUp, AlertCircle} from 'lucide-react';

const RealisticInventoryVariance = () => {
    const [data, setData] = useState([]);
    const [enhanced, setEnhanced] = useState([]);
    const [processing, setProcessing] = useState(false);

    // === FILE UPLOAD (browser-safe) ===
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (!content) return;

            const lines = content.trim().split('\n');
            const headers = lines[0].split(',').map((h) => h.trim());

            const parsed = lines.slice(1).map((line) => {
                const values = line.split(',');
                return headers.reduce((obj: any, header, i) => {
                    obj[header] = values[i]?.trim() || '';
                    return obj;
                }, {});
            });

            setData(parsed);
        };
        reader.readAsText(file);
    };

// === ITEM CATEGORY LOGIC ===
    const categorizeItem = (desc: string) => {
        const d = desc.toLowerCase();

        // Pain relief / anti-inflammatory
        if (d.includes('paracetamol') || d.includes('ibuprofen') || d.includes('naproxen') ||
            d.includes('celecoxib') || d.includes('diclofenac')) return 'pain-relief';

        // Antibiotics
        if (d.includes('amoxicillin') || d.includes('azithromycin') || d.includes('cefalexin') ||
            d.includes('clindamycin') || d.includes('co-amoxiclav') || d.includes('ciprofloxacin'))
            return 'antibiotic';

        // Chronic maintenance meds
        if (d.includes('metformin') || d.includes('amlodipine') || d.includes('losartan') ||
            d.includes('atorvastatin') || d.includes('enalapril') || d.includes('simvastatin'))
            return 'chronic-maintenance';

        // Respiratory / asthma / allergy
        if (d.includes('salbutamol') || d.includes('montelukast') || d.includes('lagundi') ||
            d.includes('fluticasone') || d.includes('budesonide') || d.includes('prednisone'))
            return 'respiratory';

        // Antihistamine / allergy relief
        if (d.includes('cetirizine') || d.includes('loratadine') || d.includes('diphenhydramine') ||
            d.includes('fexofenadine')) return 'antihistamine';

        // Vitamins / supplements
        if (d.includes('vitamin') || d.includes('ascorbic') || d.includes('ferrous') ||
            d.includes('multivitamin') || d.includes('calcium') || d.includes('zinc'))
            return 'supplement';

        // Gastrointestinal meds
        if (d.includes('omeprazole') || d.includes('loperamide') || d.includes('simethicone') ||
            d.includes('ranitidine') || d.includes('domperidone'))
            return 'gastrointestinal';

        // Topical / antiseptic / skin
        if (d.includes('clotrimazole') || d.includes('mupirocin') || d.includes('betadine') ||
            d.includes('ointment') || d.includes('cream') || d.includes('gel'))
            return 'topical';

        // Cough / cold OTC
        if (d.includes('guaifenesin') || d.includes('phenylephrine') || d.includes('ambroxol') ||
            d.includes('dextromethorphan') || d.includes('carbocisteine'))
            return 'cough-cold';

        // Default fallback
        return 'other';
    };


// === PROCESS DATA ===
    const processData = () => {
        setProcessing(true);

        setTimeout(() => {
            const itemGroups: Record<string, any[]> = {};
            data.forEach((row: any) => {
                const code = row.itemcode;
                if (!itemGroups[code]) itemGroups[code] = [];
                itemGroups[code].push(row);
            });

            const result: any[] = [];

            Object.keys(itemGroups).forEach((itemCode) => {
                const items = itemGroups[itemCode].sort(
                    (a, b) => parseInt(a.year) * 100 + parseInt(a.month) - (parseInt(b.year) * 100 + parseInt(b.month))
                );

                const category = categorizeItem(items[0].itemdescription);
                let runningStock = parseFloat(items[0].beginningbalance);

                items.forEach((item) => {
                    const month = parseInt(item.month);
                    const isRainySeason = month >= 6 && month <= 11;

                    // Category-specific simulation behavior
                    let baseRate, variance, seasonalMultiplier, restockProb;

                    switch (category) {
                        case 'pain-relief':
                            baseRate = 0.20;
                            variance = 0.35;
                            seasonalMultiplier = isRainySeason ? 1.2 : 1.0;
                            restockProb = 0.45;
                            break;
                        case 'antibiotic':
                            baseRate = 0.12;
                            variance = 0.50;
                            seasonalMultiplier = isRainySeason ? 2.0 : 0.7;
                            restockProb = 0.35;
                            break;
                        case 'chronic-maintenance':
                            baseRate = 0.15;
                            variance = 0.20;
                            seasonalMultiplier = 1.05;
                            restockProb = 0.5;
                            break;
                        case 'respiratory':
                            baseRate = 0.13;
                            variance = 0.45;
                            seasonalMultiplier = isRainySeason ? 3.0 : 0.4;
                            restockProb = 0.3;
                            break;
                        case 'antihistamine':
                            baseRate = 0.10;
                            variance = 0.40;
                            seasonalMultiplier = isRainySeason ? 1.8 : 0.9;
                            restockProb = 0.25;
                            break;
                        case 'supplement':
                            baseRate = 0.08;
                            variance = 0.25;
                            seasonalMultiplier = isRainySeason ? 1.2 : 1.0;
                            restockProb = 0.4;
                            break;
                        case 'gastrointestinal':
                            baseRate = 0.09;
                            variance = 0.35;
                            seasonalMultiplier = isRainySeason ? 1.1 : 1.0;
                            restockProb = 0.3;
                            break;
                        case 'topical':
                            baseRate = 0.07;
                            variance = 0.45;
                            seasonalMultiplier = isRainySeason ? 1.0 : 1.0;
                            restockProb = 0.25;
                            break;
                        case 'cough-cold':
                            baseRate = 0.11;
                            variance = 0.5;
                            seasonalMultiplier = isRainySeason ? 2.2 : 0.8;
                            restockProb = 0.35;
                            break;
                        default:
                            baseRate = 0.06;
                            variance = 0.6;
                            seasonalMultiplier = 1.0;
                            restockProb = 0.2;
                    }

                    const randomFactor = (Math.random() - 0.5) * variance * 2;
                    const baseUsage = runningStock * baseRate * seasonalMultiplier;
                    const actualUsage = Math.max(0, baseUsage * (1 + randomFactor));
                    const bufferFactor = 1 + (Math.random() * 0.15 + 0.05);
                    const requested = actualUsage * bufferFactor;
                    const issued = Math.min(requested, runningStock);
                    let newStock = Math.max(0, runningStock - issued);

                    const stockRatio = newStock / (runningStock || 1);
                    const shouldRestock = stockRatio < 0.35 || Math.random() < restockProb * 0.3;

                    let restocked = 0;
                    if (shouldRestock && newStock < runningStock * 0.6) {
                        const targetStock = runningStock * (1.2 + Math.random() * 0.5);
                        restocked = Math.max(0, targetStock - newStock);
                        newStock += restocked;
                    }

                    result.push({
                        reportid: item.reportid,
                        itemcode: itemCode,
                        itemdescription: item.itemdescription,
                        unitofmeasurement: item.unitofmeasurement,
                        beginningbalance: runningStock.toFixed(2),
                        quantityrequested: requested.toFixed(2),
                        issuedquantity: issued.toFixed(2),
                        restocked: restocked.toFixed(2),
                        stockonhand: newStock.toFixed(2),
                        month: item.month,
                        year: item.year,
                        category: category,
                        seasonalFactor: seasonalMultiplier.toFixed(2),
                    });

                    runningStock = newStock;
                });
            });

            setEnhanced(result);
            setProcessing(false);
        }, 100);
    };


    // === DOWNLOAD CSV ===
    const downloadCSV = () => {
        const headers = [
            'reportid',
            'itemcode',
            'itemdescription',
            'unitofmeasurement',
            'beginningbalance',
            'quantityrequested',
            'issuedquantity',
            'restocked',
            'stockonhand',
            'month',
            'year',
            'category',
            'seasonalFactor',
        ];

        const csv = [
            headers.join(','),
            ...enhanced.map((row) =>
                headers
                    .map((h) => {
                        const val = row[h];
                        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
                    })
                    .join(',')
            ),
        ].join('\n');

        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory_with_realistic_variance.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                                <TrendingUp className="w-10 h-10 text-blue-600"/>
                                Inventory Variance Generator
                            </h1>
                            <p className="text-gray-600 mt-2">Transform flat data into predictive-ready dataset</p>
                        </div>
                        {enhanced.length > 0 && (
                            <button
                                onClick={downloadCSV}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                            >
                                <Download className="w-5 h-5"/>
                                Download Enhanced CSV
                            </button>
                        )}
                    </div>

                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"/>
                            <div>
                                <h3 className="font-semibold text-amber-900 mb-1">Issue Detected</h3>
                                <p className="text-amber-800 text-sm">
                                    Your current data has quantityrequested = issuedquantity = stockonhand for all
                                    records.
                                    This creates zero variance, making prediction impossible. This tool will add
                                    realistic patterns.
                                </p>
                            </div>
                        </div>
                    </div>

                    {data.length === 0 && (
                        <div className="text-center py-12">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="mb-4 block mx-auto text-sm text-gray-600"
                            />
                            <p className="text-gray-600">Upload your CSV file to begin</p>
                        </div>
                    )}

                    {data.length > 0 && enhanced.length === 0 && (
                        <div className="text-center py-12">
                            <button
                                onClick={processData}
                                disabled={processing}
                                className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 mx-auto text-lg font-semibold"
                            >
                                <Play className={`w-6 h-6 ${processing ? 'animate-spin' : ''}`}/>
                                {processing ? 'Processing...' : 'Generate Realistic Variance'}
                            </button>
                            <p className="text-gray-600 mt-4">
                                Loaded {data.length} records from your file
                            </p>
                        </div>
                    )}

                    {enhanced.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                {/* Total Records */}
                                <div
                                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                                    <p className="text-sm opacity-90 mb-1">Total Records</p>
                                    <p className="text-3xl font-bold">{enhanced.length.toLocaleString()}</p>
                                </div>

                                {/* Unique Items */}
                                <div
                                    className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                                    <p className="text-sm opacity-90 mb-1">Unique Items</p>
                                    <p className="text-3xl font-bold">
                                        {new Set(enhanced.map((e) => e.itemcode)).size.toLocaleString()}
                                    </p>
                                </div>

                                {/* Time Period */}
                                <div
                                    className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                                    <p className="text-sm opacity-90 mb-1">Time Period</p>
                                    <p className="text-3xl font-bold">
                                        {
                                            new Set(
                                                enhanced.map((e) => `${e.year}-${e.month}`)
                                            ).size
                                        } Months
                                    </p>
                                </div>

                                {/* Categories */}
                                <div
                                    className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                                    <p className="text-sm opacity-90 mb-1">Categories</p>
                                    <p className="text-3xl font-bold">
                                        {new Set(enhanced.map((e) => e.category)).size}
                                    </p>
                                </div>
                            </div>


                            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                                <div className="bg-gray-100 px-6 py-4 border-b-2 border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900">Sample Preview (First 30 rows)</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Item Code
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700">Begin</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700">Requested</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700">Issued</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700">Restocked</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700">On Hand
                                            </th>
                                            <th className="px-4 py-3 text-center font-semibold text-gray-700">Month</th>
                                            <th className="px-4 py-3 text-center font-semibold text-gray-700">Category</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {enhanced.slice(0, 30).map((row, idx) => (
                                            <tr key={idx}
                                                className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900">{row.itemcode}</td>
                                                <td className="px-4 py-3 text-right text-gray-600">{row.beginningbalance}</td>
                                                <td className="px-4 py-3 text-right text-blue-600 font-medium">{row.quantityrequested}</td>
                                                <td className="px-4 py-3 text-right text-green-600 font-medium">{row.issuedquantity}</td>
                                                <td className="px-4 py-3 text-right text-purple-600 font-medium">{row.restocked}</td>
                                                <td className="px-4 py-3 text-right text-gray-900 font-bold">{row.stockonhand}</td>
                                                <td className="px-4 py-3 text-center text-gray-600">{row.month}/{row.year}</td>
                                                <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {row.category.split('-')[0]}
                            </span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RealisticInventoryVariance;
