// app/api/upload-medicine-image/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {supabase} from "@/lib/supabase";

interface MedicineRecord {
    medicine_code: string;
    medicine_name: string;
    medicine_base_name: string;
    dosage: string;
    unit_type: string;
    quantity_requested: number;
    quantity_issued: number;
    unit_cost: number;
    total_amount: number;
    batch_lot_no?: string;
    expiration_date?: string;
    purchase_order_no?: string;
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

function extractMedicineParts(medicineName: string): { baseName: string; dosage: string } {
    if (!medicineName) return {baseName: '', dosage: ''};

    const cleaned = medicineName
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const dosageMatch = cleaned.match(
        /(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu|IU|units|%)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:mg|g|ml))?(?:\s*[x×]\s*\d+(?:\s*(?:ml|mg|g))?)?)/i
    );

    const dosage = dosageMatch ? dosageMatch[0].toLowerCase().replace(/\s+/g, '') : '';

    let baseName = cleaned;
    if (dosageMatch) {
        baseName = baseName.replace(dosageMatch[0], '').trim();
    }

    baseName = baseName
        .replace(/\b(tablet|capsule|bottle|sachet|syrup|drops|suspension|granules|ampule|vial|oral|solution|tab|cap|cream|tube|nebule)s?\b/gi, '')
        .trim();

    return {baseName, dosage};
}

function parseDate(dateStr: string): string | null {
    if (!dateStr) return null;

    // Handle formats like "Jun-26", "Nov-28", "Jan-26"
    const monthYearMatch = dateStr.match(/([A-Za-z]{3})-(\d{2})/);
    if (monthYearMatch) {
        const monthMap: { [key: string]: string } = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        };
        const month = monthMap[monthYearMatch[1].toLowerCase()] || '01';
        let year = monthYearMatch[2];
        year = parseInt(year) < 50 ? `20${year}` : `19${year}`;
        return `${year}-${month}-01`;
    }

    return null;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const month = formData.get('month') as string;
        const year = formData.get('year') as string;
        const recordsJson = formData.get('records') as string;

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

        // Parse the records JSON
        let records: MedicineRecord[] = [];
        if (recordsJson) {
            try {
                records = JSON.parse(recordsJson);
            } catch (e) {
                return NextResponse.json(
                    {error: 'Invalid records data'},
                    {status: 400}
                );
            }
        }

        if (records.length === 0) {
            // If no records provided, just save the image for preview
            // This allows the frontend to show the image and let user manually enter data
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64 = buffer.toString('base64');

            return NextResponse.json({
                success: true,
                needsManualEntry: true,
                imagePreview: `data:${file.type};base64,${base64}`,
                message: 'Image uploaded. Please review and enter the data manually.',
            });
        }

        // Extract health center (default if not provided)
        const healthCenter = 'Unknown Health Center'; // You can extract this from records or form data

        // Create upload record
        const {data: uploadData, error: uploadError} = await supabase
            .from('uploads')
            .insert({
                filename: file.name,
                health_center: healthCenter,
                month: monthYear,
                row_count: records.length,
                processed_count: 0,
                status: 'processing',
            })
            .select()
            .single();

        if (uploadError) {
            throw new Error(`Failed to create upload record: ${uploadError.message}`);
        }

        const uploadId = uploadData.id;

        // Convert records to inventory records
        const inventoryRecords = records.map(record => {
            const {baseName, dosage} = extractMedicineParts(record.medicine_name);

            return {
                upload_id: uploadId,
                medicine_code: record.medicine_code,
                medicine_name: record.medicine_name,
                medicine_base_name: baseName || record.medicine_base_name,
                dosage: dosage || record.dosage,
                unit_type: record.unit_type?.toLowerCase(),
                beginning_balance: 0,
                delivery: 0,
                dispensed: record.quantity_issued || 0,
                ending_balance: 0,
                quantity_requested: record.quantity_requested || 0,
                batch_lot_no: record.batch_lot_no,
                expiration_date: record.expiration_date ? parseDate(record.expiration_date) : null,
                purchase_price: record.unit_cost,
                unit_cost: record.unit_cost,
                total_amount: record.total_amount,
                month_year: monthYear,
                health_center: healthCenter,
                purchase_order_no: record.purchase_order_no,
            };
        });

        // Batch insert
        const batchSize = 1000;
        let insertedCount = 0;

        for (let i = 0; i < inventoryRecords.length; i += batchSize) {
            const batch = inventoryRecords.slice(i, i + batchSize);
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
            .update({
                status: 'completed',
                processed_count: insertedCount
            })
            .eq('id', uploadId);

        // Refresh materialized view (optional)
        try {
            await supabase.rpc('refresh_medicine_timeseries');
        } catch (e) {
            console.log('Could not refresh materialized view:', e);
        }

        return NextResponse.json({
            success: true,
            uploadId,
            processedRows: insertedCount,
            totalRows: records.length,
            healthCenter,
            month: monthYear,
            message: `Successfully imported ${insertedCount} medicine records from requisition slip for ${month} ${year}`,
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            {error: error.message || 'Upload failed'},
            {status: 500}
        );
    }
}
