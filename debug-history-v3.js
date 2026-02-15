
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

    async function testQuery() {
        console.log('Testing EXACT History query...');

        // 1. Check if shift_reports has ANY data
        const { count, error: countError } = await supabase.from('shift_reports').select('*', { count: 'exact', head: true });
        if (countError) console.error('Error counting shift_reports:', countError);
        else console.log('Total shift_reports:', count);

        // 2. Run the main query
        const { data, error } = await supabase
            .from('shift_reports')
            .select(`
                *,
                profiles(full_name),
                shift_details(id, zone_id, extra_hours, empty_posts, zones(name), incoming_sup, outgoing_sup, justification)
            `)
            .limit(5);

        if (error) {
            console.error('Main Query Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('Main Query Success! Rows returned:', data?.length || 0);
            if (data && data.length > 0) {
                console.log('Sample row profiles:', JSON.stringify(data[0].profiles, null, 2));
                console.log('Sample row shift_details:', JSON.stringify(data[0].shift_details, null, 2));
            } else {
                console.log('No data returned from main query.');
            }
        }

        // 3. Test simplified query (without deep nesting)
        if (error || !data || data.length === 0) {
            console.log('\nTesting simplified query (shift_reports only)...');
            const { data: simpleData, error: simpleError } = await supabase.from('shift_reports').select('*').limit(5);
            if (simpleError) console.error('Simple Query Error:', simpleError);
            else console.log('Simple Query Rows:', simpleData?.length);

            console.log('\nTesting query with just profiles...');
            const { data: profileData, error: profileError } = await supabase.from('shift_reports').select('*, profiles(full_name)').limit(1);
            if (profileError) console.error('Profile Query Error:', profileError);
            else console.log('Profile Query Rows:', profileData?.length);

            console.log('\nTesting query with shift_details (no zones)...');
            const { data: detailData, error: detailError } = await supabase.from('shift_reports').select('*, shift_details(id)').limit(1);
            if (detailError) console.error('Detail Query Error:', detailError);
            else console.log('Detail Query Rows:', detailData?.length);
        }
    }

    testQuery();

} catch (err) {
    console.error('Error:', err);
}
