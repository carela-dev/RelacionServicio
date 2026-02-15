const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vzoxfwktcvxqgirtvbcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6b3hmd2t0Y3Z4cWdpcnR2YmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMjc4OTIsImV4cCI6MjA4NjYwMzg5Mn0.1djfJ3rSom2-CUM71EkKvlsG2VCDkNclBwwlFzIk5Fs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

checkProfiles();
