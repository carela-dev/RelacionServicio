const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vzoxfwktcvxqgirtvbcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6b3hmd2t0Y3Z4cWdpcnR2YmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMjc4OTIsImV4cCI6MjA4NjYwMzg5Mn0.1djfJ3rSom2-CUM71EkKvlsG2VCDkNclBwwlFzIk5Fs';

const supabase = createClient(supabaseUrl, supabaseKey);

const newZones = [
    'Village',
    'Zona 6',
    'Aguila 16',
    'Club Med',
    'Hotel',
    'Corales',
    'Golf',
    'Gate Turistico',
    'Gate de Servicio'
];

async function seed() {
    console.log('Authenticating with eddy.carela@gmail.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'eddy.carela@gmail.com',
        password: 'Carela123'
    });

    if (authError) {
        console.log('Trying carela123...');
        const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
            email: 'carela.admin@example.com',
            password: 'Carela123'
        });
        if (authError2) {
            console.error('All auth attempts failed.');
            return;
        }
    }

    console.log('Seeding zones...');
    const { data: currentZones } = await supabase.from('zones').select('name');
    const existingNames = currentZones ? currentZones.map(z => z.name) : [];
    const toInsert = newZones.filter(name => !existingNames.includes(name)).map(name => ({ name }));

    if (toInsert.length > 0) {
        const { error } = await supabase.from('zones').insert(toInsert);
        if (error) console.error('Error seeding zones:', error);
        else console.log(`Inserted ${toInsert.length} new zones.`);
    } else {
        console.log('All zones already exist.');
    }
}

seed();
