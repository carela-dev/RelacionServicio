
const { createClient } = require('@supabase/supabase-js');

// Load env vars (simulated since we can't easily load local .env in this context without dotenv)
// I will try to read them from the file first or assume they are available if I run with nextjs context, 
// but running a standalone script is safer.
// Wait, I don't have the keys here. I should try to read .env.local first.

const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });

    const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials in .env.local');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function testQuery() {
        console.log('Testing fetchHistory query...');
        const { data, error } = await supabase
            .from('shift_reports')
            .select(`
                *,
                profiles(full_name),
                shift_details(id, zone_id, extra_hours, empty_posts, zones(name), entry_time, incoming_sup, outgoing_sup, justification)
            `)
            .limit(5);

        if (error) {
            console.error('Query Error:', error);
        } else {
            console.log('Query Success! Rows returned:', data.length);
            if (data.length > 0) {
                console.log('Sample row shift_details:', JSON.stringify(data[0].shift_details, null, 2));
            }
        }
    }

    testQuery();

} catch (err) {
    console.error('Error reading .env.local or running script:', err);
}
