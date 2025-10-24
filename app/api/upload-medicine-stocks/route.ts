// app/api/upload-medicine-stocks/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {supabase} from "@/lib/supabase";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface MedicineRecord {
    medicine_name: string;
    medicine_base_name: string;
    dosage: string;
    unit_type: string;
    beginning_balance: number;
    delivery: number;
    dispensed: number;
    ending_balance: number;
    month_year: string;
    health_center: string;
}

function extractMedicineParts(medicineName: string): { baseName: string; dosage: string } {
    if (!medicineName) return {baseName: '', dosage: ''};

    const cleaned = medicineName
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const dosageMatch = cleaned.match(
        /(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu|IU|units)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:mg|g|ml))?(?:\s*[x×]\s*\d+(?:\s*(?:ml|mg|g))?)?)/i
    );

    const dosage = dosageMatch ? dosageMatch[0].toLowerCase().replace(/\s+/g, '') : '';

    let baseName = cleaned;
    if (dosageMatch) {
        baseName = baseName.replace(dosageMatch[0], '').trim();
    }

    baseName = baseName
        .replace(/\b(tablet|capsule|bottle|sachet|syrup|drops|suspension|granules|ampule|vial|oral|solution|tab|cap)s?\b/gi, '')
        .trim();

    return {baseName, dosage};
}

function parseNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    const str = value.toString().trim();
    if (str === '') return 0;

    const cleaned = str.replace(/,/g, '').replace(/"/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.max(0, Math.floor(num));
}

function extractHealthCenterAndMonth(rows: any[][]): { healthCenter: string; month: string } {
    let healthCenter = 'Unknown Health Center';
    let month = '';

    for (let i = 0; i < Math.min(10, rows.length); i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        for (const cell of row) {
            if (!cell) continue;
            const str = cell.toString().trim();
            const upperStr = str.toUpperCase();

            if (upperStr.includes('HEALTH CENTER') || upperStr.includes('RHU') || upperStr.includes('BARANGAY')) {
                healthCenter = str;
            }

            const monthPattern = /^[A-Za-z]+[-\s]?\d{2,4}$/;
            if (monthPattern.test(str)) {
                month = str;
            }
        }
    }

    return {healthCenter, month};
}

function parseMonthToYearMonth(monthStr: string): string {
    const months: { [key: string]: string } = {
        'jan': '01', 'january': '01',
        'feb': '02', 'february': '02',
        'mar': '03', 'march': '03',
        'apr': '04', 'april': '04',
        'may': '05',
        'jun': '06', 'june': '06',
        'jul': '07', 'july': '07',
        'aug': '08', 'august': '08',
        'sep': '09', 'sept': '09', 'september': '09',
        'oct': '10', 'october': '10',
        'nov': '11', 'november': '11',
        'dec': '12', 'december': '12'
    };

    const cleaned = monthStr.trim().replace(/\s+/g, '-');
    const parts = cleaned.toLowerCase().split(/[-\s]/);

    if (parts.length >= 2) {
        const monthName = parts[0];
        let year = parts[parts.length - 1];

        if (year.length === 2) {
            const yearNum = parseInt(year);
            year = yearNum >= 50 ? `19${year}` : `20${year}`;
        }

        const monthNum = months[monthName] || '01';
        return `${year}-${monthNum}`;
    }

    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function convertMonthYearToYearMonth(month: string, year: string): string {
    const months: { [key: string]: string } = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };

    const monthNum = months[month.toLowerCase()] || '01';
    return `${year}-${monthNum}`;
}

function isDataRow(row: any[]): boolean {
    if (!row || row.length < 6) return false;

    const firstCell = row[1]?.toString().trim() || '';
    const secondCell = row[2]?.toString().trim().toLowerCase() || '';

    if (firstCell.length < 3) return false;

    const headerKeywords = ['health center', 'medicine', 'name', 'item', 'drug', 'inventory'];
    if (headerKeywords.some(keyword => firstCell.toLowerCase().includes(keyword))) {
        return false;
    }

    // Skip date rows (e.g., "August-25")
    if (/^[A-Za-z]+[-\s]?\d{2,4}$/.test(firstCell)) {
        return false;
    }

    // Check if second cell looks like a unit type
    const validUnits = ['tablet', 'capsule', 'bottle', 'sachet', 'syrup', 'drops', 'suspension', 'granules', 'ampule', 'vial'];
    const hasValidUnit = validUnits.includes(secondCell);

    // Check if columns 3-6 contain numbers (indices 3-6 in the array)
    const hasNumbers = row.slice(3, 7).some(cell => {
        const val = cell?.toString().trim();
        return val && /^\d+/.test(val.replace(/,/g, ''));
    });

    return hasValidUnit || hasNumbers;
}

