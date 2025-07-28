const testOptimization = async () => {
  console.log('🚀 Testing Smart Intelligence Optimization...\n');
  
  const testEmail = `
From: john.doe@testcompany.com
Subject: Turmeric Lot Approval Update

Hello,

Our Certification body just approved a lot of turmeric and it will be at our warehouse by the end of September. The quantity is 500kg and we have all the quality certificates ready.

Please let me know the next steps for processing this order.

Best regards,
John Doe
Test Company
  `;

  try {
    const response = await fetch('http://localhost:3000/api/email/generate-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalEmail: testEmail,
        senderEmail: 'john.doe@testcompany.com',
        tone: 'professional'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ API Response received successfully!');
    console.log('\n📊 OPTIMIZATION RESULTS:');
    console.log(`🎯 Response Generated: ${data.success ? 'YES' : 'NO'}`);
    console.log(`📝 Response Length: ${data.response?.length || 0} characters`);
    
    if (data.intelligence) {
      console.log('\n🧠 INTELLIGENCE USED:');
      console.log(`📊 Contact Found: ${data.intelligence.contactFound ? 'YES' : 'NO'}`);
      console.log(`🧠 AI Profiler Data: ${data.intelligence.aiProfilerData ? 'YES' : 'NO'}`);
      console.log(`🎯 Sales Tactics: ${data.intelligence.salesTacticsCount || 0}`);
      console.log(`📚 Analysis History: ${data.intelligence.analysisHistoryCount || 0}`);
    }
    
    console.log('\n📧 GENERATED RESPONSE:');
    console.log('---');
    console.log(data.response);
    console.log('---');
    
    console.log('\n🎉 Optimization test completed successfully!');
    console.log('Check the server logs for detailed token usage information.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testOptimization(); 