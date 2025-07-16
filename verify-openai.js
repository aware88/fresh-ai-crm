const OpenAI = require('openai');
require('dotenv').config();

async function verifyOpenAI() {
  try {
    console.log('🔍 Verifying OpenAI API configuration...');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in environment variables');
      console.log('💡 Please add your OpenAI API key to .env.local');
      return false;
    }
    
    if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
      console.error('❌ Invalid API key format. OpenAI keys should start with "sk-"');
      return false;
    }
    
    console.log('✅ API key format looks correct');
    console.log('🔄 Testing connection to OpenAI...');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Simple test call
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: "Say 'Hello, Fresh AI CRM!' if you can hear me." }
      ],
      max_tokens: 50
    });
    
    const result = response.choices[0].message.content;
    console.log('✅ OpenAI API is working!');
    console.log('🤖 OpenAI says:', result);
    
    return true;
    
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    
    if (error.status === 401) {
      console.log('💡 This means your API key is invalid or expired.');
      console.log('🔗 Get a new key at: https://platform.openai.com/account/api-keys');
    } else if (error.status === 429) {
      console.log('💡 Rate limit exceeded. Please wait and try again.');
    } else if (error.status === 403) {
      console.log('💡 Access denied. Check your API key permissions.');
    }
    
    return false;
  }
}

// Run the verification
verifyOpenAI().then(success => {
  if (success) {
    console.log('\n🎉 All set! Your AI analysis should now work properly.');
    console.log('🚀 Try clicking the "AI Analysis" or "Sales Agent" buttons in your app.');
  } else {
    console.log('\n❌ Please fix the API key issue and run this script again.');
    console.log('📝 Command: node verify-openai.js');
  }
}); 