
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testKpiHistory() {
    console.log('Testing KPI History Logic...');

    // 3-Day History Calculation logic from frontend
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDayStr = threeDaysAgo.toISOString().split('T')[0];

    console.log(`Fetching reports since: ${threeDayStr}`);

    const { data: recentHistory, error } = await supabase
        .from('shift_reports')
        .select('date, shift_details(extra_hours, empty_posts)')
        .gte('date', threeDayStr);

    if (error) {
        console.error('Supabase Error:', error);
        return;
    }

    console.log(`Found ${recentHistory?.length || 0} reports.`);

    const last3Days = Array.from({ length: 3 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateVal = d.toISOString().split('T')[0];
        const label = i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });

        console.log(`Processing date: ${dateVal} (${label})`);

        // Sum for this date
        const reportsForDay = recentHistory?.filter((r) => r.date === dateVal) || [];
        console.log(`  Reports for ${dateVal}: ${reportsForDay.length}`);

        const dayHours = reportsForDay.reduce((acc, r) =>
            acc + (r.shift_details?.reduce((sum, d) => sum + (d.extra_hours || 0), 0) || 0), 0);

        const dayGaps = reportsForDay.reduce((acc, r) =>
            acc + (r.shift_details?.reduce((sum, d) => sum + (d.empty_posts || 0), 0) || 0), 0);

        console.log(`  Hours: ${dayHours}, Gaps: ${dayGaps}`);

        return { label, hours: dayHours, gaps: dayGaps };
    }).reverse();

    console.log('\nFinal History Object:');
    console.log(JSON.stringify(last3Days, null, 2));
}

testKpiHistory();
