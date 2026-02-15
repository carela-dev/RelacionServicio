const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    const { count: reportsCount } = await supabase.from('shift_reports').select('*', { count: 'exact', head: true });
    const { count: zonesCount } = await supabase.from('zones').select('*', { count: 'exact', head: true });
    const { count: detailsCount } = await supabase.from('shift_details').select('*', { count: 'exact', head: true });

    console.log(JSON.stringify({ reportsCount, zonesCount, detailsCount }));
}

check();
