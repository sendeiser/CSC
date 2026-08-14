import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ukmtqmaxruxhyiubjvaw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbXRxbWF4cnV4aHlpdWJqdmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2OTYyODcsImV4cCI6MjA5NjI3MjI4N30.ybFX7dtas39Tat-1USgnMxNtdkHhUK9z6zXdyBBvBYs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function run() {
  const { data: allProds, error } = await supabase.from('products').select('*');
  if (error) {
    console.error(error);
    return;
  }
  const allGomitas = allProds.filter(p => p.category === 'Gomitas');
  const validGomitas = allGomitas.filter(p => p.unit_type === 'weight' && p.stock > 0);
  console.log('Total products:', allProds.length);
  console.log('Total Gomitas:', allGomitas.length);
  console.log('Total Gomitas for Combo:', validGomitas.length);
  
  if (validGomitas.length < allGomitas.length) {
    const invalid = allGomitas.filter(p => !(p.unit_type === 'weight' && p.stock > 0));
    console.log('Invalid Gomitas for combo:', JSON.stringify(invalid, null, 2));
  }
}

run();
