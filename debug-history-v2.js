
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const supabaseUrl = envConfig.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1];
    const supabaseKey = envConfig.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]; // simplified regex

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());

    async function testQuery() {
        console.log('Testing specific columns...');
        // Test 1: just incoming_sup
        const { error: err1 } = await supabase.from('shift_details').select('incoming_sup').limit(1);
        if (err1) console.error('Error incoming_sup:', err1.message);
        else console.log('incoming_sup exists');

        // Test 2: just outgoing_sup
        const { error: err2 } = await supabase.from('shift_details').select('outgoing_sup').limit(1);
        if (err2) console.error('Error outgoing_sup:', err2.message);
        else console.log('outgoing_sup exists');

        // Test 3: just justification
        const { error: err3 } = await supabase.from('shift_details').select('justification').limit(1);
        if (err3) console.error('Error justification:', err3.message);
        else console.log('justification exists');

        // Test 4: entry_time (already known to fail but confirming)
        const { error: err4 } = await supabase.from('shift_details').select('entry_time').limit(1);
        if (err4) console.error('Error entry_time:', err4.message);
        else console.log('entry_time exists');
    }

    testQuery();

} catch (err) {
    console.error('Error:', err);
}
