/**
 * MongoDB Connection Test Script
 * 
 * This script tests your MongoDB Atlas connection and diagnoses common issues.
 * Run with: node scripts/test-mongodb-connection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

console.log('🔍 MongoDB Connection Test Starting...\n');

// Validate environment variable
if (!MONGO_URI) {
  console.error('❌ ERROR: MONGO_URI is not defined in .env file');
  console.log('\n📝 Please add to your .env file:');
  console.log('MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname\n');
  process.exit(1);
}

// Mask password in URI for logging
const maskedURI = MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
console.log('📋 Connection String (masked):', maskedURI);
console.log('');

// Connection options (matching app.js settings)
const options = {
  serverSelectionTimeoutMS: 30000,  // 30 seconds (increased for Atlas)
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
};

console.log('⏳ Attempting to connect...\n');

mongoose.connect(MONGO_URI, options)
  .then(() => {
    console.log('✅ CONNECTION SUCCESSFUL!\n');
    console.log('📊 Connection Details:');
    console.log('   Database Name:', mongoose.connection.name || 'default');
    console.log('   Host:', mongoose.connection.host);
    console.log('   Port:', mongoose.connection.port || 'N/A (Atlas SRV)');
    console.log('   Ready State:', getReadyStateText(mongoose.connection.readyState));
    console.log('');
    
    // Test a simple query
    console.log('🧪 Testing database query...');
    return mongoose.connection.db.admin().ping();
  })
  .then(() => {
    console.log('✅ Database ping successful!\n');
    console.log('🎉 All tests passed! Your MongoDB connection is working correctly.\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ CONNECTION FAILED!\n');
    console.error('Error Type:', err.name);
    console.error('Error Message:', err.message);
    console.log('');
    
    // Provide specific troubleshooting
    diagnoseProblem(err);
    
    process.exit(1);
  });

// Connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('❌ Connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Disconnected from MongoDB');
});

// Helper functions
function getReadyStateText(state) {
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };
  return states[state] || 'Unknown';
}

function diagnoseProblem(error) {
  console.log('🔍 TROUBLESHOOTING:\n');
  
  const errorMsg = error.message.toLowerCase();
  
  if (errorMsg.includes('econnrefused') || errorMsg.includes('querysrv')) {
    console.log('❗ Issue: Cannot reach MongoDB server (DNS/Network)');
    console.log('');
    console.log('   Solutions:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify the cluster hostname in your connection string');
    console.log('   3. Ensure MongoDB Atlas cluster is running (check Atlas dashboard)');
    console.log('   4. Test DNS resolution:');
    console.log('      Windows: nslookup your-cluster.mongodb.net');
    console.log('      Linux/Mac: dig your-cluster.mongodb.net');
    console.log('');
  }
  
  if (errorMsg.includes('authentication failed') || errorMsg.includes('auth')) {
    console.log('❗ Issue: Authentication Failed');
    console.log('');
    console.log('   Solutions:');
    console.log('   1. Verify username and password in connection string');
    console.log('   2. URL-encode special characters in password:');
    console.log('      @ → %40, ! → %21, # → %23, $ → %24');
    console.log('   3. Reset password in MongoDB Atlas:');
    console.log('      Database Access → Edit User → Update Password');
    console.log('   4. Ensure user has correct permissions');
    console.log('');
  }
  
  if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
    console.log('❗ Issue: Connection Timeout');
    console.log('');
    console.log('   Solutions:');
    console.log('   1. Check MongoDB Atlas Network Access:');
    console.log('      - Add your IP address to whitelist');
    console.log('      - Or temporarily use 0.0.0.0/0 (NOT for production!)');
    console.log('   2. Check firewall/proxy settings');
    console.log('   3. Try increasing serverSelectionTimeoutMS');
    console.log('');
  }
  
  if (errorMsg.includes('network') || errorMsg.includes('enotfound')) {
    console.log('❗ Issue: Network/DNS Resolution Failed');
    console.log('');
    console.log('   Solutions:');
    console.log('   1. Verify cluster address is correct');
    console.log('   2. Check DNS server settings');
    console.log('   3. Try using a different network');
    console.log('   4. Flush DNS cache:');
    console.log('      Windows: ipconfig /flushdns');
    console.log('      Linux: sudo systemd-resolve --flush-caches');
    console.log('      Mac: sudo dscacheutil -flushcache');
    console.log('');
  }
  
  console.log('📚 Additional Resources:');
  console.log('   - MongoDB Atlas: https://cloud.mongodb.com');
  console.log('   - Connection Guide: https://www.mongodb.com/docs/manual/reference/connection-string/');
  console.log('   - Troubleshooting: https://www.mongodb.com/docs/atlas/troubleshoot-connection/');
  console.log('');
  
  console.log('💡 Quick Checks:');
  console.log('   1. Can you access MongoDB Atlas dashboard? https://cloud.mongodb.com');
  console.log('   2. Is your cluster running? (Check Clusters page)');
  console.log('   3. Is your IP whitelisted? (Check Network Access)');
  console.log('   4. Did you URL-encode your password?');
  console.log('');
}