function cleanData(rawRows: any[][], monthYear: string): {
    records: MedicineRecord[];
    healthCenter: string;
    month: string;
} {
    const {healthCenter} = extractHealthCenterAndMonth(rawRows);

    const records: MedicineRecord[] = [];
    const seen = new Set<string>();

    for (const row of rawRows) {
        if (!isDataRow(row)) continue;

        const medicineName = row[1]?.toString().trim() || '';
        const unitType = row[2]?.toString().trim().toLowerCase() || 'unit';
        const beginningBalance = parseNumber(row[3]);
        const delivery = parseNumber(row[4]);
        const dispensed = parseNumber(row[5]);
        const endingBalance = parseNumber(row[6]);

        if (!medicineName || medicineName.length < 3) continue;
        if (beginningBalance === 0 && delivery === 0 && dispensed === 0 && endingBalance === 0) continue;

        const {baseName, dosage} = extractMedicineParts(medicineName);

        const uniqueKey = `${baseName.toLowerCase()}-${dosage}-${monthYear}`;
        if (seen.has(uniqueKey)) continue;
        seen.add(uniqueKey);

        records.push({
            medicine_name: medicineName,
            medicine_base_name: baseName,
            dosage,
            unit_type: unitType,
            beginning_balance: beginningBalance,
            delivery,
            dispensed,
            ending_balance: endingBalance,
            month_year: monthYear,
            health_center: healthCenter,
        });
    }

    return {records, healthCenter, month: monthYear};
}

function parseFile(buffer: Buffer, filename: string): any[][] {
    const fileExtension = filename.toLowerCase().split('.').pop();

    if (fileExtension === 'csv' || fileExtension === 'txt') {
        const text = buffer.toString('utf-8');
        const result = Papa.parse(text, {
            header: false,
            skipEmptyLines: true
        });
        return result.data as any[][];
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const workbook = XLSX.read(buffer, {type: 'buffer'});

        const allRows: any[][] = [];

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetRows = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ''}) as any[][];

            if (allRows.length > 0) allRows.push([]);

            sheetRows.forEach(r => allRows.push(r));
        });

        return allRows;
    } else {
        throw new Error('Unsupported file format. Please upload CSV, TXT, or Excel files.');
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const month = formData.get('month') as string;
        const year = formData.get('year') as string;

        if (!file) {
            return NextResponse.json(
                {error: 'No file provided'},
                {status: 400}
            );
        }

        if (!month || !year) {
            return NextResponse.json(
                {error: 'Month and year are required'},
                {status: 400}
            );
        }

        // Convert month and year to YYYY-MM format
        const monthYear = convertMonthYearToYearMonth(month, year);

        // Read file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Parse file into 2D array
        const rawRows = parseFile(buffer, file.name);

        if (!rawRows || rawRows.length === 0) {
            return NextResponse.json(
                {error: 'File is empty or could not be parsed'},
                {status: 400}
            );
        }

        // Clean and extract data with the provided month/year
        const {records, healthCenter} = cleanData(rawRows, monthYear);

        if (records.length === 0) {
            return NextResponse.json(
                {error: 'No valid medicine records found. Please check your file format.'},
                {status: 400}
            );
        }

        // Create upload record
        const {data: uploadData, error: uploadError} = await supabase
            .from('uploads')
            .insert({
                filename: file.name,
                health_center: healthCenter,
                month: monthYear,
                row_count: rawRows.length,
                processed_count: records.length,
                status: 'processing',
            })
            .select()
            .single();

        if (uploadError) {
            throw new Error(`Failed to create upload record: ${uploadError.message}`);
        }

        const uploadId = uploadData.id;

        // Add upload_id to each record
        const recordsWithUploadId = records.map(record => ({
            ...record,
            upload_id: uploadId,
        }));

        // Batch insert (1000 rows at a time)
        const batchSize = 1000;
        let insertedCount = 0;

        for (let i = 0; i < recordsWithUploadId.length; i += batchSize) {
            const batch = recordsWithUploadId.slice(i, i + batchSize);
            const {error: insertError} = await supabase
                .from('medicine_inventory')
                .insert(batch);

            if (insertError) {
                await supabase
                    .from('uploads')
                    .update({
                        status: 'failed',
                        error_message: insertError.message,
                    })
                    .eq('id', uploadId);

                throw new Error(`Failed to insert records: ${insertError.message}`);
            }

            insertedCount += batch.length;
        }

        // Update upload status to completed
        await supabase
            .from('uploads')
            .update({status: 'completed'})
            .eq('id', uploadId);

        // Refresh materialized view (optional - may fail if view doesn't exist yet)
        try {
            await supabase.rpc('refresh_medicine_timeseries');
        } catch (e) {
            console.log('Could not refresh materialized view:', e);
        }

        // Count unique medicines
        const uniqueMedicines = new Set(records.map(r => r.medicine_base_name)).size;

        return NextResponse.json({
            success: true,
            uploadId,
            processedRows: insertedCount,
            totalRows: rawRows.length,
            uniqueMedicines,
            healthCenter,
            month: monthYear,
            message: `Successfully imported ${insertedCount} medicine records for ${month} ${year} from ${healthCenter}`,
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            {error: error.message || 'Upload failed'},
            {status: 500}
        );
    }
}
