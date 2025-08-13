/**
 * Script to seed demo data for the dashboard and email accounts
 * Run with: node seed-data.js
 */

// Simple fetch to call the seed-demo-data API
async function seedData() {
  try {
    console.log('🌱 Seeding demo data...');
    
    const response = await fetch('http://localhost:3000/api/seed-demo-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! Demo data created:');
      console.log(`   - ${result.contactsCount} contacts`);
      console.log(`   - ${result.emailAccountsCount} email accounts`);
      console.log('\n🔄 Please refresh your dashboard and email accounts page to see the data.');
    } else {
      console.error('❌ Failed to create demo data:', result.error);
      console.error('Details:', result.details);
    }
  } catch (error) {
    console.error('💥 Error seeding data:', error.message);
  }
}

// Run the function
seedData();

