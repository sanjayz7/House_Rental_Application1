const crypto = require('crypto');

console.log('🔐 Generating Secure JWT Secret...\n');

// Generate a random 64-character secret
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('✅ Your JWT Secret:');
console.log('='.repeat(50));
console.log(jwtSecret);
console.log('='.repeat(50));

console.log('\n📝 Copy this secret and use it in one of these ways:');
console.log('\n1️⃣ Create a .env file in your server folder with:');
console.log('   JWT_SECRET=' + jwtSecret);

console.log('\n2️⃣ Set environment variable in PowerShell:');
console.log('   $env:JWT_SECRET="' + jwtSecret + '"');

console.log('\n3️⃣ Set environment variable in Command Prompt:');
console.log('   set JWT_SECRET=' + jwtSecret);

console.log('\n⚠️  IMPORTANT: Keep this secret safe and never share it!');
console.log('   This is used to sign and verify your JWT tokens.');
