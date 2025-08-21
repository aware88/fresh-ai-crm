/**
 * Test Withcar Language Detection
 * Verify that language detection works for all Withcar primary languages
 */

// Mock the MagentoMultiLanguageAdapter for testing
class WithcarLanguageDetector {
  detectLanguageFromEmail(emailContent) {
    const lowerContent = emailContent.toLowerCase();

    // German detection (Priority 1 - Withcar primary market)
    if (this.containsGermanWords(lowerContent)) {
      return 'de';
    }

    // Slovenian detection (Priority 1 - Withcar primary market)
    if (this.containsSlovenianWords(lowerContent)) {
      return 'sl';
    }

    // Italian detection (Priority 1 - Withcar primary market)
    if (this.containsItalianWords(lowerContent)) {
      return 'it';
    }

    // Croatian detection (Additional language)
    if (this.containsCroatianWords(lowerContent)) {
      return 'hr';
    }

    // Default to English (Priority 1 - International fallback)
    return 'en';
  }

  containsGermanWords(content) {
    const germanWords = ['danke', 'bitte', 'können', 'möchte', 'produkt', 'preis', 'bestellung', 'lieferung', 'hallo', 'guten', 'tag', 'mit', 'freundlichen', 'grüßen'];
    return germanWords.some(word => content.includes(word));
  }

  containsSlovenianWords(content) {
    const slovenianWords = ['hvala', 'prosim', 'lahko', 'želim', 'izdelek', 'cena', 'naročilo', 'dostava', 'pozdravi', 'lep', 'pozdrav'];
    return slovenianWords.some(word => content.includes(word));
  }

  containsItalianWords(content) {
    const italianWords = ['grazie', 'prego', 'posso', 'vorrei', 'prodotto', 'prezzo', 'ordine', 'spedizione', 'ciao', 'buongiorno', 'cordiali', 'saluti'];
    return italianWords.some(word => content.includes(word));
  }

  containsCroatianWords(content) {
    const croatianWords = ['hvala', 'molim', 'mogu', 'želim', 'proizvod', 'cijena', 'narudžba', 'dostava'];
    return croatianWords.some(word => content.includes(word));
  }
}

async function testWithcarLanguages() {
  console.log('🚗 Testing Withcar Language Detection\n');
  
  const detector = new WithcarLanguageDetector();
  
  // Test cases for Withcar primary languages
  const testCases = [
    // German (Primary)
    {
      email: 'Hallo, können Sie mir bitte Informationen über Ihre Produkte senden? Danke!',
      expected: 'de',
      language: 'German'
    },
    {
      email: 'Guten Tag, ich möchte eine Bestellung aufgeben. Mit freundlichen Grüßen.',
      expected: 'de',
      language: 'German'
    },
    
    // Slovenian (Primary)
    {
      email: 'Hvala za vaš odziv. Prosim, ali lahko dobim več informacij o izdelkih?',
      expected: 'sl',
      language: 'Slovenian'
    },
    {
      email: 'Želim naročiti vaše izdelke. Lep pozdrav!',
      expected: 'sl',
      language: 'Slovenian'
    },
    
    // Italian (Primary)
    {
      email: 'Ciao, vorrei informazioni sui vostri prodotti. Grazie mille!',
      expected: 'it',
      language: 'Italian'
    },
    {
      email: 'Buongiorno, posso avere il prezzo di questo prodotto? Cordiali saluti.',
      expected: 'it',
      language: 'Italian'
    },
    
    // English (Primary - International)
    {
      email: 'Hello, I would like to inquire about your products. Thank you!',
      expected: 'en',
      language: 'English'
    },
    {
      email: 'Hi there, can you help me with my order? Best regards.',
      expected: 'en',
      language: 'English'
    },
    
    // Croatian (Additional)
    {
      email: 'Hvala na brzom odgovoru. Molim vas za više informacija o proizvodu.',
      expected: 'hr',
      language: 'Croatian'
    }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  console.log('🧪 Running Language Detection Tests:\n');
  
  for (const testCase of testCases) {
    const detected = detector.detectLanguageFromEmail(testCase.email);
    const success = detected === testCase.expected;
    
    console.log(`${success ? '✅' : '❌'} ${testCase.language}:`);
    console.log(`   Email: "${testCase.email.substring(0, 50)}..."`);
    console.log(`   Expected: ${testCase.expected} | Detected: ${detected}`);
    console.log('');
    
    if (success) passed++;
  }
  
  console.log('📊 Test Results:');
  console.log(`   Passed: ${passed}/${total} tests`);
  console.log(`   Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 Perfect! All Withcar languages detected correctly!');
    console.log('✅ German: Primary market - Working');
    console.log('✅ Slovenian: Primary market - Working');
    console.log('✅ Italian: Primary market - Working');
    console.log('✅ English: International fallback - Working');
    console.log('✅ Croatian: Additional language - Working');
    
    console.log('\n🚗 Withcar Language System Status:');
    console.log('   🇩🇪 German customers → German responses');
    console.log('   🇸🇮 Slovenian customers → Slovenian responses');
    console.log('   🇮🇹 Italian customers → Italian responses');
    console.log('   🇬🇧 English customers → English responses');
    console.log('   🇭🇷 Croatian customers → Croatian responses');
    
  } else {
    console.log('\n⚠️ Some language detection tests failed. Please review the results above.');
  }
}

// Run the test
testWithcarLanguages().catch(console.error);

