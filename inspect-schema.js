
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

    async function checkSchema() {
        console.log('Testing column capabilities...');

        // 1. Try to fetch one row to see structure (if any)
        const { data: existing } = await supabase.from('shift_details').select('*').limit(1);
        if (existing && existing.length > 0) {
            console.log('Existing row sample:', existing[0]);
            console.log('entry_hours type:', typeof existing[0].entry_hours);
        }

        // 2. Try to insert a dummy record with a STRING "07:30" into entry_hours
        // We need a valid report_id and zone_id. 
        // We'll try to find an existing report or create a temporary one? 
        // Actually, just checking if "entry_time" exists again is worth it.

        console.log('Checking if entry_time column exists...');
        const { error: colError } = await supabase.from('shift_details').select('entry_time').limit(1);
        if (colError) {
            console.log('entry_time column check failed (likely does not exist):', colError.message);
        } else {
            console.log('entry_time column EXISTS!');
        }

        // 3. Check if we can start using "entry_time" or if we must use "entry_hours"
        // If entry_time doesn't exist, we might be stuck with entry_hours.
    }

    checkSchema();

} catch (err) {
    console.error('Error:', err);
}
