const createImagesTable = require('./createImagesTable');

async function setupImagesDatabase() {
  console.log('🚀 Setting up Images database...');
  
  try {
    await createImagesTable();
    console.log('✅ Images database setup completed successfully!');
  } catch (err) {
    console.error('❌ Images database setup failed:', err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupImagesDatabase();
}

module.exports = setupImagesDatabase;
