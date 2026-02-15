
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const supabaseUrl = envConfig.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1];
    const supabaseKey = envConfig.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1];

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());

    async function testDecimalStorage() {
        console.log('Testing decimal storage in entry_hours...');

        // 1. Create a dummy report to link to
        const { data: report, error: repError } = await supabase
            .from('shift_reports')
            .insert({
                shift_type: 'TEST_DECIMAL',
                observations: 'Temp test for schema',
                date: new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (repError) {
            console.error('Failed to create test report:', repError);
            return;
        }

        console.log('Created test report:', report.id);

        // 2. Insert detail with 7.5
        // We need a valid zone_id. We'll fetch one first.
        const { data: zones } = await supabase.from('zones').select('id').limit(1);
        if (!zones || zones.length === 0) {
            console.error('No zones found to test with.');
            return;
        }

        const testVal = 7.55;
        const { data: detail, error: detError } = await supabase
            .from('shift_details')
            .insert({
                report_id: report.id,
                zone_id: zones[0].id,
                entry_hours: testVal,
                status: 'Completo'
            })
            .select()
            .single();

        if (detError) {
            console.error('Failed to insert detail:', detError);
        } else {
            console.log(`Inserted entry_hours: ${testVal}`);
            console.log(`Retrieved entry_hours: ${detail.entry_hours}`);

            if (detail.entry_hours === testVal) {
                console.log('SUCCESS: Column supports decimals!');
            } else {
                console.log('FAILURE: Column likely truncated (Integer type).');
            }
        }

        // 3. Cleanup
        await supabase.from('shift_details').delete().eq('id', detail?.id);
        await supabase.from('shift_reports').delete().eq('id', report.id);
        console.log('Cleanup complete.');
    }

    testDecimalStorage();

} catch (err) {
    console.error('Error:', err);
}
