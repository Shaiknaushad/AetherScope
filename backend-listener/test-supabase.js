    import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('🔍 URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('🔍 Key:', supabaseKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Check if we can connect
console.log('\n📋 Test 1: Basic connection test');
try {
    const { data, error } = await supabase.from('Triplets').select('count', { count: 'exact', head: true });
    
    if (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('   Code:', error.code);
        console.error('   Details:', error.details);
    } else {
        console.log('✅ Connection successful');
        console.log('   Current record count:', data);
    }
} catch (err) {
    console.error('❌ Connection error:', err.message);
}

// Test 2: Check table structure
console.log('\n📋 Test 2: Table structure check');
try {
    const { data, error } = await supabase
        .from('Triplets')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('❌ Table access failed:', error.message);
        console.error('   Code:', error.code);
        console.error('   Details:', error.details);
    } else {
        console.log('✅ Table accessible');
        console.log('   Sample record structure:', data.length > 0 ? Object.keys(data[0]) : 'No records');
    }
} catch (err) {
    console.error('❌ Table access error:', err.message);
}

// Test 3: Try a simple insert
console.log('\n📋 Test 3: Simple insert test');
const testData = {
    timestamp: new Date().toISOString(),
    agent: 'test-agent',
    summary: 'Test summary',
    ipfs_hash: 'test-hash',
    event_timestamp: new Date().toISOString(),
    triplets: [
        {
            subject: 'test',
            predicate: 'is',
            object: 'working'
        }
    ]
};

try {
    const { data, error } = await supabase
        .from('Triplets')
        .insert([testData])
        .select();
    
    if (error) {
        console.error('❌ Insert failed:', error.message);
        console.error('   Code:', error.code);
        console.error('   Details:', error.details);
        console.error('   Hint:', error.hint);
        console.error('   Full error:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Insert successful');
        console.log('   Inserted record ID:', data[0]?.id);
        
        // Clean up - delete the test record
        if (data[0]?.id) {
            await supabase.from('Triplets').delete().eq('id', data[0].id);
            console.log('🧹 Test record cleaned up');
        }
    }
} catch (err) {
    console.error('❌ Insert error:', err.message);
    console.error('   Stack:', err.stack);
}

console.log('\n🏁 Test complete');
process.exit(0);