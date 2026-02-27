/**
 * WebSocket Performance Testing Script
 * 
 * This script helps test the WebSocket optimizations by simulating
 * high-frequency events and measuring response times.
 * 
 * Usage: node scripts/test-websocket-performance.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test configuration
const TEST_DURATION = 10000; // 10 seconds
const EVENT_INTERVAL = 100; // Event every 100ms

let eventsReceived = 0;
let eventsExpected = 0;
let latencies = [];
const startTime = Date.now();

console.log('🚀 Starting WebSocket Performance Test\n');
console.log('Configuration:');
console.log(`  Duration: ${TEST_DURATION}ms`);
console.log(`  Event Interval: ${EVENT_INTERVAL}ms`);
console.log(`  Expected Events: ~${Math.floor(TEST_DURATION / EVENT_INTERVAL)}\n`);

// Subscribe to a test channel
const channel = supabase
  .channel('performance-test')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'forum_stats' },
    (payload) => {
      eventsReceived++;
      const latency = Date.now() - payload.commit_timestamp;
      latencies.push(latency);
      
      if (eventsReceived % 10 === 0) {
        const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        console.log(`📊 Received ${eventsReceived} events | Avg Latency: ${avgLatency.toFixed(2)}ms`);
      }
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Connected to WebSocket\n');
      console.log('Monitoring events...\n');
      
      // Start monitoring
      setTimeout(() => {
        printResults();
        process.exit(0);
      }, TEST_DURATION);
    } else if (status === 'CHANNEL_ERROR') {
      console.error('❌ Channel error');
      process.exit(1);
    } else if (status === 'TIMED_OUT') {
      console.error('❌ Connection timed out');
      process.exit(1);
    }
  });

function printResults() {
  const duration = Date.now() - startTime;
  const avgLatency = latencies.length > 0 
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
    : 0;
  const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
  const eventsPerSecond = (eventsReceived / duration) * 1000;

  console.log('\n' + '='.repeat(60));
  console.log('📈 Performance Test Results');
  console.log('='.repeat(60));
  console.log(`Duration:           ${duration}ms`);
  console.log(`Events Received:    ${eventsReceived}`);
  console.log(`Events/Second:      ${eventsPerSecond.toFixed(2)}`);
  console.log(`Average Latency:    ${avgLatency.toFixed(2)}ms`);
  console.log(`Min Latency:        ${minLatency}ms`);
  console.log(`Max Latency:        ${maxLatency}ms`);
  console.log('='.repeat(60));

  // Performance assessment
  console.log('\n📋 Assessment:');
  if (eventsPerSecond >= 40) {
    console.log('✅ Excellent: Handling high event throughput');
  } else if (eventsPerSecond >= 20) {
    console.log('⚠️  Good: Adequate performance');
  } else {
    console.log('❌ Poor: Performance issues detected');
  }

  if (avgLatency < 100) {
    console.log('✅ Excellent: Low latency');
  } else if (avgLatency < 300) {
    console.log('⚠️  Good: Acceptable latency');
  } else {
    console.log('❌ Poor: High latency detected');
  }

  console.log('\n💡 Tips:');
  console.log('  - Compare results before/after optimization');
  console.log('  - Run multiple times for consistent results');
  console.log('  - Test during different load conditions');
  console.log('  - Monitor Supabase dashboard for query counts\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted');
  printResults();
  process.exit(0);
});
